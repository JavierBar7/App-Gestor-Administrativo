const conn = require('../../config/database');
const { Estudiante } = require('../models/Estudiante');

// Create a payment for a student, optionally registros parciales and billetes for cash
exports.createPayment = async (req, res) => {
    try {
        const payload = req.body;
        const idEstudiante = payload.idEstudiante;
        const metodoId = payload.metodoId;
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

        const idPago = await Estudiante.createPago({
            idDeuda: idDeuda || null,
            idMetodos_pago: metodoId,
            idCuenta_Destino: payload.idCuenta_Destino || null,
            idEstudiante,
            Referencia: referencia,
            Mes_referencia: payload.Mes_referencia || null,
            Monto_bs,
            Tasa_Pago,
            Monto_usd,
            Fecha_pago
        });

        // If a month reference or group is provided, attempt to create a control_mensualidades record
        try {
            const mesRef = payload.Mes_referencia || payload.Mes || null;
            const observacion = payload.Observacion || payload.Observacion_control || null;
            const idGrupoControl = payload.idGrupo || payload.idGrupo_control || null;
            if (mesRef) {
                // Insert using STR_TO_DATE to accept 'YYYY-MM' from frontend (input[type=month])
                await conn.promise().query(
                    `INSERT INTO control_mensualidades (idEstudiante, idPago, Mes, Observacion, idGrupo)
                     VALUES (?, ?, STR_TO_DATE(?, '%Y-%m'), ?, ?)`,
                    [idEstudiante, idPago, mesRef, observacion, idGrupoControl]
                );
            } else if (idGrupoControl) {
                // If only group provided, insert with current month
                const todayMonth = new Date().toISOString().slice(0,7); // 'YYYY-MM'
                await conn.promise().query(
                    `INSERT INTO control_mensualidades (idEstudiante, idPago, Mes, Observacion, idGrupo)
                     VALUES (?, ?, STR_TO_DATE(?, '%Y-%m'), ?, ?)`,
                    [idEstudiante, idPago, todayMonth, observacion, idGrupoControl]
                );
            }
        } catch (cmErr) {
            // Don't fail the payment if control insertion fails; log for debugging
            console.warn('No se pudo insertar control_mensualidades:', cmErr && cmErr.message ? cmErr.message : cmErr);
        }

        // parciales: array of { monto, idDeuda? }
        if (parciales.length) {
            for (const p of parciales) {
                const montoPar = Number(p.monto || 0);
                if (!isNaN(montoPar) && montoPar > 0) {
                    await Estudiante.createPagoParcial({ idPago, idDeuda: p.idDeuda || idDeuda || null, Monto_parcial: montoPar });
                }
            }
        }

        // billetes: array of { Codigo_billete, Denominacion }
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
        return res.status(500).json({ success: false, message: 'Error creando pago' });
    }
};
