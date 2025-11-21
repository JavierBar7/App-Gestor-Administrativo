const conn = require('../../config/database');
const { Estudiante } = require('../models/Estudiante');

// Create a payment for a student, optionally registros parciales and billetes for cash
exports.createPayment = async (req, res) => {
    try {
        const payload = req.body;
        const idEstudiante = payload.idEstudiante;
        const metodoId = Number(payload.metodoId); // Asegurar que es número

        // fetch payment method info to apply validation rules
        let metodoRow = null;
        try {
            const [rows] = await conn.promise().query('SELECT idMetodos_pago, Nombre, Tipo_Validacion FROM metodos_pagos WHERE idMetodos_pago = ?', [metodoId]);
            if (Array.isArray(rows) && rows.length) metodoRow = rows[0];
        } catch (mErr) {
            console.warn('No se pudo obtener metodos_pagos para validación:', mErr && mErr.message ? mErr.message : mErr);
        }
        
        const referencia = payload.referencia || null;
        const idDeuda = payload.idDeuda || null;
        const monto = Number(payload.monto || 0);
        const moneda = (payload.moneda || 'bs').toString().toLowerCase();
        const parciales = Array.isArray(payload.parciales) ? payload.parciales : [];
        const billetes = Array.isArray(payload.billetes) ? payload.billetes : [];

        if (!idEstudiante || !metodoId || isNaN(monto) || monto <= 0) {
            return res.status(400).json({ success: false, message: 'Faltan datos requeridos del pago' });
        }

        // If the payment method is Pago Móvil (either by Tipo_Validacion or name), require referencia and monto
        const metodoName = metodoRow ? String(metodoRow.Nombre || '').toLowerCase() : '';
        const metodoTipo = metodoRow ? String(metodoRow.Tipo_Validacion || '').toLowerCase() : '';
        const isPagoMovil = metodoTipo.includes('movil') || metodoName.includes('pago movil') || metodoName.includes('movil');
        if (isPagoMovil) {
            if (!referencia || String(referencia).trim() === '') {
                return res.status(400).json({ success: false, message: 'Pago móvil requiere referencia de la transacción' });
            }
            if (isNaN(monto) || monto <= 0) {
                return res.status(400).json({ success: false, message: 'Pago móvil requiere el monto de la transacción' });
            }
        }

        // --- LÓGICA DE CUENTA DESTINO AUTOMÁTICA ---
        // 1: Transferencia, 2: Pago Móvil -> Cuenta Débito (ID 2)
        // 3: Efectivo, 4: Cash -> Caja Chica (ID 1)
        let idCuentaAuto = 1; 
        if (metodoId === 1 || metodoId === 2) {
            idCuentaAuto = 2;
        }
        // Usamos la que venga del front o la automática
        const idCuentaFinal = payload.idCuenta_Destino || idCuentaAuto;


        const tasaActual = await Estudiante.getLatestTasa();
        let Monto_bs = null;
        let Monto_usd = null;
        let Tasa_Pago = tasaActual;

        if (moneda === 'usd' || moneda === 'dolar' || moneda === 'usd$') {
            Monto_usd = Number(monto.toFixed(4));
            if (tasaActual) Monto_bs = Number((Monto_usd * tasaActual).toFixed(4));
        } else {
            // assume bs
            Monto_bs = Number(monto.toFixed(4));
            if (tasaActual && tasaActual !== 0) {
                Monto_usd = Number((Monto_bs / tasaActual).toFixed(4));
            }
        }

        const Fecha_pago = payload.Fecha_pago || new Date().toISOString().slice(0,19).replace('T', ' ');

        // Execute all payment-related writes inside a DB transaction for atomicity
        const dbConn = await conn.promise().getConnection();
        try {
            await dbConn.beginTransaction();

            const idPago = await Estudiante.createPago({
                idDeuda: idDeuda || null,
                idMetodos_pago: metodoId,
                idCuenta_Destino: idCuentaFinal, // <--- CAMBIO: Usamos la cuenta calculada
                idEstudiante,
                Referencia: referencia || 'Pendiente', // <--- CAMBIO: Evitamos NULL
                Mes_referencia: payload.Mes_referencia || null,
                Monto_bs,
                Tasa_Pago,
                Monto_usd,
                Fecha_pago
            }, dbConn);

            // control_mensualidades insertion (if requested)
            const mesRef = payload.Mes_referencia || payload.Mes || null;
            const idGrupoControl = payload.idGrupo || payload.idGrupo_control || null;
            
            if (mesRef) {
                let mesRefNormalized = mesRef;
                const mMatch = mesRef.match(/^(\d{4}-\d{2})/);
                if (mMatch) mesRefNormalized = mMatch[1];
                const yearInt = Number(mesRefNormalized.split('-')[0]);
                const monthInt = Number(mesRefNormalized.split('-')[1]);
                
                await dbConn.promise().query(
                    `INSERT INTO control_mensualidades (idEstudiante, idPago, Mes, Year, Mes_date, idGrupo)
                     VALUES (?, ?, ?, ?, STR_TO_DATE(?, '%Y-%m'), ?)`,
                    [idEstudiante, idPago, monthInt, yearInt, mesRefNormalized, idGrupoControl]
                );
            } else if (idGrupoControl) {
                const now = new Date();
                const todayMonthStr = now.toISOString().slice(0,7);
                const yearInt = now.getFullYear();
                const monthInt = now.getMonth() + 1;
                
                await dbConn.promise().query(
                    `INSERT INTO control_mensualidades (idEstudiante, idPago, Mes, Year, Mes_date, idGrupo)
                     VALUES (?, ?, ?, ?, STR_TO_DATE(?, '%Y-%m'), ?)`,
                    [idEstudiante, idPago, monthInt, yearInt, todayMonthStr, idGrupoControl]
                );
            }

            // parciales: array of { monto, idDeuda? }
            const deudaIdsToReconcile = new Set();
            if (idDeuda) deudaIdsToReconcile.add(idDeuda);
            
            if (parciales.length) {
                for (const p of parciales) {
                    const montoPar = Number(p.monto || 0);
                    const parcialDeuda = p.idDeuda || idDeuda || null;
                    if (!isNaN(montoPar) && montoPar > 0) {
                        await Estudiante.createPagoParcial({ idPago, idDeuda: parcialDeuda, Monto_parcial: montoPar }, dbConn);
                        if (parcialDeuda) deudaIdsToReconcile.add(parcialDeuda);
                    }
                }
            }

            // billetes: array of { Codigo_billete, Denominacion }
            if (billetes.length) {
                for (const b of billetes) {
                    const codigo = b.Codigo_billete || b.codigo || null;
                    const denom = Number(b.Denominacion || b.denom || 0);
                    if (!codigo || isNaN(denom) || denom <= 0) continue;
                    await dbConn.promise().query(
                        'INSERT INTO billetes_cash (idPago, Codigo_billete, Denominacion) VALUES (?, ?, ?)',
                        [idPago, codigo, denom]
                    );
                }
            }

            // Reconcile deudas referenced by the payment / parciales (Opcional si tienes esa función)
            /*
            try {
                for (const dId of Array.from(deudaIdsToReconcile)) {
                    if (!dId) continue;
                    // await Estudiante.reconcileDeuda(dId, dbConn); // Descomentar si existe
                }
            } catch (recErr) {
                throw new Error('Error reconciling deudas: ' + (recErr && recErr.message ? recErr.message : recErr));
            }
            */

            await dbConn.commit();
            dbConn.release();
            return res.json({ success: true, idPago, Monto_bs, Monto_usd, Tasa_Pago });

        } catch (txErr) {
            try { await dbConn.rollback(); } catch (rbErr) { console.error('Rollback error:', rbErr); }
            try { dbConn.release(); } catch (relErr) { }
            console.error('Error creating payment transaction:', txErr);
            return res.status(500).json({ success: false, message: 'Error creando pago (transacción)', error: txErr && txErr.message });
        }
    } catch (err) {
        console.error('Error creating payment:', err);
        return res.status(500).json({ 
            success: false, 
            message: 'Error creando pago: ' + (err.message || 'Unknown error'),
            code: err.code,
            sqlMessage: err.sqlMessage
        });
    }
};