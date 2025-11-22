const conn = require('../config/database');

async function fixDatabase() {
    try {
        console.log('🔧 Reparando base de datos...');
        
        // 1. Agregar columna observacion a la tabla pagos si no existe
        try {
            await conn.promise().query("ALTER TABLE pagos ADD COLUMN observacion VARCHAR(255) NULL AFTER Referencia");
            console.log('✅ Columna "observacion" agregada a la tabla pagos.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('✓ La columna "observacion" ya existía.');
            } else {
                throw err;
            }
        }

        console.log('🎉 Base de datos actualizada correctamente. Ahora puedes ver los estudiantes.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error actualizando la BD:', error.message);
        process.exit(1);
    }
}

fixDatabase();