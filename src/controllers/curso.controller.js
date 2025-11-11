const { Curso } = require('../models/Curso');

const createCurso = async (req, res) => {
    try {
        const { Nombre_Curso, Descripcion_Curso } = req.body;
        if (!Nombre_Curso) {
            return res.status(400).json({ success: false, message: 'Nombre_Curso es requerido' });
        }
        const curso = await Curso.create(Nombre_Curso, Descripcion_Curso || null);
        return res.json({ success: true, curso });
    } catch (error) {
        console.error('Error en createCurso:', error);
        return res.status(500).json({ success: false, message: 'Error al crear curso' });
    }
};

const listCursos = async (req, res) => {
    try {
        const cursos = await Curso.findAll();
        return res.json(cursos);
    } catch (error) {
        console.error('Error en listCursos:', error);
        return res.status(500).json({ success: false, message: 'Error al obtener cursos' });
    }
};

module.exports = { createCurso, listCursos };
