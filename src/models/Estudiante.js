    const conn = require('../../config/database');

    class Estudiante {
        static async updateEstudiante(idEstudiante, data) {
            const { Nombres, Apellidos, Cedula, Fecha_Nacimiento, Telefono, Correo, Direccion } = data;
            const [result] = await conn.promise().query(
                'UPDATE estudiantes SET Nombres=?, Apellidos=?, Cedula=?, Fecha_Nacimiento=?, Telefono=?, Correo=?, Direccion=? WHERE idEstudiante=?',
                [Nombres, Apellidos, Cedula, Fecha_Nacimiento, Telefono, Correo, Direccion, idEstudiante]
            );
            return result.affectedRows > 0;
        }
    static async createEstudiante(data) {
        const { Nombres, Apellidos, Cedula, Fecha_Nacimiento, Telefono, Correo, Direccion } = data;
        const [result] = await conn.promise().query(
            'INSERT INTO estudiantes (Nombres, Apellidos, Cedula, Fecha_Nacimiento, Telefono, Correo, Direccion) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [Nombres, Apellidos, Cedula, Fecha_Nacimiento, Telefono, Correo, Direccion]
        );
        return result.insertId;
    }

    static async createRepresentante(data) {
        const { Nombres, Apellidos, Cedula, Parentesco, Correo, Direccion } = data;
        const [result] = await conn.promise().query(
            'INSERT INTO representantes (Nombres, Apellidos, Cedula, Parentesco, Correo, Direccion) VALUES (?, ?, ?, ?, ?, ?)',
            [Nombres, Apellidos, Cedula, Parentesco, Correo, Direccion]
        );
        return result.insertId;
    }

    static async linkRepresentanteToEstudiante(idRepresentante, idEstudiante) {
        return conn.promise().query(
            'INSERT INTO representante_estudiante (idRepresentante, idEstudiante) VALUES (?, ?)',
            [idRepresentante, idEstudiante]
        );
    }

    static async addTelefonoRepresentante(idRepresentante, numero, tipo = 'movil') {
        return conn.promise().query(
            'INSERT INTO telefonos_representante (idRepresentante, Numero, Tipo) VALUES (?, ?, ?)',
            [idRepresentante, numero, tipo]
        );
    }

    static async createInscripcion(idEstudiante, idCurso, Fecha_inscripcion, idGrupo = null) {
        // If idGrupo column exists, include it; otherwise insert without it.
        // We attempt the insert with idGrupo column — if column doesn't exist this will throw.
        // Caller should ensure migration was applied.
        if (idGrupo) {
            return conn.promise().query(
                'INSERT INTO inscripciones (idEstudiante, idCurso, Fecha_inscripcion, idGrupo) VALUES (?, ?, ?, ?)',
                [idEstudiante, idCurso, Fecha_inscripcion, idGrupo]
            );
        } else {
            return conn.promise().query(
                'INSERT INTO inscripciones (idEstudiante, idCurso, Fecha_inscripcion) VALUES (?, ?, ?)',
                [idEstudiante, idCurso, Fecha_inscripcion]
            );
        }
    }

    static async findEstudiantesByGrupo(idGrupo) {
        const [rows] = await conn.promise().query(
            `SELECT e.idEstudiante, e.Nombres, e.Apellidos, e.Cedula, e.Fecha_Nacimiento, e.Telefono, e.Correo, e.Direccion
             FROM estudiantes e
             JOIN inscripciones i ON i.idEstudiante = e.idEstudiante
             WHERE i.idGrupo = ?`, [idGrupo]
        );
        return rows;
    }

    static async getLastPaymentsForStudent(idEstudiante, limit = 3) {
        const [rows] = await conn.promise().query(
            'SELECT idPago, Monto_usd, Fecha_pago FROM pagos WHERE idEstudiante = ? ORDER BY Fecha_pago DESC LIMIT ?',
            [idEstudiante, Number(limit)]
        );
        return rows;
    }

    static async getEstudiantes() {
        const [rows] = await conn.promise().query(
            `SELECT e.idEstudiante, e.Nombres, e.Apellidos, e.Cedula, e.Fecha_Nacimiento, e.Telefono, e.Correo, e.Direccion
             FROM estudiantes e`);
        return rows;
    }
}

module.exports = { Estudiante };
