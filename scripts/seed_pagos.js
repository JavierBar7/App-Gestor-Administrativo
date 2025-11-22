const conn = require('../config/database');

async function seedFinancialData() {
    try {
        console.log('💰 Iniciando generación de historial financiero (JS)...');

        // 1. LIMPIEZA
        console.log('🧹 Limpiando tablas...');
        await conn.promise().query("SET FOREIGN_KEY_CHECKS = 0");
        const tablas = ['historial_tasa', 'tasa_cambio', 'metodos_pagos', 'cuenta_destino', 'pagos_parciales', 'control_mensualidades', 'pagos', 'deudas'];
        for (const t of tablas) await conn.promise().query(`TRUNCATE TABLE ${t}`);
        await conn.promise().query("SET FOREIGN_KEY_CHECKS = 1");

        // 2. CONFIGURACIÓN
        await conn.promise().query(`INSERT INTO cuenta_destino (idCuenta_Destino, Nombre, Tipo, Moneda) VALUES (1, 'Caja Chica', 'Efectivo', 'Mixta'), (2, 'Cuenta Débito', 'Banco', 'Bolívares')`);
        await conn.promise().query(`INSERT INTO metodos_pagos (idMetodos_pago, Nombre, Tipo_Validacion, Moneda_asociada) VALUES (1, 'Transferencia', 'Número de referencia', 'Bolívares'), (2, 'Pago Móvil', 'Número de referencia', 'Bolívares'), (3, 'Efectivo', 'Sin validación', 'Bolívares'), (4, 'Cash', 'Códigos de billetes', 'Dólares')`);

        // 3. TASAS
        const tasasHistory = [];
        let currentRate = 100.00;
        let currentDate = new Date('2025-08-01T12:00:00');
        for (let i = 0; i < 30; i++) {
            const dateStr = currentDate.toISOString().split('T')[0];
            tasasHistory.push({ date: dateStr, rate: parseFloat(currentRate.toFixed(2)) });
            await conn.promise().query("INSERT INTO historial_tasa (Tasa_Registrada, Fecha_Registro) VALUES (?, ?)", [parseFloat(currentRate.toFixed(2)), dateStr]);
            currentRate += 0.5 + Math.random() * 1.5;
            currentDate.setDate(currentDate.getDate() + 4);
        }
        await conn.promise().query("INSERT INTO tasa_cambio (Fecha_Vigencia, Tasa_usd_a_bs) VALUES (NOW(), ?)", [tasasHistory[tasasHistory.length - 1].rate]);

        // HELPER: Tasa
        const getTasaForDate = (dateString) => {
            const target = new Date(dateString);
            let foundRate = 100.00;
            for (const entry of tasasHistory) {
                const entryDate = new Date(entry.date + 'T23:59:59');
                if (entryDate <= target) foundRate = entry.rate;
            }
            return foundRate;
        };

        const MONTO_INSCRIPCION = 10.00;
        const MONTO_MENSUALIDAD = 30.00;

        // HELPER: Registrar Transacción
        const registrarTransaccion = async (estudianteId, concepto, mesRef, estadoDeuda, montoPagado, fechaOpBase, metodoId, referenciaInput) => {
            const fechaOp = `${fechaOpBase} 10:00:00`;
            const montoDeuda = concepto.includes('Inscripción') ? MONTO_INSCRIPCION : MONTO_MENSUALIDAD;
            const tasaAplicada = getTasaForDate(fechaOp);
            const fechaVencimiento = new Date(fechaOpBase); fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1); fechaVencimiento.setDate(0);

            // Crear Deuda
            const [resDeuda] = await conn.promise().query(`INSERT INTO deudas (idEstudiante, Monto_usd, Tasa_Emision, Monto_bs_emision, Fecha_emision, Fecha_vencimiento, Concepto, Estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
                [estudianteId, montoDeuda, tasaAplicada, montoDeuda * tasaAplicada, fechaOp, fechaVencimiento, concepto, estadoDeuda]);
            const idDeuda = resDeuda.insertId;

            if (montoPagado > 0) {
                // REFERENCIA
                let refFinal = referenciaInput;
                
                // Si es inscripción y no hay ref, generar NUMÉRICA SIMPLE (ej. 029384)
                if (!refFinal && concepto.includes('Inscripción')) {
                    refFinal = Math.floor(100000 + Math.random() * 900000).toString();
                } else if (!refFinal) {
                    refFinal = 'Pendiente';
                }

                let idCuenta = (metodoId === 1 || metodoId === 2) ? 2 : 1;

                const [resPago] = await conn.promise().query(`INSERT INTO pagos (idDeuda, idMetodos_pago, idCuenta_Destino, idEstudiante, Referencia, Monto_bs, Tasa_Pago, Monto_usd, Fecha_pago) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                    [idDeuda, metodoId, idCuenta, estudianteId, refFinal, montoPagado * tasaAplicada, tasaAplicada, montoPagado, fechaOp]);
                
                // CONTROL MENSUALIDADES y OBSERVACIÓN
                let obs = null;
                let mesNum = 0;
                let mesDate = null;

                if (concepto.includes('Inscripción')) {
                    obs = 'Inscripción'; 
                } else if (concepto.includes('Mensualidad')) {
                    const mapMeses = { 'Septiembre': '2025-09-01', 'Octubre': '2025-10-01', 'Noviembre': '2025-11-01' };
                    if (mesRef && mapMeses[mesRef]) {
                        mesDate = mapMeses[mesRef];
                        mesNum = new Date(mesDate).getMonth() + 1;
                    }
                }

                // Insertar control (INSERT IGNORE para evitar duplicados en pagos fraccionados como el de Javier)
                if (mesDate || obs) {
                    const [g] = await conn.promise().query('SELECT idGrupo FROM inscripciones WHERE idEstudiante = ? LIMIT 1', [estudianteId]);
                    const idGrupo = g.length ? g[0].idGrupo : null;
                    await conn.promise().query(`INSERT IGNORE INTO control_mensualidades (idEstudiante, idPago, Mes, Mes_date, Observacion, idGrupo) VALUES (?, ?, ?, ?, ?, ?)`, 
                        [estudianteId, resPago.insertId, mesNum, mesDate, obs, idGrupo]);
                }

                if (montoPagado < montoDeuda) {
                    await conn.promise().query(`INSERT INTO pagos_parciales (idPago, idDeuda, Monto_parcial) VALUES (?, ?, ?)`, [resPago.insertId, idDeuda, montoPagado]);
                }
            }
        };

        console.log('👤 Procesando estudiantes...');
        const [TR, PM, EF, CASH] = [1, 2, 3, 4]; 

        // 1. LUISITO
        await registrarTransaccion(1, 'Inscripción', null, 'Pagada', 10, '2025-09-01', CASH, null); 
        await registrarTransaccion(1, 'Mensualidad Septiembre', 'Septiembre', 'Pagada', 30, '2025-09-05', TR, '123456');
        
        // 2. SOFÍA (Ejemplo solicitado)
        await registrarTransaccion(2, 'Inscripción', null, 'Pagada', 10, '2025-09-02', PM, '002938'); // Ref numérica
        await registrarTransaccion(2, 'Mensualidad Septiembre', 'Septiembre', 'Pagada', 30, '2025-09-10', PM, '002');
        await registrarTransaccion(2, 'Mensualidad Octubre', 'Octubre', 'Pendiente', 0, '2025-10-01', null, null);
        await registrarTransaccion(2, 'Mensualidad Noviembre', 'Noviembre', 'Pendiente', 0, '2025-11-01', null, null);

        // 3. PEDRITO
        await registrarTransaccion(3, 'Inscripción', null, 'Pagada', 10, '2025-09-01', TR, '098765');
        await registrarTransaccion(3, 'Mensualidad Septiembre', 'Septiembre', 'Pagada', 30, '2025-09-15', TR, '567890');
        
        // 4. JAVIER
        await registrarTransaccion(4, 'Inscripción', null, 'Pagada', 10, '2025-09-02', TR, '112233');
        await registrarTransaccion(4, 'Mensualidad Octubre', 'Octubre', 'Pendiente', 15, '2025-10-05', CASH, null); // Abono 1
        await registrarTransaccion(4, 'Mensualidad Octubre', 'Octubre', 'Pagada', 15, '2025-10-20', CASH, null); // Abono 2 (Cierra)
        
        console.log('✅ Datos generados correctamente.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seed:', error);
        process.exit(1);
    }
}

seedFinancialData();