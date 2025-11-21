const { Estudiante } = require('../models/Estudiante');
const { Grupo } = require('../models/Grupo');

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

        // Validación mínima
        if (!estudianteData.Nombres || !estudianteData.Apellidos || !estudianteData.Cedula || !estudianteData.Fecha_Nacimiento) {
            return res.status(400).json({ success: false, message: 'Faltan campos requeridos del estudiante.' });
        }

        const edad = calcularEdad(estudianteData.Fecha_Nacimiento);

        // 1. Crear Estudiante
        const idEstudiante = await Estudiante.createEstudiante(estudianteData);

        // 2. Crear Representante (si es menor)
        if (edad < 18) {
            const rep = payload.representante;
            if (rep && rep.Nombres && rep.Cedula) {
                try {
                    const idRepresentante = await Estudiante.createRepresentante(rep);
                    await Estudiante.linkRepresentanteToEstudiante(idRepresentante, idEstudiante);
                    if (rep.Telefono) {
                        await Estudiante.addTelefonoRepresentante(idRepresentante, rep.Telefono, rep.TipoTelefono || 'movil');
                    }
                } catch (repErr) {
                    console.error('Error creando representante:', repErr);
                }
            }
        }

        // 3. Inscripciones (Grupos)
        const fechaIns = payload.Fecha_inscripcion || new Date().toISOString().slice(0,10);
        
        // Manejo robusto de grupos (array o id único)
        let gruposProcesar = [];
        if (Array.isArray(payload.grupos) && payload.grupos.length > 0) {
            gruposProcesar = payload.grupos;
        } else if (payload.idGrupo) {
            gruposProcesar = [payload.idGrupo];
        }

        if (gruposProcesar.length > 0) {
            for (const gid of gruposProcesar) {
                try {
                    // Usamos el modelo Grupo importado al inicio (sin re-requerir)
                    const grupoInfo = await Grupo.findById(gid);
                    if (grupoInfo) {
                        await Estudiante.createInscripcion(idEstudiante, grupoInfo.idCurso, fechaIns, gid);
                    } else {
                        console.warn(`Grupo ID ${gid} no encontrado, saltando inscripción.`);
                    }
                } catch (gErr) {
                    console.error('Error en inscripción de grupo:', gErr);
                }
            }
        } else if (payload.idCurso) {
            // Caso legado: solo curso
            await Estudiante.createInscripcion(idEstudiante, payload.idCurso, fechaIns, null);
        }

        // 4. Registro de Pago Inicial (si aplica)
        if (payload.pago) {
            try {
                const pago = payload.pago;
                const metodoId = Number(pago.metodoId);

                if (pago.monto && metodoId) {
                    // Lógica Automática de Cuenta
                    let idCuentaAuto = 1; // Caja Chica
                    if (metodoId === 1 || metodoId === 2) { // Transf o PagoMovil
                        idCuentaAuto = 2; // Banco
                    }
                    const idCuentaFinal = pago.idCuenta_Destino || idCuentaAuto;

                    const tasaActual = await Estudiante.getLatestTasa();
                    let Monto_bs = null;
                    let Monto_usd = null;
                    let Tasa_Pago = tasaActual || 1;
                    
                    const moneda = pago.moneda ? String(pago.moneda).toLowerCase() : 'bs';
                    const montoNum = Number(pago.monto);

                    if (moneda.includes('usd') || moneda.includes('dolar')) {
                        Monto_usd = Number(montoNum.toFixed(4));
                        if (tasaActual) Monto_bs = Number((Monto_usd * tasaActual).toFixed(4));
                    } else {
                        Monto_bs = Number(montoNum.toFixed(4));
                        if (tasaActual) Monto_usd = Number((Monto_bs / tasaActual).toFixed(4));
                    }

                    const Fecha_pago = pago.Fecha_pago || new Date().toISOString().slice(0,19).replace('T', ' ');
                    
                    const idPago = await Estudiante.createPago({
                        idDeuda: pago.idDeuda || null,
                        idMetodos_pago: metodoId,
                        idCuenta_Destino: idCuentaFinal, 
                        idEstudiante,
                        Referencia: pago.referencia || 'Pendiente',
                        Mes_referencia: pago.Mes_referencia || null,
                        Monto_bs,
                        Tasa_Pago,
                        Monto_usd,
                        Fecha_pago
                    });
                    
                    return res.json({ success: true, idEstudiante, idPago });
                }
            } catch (payErr) {
                console.error('Error registrando pago inicial:', payErr);
                // Retornamos éxito con advertencia, no error 500 para no bloquear la creación
                return res.json({ success: true, idEstudiante, warning: 'Estudiante creado, pago falló' });
            }
        }

        return res.json({ success: true, idEstudiante });

    } catch (error) {
        console.error('Error creando estudiante:', error);
        if (error && error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Cédula o Correo ya registrados.' });
        }
        return res.status(500).json({ success: false, message: 'Error interno al crear estudiante' });
    }
};

