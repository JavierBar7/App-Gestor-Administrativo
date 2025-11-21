const { Estudiante } = require('../src/models/Estudiante');
const conn = require('../config/database');

async function run() {
    try {
        const checks = [
            { idEstudiante: 1, idGrupo: 1 },
            { idEstudiante: 2, idGrupo: 1 }
        ];

        for (const c of checks) {
            try {
                const status = await Estudiante.getGroupDebtStatus(c.idEstudiante, c.idGrupo);
                console.log(`Estudiante ${c.idEstudiante}, Grupo ${c.idGrupo} =>`, status);
            } catch (e) {
                console.error('Error checking status for', c, e && e.message ? e.message : e);
            }
        }
    } catch (err) {
        console.error('Error en script:', err && err.message ? err.message : err);
    } finally {
        try { conn.end(); } catch (e) {}
    }
}

run();
