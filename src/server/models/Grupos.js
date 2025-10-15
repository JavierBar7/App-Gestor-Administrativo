const connection = require('../../config/database');

class Grupo {
    constructor(idGrupos, idProfesores, Curso_idCurso, Nombre_Grupo, Fecha_inicio, Estado) {
        this.idGrupos = idGrupos;
        this.idProfesores = idProfesores;
        this.Curso_idCurso = Curso_idCurso;
        this.Nombre_Grupo = Nombre_Grupo;
        this.Fecha_inicio = Fecha_inicio;
        this.Estado = Estado;
    }

    async save() {
        try {
            const query = 'INSERT INTO Grupos (idProfesores, Curso_idCurso, , Nombre_Grupo, Fecha_inicio, Estado) VALUES (?, ?, ?, ?, ?)';
            const [result] = await connection.execute(query, [
                this.idProfesores,
                this.Curso_idCurso,
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
            const query = 'UPDATE Grupos SET  = ?, Nombre_Grupo = ?, Fecha_inicio = ?, Estado = ? WHERE idGrupos = ? AND idProfesores = ? AND Curso_idCurso = ?';
            const [result] = await connection.execute(query, [
                this.Nombre_Grupo,
                this.Fecha_inicio,
                this.Estado,
                this.idGrupos,
                this.idProfesores,
                this.Curso_idCurso
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

    static async findByIds(idGrupos, idProfesores, Curso_idCurso) {
        try {
            const query = 'SELECT * FROM Grupos WHERE idGrupos = ? AND idProfesores = ? AND Curso_idCurso = ?';
            const [rows] = await connection.execute(query, [idGrupos, idProfesores, Curso_idCurso]);
            if (rows.length > 0) {
                const r = rows[0];
                return new Grupo(r.idGrupos, r.idProfesores, r.Curso_idCurso, r.Nombre_Grupo, r.Fecha_inicio, r.Estado);
            }
            return null;
        } catch (error) {
            throw new Error(`Error al buscar el grupo: ${error.message}`);
        }
    }
    
    static async deleteByIds(idGrupos, idProfesores, Curso_idCurso) {
        try {
            const query = 'DELETE FROM Grupos WHERE idGrupos = ? AND idProfesores = ? AND Curso_idCurso = ?';
            const [result] = await connection.execute(query, [idGrupos, idProfesores, Curso_idCurso]);
            return result;
        } catch (error) {
            throw new Error(`Error al eliminar el grupo: ${error.message}`);
        }
    }
}

module.exports = Grupo;