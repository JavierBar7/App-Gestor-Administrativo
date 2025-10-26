const connection = require('../../config/database');

class RepresentanteEstudiante {
    constructor(Representantes_idRepresentantes, Estudiantes_idEstudiantes) {
        this.Representantes_idRepresentantes = Representantes_idRepresentantes;
        this.Estudiantes_idEstudiantes = Estudiantes_idEstudiantes;
    }

    async save() {
        try {
            const query = 'INSERT INTO Representantes_has_Estudiantes (Representantes_idRepresentantes, Estudiantes_idEstudiantes) VALUES (?, ?)';
            const [result] = await connection.execute(query, [this.Representantes_idRepresentantes, this.Estudiantes_idEstudiantes]);
            return result;
        } catch (error) {
            throw new Error(`Error al vincular representante y estudiante: ${error.message}`);
        }
    }

    static async findAll() {
        try {
            const [rows] = await connection.execute('SELECT * FROM Representantes_has_Estudiantes');
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener las vinculaciones: ${error.message}`);
        }
    }

    static async findByRepresentanteId(idRepresentante) {
        try {
            const query = 'SELECT * FROM Representantes_has_Estudiantes WHERE Representantes_idRepresentantes = ?';
            const [rows] = await connection.execute(query, [idRepresentante]);
            return rows;
        } catch (error) {
            throw new Error(`Error al buscar por representante: ${error.message}`);
        }
    }
    
    static async findByEstudianteId(idEstudiante) {
        try {
            const query = 'SELECT * FROM Representantes_has_Estudiantes WHERE Estudiantes_idEstudiantes = ?';
            const [rows] = await connection.execute(query, [idEstudiante]);
            return rows;
        } catch (error) {
            throw new Error(`Error al buscar por estudiante: ${error.message}`);
        }
    }

    static async delete(idRepresentante, idEstudiante) {
        try {
            const query = 'DELETE FROM Representantes_has_Estudiantes WHERE Representantes_idRepresentantes = ? AND Estudiantes_idEstudiantes = ?';
            const [result] = await connection.execute(query, [idRepresentante, idEstudiante]);
            return result;
        } catch (error) {
            throw new Error(`Error al eliminar la vinculación: ${error.message}`);
        }
    }
}

module.exports = RepresentanteEstudiante;