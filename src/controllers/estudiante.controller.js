const { Estudiante } = require('../models/Estudiante');

// Helper para calcular edad (años completos)
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

exports.getEstudiantes = async (req, res) => {
    try {
        const estudiantes = await Estudiante.getEstudiantes();
        return res.json(estudiantes);
    } catch (error) {
        console.error('Error al obtener estudiantes:', error);
        return res.status(500).json({ success: false, message: 'Error al obtener estudiantes' });
    }
};

exports.createEstudiante = async (req, res) => {
    try {
        const payload = req.body;
        // campos de estudiante
        const estudianteData = {
            Nombres: payload.Nombres,
            Apellidos: payload.Apellidos,
            Cedula: payload.Cedula,
            Fecha_Nacimiento: payload.Fecha_Nacimiento,
            Telefono: payload.Telefono,
            Correo: payload.Correo,
            Direccion: payload.Direccion
        };

        // validación mínima
        if (!estudianteData.Nombres || !estudianteData.Apellidos || !estudianteData.Cedula || !estudianteData.Fecha_Nacimiento) {
            return res.status(400).json({ success: false, message: 'Faltan campos requeridos del estudiante.' });
        }

        const edad = calcularEdad(estudianteData.Fecha_Nacimiento);

        // crear estudiante
        const idEstudiante = await Estudiante.createEstudiante(estudianteData);

        // si es menor, validar representante
        if (edad < 18) {
            const rep = payload.representante;
            if (!rep || !rep.Nombres || !rep.Apellidos || !rep.Cedula) {
                return res.status(400).json({ success: false, message: 'Estudiante menor de edad requiere datos del representante.' });
            }
            const idRepresentante = await Estudiante.createRepresentante(rep);
            await Estudiante.linkRepresentanteToEstudiante(idRepresentante, idEstudiante);
            if (rep.Telefono) {
                await Estudiante.addTelefonoRepresentante(idRepresentante, rep.Telefono, rep.TipoTelefono || 'movil');
            }
        }

        // registrar inscripción si llega idCurso
        if (payload.idCurso) {
            const fechaIns = payload.Fecha_inscripcion || new Date().toISOString().slice(0,10);
            await Estudiante.createInscripcion(idEstudiante, payload.idCurso, fechaIns);
        }

        return res.json({ success: true, idEstudiante });
    } catch (error) {
        console.error('Error creando estudiante:', error);
        return res.status(500).json({ success: false, message: 'Error al crear estudiante' });
    }
};
