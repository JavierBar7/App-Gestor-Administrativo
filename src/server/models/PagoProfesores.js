const connection = require('../../config/database');

class PagoProfesor {
    constructor(idPagos_profesor, Valor_bs, Metodo_pago, Fecha_pago, Referencia_pago, Concepto, Profesores_idProfesores) {
        this.idPagos_profesor = idPagos_profesor;
        this.Valor_bs = Valor_bs;
        this.Metodo_pago = Metodo_pago;
        this.Fecha_pago = Fecha_pago;
        this.Referencia_pago = Referencia_pago;
        this.Concepto = Concepto;
        this.Profesores_idProfesores = Profesores_idProfesores;
    }

    async save() {
        try {
            const query = `
                INSERT INTO Pagos_profesor 
                (Valor_bs, Metodo_pago, Fecha_pago, Referencia_pago, Concepto, Profesores_idProfesores) 
                VALUES (?, ?, ?, ?, ?, ?)`;
            const [result] = await connection.execute(query, [
                this.Valor_bs, this.Metodo_pago, this.Fecha_pago, this.Referencia_pago, this.Concepto, this.Profesores_idProfesores
            ]);
            this.idPagos_profesor = result.insertId;
            return result;
        } catch (error) {
            throw new Error(`Error al guardar el pago del profesor: ${error.message}`);
        }
    }
    
    async update() {
        try {
            const query = `
                UPDATE Pagos_profesor SET Valor_bs = ?, Metodo_pago = ?, Fecha_pago = ?, Referencia_pago = ?, Concepto = ?
                WHERE idPagos_profesor = ? AND Profesores_idProfesores = ?`;
            const [result] = await connection.execute(query, [
                this.Valor_bs, this.Metodo_pago, this.Fecha_pago, this.Referencia_pago, this.Concepto, this.idPagos_profesor, this.Profesores_idProfesores
            ]);
            return result;
        } catch (error) {
            throw new Error(`Error al actualizar el pago del profesor: ${error.message}`);
        }
    }

    static async findAll() {
        try {
            const [rows] = await connection.execute('SELECT * FROM Pagos_profesor');
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener los pagos de profesores: ${error.message}`);
        }
    }
    
    static async findByIds(idPago, idProfesor) {
        try {
            const query = 'SELECT * FROM Pagos_profesor WHERE idPagos_profesor = ? AND Profesores_idProfesores = ?';
            const [rows] = await connection.execute(query, [idPago, idProfesor]);
             if (rows.length > 0) {
                const r = rows[0];
                return new PagoProfesor(r.idPagos_profesor, r.Valor_bs, r.Metodo_pago, r.Fecha_pago, r.Referencia_pago, r.Concepto, r.Profesores_idProfesores);
            }
            return null;
        } catch (error) {
            throw new Error(`Error al buscar el pago del profesor: ${error.message}`);
        }
    }

    static async deleteByIds(idPago, idProfesor) {
        try {
            const query = 'DELETE FROM Pagos_profesor WHERE idPagos_profesor = ? AND Profesores_idProfesores = ?';
            const [result] = await connection.execute(query, [idPago, idProfesor]);
            return result;
        } catch (error) {
            throw new Error(`Error al eliminar el pago del profesor: ${error.message}`);
        }
    }
}

module.exports = PagoProfesor;