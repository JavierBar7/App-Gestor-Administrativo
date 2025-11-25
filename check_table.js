const conn = require('./config/database');

async function checkTable() {
    try {
        const [rows] = await conn.promise().query("SHOW TABLES LIKE 'solicitudes_pago'");
        if (rows.length > 0) {
            console.log("Table 'solicitudes_pago' EXISTS.");
        } else {
            console.log("Table 'solicitudes_pago' DOES NOT EXIST.");
        }
        process.exit(0);
    } catch (error) {
        console.error("Error checking table:", error);
        process.exit(1);
    }
}

checkTable();
