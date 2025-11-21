const conn = require('../../config/database');
const { Estudiante } = require('../models/Estudiante');

// Create a payment for a student, optionally registros parciales and billetes for cash
exports.createPayment = async (req, res) => {
    try {
        const payload = req.body;
        const idEstudiante = payload.idEstudiante;
        const metodoId = Number(payload.metodoId); // Aseguramos que sea número

        // 1. Obtener información del método de pago para validaciones
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

        // 2. Validaciones básicas
        if (!idEstudiante || !metodoId || isNaN(monto) || monto <= 0) {
            return res.status(400).json({ success: false, message: 'Faltan datos requeridos del pago' });
        }

        // Validación específica para Pago Móvil
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

        // 3. Lógica de Cuenta Destino Automática
        // 1: Transferencia, 2: Pago Móvil -> Cuenta Débito (ID 2)
        // 3: Efectivo, 4: Cash -> Caja Chica (ID 1)
        let idCuentaAuto = 1; // Por defecto Caja Chica
        if (metodoId === 1 || metodoId === 2) {
            idCuentaAuto = 2; // Banco
        }
        const idCuentaFinal = payload.idCuenta_Destino || idCuentaAuto;

        // 4. Cálculos de Tasa y Montos
        const tasaActual = await Estudiante.getLatestTasa();
        let Monto_bs = null;
        let Monto_usd = null;
        let Tasa_Pago = tasaActual;

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

        // 5. Crear el Pago en la BD
        // Usamos una referencia por defecto 'Pendiente' si es nula para evitar errores SQL
        const referenciaFinal = referencia || 'Pendiente';

        const idPago = await Estudiante.createPago({
            idDeuda: idDeuda || null,
            idMetodos_pago: metodoId,
            idCuenta_Destino: idCuentaFinal, // <--- CUENTA CORREGIDA
            idEstudiante,
            Referencia: referenciaFinal,      // <--- REFERENCIA SEGURA
            Mes_referencia: payload.Mes_referencia || null,
            Monto_bs,
            Tasa_Pago,
            Monto_usd,
            Fecha_pago
        });

        // 6. Control de Mensualidades (si aplica)
        try {
            const mesRef = payload.Mes_referencia || payload.Mes || null;
            const idGrupoControl = payload.idGrupo || payload.idGrupo_control || null;
            
            console.log('Control Mensualidades - mesRef:', mesRef, 'idGrupo:', idGrupoControl);
            
            if (mesRef) {
                // Intenta extraer YYYY-MM si viene completo
                let mesRefNormalized = mesRef;
                // Si mesRef es solo 'YYYY-MM', STR_TO_DATE funciona bien.
                await conn.promise().query(
                    `INSERT INTO control_mensualidades (idEstudiante, idPago, Mes_date, idGrupo)
                     VALUES (?, ?, STR_TO_DATE(?, '%Y-%m'), ?)`,
                    [idEstudiante, idPago, mesRefNormalized, idGrupoControl]
                );
                console.log('Control mensualidades inserted successfully');
            } else if (idGrupoControl) {
                const todayMonth = new Date().toISOString().slice(0,7); // 'YYYY-MM'
                await conn.promise().query(
                    `INSERT INTO control_mensualidades (idEstudiante, idPago, Mes_date, idGrupo)
                     VALUES (?, ?, STR_TO_DATE(?, '%Y-%m'), ?)`,
                    [idEstudiante, idPago, todayMonth, idGrupoControl]
                );
                console.log('Control mensualidades (current month) inserted successfully');
            }
        } catch (cmErr) {
            console.error('ERROR inserting control_mensualidades:', cmErr);
        }

        // 7. Pagos Parciales
        if (parciales.length) {
            for (const p of parciales) {
                const montoPar = Number(p.monto || 0);
                if (!isNaN(montoPar) && montoPar > 0) {
                    await Estudiante.createPagoParcial({ idPago, idDeuda: p.idDeuda || idDeuda || null, Monto_parcial: montoPar });
                }
            }
        }

        // 8. Billetes (Cash)
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
            code: err.code,
            sqlMessage: err.sqlMessage
        });
    }
};