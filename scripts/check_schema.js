const conn = require('../config/database');

async function checkSchema() {
    try {
        const [rows] = await conn.promise().query('DESCRIBE pagos');
        console.log('Schema of pagos table:');
        console.table(rows);
        process.exit(0);
    } catch (err) {
        console.error('Error checking schema:', err);
        process.exit(1);
    }
}

checkSchema();
