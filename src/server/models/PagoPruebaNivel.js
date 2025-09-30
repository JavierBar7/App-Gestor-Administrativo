const connection = require('../../config/database');

class PagoPruebaNivel {
    constructor(idPagos_Prueba_nivel, Precios, Fecha_pago, Metodo_pago, Serial_divisa, Referencia_pago, Concepto, Estudiantes_idEstudiantes) {
        this.idPagos_Prueba_nivel = idPagos_Prueba_nivel;
        this.Precios = Precios;
        this.Fecha_pago = Fecha_pago;
        this.Metodo_pago = Metodo_pago;
        this.Serial_divisa = Serial_divisa;
        this.Referencia_pago = Referencia_pago;
        this.Concepto = Concepto;
        this.Estudiantes_idEstudiantes = Estudiantes_idEstudiantes;
    }

    async save() {
        try {
            const query = `
                INSERT INTO Pagos_Prueba_nivel 
                (Precios, Fecha_pago, Metodo_pago, Serial_divisa, Referencia_pago, Concepto, Estudiantes_idEstudiantes) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`;
            const [result] = await connection.execute(query, [
                this.Precios, this.Fecha_pago, this.Metodo_pago, this.Serial_divisa, this.Referencia_pago, this.Concepto, this.Estudiantes_idEstudiantes
            ]);
            this.idPagos_Prueba_nivel = result.insertId;
            return result;
        } catch (error) {
            throw new Error(`Error al guardar el pago de prueba: ${error.message}`);
        }
    }

    async update() {
        try {
            const query = `
                UPDATE Pagos_Prueba_nivel 
                SET Precios = ?, Fecha_pago = ?, Metodo_pago = ?, Serial_divisa = ?, Referencia_pago = ?, Concepto = ? 
                WHERE idPagos_Prueba_nivel = ? AND Estudiantes_idEstudiantes = ?`;
            const [result] = await connection.execute(query, [
                this.Precios, this.Fecha_pago, this.Metodo_pago, this.Serial_divisa, this.Referencia_pago, this.Concepto, this.idPagos_Prueba_nivel, this.Estudiantes_idEstudiantes
            ]);
            return result;
        } catch (error) {
            throw new Error(`Error al actualizar el pago de prueba: ${error.message}`);
        }
    }

    static async findAll() {
        try {
            const [rows] = await connection.execute('SELECT * FROM Pagos_Prueba_nivel');
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener los pagos de prueba: ${error.message}`);
        }
    }
    
    static async findByEstudianteId(idEstudiante) {
        try {
            const query = 'SELECT * FROM Pagos_Prueba_nivel WHERE Estudiantes_idEstudiantes = ?';
            const [rows] = await connection.execute(query, [idEstudiante]);
            return rows;
        } catch (error) {
            throw new Error(`Error al buscar pagos por estudiante: ${error.message}`);
        }
    }

    static async deleteByIds(idPago, idEstudiante) {
        try {
            const query = 'DELETE FROM Pagos_Prueba_nivel WHERE idPagos_Prueba_nivel = ? AND Estudiantes_idEstudiantes = ?';
            const [result] = await connection.execute(query, [idPago, idEstudiante]);
            return result;
        } catch (error) {
            throw new Error(`Error al eliminar el pago de prueba: ${error.message}`);
        }
    }
}

module.exports = PagoPruebaNivel;