const connection = require('../../config/database');

class Curso {
    constructor(idCursos, Nombre_Curso, Descripcion_Curso) {
        this.idCursos = idCursos;
        this.Nombre_Curso = Nombre_Curso;
        this.Descripcion_Curso = Descripcion_Curso;
    }

    async save() {
        try {
            const query = 'INSERT INTO Cursos (Nombre_Curso, Descripcion_Curso) VALUES (?, ?)';
            const [result] = await connection.execute(query, [this.Nombre_Curso, this.Descripcion_Curso]);
            this.idCursos = result.insertId;
            return result;
        } catch (error) {
            throw new Error(`Error al guardar el curso: ${error.message}`);
        }
    }

    async update() {
        try {
            const query = 'UPDATE Cursos SET Nombre_Curso = ?, Descripcion_Curso = ? WHERE idCursos = ?';
            const [result] = await connection.execute(query, [this.Nombre_Curso, this.Descripcion_Curso, this.idCursos]);
            return result;
        } catch (error) {
            throw new Error(`Error al actualizar el curso: ${error.message}`);
        }
    }

    static async findAll() {
        try {
            const [rows] = await connection.execute('SELECT * FROM Cursos');
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener los cursos: ${error.message}`);
        }
    }

    static async findById(id) {
        try {
            const [rows] = await connection.execute('SELECT * FROM Cursos WHERE idCursos = ?', [id]);
            if (rows.length > 0) {
                const r = rows[0];
                return new Curso(r.idCursos, r.Nombre_Curso, r.Descripcion_Curso);
            }
            return null;
        } catch (error) {
            throw new Error(`Error al buscar el curso: ${error.message}`);
        }
    }
    
    static async deleteById(id) {
        try {
            const [result] = await connection.execute('DELETE FROM Cursos WHERE idCursos = ?', [id]);
            return result;
        } catch (error) {
            throw new Error(`Error al eliminar el curso: ${error.message}`);
        }
    }
}

module.exports = Curso;