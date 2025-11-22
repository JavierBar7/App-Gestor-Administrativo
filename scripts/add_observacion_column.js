const conn = require('../config/database');

async function runMigration() {
    try {
        console.log('🔧 Agregando columna "observacion" a la tabla pagos...');
        
        // Intentamos agregar la columna. Si ya existe, el catch lo manejará.
        await conn.promise().query("ALTER TABLE pagos ADD COLUMN observacion VARCHAR(255) NULL AFTER Referencia");
        
        console.log('✅ Columna agregada exitosamente.');
        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️ La columna "observacion" ya existía. No se hicieron cambios.');
            process.exit(0);
        } else {
            console.error('❌ Error:', error);
            process.exit(1);
        }
    }
}

runMigration();