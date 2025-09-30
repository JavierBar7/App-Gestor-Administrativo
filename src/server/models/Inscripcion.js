const connection = require('../../config/database');

class Inscripcion {
    constructor(idInscripciones, Fecha_inscripcion, Estado, Estudiantes_idEstudiantes, Grupos_idGrupos, Grupos_Profesores_idProfesores) {
        this.idInscripciones = idInscripciones;
        this.Fecha_inscripcion = Fecha_inscripcion;
        this.Estado = Estado;
        this.Estudiantes_idEstudiantes = Estudiantes_idEstudiantes;
        this.Grupos_idGrupos = Grupos_idGrupos;
        this.Grupos_Profesores_idProfesores = Grupos_Profesores_idProfesores;
    }

    async save() {
        try {
            const query = `
                INSERT INTO Inscripciones 
                (Fecha_inscripcion, Estado, Estudiantes_idEstudiantes, Grupos_idGrupos, Grupos_Profesores_idProfesores) 
                VALUES (?, ?, ?, ?, ?)`;
            const [result] = await connection.execute(query, [
                this.Fecha_inscripcion,
                this.Estado,
                this.Estudiantes_idEstudiantes,
                this.Grupos_idGrupos,
                this.Grupos_Profesores_idProfesores
            ]);
            this.idInscripciones = result.insertId;
            return result;
        } catch (error) {
            throw new Error(`Error al guardar la inscripción: ${error.message}`);
        }
    }
    
    async update() {
        try {
            const query = `
                UPDATE Inscripciones SET Fecha_inscripcion = ?, Estado = ?
                WHERE idInscripciones = ? AND Estudiantes_idEstudiantes = ? AND Grupos_idGrupos = ? AND Grupos_Profesores_idProfesores = ?`;
            const [result] = await connection.execute(query, [
                this.Fecha_inscripcion,
                this.Estado,
                this.idInscripciones,
                this.Estudiantes_idEstudiantes,
                this.Grupos_idGrupos,
                this.Grupos_Profesores_idProfesores
            ]);
            return result;
        } catch (error) {
            throw new Error(`Error al actualizar la inscripción: ${error.message}`);
        }
    }

    static async findAll() {
        try {
            const [rows] = await connection.execute('SELECT * FROM Inscripciones');
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener las inscripciones: ${error.message}`);
        }
    }

    static async findByIds(idInscripciones, idEstudiante, idGrupo, idProfesor) {
        try {
            const query = `
                SELECT * FROM Inscripciones 
                WHERE idInscripciones = ? AND Estudiantes_idEstudiantes = ? AND Grupos_idGrupos = ? AND Grupos_Profesores_idProfesores = ?`;
            const [rows] = await connection.execute(query, [idInscripciones, idEstudiante, idGrupo, idProfesor]);
            if (rows.length > 0) {
                const r = rows[0];
                return new Inscripcion(r.idInscripciones, r.Fecha_inscripcion, r.Estado, r.Estudiantes_idEstudiantes, r.Grupos_idGrupos, r.Grupos_Profesores_idProfesores);
            }
            return null;
        } catch (error) {
            throw new Error(`Error al buscar la inscripción: ${error.message}`);
        }
    }

    static async deleteByIds(idInscripciones, idEstudiante, idGrupo, idProfesor) {
        try {
            const query = `
                DELETE FROM Inscripciones 
                WHERE idInscripciones = ? AND Estudiantes_idEstudiantes = ? AND Grupos_idGrupos = ? AND Grupos_Profesores_idProfesores = ?`;
            const [result] = await connection.execute(query, [idInscripciones, idEstudiante, idGrupo, idProfesor]);
            return result;
        } catch (error) {
            throw new Error(`Error al eliminar la inscripción: ${error.message}`);
        }
    }
}

module.exports = Inscripcion;