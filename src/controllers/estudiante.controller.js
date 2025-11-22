const { Estudiante } = require('../models/Estudiante');
const { Grupo } = require('../models/Grupo');
const { SolicitudPago } = require('../models/SolicitudPago');
const conn = require('../../config/database');

// Helper para calcular edad
function calcularEdad(fechaStr) {
    const hoy = new Date();
    const fecha = new Date(fechaStr);
    let edad = hoy.getFullYear() - fecha.getFullYear();
    const m = hoy.getMonth() - fecha.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < fecha.getDate())) {
        edad--;
    }
    return edad;
}

exports.updateEstudiante = async (req, res) => {
    try {
        const id = req.params.id;
        const success = await Estudiante.updateEstudiante(id, req.body);
        if (success) {
            return res.json({ success: true });
        } else {
            return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
        }
    } catch (error) {
        console.error('Error actualizando estudiante:', error);
        return res.status(500).json({ success: false, message: 'Error al actualizar estudiante' });
    }
};

exports.getEstudiantes = async (req, res) => {
    try {
        const estudiantes = await Estudiante.getEstudiantes();
        return res.json(estudiantes);
    } catch (error) {
        console.error('Error al obtener estudiantes:', error);
        return res.status(500).json({ success: false, message: 'Error al obtener estudiantes' });
    }
};

exports.getEstudianteDetails = async (req, res) => {
    try {
        const id = req.params.id;
        const estudiante = await Estudiante.getEstudianteById(id);
        if (!estudiante) return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });

        const pagos = await Estudiante.getPaymentsByStudent(id);
        const representante = await Estudiante.getRepresentanteByStudent(id);
        const grupos = await Estudiante.getGroupsByStudent(id);
        const deudas = await Estudiante.getDeudasByStudent(id);

        return res.json({ success: true, estudiante, pagos, representante, grupos, deudas });
    } catch (err) {
        console.error('Error obteniendo detalles del estudiante:', err);
        return res.status(500).json({ success: false, message: 'Error al obtener detalles del estudiante' });
    }
};

exports.createEstudiante = async (req, res) => {
    try {
        const payload = req.body;
        const estudianteData = {
            Nombres: payload.Nombres,
            Apellidos: payload.Apellidos,
            Cedula: payload.Cedula,
            Fecha_Nacimiento: payload.Fecha_Nacimiento,
            Telefono: payload.Telefono,
            Correo: payload.Correo,
            Direccion: payload.Direccion
        };

        if (!estudianteData.Nombres || !estudianteData.Apellidos || !estudianteData.Cedula || !estudianteData.Fecha_Nacimiento) {
            return res.status(400).json({ success: false, message: 'Faltan campos requeridos.' });
        }

        const idEstudiante = await Estudiante.createEstudiante(estudianteData);
        const edad = calcularEdad(estudianteData.Fecha_Nacimiento);

        if (edad < 18 && payload.representante) {
            const idRep = await Estudiante.createRepresentante(payload.representante);
            await Estudiante.linkRepresentanteToEstudiante(idRep, idEstudiante);
            if (payload.representante.Telefono) await Estudiante.addTelefonoRepresentante(idRep, payload.representante.Telefono);
        }

        const fechaIns = payload.Fecha_inscripcion || new Date().toISOString().slice(0,10);
        if (payload.grupos && payload.grupos.length) {
            for (const gid of payload.grupos) {
                const gInfo = await Grupo.findById(gid);
                if (gInfo) await Estudiante.createInscripcion(idEstudiante, gInfo.idCurso, fechaIns, gid);
            }
        }

        return res.json({ success: true, idEstudiante });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error creando estudiante' });
    }
};

// USANDO LÓGICA UNIFICADA CON PERÍODO DE GRACIA
exports.getDeudas = async (req, res) => {
    try {
        const id = req.params.id;
        const todasLasDeudas = await Estudiante.getDebtsForStudent(id, null);
        return res.json({ success: true, deudas: todasLasDeudas });
    } catch (error) {
        console.error('Error obteniendo deudas:', error);
        return res.status(500).json({ success: false, message: 'Error al obtener deudas' });
    }
};

exports.getListadoDeudores = async (req, res) => {
    try {
        const estudiantes = await Estudiante.getEstudiantes();
        const morosos = [];

        for (const est of estudiantes) {
            const deudas = await Estudiante.getDebtsForStudent(est.idEstudiante, null);
            
            const deudasPendientes = deudas.filter(d => {
                const monto = Number(d.Monto_usd);
                const pagado = Number(d.Total_Pagado || 0);
                return (monto - pagado) > 0.01;
            });

            if (deudasPendientes.length > 0) {
                const totalDeuda = deudasPendientes.reduce((acc, d) => {
                    const monto = Number(d.Monto_usd);
                    const pagado = Number(d.Total_Pagado || 0);
                    return acc + (monto - pagado);
                }, 0);

                const conceptos = deudasPendientes.map(d => {
                    const monto = Number(d.Monto_usd);
                    const pagado = Number(d.Total_Pagado || 0);
                    const esParcial = pagado > 0 && pagado < monto;
                    return d.Concepto + (esParcial ? ' (Parcial)' : '');
                }).join(', ');

                morosos.push({
                    idEstudiante: est.idEstudiante,
                    Nombres: est.Nombres,
                    Apellidos: est.Apellidos,
                    Deuda_Total: totalDeuda.toFixed(2),
                    Cantidad_Deudas: deudasPendientes.length,
                    Meses_Deuda: conceptos
                });
            }
        }

        return res.json({ success: true, deudores: morosos });
    } catch (error) {
        console.error('Error obteniendo listado de morosos:', error);
        return res.status(500).json({ success: false, message: 'Error al obtener listado de morosos' });
    }
};

// Create payment request for a student
exports.createSolicitudPago = async (req, res) => {
    try {
        const { id } = req.params;
        const { Tipo_Solicitud, Fecha_Solicitud, Notas } = req.body;

        if (!Tipo_Solicitud || !Fecha_Solicitud) {
            return res.status(400).json({ 
                success: false, 
                message: 'Tipo_Solicitud y Fecha_Solicitud son requeridos' 
            });
        }

        const idSolicitud = await SolicitudPago.createSolicitud({
            idEstudiante: id,
            Tipo_Solicitud,
            Fecha_Solicitud,
            Notas
        });

        return res.json({ success: true, idSolicitud });
    } catch (error) {
        console.error('Error creando solicitud de pago:', error);
        return res.status(500).json({ success: false, message: 'Error al crear solicitud de pago' });
    }
};

// Get payment requests for a student
exports.getSolicitudesPago = async (req, res) => {
    try {
        const { id } = req.params;
        const solicitudes = await SolicitudPago.getSolicitudesByEstudiante(id);
        return res.json({ success: true, solicitudes });
    } catch (error) {
        console.error('Error obteniendo solicitudes:', error);
        return res.status(500).json({ success: false, message: 'Error al obtener solicitudes' });
    }
};