const connection = require('../../config/database');

class HistorialGrupo {
    constructor(idHistorial_Grupos, Nombre_grupo, Estudiantes_idEstudiantes, Grupos_idGrupos, Grupos_Profesores_idProfesores, Grupos_Cursos_idCursos) {
        this.idHistorial_Grupos = idHistorial_Grupos;
        this.Nombre_grupo = Nombre_grupo;
        this.Estudiantes_idEstudiantes = Estudiantes_idEstudiantes;
        this.Grupos_idGrupos = Grupos_idGrupos;
        this.Grupos_Profesores_idProfesores = Grupos_Profesores_idProfesores;
        this.Grupos_Cursos_idCursos = Grupos_Cursos_idCursos;
    }

    /**
     * Guarda un nuevo registro en el historial.
     */
    async save() {
        try {
            const query = `
                INSERT INTO Historial_Grupos 
                (Nombre_grupo, Estudiantes_idEstudiantes, Grupos_idGrupos, Grupos_Profesores_idProfesores, Grupos_Cursos_idCursos) 
                VALUES (?, ?, ?, ?, ?)`;
            const [result] = await connection.execute(query, [
                this.Nombre_grupo,
                this.Estudiantes_idEstudiantes,
                this.Grupos_idGrupos,
                this.Grupos_Profesores_idProfesores,
                this.Grupos_Cursos_idCursos
            ]);
            this.idHistorial_Grupos = result.insertId;
            return result;
        } catch (error) {
            throw new Error(`Error al guardar en el historial: ${error.message}`);
        }
    }

    /**
     * Obtiene todos los registros del historial.
     */
    static async findAll() {
        try {
            const [rows] = await connection.execute('SELECT * FROM Historial_Grupos');
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener el historial: ${error.message}`);
        }
    }

    /**
     * Busca el historial completo de un estudiante específico.
     * @param {number} idEstudiante - El ID del estudiante a buscar.
     * @returns {Promise<Array>} - Una lista de registros del historial del estudiante.
     */
    static async findByEstudianteId(idEstudiante) {
        try {
            const query = `
                SELECT * FROM Historial_Grupos 
                WHERE Estudiantes_idEstudiantes = ? 
                ORDER BY idHistorial_Grupos DESC`;
            const [rows] = await connection.execute(query, [idEstudiante]);
            return rows;
        } catch (error) {
            throw new Error(`Error al buscar el historial del estudiante: ${error.message}`);
        }
    }
    
    // NOTA: No se implementa un método de eliminación para esta tabla
    // ya que es un registro histórico importante que no debe ser borrado.
}

module.exports = HistorialGrupo;