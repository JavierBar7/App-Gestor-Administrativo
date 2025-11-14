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

// Summary: return groups with course name and student count
const summaryGrupos = async (req, res) => {
    try {
        const grupos = await Grupo.findAll();
        // need Curso model to get course name and count inscripciones per grupo
        const conn = require('../../config/database');
        const results = [];
        for (const g of grupos) {
            const [cursoRows] = await conn.promise().query('SELECT Nombre_Curso FROM cursos WHERE idCurso = ?', [g.idCurso]);
            const cursoNombre = cursoRows[0] ? cursoRows[0].Nombre_Curso : null;
            const [countRows] = await conn.promise().query('SELECT COUNT(*) as cnt FROM inscripciones WHERE idGrupo = ?', [g.idGrupo]);
            const cnt = countRows[0] ? countRows[0].cnt : 0;
            results.push({ idGrupo: g.idGrupo, idCurso: g.idCurso, Nombre_Grupo: g.Nombre_Grupo, Fecha_inicio: g.Fecha_inicio, Estado: g.Estado, Nombre_Curso: cursoNombre, studentCount: cnt });
        }
        return res.json(results);
    } catch (error) {
        console.error('Error en summaryGrupos:', error);
        return res.status(500).json({ success: false, message: 'Error al obtener resumen de grupos' });
    }
};

// List estudiantes of a group including last 3 payments
const estudiantesPorGrupo = async (req, res) => {
    try {
        const idGrupo = req.params.id;
        const { Estudiante } = require('../models/Estudiante');
        const estudiantes = await Estudiante.findEstudiantesByGrupo(idGrupo);

        // for each estudiante, compute age and last 3 payments
        const mapped = await Promise.all(estudiantes.map(async (e) => {
            const edad = (() => {
                if (!e.Fecha_Nacimiento) return null;
                const hoy = new Date();
                const fn = new Date(e.Fecha_Nacimiento);
                let edadCalc = hoy.getFullYear() - fn.getFullYear();
                const m = hoy.getMonth() - fn.getMonth();
                if (m < 0 || (m === 0 && hoy.getDate() < fn.getDate())) edadCalc--;
                return edadCalc;
            })();
            const pagos = await Estudiante.getLastPaymentsForStudent(e.idEstudiante, 3);
            return { ...e, edad, pagos };
        }));

        return res.json(mapped);
    } catch (error) {
        console.error('Error en estudiantesPorGrupo:', error);
        return res.status(500).json({ success: false, message: 'Error al obtener estudiantes por grupo' });
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

module.exports = { createGrupo, listGrupos, updateGrupo, summaryGrupos, estudiantesPorGrupo };
