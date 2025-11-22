const conn = require('../../config/database');
const { Estudiante } = require('../models/Estudiante');

// Create a payment for a student
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
            console.warn('No se pudo obtener metodos_pagos:', mErr);
        }
        
        const idDeuda = payload.idDeuda || null;
        const monto = Number(payload.monto || 0);
        const moneda = (payload.moneda || 'bs').toString().toLowerCase();
        const parciales = Array.isArray(payload.parciales) ? payload.parciales : [];
        const billetes = Array.isArray(payload.billetes) ? payload.billetes : [];
        
        // Datos del formulario
        const conceptoManual = payload.Concepto_Manual || '';
        const userObservacion = payload.Observacion || '';
        const mesRef = payload.Mes_referencia || null;

        // 2. Validaciones básicas
        if (!idEstudiante || !metodoId || isNaN(monto) || monto <= 0) {
            return res.status(400).json({ success: false, message: 'Faltan datos requeridos' });
        }

        // Validación Pago Móvil o Transferencia (Estricta)
        const metodoName = metodoRow ? String(metodoRow.Nombre || '').toLowerCase() : '';
        const metodoTipo = metodoRow ? String(metodoRow.Tipo_Validacion || '').toLowerCase() : '';
        const requiereReferencia = metodoTipo.includes('movil') || metodoName.includes('movil') || metodoName.includes('pago movil') || metodoName.includes('transferencia');
        
        let referenciaInput = payload.referencia;
        if (requiereReferencia) {
            if (!referenciaInput || String(referenciaInput).trim() === '') {
                return res.status(400).json({ success: false, message: `El método ${metodoRow.Nombre} requiere un número de referencia.` });
            }
        }

        // 3. Procesar Referencia (CORREGIDO PARA CASH)
        let referenciaFinal = referenciaInput;

        // Si es Cash y no escribió referencia, intentamos usar los seriales de los billetes
        if ((!referenciaFinal || referenciaFinal.trim() === '') && billetes.length > 0) {
            // Tomamos los códigos de los billetes (ej: "A1234, B5678")
            const seriales = billetes.map(b => b.Codigo_billete).filter(c => c).join(', ');
            // Cortamos si es muy largo para que quepa y sea legible como referencia corta
            if (seriales) {
                referenciaFinal = seriales.length > 40 ? seriales.substring(0, 37) + '...' : seriales;
            }
        }

        // Si sigue vacía, asignamos un valor por defecto para evitar el error "Column cannot be null"
        if (!referenciaFinal || referenciaFinal.trim() === '') {
            const esEfectivo = metodoName.includes('efectivo') || metodoName.includes('cash');
            referenciaFinal = esEfectivo ? 'Efectivo' : 'Pendiente';
        }

        // 4. Construir OBSERVACIÓN
        let observacionFinal = [];
        if (conceptoManual) observacionFinal.push(conceptoManual);
        if (userObservacion) observacionFinal.push(userObservacion);
        const obsString = observacionFinal.length > 0 ? observacionFinal.join(' - ') : null;

        // 5. Cuenta Destino y Tasa
        let idCuentaAuto = (metodoId === 1 || metodoId === 2) ? 2 : 1; 
        const idCuentaFinal = payload.idCuenta_Destino || idCuentaAuto;

        const tasaActual = await Estudiante.getLatestTasa();
        let Monto_bs = null;
        let Monto_usd = null;
        let Tasa_Pago = tasaActual || 1;

        if (moneda.includes('usd') || moneda.includes('dolar')) {
            Monto_usd = Number(monto.toFixed(4));
            if (tasaActual) Monto_bs = Number((Monto_usd * tasaActual).toFixed(4));
        } else {
            Monto_bs = Number(monto.toFixed(4));
            if (tasaActual && tasaActual !== 0) {
                Monto_usd = Number((Monto_bs / tasaActual).toFixed(4));
            }
        }

        const Fecha_pago = payload.Fecha_pago || new Date().toISOString().slice(0,19).replace('T', ' ');

        // 6. Crear Pago
        const idPago = await Estudiante.createPago({
            idDeuda,
            idMetodos_pago: metodoId,
            idCuenta_Destino: idCuentaFinal,
            idEstudiante,
            Referencia: referenciaFinal, // Ahora nunca será null
            observacion: obsString, 
            Monto_bs,
            Tasa_Pago: tasaActual,
            Monto_usd,
            Fecha_pago
        });

        // 7. Control de Mensualidades
        if (mesRef) {
            try {
                const idGrupoControl = payload.idGrupo || null;
                const [yearStr, monthStr] = mesRef.split('-');
                const mesDateStr = `${mesRef}-01`;

                await conn.promise().query(
                    `INSERT IGNORE INTO control_mensualidades (idEstudiante, idPago, Mes, Year, Mes_date, idGrupo)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [idEstudiante, idPago, parseInt(monthStr), parseInt(yearStr), mesDateStr, idGrupoControl]
                );
            } catch (cmErr) {
                console.error('Error control mensualidad:', cmErr);
            }
        }

        // 8. Pagos Parciales
        if (idDeuda && !parciales.length) {
            await Estudiante.createPagoParcial({ idPago, idDeuda, Monto_parcial: Monto_usd });
            await Estudiante.reconcileDeuda(idDeuda);
        } else if (parciales.length) {
            for (const p of parciales) {
                const montoPar = Number(p.monto || 0);
                const deudaPar = p.idDeuda || idDeuda;
                if (!isNaN(montoPar) && montoPar > 0 && deudaPar) {
                    await Estudiante.createPagoParcial({ idPago, idDeuda: deudaPar, Monto_parcial: montoPar });
                    await Estudiante.reconcileDeuda(deudaPar);
                }
            }
        }

        // 9. Billetes
        if (billetes.length) {
            for (const b of billetes) {
                if (b.Codigo_billete && b.Denominacion) {
                    await conn.promise().query('INSERT INTO billetes_cash (idPago, Codigo_billete, Denominacion) VALUES (?, ?, ?)', [idPago, b.Codigo_billete, b.Denominacion]);
                }
            }
        }

        return res.json({ success: true, idPago });

    } catch (err) {
        console.error('Error creating payment:', err);
        return res.status(500).json({ 
            success: false, 
            message: 'Error creando pago: ' + (err.message || 'Unknown error'),
            code: err.code
        });
    }
};