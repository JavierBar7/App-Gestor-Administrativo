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
        
        // MODIFICADO: Crear 2 Cuentas Destino
        await conn.promise().query(`
            INSERT INTO cuenta_destino (idCuenta_Destino, Nombre, Tipo, Moneda) VALUES 
            (1, 'Caja Chica', 'Efectivo', 'Mixta'),
            (2, 'Cuenta Débito', 'Banco', 'Bolívares')
        `);

        // Crear Métodos de Pago
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
        let currentDate = new Date('2025-09-01');

        // Generamos 20 tasas simuladas
        for (let i = 0; i < 20; i++) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const tasaVal = parseFloat(currentRate.toFixed(2));
            
            tasasHistory.push({ date: dateStr, rate: tasaVal });

            await conn.promise().query(
                "INSERT INTO historial_tasa (Tasa_Registrada, Fecha_Registro) VALUES (?, ?)",
                [tasaVal, dateStr]
            );

            // Incremento progresivo (~1.2 Bs por salto)
            currentRate += 0.5 + Math.random() * 1.5;
            currentDate.setDate(currentDate.getDate() + 4);
        }

        // Insertar tasa actual
        const ultimaTasa = tasasHistory[tasasHistory.length - 1];
        await conn.promise().query(
            "INSERT INTO tasa_cambio (Fecha_Vigencia, Tasa_usd_a_bs) VALUES (NOW(), ?)",
            [ultimaTasa.rate]
        );


        // ==========================================
        // 4. FUNCIONES HELPER
        // ==========================================
        
        // Buscar tasa para una fecha
        const getTasaForDate = (dateString) => {
            const target = new Date(dateString);
            let foundRate = 100.00;
            for (const entry of tasasHistory) {
                const entryDate = new Date(entry.date);
                if (entryDate <= target) foundRate = entry.rate;
                else break;
            }
            return foundRate;
        };

        const MONTO_INSCRIPCION = 10.00;
        const MONTO_MENSUALIDAD = 30.00;

        // Función maestra para registrar
        const registrarTransaccion = async (estudianteId, concepto, mesRef, estadoDeuda, montoPagado, fechaOp, metodoId, referenciaInput) => {
            const montoDeuda = concepto.includes('Inscripción') ? MONTO_INSCRIPCION : MONTO_MENSUALIDAD;
            const tasaAplicada = getTasaForDate(fechaOp);

            // Fechas
            const fechaVencimiento = new Date(fechaOp);
            fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1);
            fechaVencimiento.setDate(0);

            // Insertar Deuda
            const [resDeuda] = await conn.promise().query(`
                INSERT INTO deudas (idEstudiante, Monto_usd, Tasa_Emision, Monto_bs_emision, Fecha_emision, Fecha_vencimiento, Concepto, Estado)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [estudianteId, montoDeuda, tasaAplicada, montoDeuda * tasaAplicada, fechaOp, fechaVencimiento, concepto, estadoDeuda]);
            
            const idDeuda = resDeuda.insertId;

            // Insertar Pago (si aplica)
            if (montoPagado > 0) {
                // Definir referencia: si no viene, ponemos 'Pendiente'
                const refFinal = referenciaInput ? referenciaInput : 'Pendiente';

                // MODIFICADO: Lógica para asignar cuenta destino automáticamente
                let idCuentaDestino = 1; // Por defecto Caja Chica (Efectivo/Cash)
                if (metodoId === 1 || metodoId === 2) {
                    idCuentaDestino = 2; // Transferencia o Pago Móvil -> Cuenta Débito
                }

                const [resPago] = await conn.promise().query(`
                    INSERT INTO pagos (idDeuda, idMetodos_pago, idCuenta_Destino, idEstudiante, Referencia, Monto_bs, Tasa_Pago, Monto_usd, Fecha_pago)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [idDeuda, metodoId, idCuentaDestino, estudianteId, refFinal, montoPagado * tasaAplicada, tasaAplicada, montoPagado, fechaOp]);
                
                const idPago = resPago.insertId;

                // Control de mensualidades
                if (concepto.includes('Mensualidad')) {
                    let fechaMes = null;
                    const meses = { 'Septiembre': '2025-09-01', 'Octubre': '2025-10-01', 'Noviembre': '2025-11-01' };
                    if (mesRef && meses[mesRef]) fechaMes = meses[mesRef];

                    if (fechaMes) {
                        // Buscar grupo del estudiante
                        const [grupoRows] = await conn.promise().query('SELECT idGrupo FROM inscripciones WHERE idEstudiante = ? LIMIT 1', [estudianteId]);
                        const idGrupo = grupoRows.length ? grupoRows[0].idGrupo : null;

                        await conn.promise().query(`
                            INSERT INTO control_mensualidades (idEstudiante, idPago, Mes, Mes_date, idGrupo)
                            VALUES (?, ?, MONTH(?), ?, ?)
                        `, [estudianteId, idPago, fechaMes, fechaMes, idGrupo]);
                    }
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
        // 5. REGISTRO DE CASOS (USANDO NUEVOS MÉTODOS)
        // ==========================================
        console.log('👤 Procesando estudiantes...');

        // CONSTANTES DE MÉTODOS
        const M_TRANSF = 1;
        const M_PAGO_MOVIL = 2;
        const M_EFECTIVO = 3;
        const M_CASH = 4;

        // --- CASO 1: LUISITO (SOLVENTE - Transferencia/Cash) ---
        await registrarTransaccion(1, 'Inscripción', null, 'Pagada', 10, '2025-09-01', M_CASH, 'Pendiente');
        await registrarTransaccion(1, 'Mensualidad Septiembre', 'Septiembre', 'Pagada', 30, '2025-09-05', M_TRANSF, 'REF-123456');
        await registrarTransaccion(1, 'Mensualidad Octubre', 'Octubre', 'Pagada', 30, '2025-10-05', M_TRANSF, 'REF-123457');
        await registrarTransaccion(1, 'Mensualidad Noviembre', 'Noviembre', 'Pagada', 30, '2025-11-05', M_TRANSF, 'REF-123458');

        // --- CASO 2: SOFÍA (DEUDA 2 MESES - Pago Móvil) ---
        await registrarTransaccion(2, 'Inscripción', null, 'Pagada', 10, '2025-09-02', M_PAGO_MOVIL, 'PM-001');
        await registrarTransaccion(2, 'Mensualidad Septiembre', 'Septiembre', 'Pagada', 30, '2025-09-10', M_PAGO_MOVIL, 'PM-002');
        await registrarTransaccion(2, 'Mensualidad Octubre', 'Octubre', 'Pendiente', 0, '2025-10-01', null, null);
        await registrarTransaccion(2, 'Mensualidad Noviembre', 'Noviembre', 'Pendiente', 0, '2025-11-01', null, null);

        // --- CASO 3: PEDRITO (PAGO PARCIAL - Cash/Transf) ---
        await registrarTransaccion(3, 'Inscripción', null, 'Pagada', 10, '2025-09-01', M_TRANSF, 'TR-PED-1');
        await registrarTransaccion(3, 'Mensualidad Septiembre', 'Septiembre', 'Pagada', 30, '2025-09-15', M_TRANSF, 'TR-PED-2');
        // Parcial de Octubre (Debe 15, paga 15 con Cash sin referencia)
        await registrarTransaccion(3, 'Mensualidad Octubre', 'Octubre', 'Pendiente', 15, '2025-10-10', M_CASH, 'Pendiente');
        await registrarTransaccion(3, 'Mensualidad Noviembre', 'Noviembre', 'Pendiente', 0, '2025-11-01', null, null);

        // --- CASO 4: JAVIER (SOLVENTE FRACCIONADO - Transf/Cash) ---
        await registrarTransaccion(4, 'Inscripción', null, 'Pagada', 10, '2025-09-02', M_TRANSF, 'TR-JAV-1');
        await registrarTransaccion(4, 'Mensualidad Septiembre', 'Septiembre', 'Pagada', 30, '2025-09-20', M_TRANSF, 'TR-JAV-2');
        
        // Octubre Fraccionado Manual (2 Pagos Cash)
        const tasaOct = getTasaForDate('2025-10-01');
        const [resD] = await conn.promise().query(`
            INSERT INTO deudas (idEstudiante, Monto_usd, Tasa_Emision, Monto_bs_emision, Fecha_emision, Fecha_vencimiento, Concepto, Estado)
            VALUES (4, 30, ?, ?, '2025-10-01', '2025-10-31', 'Mensualidad Octubre', 'Pagada')
        `, [tasaOct, 30 * tasaOct]);
        const idDeudaJav = resD.insertId;

        // Pago 1 (15$ Cash -> CAJA CHICA)
        const tP1 = getTasaForDate('2025-10-05');
        const [p1] = await conn.promise().query(`
            INSERT INTO pagos (idDeuda, idMetodos_pago, idCuenta_Destino, idEstudiante, Referencia, Monto_bs, Tasa_Pago, Monto_usd, Fecha_pago) 
            VALUES (?, ?, 1, 4, 'Pendiente', ?, ?, 15, '2025-10-05')
        `, [idDeudaJav, M_CASH, 15 * tP1, tP1]);
        await conn.promise().query(`INSERT INTO pagos_parciales (idPago, idDeuda, Monto_parcial) VALUES (?, ?, 15)`, [p1.insertId, idDeudaJav]);

        // Pago 2 (15$ Cash -> CAJA CHICA)
        const tP2 = getTasaForDate('2025-10-20');
        const [p2] = await conn.promise().query(`
            INSERT INTO pagos (idDeuda, idMetodos_pago, idCuenta_Destino, idEstudiante, Referencia, Monto_bs, Tasa_Pago, Monto_usd, Fecha_pago) 
            VALUES (?, ?, 1, 4, 'Pendiente', ?, ?, 15, '2025-10-20')
        `, [idDeudaJav, M_CASH, 15 * tP2, tP2]);
        await conn.promise().query(`INSERT INTO pagos_parciales (idPago, idDeuda, Monto_parcial) VALUES (?, ?, 15)`, [p2.insertId, idDeudaJav]);
        
        // Control mensualidad (Grupo de Javier es 3 según seed anterior, lo buscamos dinámico mejor)
        const [grupoJav] = await conn.promise().query('SELECT idGrupo FROM inscripciones WHERE idEstudiante = 4 LIMIT 1');
        await conn.promise().query(`INSERT INTO control_mensualidades (idEstudiante, idPago, Mes, Mes_date, idGrupo) VALUES (4, ?, 10, '2025-10-01', ?)`, [p2.insertId, grupoJav[0].idGrupo]);

        // Noviembre Normal (Transf -> CUENTA DEBITO)
        await registrarTransaccion(4, 'Mensualidad Noviembre', 'Noviembre', 'Pagada', 30, '2025-11-15', M_TRANSF, 'TR-JAV-3');

        // --- CASO 5: GABRIELA (SOLVENTE - Efectivo Bs) ---
        // Referencia 'Pendiente' para Efectivo -> CAJA CHICA
        await registrarTransaccion(5, 'Inscripción', null, 'Pagada', 10, '2025-09-05', M_EFECTIVO, 'Pendiente');
        await registrarTransaccion(5, 'Mensualidad Septiembre', 'Septiembre', 'Pagada', 30, '2025-09-25', M_EFECTIVO, 'Pendiente');
        await registrarTransaccion(5, 'Mensualidad Octubre', 'Octubre', 'Pagada', 30, '2025-10-25', M_EFECTIVO, 'Pendiente');
        await registrarTransaccion(5, 'Mensualidad Noviembre', 'Noviembre', 'Pagada', 30, '2025-11-18', M_EFECTIVO, 'Pendiente');

        // --- CASO 6: ROBERTO (MOROSO - Cash) ---
        await registrarTransaccion(6, 'Inscripción', null, 'Pagada', 10, '2025-09-06', M_CASH, 'CASH-ROB');
        await registrarTransaccion(6, 'Mensualidad Septiembre', 'Septiembre', 'Pendiente', 0, '2025-09-01', null, null);
        await registrarTransaccion(6, 'Mensualidad Octubre', 'Octubre', 'Pendiente', 0, '2025-10-01', null, null);
        await registrarTransaccion(6, 'Mensualidad Noviembre', 'Noviembre', 'Pendiente', 0, '2025-11-01', null, null);

        console.log('✅ ¡Datos financieros generados exitosamente con multi-cuentas!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error al ejecutar seed:', error);
        process.exit(1);
    }
}

seedFinancialData();