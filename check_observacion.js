const conn = require('./config/database');

async function checkSchema() {
    try {
        const [rows] = await conn.promise().query("SHOW COLUMNS FROM pagos LIKE 'observacion'");
        if (rows.length > 0) {
            console.log("✅ Column 'observacion' exists in 'pagos' table.");
        } else {
            console.log("❌ Column 'observacion' MISSING in 'pagos' table.");
        }
        process.exit(0);
    } catch (err) {
        console.error("Error checking schema:", err);
        process.exit(1);
    }
}

checkSchema();
