const conn = require('../../config/database');
const { Estudiante } = require('../models/Estudiante');

// Create a payment for a student, optionally registros parciales and billetes for cash
exports.createPayment = async (req, res) => {
    try {
        const payload = req.body;
        const idEstudiante = payload.idEstudiante;
        const metodoId = Number(payload.metodoId);

        // 1. Validar método de pago
        let metodoRow = null;
        try {
            const [rows] = await conn.promise().query('SELECT idMetodos_pago, Nombre, Tipo_Validacion FROM metodos_pagos WHERE idMetodos_pago = ?', [metodoId]);
            if (Array.isArray(rows) && rows.length) metodoRow = rows[0];
        } catch (mErr) {
            console.warn('No se pudo obtener metodos_pagos para validación:', mErr);
        }
        
        const idDeuda = payload.idDeuda || null;
        const monto = Number(payload.monto || 0);
        const moneda = (payload.moneda || 'bs').toString().toLowerCase();
        const parciales = Array.isArray(payload.parciales) ? payload.parciales : [];
        const billetes = Array.isArray(payload.billetes) ? payload.billetes : [];
        
        // Nuevos campos del formulario avanzado
        const conceptoManual = payload.Concepto_Manual || '';
        const observacion = payload.Observacion || null;
        const mesRef = payload.Mes_referencia || null;

        // 2. Validaciones básicas
        if (!idEstudiante || !metodoId || isNaN(monto) || monto <= 0) {
            return res.status(400).json({ success: false, message: 'Faltan datos requeridos del pago (Estudiante, Método o Monto)' });
        }

        // Validación Pago Móvil
        const metodoName = metodoRow ? String(metodoRow.Nombre || '').toLowerCase() : '';
        const metodoTipo = metodoRow ? String(metodoRow.Tipo_Validacion || '').toLowerCase() : '';
        const isPagoMovil = metodoTipo.includes('movil') || metodoName.includes('pago movil') || metodoName.includes('movil');
        
        // Referencia base
        let referenciaInput = payload.referencia;

        if (isPagoMovil) {
            if (!referenciaInput || String(referenciaInput).trim() === '') {
                return res.status(400).json({ success: false, message: 'Pago móvil requiere referencia de la transacción' });
            }
        }

        // 3. Procesar Referencia Final (Concatenar concepto si es Abono/Manual)
        // Si no hay referencia, usamos 'Pendiente' o 'Efectivo'
        let referenciaFinal = referenciaInput;
        if (!referenciaFinal || referenciaFinal.trim() === '') {
            referenciaFinal = 'Pendiente';
        }
        
        // Si hay un concepto manual (ej. "Abono: ..."), lo agregamos a la referencia para que se vea en el historial de pagos
        if (conceptoManual) {
            referenciaFinal = `${referenciaFinal} - ${conceptoManual}`;
        }

        // 4. Lógica de Cuenta Destino Automática
        // 1: Caja Chica, 2: Banco
        let idCuentaAuto = 1; 
        if (metodoId === 1 || metodoId === 2) { // Transferencia o Pago Móvil -> Banco
            idCuentaAuto = 2; 
        }
        const idCuentaFinal = payload.idCuenta_Destino || idCuentaAuto;

        // 5. Cálculos de Tasa y Montos
        const tasaActual = await Estudiante.getLatestTasa();
        let Monto_bs = null;
        let Monto_usd = null;
        let Tasa_Pago = tasaActual || 1;

        if (moneda === 'usd' || moneda === 'dolar' || moneda === 'usd$') {
            Monto_usd = Number(monto.toFixed(4));
            if (tasaActual) Monto_bs = Number((Monto_usd * tasaActual).toFixed(4));
        } else {
            Monto_bs = Number(monto.toFixed(4));
            if (tasaActual && tasaActual !== 0) {
                Monto_usd = Number((Monto_bs / tasaActual).toFixed(4));
            }
        }

        const Fecha_pago = payload.Fecha_pago || new Date().toISOString().slice(0,19).replace('T', ' ');

        // 6. Crear el Pago en la BD
        const idPago = await Estudiante.createPago({
            idDeuda: idDeuda, // Puede ser null si es mensualidad directa o abono
            idMetodos_pago: metodoId,
            idCuenta_Destino: idCuentaFinal,
            idEstudiante,
            Referencia: referenciaFinal,
            Mes_referencia: mesRef, // Esto ayuda a la lógica interna del modelo si la tiene
            Monto_bs,
            Tasa_Pago,
            Monto_usd,
            Fecha_pago
        });

        // 7. Control de Mensualidades (Si es pago de mensualidad)
        if (mesRef) {
            try {
                const idGrupoControl = payload.idGrupo || null;
                
                // Parsear YYYY-MM
                const [yearStr, monthStr] = mesRef.split('-');
                const yearNum = parseInt(yearStr);
                const monthNum = parseInt(monthStr);
                const mesDateStr = `${mesRef}-01`; // YYYY-MM-01

                // Verificar si ya existe registro para ese mes (evitar duplicados)
                const [exists] = await conn.promise().query(
                    'SELECT idControl FROM control_mensualidades WHERE idEstudiante = ? AND Mes = ? AND Year = ?',
                    [idEstudiante, monthNum, yearNum]
                );

                if (exists.length === 0) {
                    await conn.promise().query(
                        `INSERT INTO control_mensualidades (idEstudiante, idPago, Mes, Year, Mes_date, Observacion, idGrupo)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [idEstudiante, idPago, monthNum, yearNum, mesDateStr, observacion, idGrupoControl]
                    );
                    console.log('✅ Control mensualidades insertado:', mesRef);
                } else {
                    console.log('⚠️ Ya existía control para el mes', mesRef, '- Actualizando pago asociado...');
                    // Opcional: Actualizar el pago asociado si era un abono previo, o dejarlo.
                    // Por ahora solo logueamos para no romper lógica de historial.
                }

            } catch (cmErr) {
                console.error('❌ Error insertando control_mensualidades:', cmErr);
            }
        }

        // 8. Pagos Parciales (Si se seleccionó una deuda específica)
        if (idDeuda && !parciales.length) {
            // Si venía un idDeuda pero NO array de parciales explícito, asumimos que este pago abona a esa deuda
            // Calculamos el monto del abono (que es el monto total del pago)
            await Estudiante.createPagoParcial({ 
                idPago, 
                idDeuda: idDeuda, 
                Monto_parcial: Monto_usd 
            });
            // Intentar reconciliar (marcar como pagada si se completó)
            await Estudiante.reconcileDeuda(idDeuda);
        } 
        else if (parciales.length) {
            // Si vienen parciales explícitos (lógica legacy o múltiple)
            for (const p of parciales) {
                const montoPar = Number(p.monto || 0);
                const deudaPar = p.idDeuda || idDeuda;
                if (!isNaN(montoPar) && montoPar > 0 && deudaPar) {
                    await Estudiante.createPagoParcial({ idPago, idDeuda: deudaPar, Monto_parcial: montoPar });
                    await Estudiante.reconcileDeuda(deudaPar);
                }
            }
        }

        // 9. Billetes (Cash)
        if (billetes.length) {
            for (const b of billetes) {
                const codigo = b.Codigo_billete || b.codigo || null;
                const denom = Number(b.Denominacion || b.denom || 0);
                if (!codigo || isNaN(denom) || denom <= 0) continue;
                await conn.promise().query(
                    'INSERT INTO billetes_cash (idPago, Codigo_billete, Denominacion) VALUES (?, ?, ?)',
                    [idPago, codigo, denom]
                );
            }
        }

        return res.json({ success: true, idPago, Monto_bs, Monto_usd, Tasa_Pago });

    } catch (err) {
        console.error('Error creating payment:', err);
        return res.status(500).json({ 
            success: false, 
            message: 'Error creando pago: ' + (err.message || 'Unknown error'),
            code: err.code
        });
    }
    }
};

exports.checkReference = async (req, res) => {
    try {
        const { referencia } = req.query;
        if (!referencia) return res.status(400).json({ success: false, message: 'Referencia requerida' });

        const existing = await Estudiante.checkReferenceExists(referencia);
        if (existing) {
            return res.json({ 
                exists: true, 
                studentName: `${existing.Nombres} ${existing.Apellidos}` 
            });
        }
        return res.json({ exists: false });
    } catch (err) {
        console.error('Error checking reference:', err);
        return res.status(500).json({ success: false, message: 'Error interno' });
    }
};