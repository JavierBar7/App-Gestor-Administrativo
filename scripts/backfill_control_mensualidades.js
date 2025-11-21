/* Backfill control_mensualidades: populate Mes_date, Mes and Year from pagos.Fecha_pago when missing */
const conn = require('../config/database');

async function run() {
    try {
        console.log('Buscando filas en control_mensualidades con Mes_date NULL o Mes=0...');
        const [rows] = await conn.promise().query("SELECT cm.idControl, cm.idPago, cm.idEstudiante, cm.Mes, cm.Year, cm.Mes_date, p.Fecha_pago FROM control_mensualidades cm LEFT JOIN pagos p ON p.idPago = cm.idPago WHERE cm.Mes_date IS NULL OR cm.Mes_date = '0000-00-00' OR cm.Mes = 0");
        console.log('Encontradas', rows.length, 'filas');
        for (const r of rows) {
            if (!r.Fecha_pago) {
                console.log('  - idControl', r.idControl, 'no tiene Fecha_pago asociada; saltando');
                continue;
            }
            const fecha = new Date(r.Fecha_pago);
            const year = fecha.getFullYear();
            const month = fecha.getMonth() + 1;
            // Mes_date as first of month YYYY-MM-01
            const mesDate = `${year}-${String(month).padStart(2,'0')}-01`;
            console.log(`  - Actualizando idControl=${r.idControl} con Mes=${month}, Year=${year}, Mes_date=${mesDate}`);
            const [u] = await conn.promise().query(
                `UPDATE control_mensualidades SET Mes = ?, Year = ?, Mes_date = ? WHERE idControl = ?`,
                [month, year, mesDate, r.idControl]
            );
        }
        console.log('Backfill completado');
    } catch (err) {
        console.error('Error en backfill:', err && err.message ? err.message : err);
    } finally {
        try { conn.end(); } catch (e) { }
    }
}

run();
