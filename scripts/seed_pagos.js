const conn = require('../config/database');

async function seedFinancialData() {
    try {
        console.log('💰 Iniciando generación de historial financiero (JS)...');

        // ==========================================
        // 1. LIMPIEZA DE TABLAS
        // ==========================================
        console.log('🧹 Limpiando tablas...');
        await conn.promise().query("SET FOREIGN_KEY_CHECKS = 0");
        const tablas = [
            'historial_tasa', 'tasa_cambio', 'metodos_pagos', 'cuenta_destino',
            'pagos_parciales', 'control_mensualidades', 'pagos', 'deudas'
        ];
        for (const t of tablas) {
            await conn.promise().query(`TRUNCATE TABLE ${t}`);
        }
        await conn.promise().query("SET FOREIGN_KEY_CHECKS = 1");


        // ==========================================
        // 2. CONFIGURACIÓN DE CUENTA Y MÉTODOS
        // ==========================================
        console.log('⚙️ Configurando cuentas destino y métodos...');
        
        await conn.promise().query(`
            INSERT INTO cuenta_destino (idCuenta_Destino, Nombre, Tipo, Moneda) VALUES 
            (1, 'Caja Chica', 'Efectivo', 'Mixta'),
            (2, 'Cuenta Débito', 'Banco', 'Bolívares')
        `);

        await conn.promise().query(`
            INSERT INTO metodos_pagos (idMetodos_pago, Nombre, Tipo_Validacion, Moneda_asociada) VALUES 
            (1, 'Transferencia', 'Número de referencia', 'Bolívares'),
            (2, 'Pago Móvil', 'Número de referencia', 'Bolívares'),
            (3, 'Efectivo', 'Sin validación', 'Bolívares'),
            (4, 'Cash', 'Códigos de billetes', 'Dólares')
        `);


        // ==========================================
        // 3. GENERACIÓN DE HISTORIAL DE TASAS
        // ==========================================
        console.log('📈 Generando tasas...');
        const tasasHistory = [];
        let currentRate = 100.00;
        let currentDate = new Date('2025-08-01T12:00:00'); 

        for (let i = 0; i < 30; i++) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const tasaVal = parseFloat(currentRate.toFixed(2));
            
            tasasHistory.push({ date: dateStr, rate: tasaVal });

            await conn.promise().query(
                "INSERT INTO historial_tasa (Tasa_Registrada, Fecha_Registro) VALUES (?, ?)",
                [tasaVal, dateStr]
            );

            currentRate += 0.5 + Math.random() * 1.5;
            currentDate.setDate(currentDate.getDate() + 4);
        }

        // Tasa actual
        const ultimaTasa = tasasHistory[tasasHistory.length - 1];
        await conn.promise().query(
            "INSERT INTO tasa_cambio (Fecha_Vigencia, Tasa_usd_a_bs) VALUES (NOW(), ?)",
            [ultimaTasa.rate]
        );


        // ==========================================
        // 4. FUNCIONES HELPER
        // ==========================================
        
        const getTasaForDate = (dateString) => {
            const target = new Date(dateString);
            let foundRate = 100.00;
            for (const entry of tasasHistory) {
                const entryDate = new Date(entry.date + 'T23:59:59');
                if (entryDate <= target) foundRate = entry.rate;
            }
            if (target > new Date(tasasHistory[tasasHistory.length - 1].date)) {
                return tasasHistory[tasasHistory.length - 1].rate;
            }
            return foundRate;
        };

        const MONTO_INSCRIPCION = 10.00;
        const MONTO_MENSUALIDAD = 30.00;

        const registrarTransaccion = async (estudianteId, concepto, mesRef, estadoDeuda, montoPagado, fechaOpBase, metodoId, referenciaInput) => {
            const fechaOp = `${fechaOpBase} 10:00:00`;
            const montoDeuda = concepto.includes('Inscripción') ? MONTO_INSCRIPCION : MONTO_MENSUALIDAD;
            const tasaAplicada = getTasaForDate(fechaOp);

            const fechaVencimiento = new Date(fechaOpBase);
            fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1);
            fechaVencimiento.setDate(0);

            // 1. Insertar Deuda
            const [resDeuda] = await conn.promise().query(`
                INSERT INTO deudas (idEstudiante, Monto_usd, Tasa_Emision, Monto_bs_emision, Fecha_emision, Fecha_vencimiento, Concepto, Estado)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [estudianteId, montoDeuda, tasaAplicada, montoDeuda * tasaAplicada, fechaOp, fechaVencimiento, concepto, estadoDeuda]);
            
            const idDeuda = resDeuda.insertId;

            // 2. Insertar Pago
            if (montoPagado > 0) {
                let refFinal = referenciaInput;
                if (concepto.includes('Inscripción') && !refFinal) {
                    refFinal = `INS-${estudianteId}-${Math.floor(Math.random() * 1000)}`;
                } else if (!refFinal) {
                    refFinal = 'Pendiente';
                }

                let idCuentaDestino = 1; 
                if (metodoId === 1 || metodoId === 2) {
                    idCuentaDestino = 2; 
                }

                const [resPago] = await conn.promise().query(`
                    INSERT INTO pagos (idDeuda, idMetodos_pago, idCuenta_Destino, idEstudiante, Referencia, Monto_bs, Tasa_Pago, Monto_usd, Fecha_pago)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [idDeuda, metodoId, idCuentaDestino, estudianteId, refFinal, montoPagado * tasaAplicada, tasaAplicada, montoPagado, fechaOp]);
                
                const idPago = resPago.insertId;

                // 3. Control de Mensualidades
                let obs = null;
                let mesNum = 0;
                let mesDate = null;

                if (concepto.includes('Inscripción')) {
                    obs = 'Inscripción';
                } else if (concepto.includes('Mensualidad')) {
                    const mapMeses = { 
                        'Septiembre': '2025-09-01', 
                        'Octubre': '2025-10-01', 
                        'Noviembre': '2025-11-01',
                        'Diciembre': '2025-12-01'
                    };
                    if (mesRef && mapMeses[mesRef]) {
                        mesDate = mapMeses[mesRef];
                        mesNum = new Date(mesDate).getMonth() + 1;
                    }
                }

                // Insertar en control_mensualidades SOLO si no existe conflicto
                if (mesDate || obs) {
                    const [grupoRows] = await conn.promise().query('SELECT idGrupo FROM inscripciones WHERE idEstudiante = ? LIMIT 1', [estudianteId]);
                    const idGrupo = grupoRows.length ? grupoRows[0].idGrupo : null;

                    // Usamos INSERT IGNORE para evitar el error ER_DUP_ENTRY si ya existe el mes para este alumno
                    await conn.promise().query(`
                        INSERT IGNORE INTO control_mensualidades (idEstudiante, idPago, Mes, Mes_date, Observacion, idGrupo)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `, [estudianteId, idPago, mesNum, mesDate, obs, idGrupo]);
                }
                
                // Pago Parcial
                if (montoPagado < montoDeuda) {
                    await conn.promise().query(`
                        INSERT INTO pagos_parciales (idPago, idDeuda, Monto_parcial) VALUES (?, ?, ?)
                    `, [idPago, idDeuda, montoPagado]);
                }
            }
        };


        // ==========================================
        // 5. REGISTRO DE CASOS
        // ==========================================
        console.log('👤 Procesando estudiantes...');

        const M_TRANSF = 1;
        const M_PAGO_MOVIL = 2;
        const M_EFECTIVO = 3;
        const M_CASH = 4;

        // --- CASO 1: LUISITO (SOLVENTE) ---
        await registrarTransaccion(1, 'Inscripción', null, 'Pagada', 10, '2025-09-01', M_CASH, 'REF-INS-LUI'); 
        await registrarTransaccion(1, 'Mensualidad Septiembre', 'Septiembre', 'Pagada', 30, '2025-09-05', M_TRANSF, 'REF-123456');
        await registrarTransaccion(1, 'Mensualidad Octubre', 'Octubre', 'Pagada', 30, '2025-10-05', M_TRANSF, 'REF-123457');
        await registrarTransaccion(1, 'Mensualidad Noviembre', 'Noviembre', 'Pagada', 30, '2025-11-05', M_TRANSF, 'REF-123458');

        // --- CASO 2: SOFÍA (MOROSA) ---
        await registrarTransaccion(2, 'Inscripción', null, 'Pagada', 10, '2025-09-02', M_PAGO_MOVIL, 'PM-INS-SOF');
        await registrarTransaccion(2, 'Mensualidad Septiembre', 'Septiembre', 'Pagada', 30, '2025-09-10', M_PAGO_MOVIL, 'PM-002');
        await registrarTransaccion(2, 'Mensualidad Octubre', 'Octubre', 'Pendiente', 0, '2025-10-01', null, null);
        await registrarTransaccion(2, 'Mensualidad Noviembre', 'Noviembre', 'Pendiente', 0, '2025-11-01', null, null);

        // --- CASO 3: PEDRITO (PAGO PARCIAL) ---
        await registrarTransaccion(3, 'Inscripción', null, 'Pagada', 10, '2025-09-01', M_TRANSF, 'TR-INS-PED');
        await registrarTransaccion(3, 'Mensualidad Septiembre', 'Septiembre', 'Pagada', 30, '2025-09-15', M_TRANSF, 'TR-PED-2');
        await registrarTransaccion(3, 'Mensualidad Octubre', 'Octubre', 'Pendiente', 15, '2025-10-10', M_CASH, null);
        await registrarTransaccion(3, 'Mensualidad Noviembre', 'Noviembre', 'Pendiente', 0, '2025-11-01', null, null);

        // --- CASO 4: JAVIER (SOLVENTE FRACCIONADO) ---
        await registrarTransaccion(4, 'Inscripción', null, 'Pagada', 10, '2025-09-02', M_TRANSF, 'TR-INS-JAV');
        await registrarTransaccion(4, 'Mensualidad Septiembre', 'Septiembre', 'Pagada', 30, '2025-09-20', M_TRANSF, 'TR-JAV-2');
        
        // --- LOGICA ESPECIAL PARA EL PAGO DOBLE DE JAVIER (OCTUBRE) ---
        
        // 1. Crear Deuda Total de Octubre
        const tasaOct = getTasaForDate('2025-10-01 10:00:00');
        const [resD] = await conn.promise().query(`
            INSERT INTO deudas (idEstudiante, Monto_usd, Tasa_Emision, Monto_bs_emision, Fecha_emision, Fecha_vencimiento, Concepto, Estado)
            VALUES (4, 30, ?, ?, '2025-10-01 10:00:00', '2025-10-31', 'Mensualidad Octubre', 'Pagada')
        `, [tasaOct, 30 * tasaOct]);
        const idDeudaJav = resD.insertId;
        
        const [grupoJav] = await conn.promise().query('SELECT idGrupo FROM inscripciones WHERE idEstudiante = 4 LIMIT 1');
        const idGrp4 = grupoJav[0].idGrupo;

        // 2. Pago 1 (15$) -> Se registra en control_mensualidades
        const tP1 = getTasaForDate('2025-10-05 10:00:00');
        const [p1] = await conn.promise().query(`
            INSERT INTO pagos (idDeuda, idMetodos_pago, idCuenta_Destino, idEstudiante, Referencia, Monto_bs, Tasa_Pago, Monto_usd, Fecha_pago) 
            VALUES (?, ?, 1, 4, 'Pendiente', ?, ?, 15, '2025-10-05 10:00:00')
        `, [idDeudaJav, M_CASH, 15 * tP1, tP1]);
        await conn.promise().query(`INSERT INTO pagos_parciales (idPago, idDeuda, Monto_parcial) VALUES (?, ?, 15)`, [p1.insertId, idDeudaJav]);
        await conn.promise().query(`INSERT INTO control_mensualidades (idEstudiante, idPago, Mes, Mes_date, idGrupo) VALUES (4, ?, 10, '2025-10-01', ?)`, [p1.insertId, idGrp4]);

        // 3. Pago 2 (15$) -> Completivo. NO LO INSERTAMOS EN control_mensualidades para evitar el error de duplicado.
        const tP2 = getTasaForDate('2025-10-20 10:00:00');
        const [p2] = await conn.promise().query(`
            INSERT INTO pagos (idDeuda, idMetodos_pago, idCuenta_Destino, idEstudiante, Referencia, Monto_bs, Tasa_Pago, Monto_usd, Fecha_pago) 
            VALUES (?, ?, 1, 4, 'Pendiente', ?, ?, 15, '2025-10-20 10:00:00')
        `, [idDeudaJav, M_CASH, 15 * tP2, tP2]);
        await conn.promise().query(`INSERT INTO pagos_parciales (idPago, idDeuda, Monto_parcial) VALUES (?, ?, 15)`, [p2.insertId, idDeudaJav]);
        // *** AQUÍ ELIMINAMOS EL INSERT A CONTROL_MENSUALIDADES QUE CAUSABA EL ERROR ***

        // Noviembre Normal
        await registrarTransaccion(4, 'Mensualidad Noviembre', 'Noviembre', 'Pagada', 30, '2025-11-15', M_TRANSF, 'TR-JAV-3');

        // --- CASO 5: GABRIELA ---
        await registrarTransaccion(5, 'Inscripción', null, 'Pagada', 10, '2025-09-05', M_EFECTIVO, 'Pendiente');
        await registrarTransaccion(5, 'Mensualidad Septiembre', 'Septiembre', 'Pagada', 30, '2025-09-25', M_EFECTIVO, 'Pendiente');
        await registrarTransaccion(5, 'Mensualidad Octubre', 'Octubre', 'Pagada', 30, '2025-10-25', M_EFECTIVO, 'Pendiente');
        await registrarTransaccion(5, 'Mensualidad Noviembre', 'Noviembre', 'Pagada', 30, '2025-11-18', M_EFECTIVO, 'Pendiente');

        // --- CASO 6: ROBERTO ---
        await registrarTransaccion(6, 'Inscripción', null, 'Pagada', 10, '2025-09-06', M_CASH, 'CASH-ROB');
        await registrarTransaccion(6, 'Mensualidad Septiembre', 'Septiembre', 'Pendiente', 0, '2025-09-01', null, null);
        await registrarTransaccion(6, 'Mensualidad Octubre', 'Octubre', 'Pendiente', 0, '2025-10-01', null, null);
        await registrarTransaccion(6, 'Mensualidad Noviembre', 'Noviembre', 'Pendiente', 0, '2025-11-01', null, null);

        console.log('✅ ¡Datos financieros generados correctamente! Error de duplicado solucionado.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error al ejecutar seed:', error);
        process.exit(1);
    }
}

seedFinancialData();