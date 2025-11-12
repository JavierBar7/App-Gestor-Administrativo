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

const updateGrupo = async (req, res) => {
    try {
        const id = req.params.id;
        const success = await Grupo.updateGrupo(id, req.body);
        if (success) {
            return res.json({ success: true });
        } else {
            return res.status(404).json({ success: false, message: 'Grupo no encontrado' });
        }
    } catch (error) {
        console.error('Error actualizando grupo:', error);
        return res.status(500).json({ success: false, message: 'Error al actualizar grupo' });
    }
};

module.exports = { createGrupo, listGrupos, updateGrupo };
