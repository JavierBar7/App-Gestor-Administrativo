const conn = require('../../config/database');

exports.getMetodos = async (req, res) => {
    try {
        const [rows] = await conn.promise().query('SELECT idMetodos_pago, Nombre, Tipo_Validacion, Moneda_asociada FROM metodos_pagos');
        return res.json(rows);
    } catch (err) {
        console.error('Error fetching metodos_pagos:', err);
        return res.status(500).json({ success: false, message: 'Error al obtener métodos de pago' });
    }
};
