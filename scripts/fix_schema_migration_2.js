const conn = require('../config/database');

async function runMigration() {
    try {
        console.log('Modifying idCuenta_Destino to allow NULL...');
        await conn.promise().query('ALTER TABLE pagos MODIFY COLUMN idCuenta_Destino INT NULL');
        console.log('Migration successful: idCuenta_Destino is now nullable.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
