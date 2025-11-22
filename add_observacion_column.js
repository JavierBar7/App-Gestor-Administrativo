const conn = require('./config/database');

async function migrate() {
    try {
        console.log("Adding 'observacion' column to 'pagos' table...");
        await conn.promise().query("ALTER TABLE pagos ADD COLUMN observacion TEXT DEFAULT NULL");
        console.log("✅ Column 'observacion' added successfully.");
        process.exit(0);
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("⚠️ Column 'observacion' already exists.");
            process.exit(0);
        }
        console.error("❌ Error adding column:", err);
        process.exit(1);
    }
}

migrate();
