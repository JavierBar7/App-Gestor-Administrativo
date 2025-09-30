const connection = require('../../config/database');

class Asistencia {
    constructor(idAsistencia, Fecha_Clase, Estuvo_presente, Justificacion, Grupos_idGrupos, Estudiantes_idEstudiantes) {
        this.idAsistencia = idAsistencia;
        this.Fecha_Clase = Fecha_Clase;
        this.Estuvo_presente = Estuvo_presente;
        this.Justificacion = Justificacion;
        this.Grupos_idGrupos = Grupos_idGrupos;
        this.Estudiantes_idEstudiantes = Estudiantes_idEstudiantes;
    }

    async save() {
        try {
            const query = 'INSERT INTO Asistencia (Fecha_Clase, Estuvo_presente, Justificacion, Grupos_idGrupos, Estudiantes_idEstudiantes) VALUES (?, ?, ?, ?, ?)';
            const [result] = await connection.execute(query, [
                this.Fecha_Clase,
                this.Estuvo_presente,
                this.Justificacion,
                this.Grupos_idGrupos,
                this.Estudiantes_idEstudiantes
            ]);
            this.idAsistencia = result.insertId;
            return result;
        } catch (error) {
            throw new Error(`Error al guardar la asistencia: ${error.message}`);
        }
    }

    async update() {
        try {
            const query = 'UPDATE Asistencia SET Fecha_Clase = ?, Estuvo_presente = ?, Justificacion = ? WHERE idAsistencia = ? AND Grupos_idGrupos = ? AND Estudiantes_idEstudiantes = ?';
            const [result] = await connection.execute(query, [
                this.Fecha_Clase,
                this.Estuvo_presente,
                this.Justificacion,
                this.idAsistencia,
                this.Grupos_idGrupos,
                this.Estudiantes_idEstudiantes
            ]);
            return result;
        } catch (error) {
            throw new Error(`Error al actualizar la asistencia: ${error.message}`);
        }
    }

    static async findAll() {
        try {
            const [rows] = await connection.execute('SELECT * FROM Asistencia');
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener las asistencias: ${error.message}`);
        }
    }

    static async findByIds(idAsistencia, idGrupo, idEstudiante) {
        try {
            const query = 'SELECT * FROM Asistencia WHERE idAsistencia = ? AND Grupos_idGrupos = ? AND Estudiantes_idEstudiantes = ?';
            const [rows] = await connection.execute(query, [idAsistencia, idGrupo, idEstudiante]);
            if (rows.length > 0) {
                const r = rows[0];
                return new Asistencia(r.idAsistencia, r.Fecha_Clase, r.Estuvo_presente, r.Justificacion, r.Grupos_idGrupos, r.Estudiantes_idEstudiantes);
            }
            return null;
        } catch (error) {
            throw new Error(`Error al buscar la asistencia: ${error.message}`);
        }
    }

    static async deleteByIds(idAsistencia, idGrupo, idEstudiante) {
        try {
            const query = 'DELETE FROM Asistencia WHERE idAsistencia = ? AND Grupos_idGrupos = ? AND Estudiantes_idEstudiantes = ?';
            const [result] = await connection.execute(query, [idAsistencia, idGrupo, idEstudiante]);
            return result;
        } catch (error) {
            throw new Error(`Error al eliminar la asistencia: ${error.message}`);
        }
    }
}

module.exports = Asistencia;