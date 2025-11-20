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
            `SELECT p.idPago, p.Referencia, p.Monto_bs, p.Monto_usd, p.Fecha_pago,
                    cm.Mes AS Mes_control, cm.Observacion, cm.idGrupo AS idGrupo_control, g.Nombre_Grupo AS Grupo_nombre
             FROM pagos p
             LEFT JOIN control_mensualidades cm ON cm.idPago = p.idPago AND cm.idEstudiante = p.idEstudiante
             LEFT JOIN grupos g ON g.idGrupo = cm.idGrupo
             WHERE p.idEstudiante = ?
             ORDER BY p.Fecha_pago DESC LIMIT ?`,
            [idEstudiante, Number(limit)]
        );
        return rows;
    }

    static async getLatestTasa() {
        const [rows] = await conn.promise().query(
            'SELECT Tasa_usd_a_bs FROM tasa_cambio ORDER BY Fecha_Vigencia DESC LIMIT 1'
        );
        return rows && rows.length ? rows[0].Tasa_usd_a_bs : null;
    }

    static async createPago({ idDeuda = null, idMetodos_pago = null, idCuenta_Destino = null, idEstudiante = null, Referencia = null, Mes_referencia = null, Monto_bs = null, Tasa_Pago = null, Monto_usd = null, Fecha_pago = null }) {
        
        // Sanitize Mes_referencia if it's YYYY-MM to YYYY-MM-01 for DATE columns
        let mesRefFinal = Mes_referencia;
        if (mesRefFinal && /^\d{4}-\d{2}$/.test(mesRefFinal)) {
            mesRefFinal += '-01';
        }

        // Helper to execute query and handle specific errors
        const tryInsert = async (query, params) => {
            try {
                const [result] = await conn.promise().query(query, params);
                return result.insertId;
            } catch (err) {
                throw err;
            }
        };

        // 1. Try Full Insert (with idDeuda and Mes_referencia)
        try {
            return await tryInsert(
                'INSERT INTO pagos (idDeuda, idMetodos_pago, idCuenta_Destino, idEstudiante, Referencia, Mes_referencia, Monto_bs, Tasa_Pago, Monto_usd, Fecha_pago) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [idDeuda, idMetodos_pago, idCuenta_Destino, idEstudiante, Referencia, mesRefFinal, Monto_bs, Tasa_Pago, Monto_usd, Fecha_pago]
            );
        } catch (err) {
            const code = err.code;
            // console.error('Full insert failed:', code, err.message);

            // 2. If Mes_referencia causes issues (Bad Field or Wrong Value/Date)
            if (code === 'ER_BAD_FIELD_ERROR' || code === 'ER_TRUNCATED_WRONG_VALUE' || code === 'WARN_DATA_TRUNCATED') {
                try {
                    // Try without Mes_referencia but WITH idDeuda
                    return await tryInsert(
                        'INSERT INTO pagos (idDeuda, idMetodos_pago, idCuenta_Destino, idEstudiante, Referencia, Monto_bs, Tasa_Pago, Monto_usd, Fecha_pago) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [idDeuda, idMetodos_pago, idCuenta_Destino, idEstudiante, Referencia, Monto_bs, Tasa_Pago, Monto_usd, Fecha_pago]
                    );
                } catch (err2) {
                    // 3. If idDeuda causes issues (Bad Field or FK Constraint)
                    if (err2.code === 'ER_BAD_FIELD_ERROR' || err2.code === 'ER_NO_REFERENCED_ROW_2' || err2.code === 'ER_NO_REFERENCED_ROW') {
                        return await tryInsert(
                            'INSERT INTO pagos (idMetodos_pago, idCuenta_Destino, idEstudiante, Referencia, Monto_bs, Tasa_Pago, Monto_usd, Fecha_pago) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                            [idMetodos_pago, idCuenta_Destino, idEstudiante, Referencia, Monto_bs, Tasa_Pago, Monto_usd, Fecha_pago]
                        );
                    }
                    throw err2;
                }
            }
            
            // 4. If idDeuda causes issues (FK Constraint) directly on first try
            if (code === 'ER_NO_REFERENCED_ROW_2' || code === 'ER_NO_REFERENCED_ROW') {
                 // Try without idDeuda (but keep Mes_referencia if it wasn't the issue, or drop it to be safe? Let's drop it to be safest)
                 return await tryInsert(
                    'INSERT INTO pagos (idMetodos_pago, idCuenta_Destino, idEstudiante, Referencia, Monto_bs, Tasa_Pago, Monto_usd, Fecha_pago) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [idMetodos_pago, idCuenta_Destino, idEstudiante, Referencia, Monto_bs, Tasa_Pago, Monto_usd, Fecha_pago]
                );
            }

            throw err;
        }
    }

    static async createPagoParcial({ idPago = null, idDeuda = null, Monto_parcial = null }) {
        const [result] = await conn.promise().query(
            'INSERT INTO pagos_parciales (idPago, idDeuda, Monto_parcial) VALUES (?, ?, ?)',
            [idPago, idDeuda, Monto_parcial]
        );
        return result.insertId;
    }

    static async getEstudiantes() {
        const [rows] = await conn.promise().query(
            `SELECT e.idEstudiante, e.Nombres, e.Apellidos, e.Cedula, e.Fecha_Nacimiento, e.Telefono, e.Correo, e.Direccion
             FROM estudiantes e`);
        return rows;
    }

    static async getEstudianteById(idEstudiante) {
        const [rows] = await conn.promise().query(
            `SELECT idEstudiante, Nombres, Apellidos, Cedula, Fecha_Nacimiento, Telefono, Correo, Direccion
             FROM estudiantes WHERE idEstudiante = ?`, [idEstudiante]
        );
        return rows && rows.length ? rows[0] : null;
    }

    static async getPaymentsByStudent(idEstudiante) {
        const [rows] = await conn.promise().query(
            `SELECT p.idPago, p.idDeuda, p.idMetodos_pago, p.Referencia, p.Monto_bs, p.Monto_usd, p.Fecha_pago,
                    cm.Mes_date AS Mes_control, cm.idGrupo AS idGrupo_control, g.Nombre_Grupo AS Grupo_nombre
             FROM pagos p
             LEFT JOIN control_mensualidades cm ON cm.idPago = p.idPago AND cm.idEstudiante = p.idEstudiante
             LEFT JOIN grupos g ON g.idGrupo = cm.idGrupo
             WHERE p.idEstudiante = ?
             ORDER BY p.Fecha_pago DESC`, [idEstudiante]
        );
        return rows;
    }

    static async getRepresentanteByStudent(idEstudiante) {
        const [rows] = await conn.promise().query(
            `SELECT r.idRepresentante, r.Nombres, r.Apellidos, r.Cedula, r.Parentesco, r.Correo, r.Direccion,
                    GROUP_CONCAT(tr.Numero SEPARATOR ', ') AS Telefonos
             FROM representantes r
             JOIN representante_estudiante re ON re.idRepresentante = r.idRepresentante
             LEFT JOIN telefonos_representante tr ON tr.idRepresentante = r.idRepresentante
             WHERE re.idEstudiante = ?
             GROUP BY r.idRepresentante`, [idEstudiante]
        );
        return rows && rows.length ? rows[0] : null;
    }

    static async getGroupsByStudent(idEstudiante) {
        const [rows] = await conn.promise().query(
            `SELECT i.Fecha_inscripcion, i.idGrupo, g.Nombre_Grupo, g.idCurso, c.Nombre_Curso
             FROM inscripciones i
             LEFT JOIN grupos g ON g.idGrupo = i.idGrupo
             LEFT JOIN cursos c ON c.idCurso = g.idCurso
             WHERE i.idEstudiante = ?
             ORDER BY i.Fecha_inscripcion DESC`, [idEstudiante]
        );
        return rows;
    }

    static async getDeudasByStudent(idEstudiante) {
        const [rows] = await conn.promise().query(
            `SELECT d.*, 
                    (COALESCE((SELECT SUM(p.Monto_usd) FROM pagos p WHERE p.idDeuda = d.idDeuda), 0) + 
                     COALESCE((SELECT SUM(pp.Monto_parcial) FROM pagos_parciales pp WHERE pp.idDeuda = d.idDeuda), 0)) AS Total_Pagado
             FROM deudas d
             WHERE d.idEstudiante = ? AND d.Estado != 'Pagada'
             ORDER BY d.Fecha_emision ASC`, 
            [idEstudiante]
        );
        return rows;
    }
}

module.exports = { Estudiante };
