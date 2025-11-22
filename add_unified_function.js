const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'models', 'Estudiante.js');

// Leer el archivo
let content = fs.readFileSync(filePath, 'utf8');

// Función unificada a insertar
const unifiedFunction = `
    static async getDebtsForStudent(idEstudiante, idGrupo = null) {
        const now = new Date();
        const currentDay = now.getDate();
        
        let inscripcionQuery = 'SELECT Fecha_inscripcion FROM inscripciones WHERE idEstudiante = ?';
        let inscripcionParams = [idEstudiante];
        
        if (idGrupo !== null) {
            inscripcionQuery += ' AND idGrupo = ?';
            inscripcionParams.push(idGrupo);
        }
        inscripcionQuery += ' ORDER BY Fecha_inscripcion ASC LIMIT 1';
        
        const [est] = await conn.promise().query(inscripcionQuery, inscripcionParams);
        const deudasRegistradas = await Estudiante.getDeudasByStudent(idEstudiante);

        let deudasVirtuales = [];
        if (est && est.length > 0) {
            const fechaStr = new Date(est[0].Fecha_inscripcion).toISOString().slice(0, 10);
            const fechaInicio = new Date(fechaStr + 'T12:00:00'); 
            const fechaActual = new Date();
            const costoMensualidad = 30.00;

            let iterador = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), 1, 12, 0, 0);
            
            while (iterador <= fechaActual) {
                const yearCheck = iterador.getFullYear();
                const mesCheck = iterador.getMonth() + 1;
                const mesClave = \`\${yearCheck}-\${String(mesCheck).padStart(2, '0')}\`;

                let controlQuery = \`SELECT cm.idControl FROM control_mensualidades cm
                                    WHERE cm.idEstudiante = ? AND (
                                        (cm.Mes = ? AND cm.Year = ?) OR DATE_FORMAT(cm.Mes_date, '%Y-%m') = ?
                                    )\`;
                let controlParams = [idEstudiante, mesCheck, yearCheck, mesClave];
                
                if (idGrupo !== null) {
                    controlQuery += ' AND cm.idGrupo = ?';
                    controlParams.push(idGrupo);
                }
                
                const [pagado] = await conn.promise().query(controlQuery, controlParams);

                const deudaFisicaExiste = deudasRegistradas.find(d => {
                    if (!d.Fecha_emision) return false;
                    const f = new Date(d.Fecha_emision);
                    const fClave = \`\${f.getFullYear()}-\${String(f.getMonth() + 1).padStart(2, '0')}\`;
                    return fClave === mesClave;
                });

                const esMesActual = mesClave === \`\${now.getFullYear()}-\${String(now.getMonth() + 1).padStart(2, '0')}\`;
                const dentroGracia = esMesActual && currentDay <= 5;

                if ((!pagado || pagado.length === 0) && !deudaFisicaExiste && !dentroGracia) {
                    const nombreMes = iterador.toLocaleString('es-ES', { month: 'long' });
                    const mesCapitalizado = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);
                    
                    deudasVirtuales.push({
                        idDeuda: \`virtual_\${mesClave}\`,
                        Concepto: \`Mensualidad \${mesCapitalizado}\`,
                        Monto_usd: costoMensualidad.toFixed(4),
                        Total_Pagado: 0,
                        Fecha_emision: new Date(iterador),
                        Estado: 'Pendiente (Automática)',
                        esVirtual: true,
                        mesRef: mesClave
                    });
                }
                iterador.setMonth(iterador.getMonth() + 1);
            }
        }

        const todasLasDeudas = [...deudasRegistradas, ...deudasVirtuales];
        todasLasDeudas.sort((a, b) => new Date(a.Fecha_emision) - new Date(b.Fecha_emision));
        return todasLasDeudas;
    }

    static async getGroupDebtStatus(idEstudiante, idGrupo) {
        try {
            const deudas = await Estudiante.getDebtsForStudent(idEstudiante, idGrupo);
            
            const deudasPendientes = deudas.filter(d => {
                const monto = Number(d.Monto_usd);
                const pagado = Number(d.Total_Pagado || 0);
                return (monto - pagado) > 0.01;
            });

            if (deudasPendientes.length > 0) {
                return { hasDebt: true, status: 'Deuda' };
            }
            
            return { hasDebt: false, status: 'Solvente' };
        } catch (error) {
            console.error('Error in getGroupDebtStatus:', error);
            return { hasDebt: true, status: 'Deuda' };
        }
    }
`;

// Buscar y reemplazar la función getGroupDebtStatus antigua
const oldFunctionStart = 'static async getGroupDebtStatus(idEstudiante, idGrupo) {';
const startIndex = content.indexOf(oldFunctionStart);

if (startIndex === -1) {
    console.error('No se encontró la función getGroupDebtStatus');
    process.exit(1);
}

// Encontrar el final de la función (buscar el cierre de llave correspondiente)
let braceCount = 0;
let inFunction = false;
let endIndex = startIndex;

for (let i = startIndex; i < content.length; i++) {
    if (content[i] === '{') {
        braceCount++;
        inFunction = true;
    } else if (content[i] === '}') {
        braceCount--;
        if (inFunction && braceCount === 0) {
            endIndex = i + 1;
            break;
        }
    }
}

// Reemplazar la función antigua con las nuevas funciones
const before = content.substring(0, startIndex);
const after = content.substring(endIndex);
const newContent = before + unifiedFunction.trim() + '\n' + after;

// Escribir el archivo
fs.writeFileSync(filePath, newContent, 'utf8');

console.log('✅ Función unificada agregada exitosamente a Estudiante.js');
console.log('✅ getGroupDebtStatus actualizado para usar la lógica unificada');
