const conn = require('./config/database');

async function seed() {
    try {
        // Insert Caja Chica (id 1)
        await conn.promise().query(`
            INSERT IGNORE INTO cuenta_destino (idCuenta_Destino, Nombre, Tipo, Moneda) 
            VALUES (1, 'Caja Chica', 'Efectivo', 'USD')
        `);
        
        // Insert Banco (id 2)
        await conn.promise().query(`
            INSERT IGNORE INTO cuenta_destino (idCuenta_Destino, Nombre, Tipo, Moneda) 
            VALUES (2, 'Banco', 'Transferencia', 'Bs')
        `);

        console.log('✅ Cuentas seeded successfully');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error seeding accounts:', err);
        process.exit(1);
    }
}

seed();
