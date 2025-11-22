const conn = require('./src/config/database');

async function check() {
    try {
        const [rows] = await conn.promise().query('SELECT * FROM cuenta_destino');
        console.log('Cuentas found:', rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
