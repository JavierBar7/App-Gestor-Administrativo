    const conn = require('../../config/database');

    class Curso {
        static async updateCurso(idCurso, data) {
            const { Nombre_Curso, Descripcion_Curso } = data;
            const [result] = await conn.promise().query(
                'UPDATE cursos SET Nombre_Curso=?, Descripcion_Curso=? WHERE idCurso=?',
                [Nombre_Curso, Descripcion_Curso, idCurso]
            );
            return result.affectedRows > 0;
        }
    constructor(Nombre_Curso, Descripcion_Curso) {
        this.Nombre_Curso = Nombre_Curso;
        this.Descripcion_Curso = Descripcion_Curso;
    }

    static async create(Nombre_Curso, Descripcion_Curso) {
        try {
            const [result] = await conn.promise().query(
                'INSERT INTO cursos (Nombre_Curso, Descripcion_Curso) VALUES (?, ?)',
                [Nombre_Curso, Descripcion_Curso]
            );
            return { idCurso: result.insertId, Nombre_Curso, Descripcion_Curso };
        } catch (error) {
            console.error('Error creando curso (Curso.create):', error);
            throw error;
        }
    }

    static async findAll() {
        try {
            const [rows] = await conn.promise().query('SELECT idCurso, Nombre_Curso, Descripcion_Curso FROM cursos');
            return rows;
        } catch (error) {
            console.error('Error listando cursos (Curso.findAll):', error);
            throw error;
        }
    }
}

module.exports = { Curso };
