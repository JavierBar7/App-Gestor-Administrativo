const conn = require('../config/database');

async function seedInsolventStudent() {
    try {
        console.log('🔄 Creando datos de prueba para estudiante no solvente...');

        // 1. Usaremos al estudiante ID 1 (Luisito Pérez) que ya existe en el seed normal
        const idEstudiante = 1;

        // 2. Insertar una DEUDA de $50
        console.log('📥 Insertando Deuda de $50...');
        const [res] = await conn.promise().query(`
            INSERT INTO deudas (idEstudiante, Monto_usd, Tasa_Emision, Monto_bs_emision, Fecha_emision, Fecha_vencimiento, Concepto, Estado) 
            VALUES (?, 50.00, 45.00, 2250.00, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 'Mensualidad Noviembre', 'Pendiente')
        `, [idEstudiante]);
        
        const idDeuda = res.insertId;
        console.log(`✅ Deuda creada con ID: ${idDeuda}`);

        // 3. Insertar un PAGO PARCIAL de $10 (opcional, para probar cálculo)
        // Vamos a dejarlo sin pago para que deba los $50 completos primero.
        // Si quisieras probar parcial:
        /*
        await conn.promise().query(`
            INSERT INTO pagos_parciales (idDeuda, Monto_parcial, Fecha_pago, Referencia)
            VALUES (?, 10.00, NOW(), 'REF123456')
        `, [idDeuda]);
        */

        console.log('✅ Datos de prueba insertados. El estudiante Luisito Pérez (ID 1) debería tener una deuda pendiente de $50.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error al crear datos de prueba:', error);
        process.exit(1);
    }
}

seedInsolventStudent();
