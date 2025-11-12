    const conn = require('../../config/database');

    class Grupo {
        static async updateGrupo(idGrupo, data) {
            const { idCurso, Nombre_Grupo, Fecha_inicio, Estado } = data;
            const [result] = await conn.promise().query(
                'UPDATE grupos SET idCurso=?, Nombre_Grupo=?, Fecha_inicio=?, Estado=? WHERE idGrupo=?',
                [idCurso, Nombre_Grupo, Fecha_inicio, Estado, idGrupo]
            );
            return result.affectedRows > 0;
        }
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

    static async findById(idGrupo) {
        try {
            const [rows] = await conn.promise().query('SELECT idGrupo, idCurso, Nombre_Grupo, Fecha_inicio, Estado FROM grupos WHERE idGrupo = ?', [idGrupo]);
            return rows[0] || null;
        } catch (error) {
            console.error('Error obteniendo grupo por id (Grupo.findById):', error);
            throw error;
        }
    }
}

module.exports = { Grupo };
