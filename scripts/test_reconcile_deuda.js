const conn = require('../config/database');
const { Estudiante } = require('../src/models/Estudiante');

async function usage() {
    console.log('Usage: node scripts/test_reconcile_deuda.js <idDeuda> <montoPago>');
    process.exit(1);
}

async function run() {
    const args = process.argv.slice(2);
    if (args.length < 2) return usage();
    const idDeuda = Number(args[0]);
    const monto = Number(args[1]);
    if (!idDeuda || isNaN(monto)) return usage();

    const db = conn; // use shared connection from config (promise wrapper used below)
    try {
        await db.promise().beginTransaction();
        // Show deuda before
        const [before] = await db.promise().query('SELECT * FROM deudas WHERE idDeuda = ?', [idDeuda]);
        console.log('Before deuda:', before[0] || null);

        // Compute tasa and insert a pago covering the amount (assumes pago.Monto_usd column exists and Fecha_pago allows DATE)
        const tasaActual = await Estudiante.getLatestTasa();
        const nowStr = new Date().toISOString().slice(0,19).replace('T',' ');
        const Monto_bs = tasaActual && tasaActual !== 0 ? Number((monto * tasaActual).toFixed(4)) : Number(monto.toFixed(4));
        const Tasa_Pago = tasaActual || 1;
        const [ins] = await db.promise().query(
            'INSERT INTO pagos (idDeuda, idMetodos_pago, idCuenta_Destino, idEstudiante, Referencia, Monto_bs, Tasa_Pago, Monto_usd, Fecha_pago) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [idDeuda, 1, 1, before[0].idEstudiante, 'TEST-RECONCILE', Monto_bs, Tasa_Pago, monto, nowStr]
        );
        const idPago = ins.insertId;
        console.log('Inserted pago idPago=', idPago);

        // Optionally insert a parcial
        // await db.promise().query('INSERT INTO pagos_parciales (idPago, idDeuda, Monto_parcial) VALUES (?, ?, ?)', [idPago, idDeuda, 0]);

        // Call reconcile
        const reconciled = await Estudiante.reconcileDeuda(idDeuda, db);
        console.log('Reconciled result:', reconciled);

        // Show deuda after
        const [after] = await db.promise().query('SELECT * FROM deudas WHERE idDeuda = ?', [idDeuda]);
        console.log('After deuda:', after[0] || null);

        await db.promise().commit();
    } catch (err) {
        console.error('Error in test_reconcile_deuda:', err && err.message ? err.message : err);
        try { await db.promise().rollback(); } catch(e){}
    }
}

run();