// src/controllers/estudiante.controller.js

exports.getDeudas = async (req, res) => {
    try {
        const id = req.params.id;
        const conn = require('../../config/database'); // Asegúrate de importar la conexión si no está arriba

        // 1. Obtener datos del estudiante (Inscripción)
        const [est] = await conn.promise().query(
            'SELECT Fecha_inscripcion FROM inscripciones WHERE idEstudiante = ? ORDER BY Fecha_inscripcion ASC LIMIT 1',
            [id]
        );

        // 2. Obtener deudas registradas en BD (las manuales o antiguas)
        const deudasRegistradas = await require('../models/Estudiante').Estudiante.getDeudasByStudent(id);

        // 3. Calcular meses pendientes automáticamente
        let deudasVirtuales = [];
        if (est && est.length > 0) {
            const fechaInicio = new Date(est[0].Fecha_inscripcion);
            const fechaActual = new Date();
            const costoMensualidad = 30.00; // MONTO FIJO $30

            // Iterar mes a mes desde la inscripción hasta la fecha actual
            let iterador = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), 1);
            
            while (iterador <= fechaActual) {
                // Formato YYYY-MM para comparar
                const mesCheck = iterador.getMonth() + 1;
                const yearCheck = iterador.getFullYear();
                const mesStr = `${yearCheck}-${String(mesCheck).padStart(2, '0')}`;

                // a. Verificar si ya está pagado en control_mensualidades
                const [pagado] = await conn.promise().query(
                    `SELECT idControl FROM control_mensualidades 
                     WHERE idEstudiante = ? AND (
                        (Mes = ? AND Year = ?) OR DATE_FORMAT(Mes_date, '%Y-%m') = ?
                     )`,
                    [id, mesCheck, yearCheck, mesStr]
                );

                // b. Verificar si ya existe como deuda física en la tabla 'deudas' para no duplicar visualmente
                // (Asumimos que el concepto contiene el nombre del mes o algo identificable, pero por seguridad
                // si ya hay una deuda pendiente generada, no mostramos la virtual).
                const deudaFisicaExiste = deudasRegistradas.find(d => 
                    d.Concepto.toLowerCase().includes(iterador.toLocaleString('es-ES', { month: 'long' })) && 
                    d.Concepto.toLowerCase().includes(String(yearCheck))
                );

                // Si NO está pagado y NO tiene deuda física ya registrada -> Generar Deuda Virtual
                if ((!pagado || pagado.length === 0) && !deudaFisicaExiste) {
                    const nombreMes = iterador.toLocaleString('es-ES', { month: 'long' });
                    const mesCapitalizado = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);
                    
                    deudasVirtuales.push({
                        idDeuda: `virtual_${mesStr}`, // ID temporal para el frontend
                        Concepto: `Mensualidad ${mesCapitalizado} ${yearCheck}`,
                        Monto_usd: costoMensualidad.toFixed(4),
                        Total_Pagado: 0,
                        Fecha_emision: new Date(iterador), // Fecha del mes que debe
                        Estado: 'Pendiente (Automática)',
                        esVirtual: true, // Flag para saber que no está en BD aun
                        mesRef: mesStr // Para enviar al pagar
                    });
                }

                // Avanzar al siguiente mes
                iterador.setMonth(iterador.getMonth() + 1);
            }
        }

        // Fusionar Deudas Reales (BD) + Deudas Virtuales (Calculadas)
        const todasLasDeudas = [...deudasRegistradas, ...deudasVirtuales];

        return res.json({ success: true, deudas: todasLasDeudas });

    } catch (error) {
        console.error('Error obteniendo deudas:', error);
        return res.status(500).json({ success: false, message: 'Error al obtener deudas' });
    }
};
//------------------------------------
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