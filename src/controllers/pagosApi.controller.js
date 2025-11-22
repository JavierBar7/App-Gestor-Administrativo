const conn = require('../../config/database');
const { Estudiante } = require('../models/Estudiante');

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
        
        const conceptoManual = payload.Concepto_Manual || '';
        const userObservacion = payload.Observacion || '';
        const mesRef = payload.Mes_referencia || null;

        // 2. Validaciones básicas
        if (!idEstudiante || !metodoId || isNaN(monto) || monto <= 0) {
            return res.status(400).json({ success: false, message: 'Faltan datos requeridos' });
        }

        // VALIDACIÓN DE REFERENCIA ESTRICTA
        // Si el método suele requerir referencia (Transferencia, Pago Movil), no aceptamos vacíos.
        // En tu BD: 1=Transferencia, 2=Pago Movil. (O validamos por nombre/tipo)
        const metodoName = metodoRow ? String(metodoRow.Nombre || '').toLowerCase() : '';
        const metodoTipo = metodoRow ? String(metodoRow.Tipo_Validacion || '').toLowerCase() : '';
        
        // Consideramos obligatorio si es 'movil', 'transferencia' o 'banco'
        const requiereRef = metodoTipo.includes('movil') || metodoName.includes('movil') || 
                            metodoName.includes('transfer') || metodoName.includes('banco');
        
        let referenciaFinal = payload.referencia;

        if (requiereRef) {
            if (!referenciaFinal || String(referenciaFinal).trim() === '') {
                return res.status(400).json({ success: false, message: `El método ${metodoRow ? metodoRow.Nombre : ''} requiere un número de referencia.` });
            }
        } else {
            // Si es efectivo/cash y viene vacío, podemos dejarlo null o poner guión, pero ya NO ponemos "Pendiente" automático
            if (!referenciaFinal || String(referenciaFinal).trim() === '') {
                referenciaFinal = null; 
            }
        }

        // 4. Observación
        let observacionFinal = [];
        if (conceptoManual) observacionFinal.push(conceptoManual);
        if (userObservacion) observacionFinal.push(userObservacion);
        const obsString = observacionFinal.length > 0 ? observacionFinal.join(' - ') : null;

        // 5. Cuenta y Tasa
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

        // 6. Insertar Pago
        const idPago = await Estudiante.createPago({
            idDeuda,
            idMetodos_pago: metodoId,
            idCuenta_Destino: idCuentaFinal,
            idEstudiante,
            Referencia: referenciaFinal, // Será el número real o null (nunca "Pendiente" automático)
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
                await Estudiante.createPagoParcial({ idPago, idDeuda: p.idDeuda || idDeuda, Monto_parcial: p.monto });
                await Estudiante.reconcileDeuda(p.idDeuda || idDeuda);
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