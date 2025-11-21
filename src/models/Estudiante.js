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
        // Si existe la columna idGrupo, la incluimos; de lo contrario insertamos sin ella.
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
        
        // Sanitizar Mes_referencia si viene como YYYY-MM a YYYY-MM-01 para columnas DATE
        let mesRefFinal = Mes_referencia;
        if (mesRefFinal && /^\d{4}-\d{2}$/.test(mesRefFinal)) {
            mesRefFinal += '-01';
        }

        const tryInsert = async (query, params) => {
            try {
                const [result] = await conn.promise().query(query, params);
                return result.insertId;
            } catch (err) {
                throw err;
            }
        };

        try {
            return await tryInsert(
                'INSERT INTO pagos (idDeuda, idMetodos_pago, idCuenta_Destino, idEstudiante, Referencia, Mes_referencia, Monto_bs, Tasa_Pago, Monto_usd, Fecha_pago) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [idDeuda, idMetodos_pago, idCuenta_Destino, idEstudiante, Referencia, mesRefFinal, Monto_bs, Tasa_Pago, Monto_usd, Fecha_pago]
            );
        } catch (err) {
            const code = err.code;

            if (code === 'ER_BAD_FIELD_ERROR' || code === 'ER_TRUNCATED_WRONG_VALUE' || code === 'WARN_DATA_TRUNCATED') {
                try {
                    return await tryInsert(
                        'INSERT INTO pagos (idDeuda, idMetodos_pago, idCuenta_Destino, idEstudiante, Referencia, Monto_bs, Tasa_Pago, Monto_usd, Fecha_pago) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [idDeuda, idMetodos_pago, idCuenta_Destino, idEstudiante, Referencia, Monto_bs, Tasa_Pago, Monto_usd, Fecha_pago]
                    );
                } catch (err2) {
                    if (err2.code === 'ER_BAD_FIELD_ERROR' || err2.code === 'ER_NO_REFERENCED_ROW_2' || err2.code === 'ER_NO_REFERENCED_ROW') {
                        return await tryInsert(
                            'INSERT INTO pagos (idMetodos_pago, idCuenta_Destino, idEstudiante, Referencia, Monto_bs, Tasa_Pago, Monto_usd, Fecha_pago) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                            [idMetodos_pago, idCuenta_Destino, idEstudiante, Referencia, Monto_bs, Tasa_Pago, Monto_usd, Fecha_pago]
                        );
                    }
                    throw err2;
                }
            }
            
            if (code === 'ER_NO_REFERENCED_ROW_2' || code === 'ER_NO_REFERENCED_ROW') {
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
            FROM estudiantes e`
        );
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

    // NUEVA FUNCIÓN PARA EL APARTADO DE DEUDORES
// En src/models/Estudiante.js

    static async getDeudores() {
        const query = `
            SELECT 
                e.idEstudiante, 
                e.Nombres, 
                e.Apellidos, 
                e.Telefono,
                COUNT(d.idDeuda) as Cantidad_Deudas,
                -- CAMBIO AQUÍ: Quitamos el HTML y dejamos solo texto plano '(Parcial)'
                GROUP_CONCAT(
                    CONCAT(
                        d.Concepto, 
                        IF(
                            (SELECT COUNT(*) FROM pagos_parciales pp WHERE pp.idDeuda = d.idDeuda) > 0, 
                            ' (Parcial)', 
                            ''
                        )
                    ) 
                SEPARATOR ', ') as Meses_Deuda,
                SUM(d.Monto_usd) as Deuda_Original,
                (
                    SELECT COALESCE(SUM(pp.Monto_parcial), 0) 
                    FROM pagos_parciales pp 
                    WHERE pp.idDeuda IN (SELECT idDeuda FROM deudas WHERE idEstudiante = e.idEstudiante AND Estado != 'Pagada')
                ) as Total_Abonado
            FROM estudiantes e
            JOIN deudas d ON e.idEstudiante = d.idEstudiante
            WHERE d.Estado != 'Pagada'
            GROUP BY e.idEstudiante, e.Nombres, e.Apellidos, e.Telefono
        `;
        const [rows] = await conn.promise().query(query);
        return rows;
    }

    static async getPaymentSummary(idEstudiante) {
        // Calcula fechas dinámicas
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
        
        const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const nextMonth = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;
        
        const [rows] = await conn.promise().query(
            `SELECT 
                MAX(p.Fecha_pago) AS Ultimo_Pago,
                SUM(p.Monto_usd) AS Total_Pagado_USD,
                COUNT(*) AS Cantidad_Pagos,
                (SELECT COALESCE(cm.Mes_date, p2.Fecha_pago)
                FROM pagos p2
                LEFT JOIN control_mensualidades cm ON cm.idPago = p2.idPago
                WHERE p2.idEstudiante = ? 
                ORDER BY p2.Fecha_pago DESC 
                LIMIT 1) AS Ultimo_Mes,
                (SELECT SUM(p3.Monto_usd)
                FROM pagos p3
                LEFT JOIN control_mensualidades cm3 ON cm3.idPago = p3.idPago
                WHERE p3.idEstudiante = ?
                AND (DATE_FORMAT(cm3.Mes_date, '%Y-%m') = ? 
                    OR (cm3.Mes_date IS NULL AND DATE_FORMAT(p3.Fecha_pago, '%Y-%m') = ?))
                ) AS Pago_Mes_Pasado,
                (SELECT SUM(p4.Monto_usd)
                FROM pagos p4
                LEFT JOIN control_mensualidades cm4 ON cm4.idPago = p4.idPago
                WHERE p4.idEstudiante = ?
                AND (DATE_FORMAT(cm4.Mes_date, '%Y-%m') = ? 
                    OR (cm4.Mes_date IS NULL AND DATE_FORMAT(p4.Fecha_pago, '%Y-%m') = ?))
                ) AS Pago_Mes_Actual,
                (SELECT SUM(p5.Monto_usd)
                FROM pagos p5
                LEFT JOIN control_mensualidades cm5 ON cm5.idPago = p5.idPago
                WHERE p5.idEstudiante = ?
                AND (DATE_FORMAT(cm5.Mes_date, '%Y-%m') = ? 
                    OR (cm5.Mes_date IS NULL AND DATE_FORMAT(p5.Fecha_pago, '%Y-%m') = ?))
                ) AS Pago_Mes_Proximo
            FROM pagos p
            WHERE p.idEstudiante = ?`,
            [
                idEstudiante, 
                idEstudiante, lastMonth, lastMonth, 
                idEstudiante, currentMonth, currentMonth, 
                idEstudiante, nextMonth, nextMonth, 
                idEstudiante
            ]
        );
        
        const result = rows[0] || { 
            Ultimo_Pago: null, 
            Total_Pagado_USD: 0, 
            Cantidad_Pagos: 0, 
            Ultimo_Mes: null,
            Pago_Mes_Pasado: null,
            Pago_Mes_Actual: null,
            Pago_Mes_Proximo: null
        };
        
        result.Nombre_Mes_Pasado = lastMonth;
        result.Nombre_Mes_Actual = currentMonth;
        result.Nombre_Mes_Proximo = nextMonth;
        
        return result;
    }
}

module.exports = { Estudiante };