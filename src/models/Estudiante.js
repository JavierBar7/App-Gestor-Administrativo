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
                    cm.Mes_date AS Mes_control, cm.Mes AS Mes_num, cm.Year AS Year_num, cm.Observacion, cm.idGrupo AS idGrupo_control, g.Nombre_Grupo AS Grupo_nombre
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

    static async createPago({ idDeuda = null, idMetodos_pago = null, idCuenta_Destino = null, idEstudiante = null, Referencia = null, Mes_referencia = null, Monto_bs = null, Tasa_Pago = null, Monto_usd = null, Fecha_pago = null }, dbConn = null) {
        
        // Sanitize Mes_referencia if it's YYYY-MM to YYYY-MM-01 for DATE columns
        let mesRefFinal = Mes_referencia;
        if (mesRefFinal && /^\d{4}-\d{2}$/.test(mesRefFinal)) {
            mesRefFinal += '-01';
        }

        // Helper to execute query and handle specific errors
        const executor = dbConn ? dbConn.promise() : conn.promise();
        const tryInsert = async (query, params) => {
            try {
                const [result] = await executor.query(query, params);
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
        // Support optional dbConn passed via last argument
        let dbConn = null;
        if (arguments && arguments.length === 2 && arguments[1]) dbConn = arguments[1];
        const executor = dbConn ? dbConn.promise() : conn.promise();
        const [result] = await executor.query(
            'INSERT INTO pagos_parciales (idPago, idDeuda, Monto_parcial) VALUES (?, ?, ?)',
            [idPago, idDeuda, Monto_parcial]
        );
        return result.insertId;
    }

    /**
     * Reconcile a deuda: compute total paid (pagos + pagos_parciales) for the deuda
     * and mark the deuda as 'Pagada' if fully covered.
     * This should be called inside the same DB transaction that created the payments.
     */
    static async reconcileDeuda(idDeuda, dbConn = null) {
        if (!idDeuda) return false;
        const executor = dbConn ? dbConn.promise() : conn.promise();

        // Lock the deuda row to avoid race conditions
        const [deudaRows] = await executor.query(
            'SELECT idDeuda, Monto_usd, Estado FROM deudas WHERE idDeuda = ? FOR UPDATE',
            [idDeuda]
        );
        if (!Array.isArray(deudaRows) || deudaRows.length === 0) return false;
        const deuda = deudaRows[0];
        // If already marked as Pagada, nothing to do
        if (String(deuda.Estado).toLowerCase() === 'pagada') return true;

        // Sum pagos (Monto_usd) and pagos_parciales (Monto_parcial)
        const [pagosSumRows] = await executor.query(
            'SELECT COALESCE(SUM(Monto_usd),0) AS total_pagos FROM pagos WHERE idDeuda = ?',
            [idDeuda]
        );
        const totalPagos = pagosSumRows && pagosSumRows[0] ? Number(pagosSumRows[0].total_pagos || 0) : 0;

        const [parcialesSumRows] = await executor.query(
            'SELECT COALESCE(SUM(Monto_parcial),0) AS total_parciales FROM pagos_parciales WHERE idDeuda = ?',
            [idDeuda]
        );
        const totalParciales = parcialesSumRows && parcialesSumRows[0] ? Number(parcialesSumRows[0].total_parciales || 0) : 0;

        const totalPagado = Number((totalPagos + totalParciales).toFixed(4));
        const montoDeuda = Number(deuda.Monto_usd || 0);

        if (totalPagado >= montoDeuda && montoDeuda > 0) {
            // Mark deuda as Pagada
            await executor.query(
                "UPDATE deudas SET Estado = 'Pagada' WHERE idDeuda = ?",
                [idDeuda]
            );
            return true;
        }

        // Not fully paid yet
        return false;
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

    static async getPaymentSummary(idEstudiante) {
        // Calculate months dynamically based on current date
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
                -- Pago mes pasado
                (SELECT SUM(p3.Monto_usd)
                 FROM pagos p3
                 LEFT JOIN control_mensualidades cm3 ON cm3.idPago = p3.idPago
                 WHERE p3.idEstudiante = ?
                 AND (DATE_FORMAT(cm3.Mes_date, '%Y-%m') = ? 
                      OR (cm3.Mes_date IS NULL AND DATE_FORMAT(p3.Fecha_pago, '%Y-%m') = ?))
                ) AS Pago_Mes_Pasado,
                -- Pago mes actual
                (SELECT SUM(p4.Monto_usd)
                 FROM pagos p4
                 LEFT JOIN control_mensualidades cm4 ON cm4.idPago = p4.idPago
                 WHERE p4.idEstudiante = ?
                 AND (DATE_FORMAT(cm4.Mes_date, '%Y-%m') = ? 
                      OR (cm4.Mes_date IS NULL AND DATE_FORMAT(p4.Fecha_pago, '%Y-%m') = ?))
                ) AS Pago_Mes_Actual,
                -- Pago mes próximo
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
                idEstudiante, // Ultimo_Mes
                idEstudiante, lastMonth, lastMonth, // Mes pasado
                idEstudiante, currentMonth, currentMonth, // Mes actual
                idEstudiante, nextMonth, nextMonth, // Mes próximo
                idEstudiante // WHERE principal
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
        
        // Add month names for frontend display
        result.Nombre_Mes_Pasado = lastMonth;
        result.Nombre_Mes_Actual = currentMonth;
        result.Nombre_Mes_Proximo = nextMonth;
        
        return result;
    }
    static async getLastPaymentTransaction(idEstudiante) {
        const [rows] = await conn.promise().query(
            `SELECT p.idPago, p.Referencia, p.Monto_bs, p.Monto_usd, p.Fecha_pago,
                    mp.Nombre AS Metodo,
                    COALESCE(cm.Mes_date, p.Fecha_pago) AS Mes_Pagado
             FROM pagos p
             LEFT JOIN metodos_pagos mp ON mp.idMetodos_pago = p.idMetodos_pago
             LEFT JOIN control_mensualidades cm ON cm.idPago = p.idPago
             WHERE p.idEstudiante = ?
             ORDER BY p.Fecha_pago DESC LIMIT 1`,
            [idEstudiante]
        );
        return rows && rows.length ? rows[0] : null;
    }

    static async getTotalPendingDebt(idEstudiante) {
        const [rows] = await conn.promise().query(
            `SELECT 
                SUM(d.Monto_usd - (
                    COALESCE((SELECT SUM(p.Monto_usd) FROM pagos p WHERE p.idDeuda = d.idDeuda), 0) + 
                    COALESCE((SELECT SUM(pp.Monto_parcial) FROM pagos_parciales pp WHERE pp.idDeuda = d.idDeuda), 0)
                )) AS Deuda_Pendiente
             FROM deudas d
             WHERE d.idEstudiante = ? AND d.Estado != 'Pagada'`,
            [idEstudiante]
        );
        return rows && rows.length ? (Number(rows[0].Deuda_Pendiente) || 0) : 0;
    }

    /**
     * Check if student has debt for a specific group based on monthly payment deadline
     * Payment deadline: 5th of each month (debt starts on day 6)
     * Only checks current month
     */
    static async getGroupDebtStatus(idEstudiante, idGrupo) {
        const now = new Date();
        const currentMonth = now.getMonth() + 1; // 1-12
        const currentYear = now.getFullYear();
        const currentDay = now.getDate();
        
        // Format current month as 'YYYY-MM' for comparison with Mes_date
        const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
        
        // 1) If the student has any unpaid debts (Estado != 'Pagada'), treat as Deuda.
        // This now includes debts emitted in the current month as requested.
        try {
            const [anyDebts] = await conn.promise().query(
                `SELECT d.idDeuda FROM deudas d
                 WHERE d.idEstudiante = ? AND d.Estado != 'Pagada' LIMIT 1`,
                [idEstudiante]
            );
            if (Array.isArray(anyDebts) && anyDebts.length > 0) {
                return { hasDebt: true, status: 'Deuda' };
            }
        } catch (ePrev) {
            console.warn('Warning checking unpaid debts:', ePrev && ePrev.message ? ePrev.message : ePrev);
            // If error checking debts, be conservative and treat as debt
            return { hasDebt: true, status: 'Deuda' };
        }

        // 2) Check if current month payment (control) exists for this group
        let currentMonthPaymentRows = [];
        try {
            const [rows] = await conn.promise().query(
                `SELECT cm.idControl, cm.idPago FROM control_mensualidades cm
                 WHERE cm.idEstudiante = ? AND cm.idGrupo = ? AND DATE_FORMAT(cm.Mes_date, '%Y-%m') = ? LIMIT 1`,
                [idEstudiante, idGrupo, currentMonthStr]
            );
            currentMonthPaymentRows = Array.isArray(rows) ? rows : [];
        } catch (eCm) {
            console.warn('Warning checking control_mensualidades:', eCm && eCm.message ? eCm.message : eCm);
            // conservative: if we cannot verify, treat as debt
            return { hasDebt: true, status: 'Deuda' };
        }

        // If no control for current month
        if (!currentMonthPaymentRows || currentMonthPaymentRows.length === 0) {
            // within grace period (1-5) -> solvente
            if (currentDay <= 5) return { hasDebt: false, status: 'Solvente' };
            // after day 5 -> deuda
            return { hasDebt: true, status: 'Deuda' };
        }

        // 3) If there is a control entry, ensure it's a full payment (not parcial)
        try {
            const ctrl = currentMonthPaymentRows[0];
            const idPago = ctrl.idPago;
            // If there are pagos_parciales associated to this idPago, treat as partial -> Deuda
            const [parciales] = await conn.promise().query(
                `SELECT COUNT(*) AS cnt FROM pagos_parciales WHERE idPago = ?`, [idPago]
            );
            const cnt = parciales && parciales[0] ? Number(parciales[0].cnt || 0) : 0;
            if (cnt > 0) {
                return { hasDebt: true, status: 'Deuda' };
            }
            // Otherwise consider full payment and solvent
            return { hasDebt: false, status: 'Solvente' };
        } catch (eFinal) {
            console.warn('Warning verifying parcial payments:', eFinal && eFinal.message ? eFinal.message : eFinal);
            return { hasDebt: true, status: 'Deuda' };
        }
    }
    static async checkReferenceExists(referencia) {
        const [rows] = await conn.promise().query(
            `SELECT p.Referencia, e.Nombres, e.Apellidos 
             FROM pagos p
             JOIN estudiantes e ON e.idEstudiante = p.idEstudiante
             WHERE p.Referencia = ? LIMIT 1`,
            [referencia]
        );
        return rows && rows.length ? rows[0] : null;
    }
}

module.exports = { Estudiante };
