const connection = require('../../config/database');

class Grupo {
    constructor(idGrupos, idProfesores, idCursos, Horarios, Nombre_Grupo, Fecha_inicio, Estado) {
        this.idGrupos = idGrupos;
        this.idProfesores = idProfesores;
        this.idCursos = idCursos;
        this.Horarios = Horarios;
        this.Nombre_Grupo = Nombre_Grupo;
        this.Fecha_inicio = Fecha_inicio;
        this.Estado = Estado;
    }

    async save() {
        try {
            const query = 'INSERT INTO Grupos (idProfesores, idCursos, Horarios, Nombre_Grupo, Fecha_inicio, Estado) VALUES (?, ?, ?, ?, ?, ?)';
            const [result] = await connection.execute(query, [
                this.idProfesores,
                this.idCursos,
                this.Horarios,
                this.Nombre_Grupo,
                this.Fecha_inicio,
                this.Estado
            ]);
            this.idGrupos = result.insertId;
            return result;
        } catch (error) {
            throw new Error(`Error al guardar el grupo: ${error.message}`);
        }
    }

    // El update se hace sobre las 3 llaves primarias
    async update() {
        try {
            const query = 'UPDATE Grupos SET Horarios = ?, Nombre_Grupo = ?, Fecha_inicio = ?, Estado = ? WHERE idGrupos = ? AND idProfesores = ? AND idCursos = ?';
            const [result] = await connection.execute(query, [
                this.Horarios,
                this.Nombre_Grupo,
                this.Fecha_inicio,
                this.Estado,
                this.idGrupos,
                this.idProfesores,
                this.idCursos
            ]);
            return result;
        } catch (error) {
            throw new Error(`Error al actualizar el grupo: ${error.message}`);
        }
    }

    static async findAll() {
        try {
            const [rows] = await connection.execute('SELECT * FROM Grupos');
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener los grupos: ${error.message}`);
        }
    }

    static async findByIds(idGrupos, idProfesores, idCursos) {
        try {
            const query = 'SELECT * FROM Grupos WHERE idGrupos = ? AND idProfesores = ? AND idCursos = ?';
            const [rows] = await connection.execute(query, [idGrupos, idProfesores, idCursos]);
             if (rows.length > 0) {
                const r = rows[0];
                return new Grupo(r.idGrupos, r.idProfesores, r.idCursos, r.Horarios, r.Nombre_Grupo, r.Fecha_inicio, r.Estado);
            }
            return null;
        } catch (error) {
            throw new Error(`Error al buscar el grupo: ${error.message}`);
        }
    }
    
    static async deleteByIds(idGrupos, idProfesores, idCursos) {
        try {
            const query = 'DELETE FROM Grupos WHERE idGrupos = ? AND idProfesores = ? AND idCursos = ?';
            const [result] = await connection.execute(query, [idGrupos, idProfesores, idCursos]);
            return result;
        } catch (error) {
            throw new Error(`Error al eliminar el grupo: ${error.message}`);
        }
    }
}

module.exports = Grupo;