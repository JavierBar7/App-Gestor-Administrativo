const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'controllers', 'estudiante.controller.js');
let content = fs.readFileSync(filePath, 'utf8');

// Buscar y reemplazar exports.getDeudas
const getDeud asStart = content.indexOf('exports.getDeudas = async (req, res) =>');
if (getDeud asStart === -1) {
    console.error('No se encontró exports.getDeudas');
    process.exit(1);
}

// Encontrar el final de la función getDeudas
let braceCount = 0;
let inFunction = false;
let getDeud asEnd = getDeud asStart;

for (let i = getDeud asStart; i < content.length; i++) {
    if (content[i] === '{') {
        braceCount++;
        inFunction = true;
    } else if (content[i] === '}') {
        braceCount--;
        if (inFunction && braceCount === 0) {
            getDeud asEnd = i + 1;
            // Buscar el punto y coma final
            while (getDeud asEnd < content.length && content[getDeud asEnd] !== ';') {
                getDeud asEnd++;
            }
            getDeud asEnd++; // Incluir el punto y coma
            break;
        }
    }
}

const newGetDeudas = `exports.getDeudas = async (req, res) => {
    try {
        const id = req.params.id;
        const todasLasDeudas = await Estudiante.getDebtsForStudent(id, null);
        return res.json({ success: true, deudas: todasLasDeudas });
    } catch (error) {
        console.error('Error obteniendo deudas:', error);
        return res.status(500).json({ success: false, message: 'Error al obtener deudas' });
    }
};`;

// Reemplazar getDeudas
const before = content.substring(0, getDeud asStart);
const after = content.substring(getDeud asEnd);
content = before + newGetDeudas + '\n\n' + after;

// Ahora buscar y verificar getListadoDeudores
const getListadoStart = content.indexOf('exports.getListadoDeudores');
if (getListadoStart === -1) {
    console.log('⚠️  No se encontró exports.getListadoDeudores, se creará');
    // Agregar antes del final del archivo
    const lastExport = content.lastIndexOf('exports.');
    if (lastExport > -1) {
        // Encontrar el final de esa función
        let insertPos = lastExport;
        braceCount = 0;
        inFunction = false;
        for (let i = insertPos; i < content.length; i++) {
            if (content[i] === '{') {
                braceCount++;
                inFunction = true;
            } else if (content[i] === '}') {
                braceCount--;
                if (inFunction && braceCount === 0) {
                    insertPos = i + 1;
                    while (insertPos < content.length && content[insertPos] !== ';') {
                        insertPos++;
                    }
                    insertPos++;
                    break;
                }
            }
        }
        
        const newGetListado = `

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
};`;
        
        content = content.substring(0, insertPos) + newGetListado + content.substring(insertPos);
    }
}

fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Controller actualizado para usar Estudiante.getDebtsForStudent');
console.log('✅ Ambas funciones ahora usan la lógica unificada con período de gracia');
