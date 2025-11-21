/* Quick check script: muestra estudiantes, pagos y control_mensualidades para IDs 1 y 2 */
const conn = require('../config/database');

async function run() {
    try {
        const ids = [1,2];

        // Print basic DB connection config (not sensitive values) to help debugging
        try {
            const cfg = conn && conn.config ? {
                host: conn.config.host,
                user: conn.config.user,
                database: conn.config.database
            } : null;
            console.log('DB config (derived):', cfg);
        } catch (e) {
            console.warn('No se pudo leer config desde el objeto de conexión:', e && e.message ? e.message : e);
        }

        // Quick connection test
        try {
            const [t] = await conn.promise().query('SELECT 1 AS ok');
            console.log('Connection test result:', t);
        } catch (connErr) {
            console.error('Fallo en prueba de conexión (SELECT 1):', connErr && connErr.message ? connErr.message : connErr);
            throw connErr; // stop further queries
        }

        console.log('Consulta: estudiantes id IN (1,2)');
        const [est] = await conn.promise().query('SELECT * FROM estudiantes WHERE idEstudiante IN (?, ?)', ids);
        console.log(JSON.stringify(est, null, 2));

        console.log('\nConsulta: pagos recientes para idEstudiante IN (1,2)');
        const [pagos] = await conn.promise().query('SELECT * FROM pagos WHERE idEstudiante IN (?, ?) ORDER BY Fecha_pago DESC LIMIT 50', ids);
        console.log(JSON.stringify(pagos, null, 2));

        console.log('\nConsulta: control_mensualidades recientes para idEstudiante IN (1,2)');
        const [cm] = await conn.promise().query('SELECT * FROM control_mensualidades WHERE idEstudiante IN (?, ?) ORDER BY idControl DESC LIMIT 50', ids);
        console.log(JSON.stringify(cm, null, 2));

        // Also show deudas for completeness
        console.log('\nConsulta: deudas abiertas para idEstudiante IN (1,2)');
        const [deudas] = await conn.promise().query("SELECT * FROM deudas WHERE idEstudiante IN (?, ?) AND Estado != 'Pagada' ORDER BY Fecha_emision ASC", ids);
        console.log(JSON.stringify(deudas, null, 2));

    } catch (err) {
        console.error('Error ejecutando consultas:', err && err.message ? err.message : err);
        if (err && err.sqlMessage) console.error('SQL Message:', err.sqlMessage);
        if (err && err.code) console.error('Error code:', err.code);
    } finally {
        try { conn.end(); } catch (e) { /* ignore */ }
    }
}

run();
