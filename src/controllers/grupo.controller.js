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
        // Use a single aggregated query to avoid per-row DB errors and improve performance
        const conn = require('../../config/database');
        // Check whether inscripciones.idGrupo column exists in this database
        const [colCheck] = await conn.promise().query(
            "SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inscripciones' AND COLUMN_NAME = 'idGrupo'"
        );
        const hasIdGrupo = colCheck && colCheck[0] && colCheck[0].cnt > 0;

        if (hasIdGrupo) {
            const sql = `
                SELECT g.idGrupo, g.idCurso, g.Nombre_Grupo, g.Fecha_inicio, g.Estado,
                       c.Nombre_Curso,
                       COUNT(i.idEstudiante) AS studentCount
                FROM grupos g
                LEFT JOIN cursos c ON c.idCurso = g.idCurso
                LEFT JOIN inscripciones i ON i.idGrupo = g.idGrupo
                GROUP BY g.idGrupo, g.idCurso, g.Nombre_Grupo, g.Fecha_inicio, g.Estado, c.Nombre_Curso
                ORDER BY g.Nombre_Grupo ASC
            `;
            const [rows] = await conn.promise().query(sql);
            return res.json(rows || []);
        } else {
            // Fallback: return groups with course name but no per-group student count (column missing in DB)
            const sqlFallback = `
                SELECT g.idGrupo, g.idCurso, g.Nombre_Grupo, g.Fecha_inicio, g.Estado,
                       c.Nombre_Curso,
                       0 AS studentCount
                FROM grupos g
                LEFT JOIN cursos c ON c.idCurso = g.idCurso
                ORDER BY g.Nombre_Grupo ASC
            `;
            const [rows] = await conn.promise().query(sqlFallback);
            const resp = { data: rows || [] };
            if (process.env.NODE_ENV !== 'production') resp.note = 'Column inscripciones.idGrupo not found; student counts unavailable.';
            return res.json(resp.data || []);
        }
    } catch (error) {
        console.error('Error en summaryGrupos:', error && error.stack ? error.stack : error);
        const resp = { success: false, message: 'Error al obtener resumen de grupos' };
        if (process.env.NODE_ENV !== 'production' && error && error.message) resp.error = error.message;
        return res.status(500).json(resp);
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
