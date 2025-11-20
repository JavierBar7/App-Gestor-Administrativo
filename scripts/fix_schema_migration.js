const conn = require('../config/database');

async function runMigration() {
    try {
        console.log('Modifying idDeuda to allow NULL...');
        // We assume idDeuda is INT. If it's BIGINT, we might need to check, but INT is standard here.
        // We use MODIFY to change the definition.
        await conn.promise().query('ALTER TABLE pagos MODIFY COLUMN idDeuda INT NULL');
        console.log('Migration successful: idDeuda is now nullable.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
