const { Estudiante } = require('../models/Estudiante');
const { Grupo } = require('../models/Grupo');

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

        return res.json({ success: true, estudiante, pagos, representante, grupos });
    } catch (err) {
        console.error('Error obteniendo detalles del estudiante:', err);
        return res.status(500).json({ success: false, message: 'Error al obtener detalles del estudiante' });
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

        // registrar inscripción: permitimos varios grupos mediante payload.grupos (array de idGrupo)
        if (Array.isArray(payload.grupos) && payload.grupos.length > 0) {
            const fechaIns = payload.Fecha_inscripcion || new Date().toISOString().slice(0,10);
            const invalidGroups = [];
            for (const gid of payload.grupos) {
                try {
                    const { Grupo } = require('../models/Grupo'); // Importar aquí para evitar circular si fuera necesario
                    const grupo = await Grupo.findById(gid);
                    if (!grupo) {
                        invalidGroups.push(gid);
                        continue;
                    }
                    await Estudiante.createInscripcion(idEstudiante, grupo.idCurso, fechaIns, gid);
                } catch (gErr) {
                    console.error('Error creando inscripcion para grupo', gid, gErr);
                    invalidGroups.push(gid);
                }
            }
            if (invalidGroups.length === payload.grupos.length) {
                return res.status(400).json({ success: false, message: 'Ningún grupo válido fue encontrado para la inscripción.' });
            }
        } else {
            let idCursoParaInscripcion = null;
            if (payload.idGrupo) {
                const { Grupo } = require('../models/Grupo');
                const grupo = await Grupo.findById(payload.idGrupo);
                if (!grupo) {
                    return res.status(400).json({ success: false, message: 'Grupo seleccionado no existe' });
                }
                idCursoParaInscripcion = grupo.idCurso;
            } else if (payload.idCurso) {
                idCursoParaInscripcion = payload.idCurso;
            }

            if (idCursoParaInscripcion) {
                const fechaIns = payload.Fecha_inscripcion || new Date().toISOString().slice(0,10);
                const idGrupoForIns = payload.idGrupo || null;
                await Estudiante.createInscripcion(idEstudiante, idCursoParaInscripcion, fechaIns, idGrupoForIns);
            }
        }

        // Registrar pago si se envió información de pago en el payload
        if (payload.pago) {
            try {
                const pago = payload.pago;
                const metodoId = Number(pago.metodoId);

                if (!pago.monto || !metodoId) {
                    return res.status(400).json({ success: false, message: 'Faltan datos del pago: monto o método.' });
                }

                // --- LÓGICA DE CUENTA DESTINO ---
                let idCuentaAuto = 1; 
                if (metodoId === 1 || metodoId === 2) {
                    idCuentaAuto = 2;
                }
                const idCuentaFinal = pago.idCuenta_Destino || idCuentaAuto;

                const tasaActual = await Estudiante.getLatestTasa();
                let Monto_bs = null;
                let Monto_usd = null;
                let Tasa_Pago = tasaActual;
                const moneda = pago.moneda ? String(pago.moneda).toLowerCase() : 'bs';
                const montoNum = Number(pago.monto);
                if (isNaN(montoNum)) {
                    return res.status(400).json({ success: false, message: 'Monto de pago inválido.' });
                }

                if (moneda.includes('usd') || moneda.includes('dolar') || moneda === 'usd') {
                    Monto_usd = Number(montoNum.toFixed(4));
                    if (tasaActual) {
                        Monto_bs = Number((Monto_usd * tasaActual).toFixed(4));
                    }
                } else {
                    Monto_bs = Number(montoNum.toFixed(4));
                    if (tasaActual) {
                        if (tasaActual === 0) {
                            Monto_usd = null;
                        } else {
                            Monto_usd = Number((Monto_bs / tasaActual).toFixed(4));
                        }
                    }
                }

                const Fecha_pago = pago.Fecha_pago || new Date().toISOString().slice(0,19).replace('T', ' ');
                
                const idPago = await Estudiante.createPago({
                    idDeuda: pago.idDeuda || null,
                    idMetodos_pago: metodoId,
                    idCuenta_Destino: idCuentaFinal, // <--- Aplicada aquí
                    idEstudiante,
                    Referencia: pago.referencia || pago.Referencia || 'Pendiente',
                    Mes_referencia: pago.Mes_referencia || pago.Mes || null,
                    Monto_bs,
                    Tasa_Pago,
                    Monto_usd,
                    Fecha_pago
                });

                // Si vienen pagos parciales, registrarlos
                if (Array.isArray(pago.parciales)) {
                    for (const parcial of pago.parciales) {
                        const montoPar = Number(parcial.monto);
                        if (!isNaN(montoPar)) {
                            await Estudiante.createPagoParcial({ idPago, idDeuda: parcial.idDeuda || pago.idDeuda || null, Monto_parcial: montoPar });
                        }
                    }
                }
                return res.json({ success: true, idEstudiante, idPago });
            } catch (payErr) {
                console.error('Error registrando pago al crear inscripción:', payErr && payErr.stack ? payErr.stack : payErr);
                const resp = { success: false, message: 'Error al registrar pago.' };
                if (process.env.NODE_ENV !== 'production' && payErr && payErr.message) resp.error = payErr.message;
                return res.status(500).json(resp);
            }
        }

        return res.json({ success: true, idEstudiante });
    } catch (error) {
        console.error('Error creando estudiante:', error && error.stack ? error.stack : error);
        if (error && error.code === 'ER_DUP_ENTRY') {
            const resp = { success: false, message: 'Entrada duplicada en la base de datos.' };
            if (process.env.NODE_ENV !== 'production' && error && error.message) resp.error = error.message;
            return res.status(409).json(resp);
        }
        const resp = { success: false, message: 'Error al crear estudiante' };
        if (process.env.NODE_ENV !== 'production' && error && error.message) resp.error = error.message;
        return res.status(500).json(resp);
    }
};

exports.getDeudas = async (req, res) => {
    try {
        const id = req.params.id;
        const deudas = await Estudiante.getDeudasByStudent(id);
        return res.json({ success: true, deudas });
    } catch (error) {
        console.error('Error obteniendo deudas:', error);
        return res.status(500).json({ success: false, message: 'Error al obtener deudas' });
    }
};

exports.getListadoDeudores = async (req, res) => {
    try {
        const deudores = await Estudiante.getDeudores();
        
        const deudoresProcesados = deudores.map(d => {
            const deudaTotal = Number(d.Deuda_Original) - Number(d.Total_Abonado);
            return {
                ...d,
                Deuda_Total: deudaTotal.toFixed(2)
            };
        });

        return res.json({ success: true, deudores: deudoresProcesados });
    } catch (error) {
        console.error('Error obteniendo deudores:', error);
        return res.status(500).json({ success: false, message: 'Error al obtener deudores' });
    }
};