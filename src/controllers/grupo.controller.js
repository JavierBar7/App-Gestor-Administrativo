const { Grupo } = require('../models/Grupo');

const createGrupo = async (req, res) => {
    try {
        const { idCurso, Nombre_Grupo, Fecha_inicio, Estado } = req.body;
        if (!idCurso || !Nombre_Grupo) {
            return res.status(400).json({ success: false, message: 'idCurso y Nombre_Grupo son requeridos' });
        }
        const grupo = await Grupo.create(idCurso, Nombre_Grupo, Fecha_inicio || null, Estado || null);
        return res.json({ success: true, grupo });
    } catch (error) {
        console.error('Error en createGrupo:', error);
        return res.status(500).json({ success: false, message: 'Error al crear grupo' });
    }
};

const listGrupos = async (req, res) => {
    try {
        const grupos = await Grupo.findAll();
        return res.json(grupos);
    } catch (error) {
        console.error('Error en listGrupos:', error);
        return res.status(500).json({ success: false, message: 'Error al obtener grupos' });
    }
};

module.exports = { createGrupo, listGrupos };
