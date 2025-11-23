const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { Estudiante } = require('../models/Estudiante');
const { SolicitudPago } = require('../models/SolicitudPago');

exports.generarReporteDeudoresPDF = async (req, res) => {
    try {
        const estudiantes = await Estudiante.getEstudiantes();
        const deudores = [];

        // Filter and gather data
        for (const est of estudiantes) {
            const deudas = await Estudiante.getDebtsForStudent(est.idEstudiante, null);
            const deudasPendientes = deudas.filter(d => (Number(d.Monto_usd) - Number(d.Total_Pagado || 0)) > 0.01);

            if (deudasPendientes.length > 0) {
                const grupos = await Estudiante.getGroupsByStudent(est.idEstudiante);
                const solicitudes = await SolicitudPago.getSolicitudesByEstudiante(est.idEstudiante);
                
                const totalDeuda = deudasPendientes.reduce((acc, d) => acc + (Number(d.Monto_usd) - Number(d.Total_Pagado || 0)), 0);

                deudores.push({
                    estudiante: est,
                    grupos: grupos,
                    deudaTotal: totalDeuda,
                    solicitudes: solicitudes
                });
            }
        }

        const doc = new PDFDocument();
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=reporte_deudores.pdf');

        doc.pipe(res);

        doc.fontSize(20).text('Reporte de Deudores - Just Talk Academy', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Fecha: ${new Date().toLocaleDateString()}`, { align: 'right' });
        doc.moveDown();

        for (const item of deudores) {
            const { estudiante, grupos, deudaTotal, solicitudes } = item;

            doc.fontSize(14).fillColor('black').text(`${estudiante.Nombres} ${estudiante.Apellidos}`, { underline: true });
            doc.fontSize(10).text(`Cédula: ${estudiante.Cedula} | Teléfono: ${estudiante.Telefono}`);
            
            const gruposStr = grupos.map(g => g.Nombre_Grupo).join(', ') || 'Sin grupos';
            doc.text(`Grupos: ${gruposStr}`);
            
            doc.fillColor('red').text(`Deuda Total: $${deudaTotal.toFixed(2)}`);
            
            doc.moveDown(0.5);
            doc.fillColor('black').text('Historial de Cobranza:', { underline: false });
            
            if (solicitudes.length > 0) {
                solicitudes.forEach(s => {
                    const fecha = new Date(s.Fecha_Solicitud).toLocaleDateString();
                    doc.text(`  - ${fecha} [${s.Tipo_Solicitud}]: ${s.Notas || ''}`);
                });
            } else {
                doc.text('  - Sin registros de cobranza');
            }
            
            doc.moveDown();
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown();
        }

        doc.end();

    } catch (error) {
        console.error('Error generando PDF:', error);
        res.status(500).send('Error generando reporte PDF');
    }
};

exports.generarReporteDeudoresExcel = async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Deudores');

        worksheet.columns = [
            { header: 'Nombres', key: 'nombres', width: 20 },
            { header: 'Apellidos', key: 'apellidos', width: 20 },
            { header: 'Cédula', key: 'cedula', width: 15 },
            { header: 'Teléfono', key: 'telefono', width: 15 },
            { header: 'Grupos', key: 'grupos', width: 30 },
            { header: 'Deuda Total ($)', key: 'deuda', width: 15 },
            { header: 'Veces Cobrado', key: 'veces_cobrado', width: 15 },
            { header: 'Último Cobro', key: 'ultimo_cobro', width: 20 },
            { header: 'Detalle Cobros', key: 'detalle_cobros', width: 50 }
        ];

        const estudiantes = await Estudiante.getEstudiantes();

        for (const est of estudiantes) {
            const deudas = await Estudiante.getDebtsForStudent(est.idEstudiante, null);
            const deudasPendientes = deudas.filter(d => (Number(d.Monto_usd) - Number(d.Total_Pagado || 0)) > 0.01);

            if (deudasPendientes.length > 0) {
                const grupos = await Estudiante.getGroupsByStudent(est.idEstudiante);
                const solicitudes = await SolicitudPago.getSolicitudesByEstudiante(est.idEstudiante);
                
                const totalDeuda = deudasPendientes.reduce((acc, d) => acc + (Number(d.Monto_usd) - Number(d.Total_Pagado || 0)), 0);
                const gruposStr = grupos.map(g => g.Nombre_Grupo).join(', ');
                
                const detalleCobros = solicitudes.map(s => `${new Date(s.Fecha_Solicitud).toLocaleDateString()} (${s.Tipo_Solicitud})`).join('; ');
                const ultimoCobro = solicitudes.length > 0 ? new Date(solicitudes[0].Fecha_Solicitud).toLocaleDateString() : 'N/A';

                worksheet.addRow({
                    nombres: est.Nombres,
                    apellidos: est.Apellidos,
                    cedula: est.Cedula,
                    telefono: est.Telefono,
                    grupos: gruposStr,
                    deuda: totalDeuda.toFixed(2),
                    veces_cobrado: solicitudes.length,
                    ultimo_cobro: ultimoCobro,
                    detalle_cobros: detalleCobros
                });
            }
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=reporte_deudores.xlsx');

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error generando Excel:', error);
        res.status(500).send('Error generando reporte Excel');
    }
};
