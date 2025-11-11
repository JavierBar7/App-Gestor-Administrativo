const conn = require('../../config/database');

class Grupo {
    constructor(idCurso, Nombre_Grupo, Fecha_inicio, Estado) {
        this.idCurso = idCurso;
        this.Nombre_Grupo = Nombre_Grupo;
        this.Fecha_inicio = Fecha_inicio;
        this.Estado = Estado;
    }

    static async create(idCurso, Nombre_Grupo, Fecha_inicio, Estado) {
        try {
            const [result] = await conn.promise().query(
                'INSERT INTO grupos (idCurso, Nombre_Grupo, Fecha_inicio, Estado) VALUES (?, ?, ?, ?)',
                [idCurso, Nombre_Grupo, Fecha_inicio, Estado]
            );
            return { idGrupo: result.insertId, idCurso, Nombre_Grupo, Fecha_inicio, Estado };
        } catch (error) {
            console.error('Error creando grupo (Grupo.create):', error);
            throw error;
        }
    }

    static async findAll() {
        try {
            const [rows] = await conn.promise().query('SELECT idGrupo, idCurso, Nombre_Grupo, Fecha_inicio, Estado FROM grupos');
            return rows;
        } catch (error) {
            console.error('Error listando grupos (Grupo.findAll):', error);
            throw error;
        }
    }
}

module.exports = { Grupo };
