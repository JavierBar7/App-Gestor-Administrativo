const { Grupo } = require('../models/Grupo');
const { Estudiante } = require('../models/Estudiante');
const conn = require('../../config/database');

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

const summaryGrupos = async (req, res) => {
    try {
        const [colCheck] = await conn.promise().query(
            "SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inscripciones' AND COLUMN_NAME = 'idGrupo'"
        );
        const hasIdGrupo = colCheck && colCheck[0] && colCheck[0].cnt > 0;

        let sql = '';
        if (hasIdGrupo) {
            sql = `
                SELECT g.idGrupo, g.idCurso, g.Nombre_Grupo, g.Fecha_inicio, g.Estado,
                       c.Nombre_Curso,
                       COUNT(i.idEstudiante) AS studentCount
                FROM grupos g
                LEFT JOIN cursos c ON c.idCurso = g.idCurso
                LEFT JOIN inscripciones i ON i.idGrupo = g.idGrupo
                GROUP BY g.idGrupo, g.idCurso, g.Nombre_Grupo, g.Fecha_inicio, g.Estado, c.Nombre_Curso
                ORDER BY g.Nombre_Grupo ASC
            `;
        } else {
            sql = `
                SELECT g.idGrupo, g.idCurso, g.Nombre_Grupo, g.Fecha_inicio, g.Estado,
                       c.Nombre_Curso,
                       0 AS studentCount
                FROM grupos g
                LEFT JOIN cursos c ON c.idCurso = g.idCurso
                ORDER BY g.Nombre_Grupo ASC
            `;
        }
        const [rows] = await conn.promise().query(sql);
        return res.json(rows || []);
    } catch (error) {
        console.error('Error en summaryGrupos:', error);
        return res.status(500).json({ success: false, message: 'Error al obtener resumen' });
    }
};

const estudiantesPorGrupo = async (req, res) => {
    try {
        const idGrupo = req.params.id;
        const estudiantes = await Estudiante.findEstudiantesByGrupo(idGrupo);

        const mapped = await Promise.all(estudiantes.map(async (e) => {
            // 1. Edad
            let edad = null;
            if (e.Fecha_Nacimiento) {
                const hoy = new Date();
                const fn = new Date(e.Fecha_Nacimiento);
                edad = hoy.getFullYear() - fn.getFullYear();
                const m = hoy.getMonth() - fn.getMonth();
                if (m < 0 || (m === 0 && hoy.getDate() < fn.getDate())) edad--;
            }

            // 2. Último Pago
            const lastPayment = await Estudiante.getLastPaymentTransaction(e.idEstudiante);

            // 3. CÁLCULO DE DEUDA INTELIGENTE
            let deudaTotal = 0;

            // A. Obtener TODAS las deudas (incluso las pagadas) para verificar el historial
            // Hacemos una consulta directa aquí para tener el historial completo, no solo las pendientes
            const [todasLasDeudas] = await conn.promise().query(
                `SELECT idDeuda, Monto_usd, Fecha_emision, Estado, 
                 (COALESCE((SELECT SUM(Monto_usd) FROM pagos WHERE idDeuda = deudas.idDeuda), 0) + 
                  COALESCE((SELECT SUM(Monto_parcial) FROM pagos_parciales WHERE idDeuda = deudas.idDeuda), 0)) as Total_Pagado
                 FROM deudas WHERE idEstudiante = ?`, 
                [e.idEstudiante]
            );

            // Sumar saldo pendiente real de las deudas que NO están pagadas
            todasLasDeudas.forEach(d => {
                if (d.Estado !== 'Pagada') {
                    const pendiente = Number(d.Monto_usd) - Number(d.Total_Pagado || 0);
                    if (pendiente > 0.01) deudaTotal += pendiente;
                }
            });

            // B. Deudas Virtuales (Meses sin registro)
            const [insc] = await conn.promise().query('SELECT Fecha_inscripcion FROM inscripciones WHERE idEstudiante = ? LIMIT 1', [e.idEstudiante]);
            
            if (insc && insc.length > 0) {
                const fechaStr = new Date(insc[0].Fecha_inscripcion).toISOString().slice(0, 10);
                const fechaInicio = new Date(fechaStr + 'T12:00:00');
                const fechaActual = new Date();
                const costoMensualidad = 30.00;

                let iterador = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), 1, 12, 0, 0);
                
                while (iterador <= fechaActual) {
                    const mesCheck = iterador.getMonth() + 1;
                    const yearCheck = iterador.getFullYear();
                    const mesClave = `${yearCheck}-${String(mesCheck).padStart(2, '0')}`;

                    // 1. ¿Existe registro de solvencia?
                    const [pagado] = await conn.promise().query(
                        `SELECT idControl FROM control_mensualidades 
                         WHERE idEstudiante = ? AND (
                            (Mes = ? AND Year = ?) OR DATE_FORMAT(Mes_date, '%Y-%m') = ?
                         )`,
                        [e.idEstudiante, mesCheck, yearCheck, mesClave]
                    );

                    // 2. ¿Existe una deuda "física" para este mes (pagada o no)?
                    const existeDeudaFisica = todasLasDeudas.find(d => {
                        if(!d.Fecha_emision) return false;
                        const f = new Date(d.Fecha_emision);
                        return f.getFullYear() === yearCheck && (f.getMonth() + 1) === mesCheck;
                    });

                    // Si NO está marcado solvente Y TAMPOCO existe una deuda registrada para este mes (ni pagada ni pendiente)
                    // Entonces es una deuda virtual (el sistema asume que falta).
                    // Si existeDeudaFisica es true, significa que ya la contamos arriba (si estaba pendiente) o ya se pagó (si estaba Pagada).
                    if ((!pagado || pagado.length === 0) && !existeDeudaFisica) {
                        deudaTotal += costoMensualidad;
                    }
                    iterador.setMonth(iterador.getMonth() + 1);
                }
            }

            return { ...e, edad, lastPayment, pendingDebt: deudaTotal };
        }));

        return res.json(mapped);
    } catch (error) {
        console.error('Error en estudiantesPorGrupo:', error);
        return res.status(500).json({ success: false, message: 'Error al obtener estudiantes' });
    }
};

const updateGrupo = async (req, res) => {
    try {
        const id = req.params.id;
        const success = await Grupo.updateGrupo(id, req.body);
        if (success) return res.json({ success: true });
        else return res.status(404).json({ success: false, message: 'Grupo no encontrado' });
    } catch (error) {
        console.error('Error actualizando grupo:', error);
        return res.status(500).json({ success: false, message: 'Error al actualizar grupo' });
    }
};

module.exports = { createGrupo, listGrupos, updateGrupo, summaryGrupos, estudiantesPorGrupo };