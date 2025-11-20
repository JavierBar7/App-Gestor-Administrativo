const conn = require('../config/database');

async function checkControlMensualidades() {
    try {
        // Check table structure
        console.log('\n=== CONTROL_MENSUALIDADES TABLE STRUCTURE ===');
        const [columns] = await conn.promise().query('DESCRIBE control_mensualidades');
        console.table(columns);

        // Check recent records
        console.log('\n=== RECENT CONTROL_MENSUALIDADES RECORDS ===');
        const [records] = await conn.promise().query(`
            SELECT cm.*, g.Nombre_Grupo, p.Fecha_pago, p.Monto_usd
            FROM control_mensualidades cm
            LEFT JOIN grupos g ON g.idGrupo = cm.idGrupo
            LEFT JOIN pagos p ON p.idPago = cm.idPago
            ORDER BY cm.idControl DESC
            LIMIT 10
        `);
        console.table(records);

        // Check recent payments without control records
        console.log('\n=== RECENT PAYMENTS WITHOUT CONTROL RECORDS ===');
        const [orphans] = await conn.promise().query(`
            SELECT p.idPago, p.idEstudiante, p.Fecha_pago, p.Monto_usd, p.Mes_referencia
            FROM pagos p
            LEFT JOIN control_mensualidades cm ON cm.idPago = p.idPago
            WHERE cm.idControl IS NULL
            ORDER BY p.idPago DESC
            LIMIT 10
        `);
        console.table(orphans);

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkControlMensualidades();
