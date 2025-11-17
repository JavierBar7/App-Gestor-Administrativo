const conn = require('../../config/database');

exports.getLatest = async (req, res) => {
    try {
        const [rows] = await conn.promise().query(
            'SELECT idTasa, Tasa_usd_a_bs, Fecha_Vigencia FROM tasa_cambio ORDER BY Fecha_Vigencia DESC LIMIT 1'
        );
        if (!rows || rows.length === 0) return res.json({ success: false, message: 'No rates found' });
        return res.json({ success: true, rate: rows[0] });
    } catch (err) {
        console.error('Error getting latest tasa:', err);
        return res.status(500).json({ success: false, message: 'Error fetching latest rate' });
    }
};

exports.getHistorial = async (req, res) => {
    try {
        const [rows] = await conn.promise().query(
            'SELECT idHistorial_Tasa, Tasa_Registrada, Fecha_Registro FROM historial_tasa ORDER BY Fecha_Registro DESC'
        );
        return res.json({ success: true, historial: rows });
    } catch (err) {
        console.error('Error getting historial tasa:', err);
        return res.status(500).json({ success: false, message: 'Error fetching historial' });
    }
};

exports.create = async (req, res) => {
    try {
        const { Tasa_usd_a_bs } = req.body;
        if (Tasa_usd_a_bs == null || isNaN(Number(Tasa_usd_a_bs))) {
            return res.status(400).json({ success: false, message: 'Tasa_usd_a_bs inválida' });
        }
        const tasaNum = Number(Tasa_usd_a_bs);
        // Insert into historial_tasa to keep a permanent record
        await conn.promise().query(
            'INSERT INTO historial_tasa (Tasa_Registrada, Fecha_Registro) VALUES (?, NOW())',
            [tasaNum]
        );

        // Update the latest row in tasa_cambio if exists, otherwise insert a new row
        const [latest] = await conn.promise().query(
            'SELECT idTasa FROM tasa_cambio ORDER BY Fecha_Vigencia DESC LIMIT 1'
        );
        if (latest && latest.length > 0) {
            const idTasa = latest[0].idTasa;
            await conn.promise().query(
                'UPDATE tasa_cambio SET Tasa_usd_a_bs = ?, Fecha_Vigencia = NOW() WHERE idTasa = ?',
                [tasaNum, idTasa]
            );
            return res.json({ success: true, idTasa, Tasa_usd_a_bs: tasaNum, updated: true });
        } else {
            const [result] = await conn.promise().query(
                'INSERT INTO tasa_cambio (Tasa_usd_a_bs, Fecha_Vigencia) VALUES (?, NOW())',
                [tasaNum]
            );
            return res.json({ success: true, idTasa: result.insertId, Tasa_usd_a_bs: tasaNum, updated: false });
        }
    } catch (err) {
        console.error('Error creating tasa:', err);
        return res.status(500).json({ success: false, message: 'Error saving rate' });
    }
};
