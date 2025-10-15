const connection = require('../config/db');

class Pagos_parciales {
    constructor(idPagos_Parciales, idPAgos, idDeudas,Monto_parcial, Pagos_Cuentas_Destino_idCuentas_Destino, Pagos_Metodos_pagos_idMetodos_pagos, Pagos_Tasa_cambio_idTasa, Pagos_Deudas_idDeudas, Pagos_Deudas_Estudiantes_idEstudiantes, Deudas_Estudiantes_idEstudiantes ) {
        this.idPagos_Parciales = idPagos_Parciales;
        this.idPAgos = idPAgos;
        this.idDeudas = idDeudas;
        this.Monto_parcial = Monto_parcial;
        this.Pagos_Cuentas_Destino_idCuentas_Destino = Pagos_Cuentas_Destino_idCuentas_Destino;
        this.Pagos_Metodos_pagos_idMetodos_pagos = Pagos_Metodos_pagos_idMetodos_pagos;
        this.Pagos_Tasa_cambio_idTasa = Pagos_Tasa_cambio_idTasa;
        this.Pagos_Deudas_idDeudas = Pagos_Deudas_idDeudas;
        this.Pagos_Deudas_Estudiantes_idEstudiantes = Pagos_Deudas_Estudiantes_idEstudiantes;
        this.Deudas_Estudiantes_idEstudiantes = Deudas_Estudiantes_idEstudiantes;
    }
    
    async save() {
        try {
            // idPagos_Parciales no es AUTO_INCREMENT, debe ser provisto.
            const query = 'INSERT INTO Pagos_parciales (idPagos_Parciales, idPAgos, idDeudas, Monto_parcial, Pagos_Cuentas_Destino_idCuentas_Destino, Pagos_Metodos_pagos_idMetodos_pagos, Pagos_Tasa_cambio_idTasa, Pagos_Deudas_idDeudas, Pagos_Deudas_Estudiantes_idEstudiantes, Deudas_Estudiantes_idEstudiantes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
            const [result] = await connection.execute(query, [
                this.idPagos_Parciales,
                this.idPAgos,
                this.idDeudas,
                this.Monto_parcial,
                this.Pagos_Cuentas_Destino_idCuentas_Destino,
                this.Pagos_Metodos_pagos_idMetodos_pagos,
                this.Pagos_Tasa_cambio_idTasa,
                this.Pagos_Deudas_idDeudas,
                this.Pagos_Deudas_Estudiantes_idEstudiantes,
                this.Deudas_Estudiantes_idEstudiantes
            ]);
            return result;
        } catch (error) {
            throw new Error(`Error al guardar el pago parcial: ${error.message}`);
        }
    }

    async update() {
        try {
            const query = 'UPDATE Pagos_parciales SET idPAgos = ?, idDeudas = ?, Monto_parcial = ?, Pagos_Cuentas_Destino_idCuentas_Destino = ?, Pagos_Metodos_pagos_idMetodos_pagos = ?, Pagos_Tasa_cambio_idTasa = ?, Pagos_Deudas_idDeudas = ?, Pagos_Deudas_Estudiantes_idEstudiantes = ?, Deudas_Estudiantes_idEstudiantes = ? WHERE idPagos_Parciales = ?';
            const [result] = await connection.execute(query, [
                this.idPAgos,
                this.idDeudas,
                this.Monto_parcial,
                this.Pagos_Cuentas_Destino_idCuentas_Destino,
                this.Pagos_Metodos_pagos_idMetodos_pagos,
                this.Pagos_Tasa_cambio_idTasa,
                this.Pagos_Deudas_idDeudas,
                this.Pagos_Deudas_Estudiantes_idEstudiantes,
                this.Deudas_Estudiantes_idEstudiantes,
                this.idPagos_Parciales
            ]);
            return result;
        } catch (error) {
            throw new Error(`Error al actualizar el pago parcial: ${error.message}`);
        }
    }

    static async findAll() {
        try {
            const [rows] = await connection.execute('SELECT * FROM Pagos_parciales');
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener los pagos parciales: ${error.message}`);
        }
    }

    static async findById(id) {
        try {
            const [rows] = await connection.execute('SELECT * FROM Pagos_parciales WHERE idPagos_Parciales = ?', [id]);
            if (rows.length > 0) {
                const p = rows[0];
                return new Pagos_parciales(p.idPagos_Parciales, p.idPAgos, p.idDeudas, p.Monto_parcial, p.Pagos_Cuentas_Destino_idCuentas_Destino, p.Pagos_Metodos_pagos_idMetodos_pagos, p.Pagos_Tasa_cambio_idTasa, p.Pagos_Deudas_idDeudas, p.Pagos_Deudas_Estudiantes_idEstudiantes, p.Deudas_Estudiantes_idEstudiantes);
            }
            return null;
        } catch (error) {
            throw new Error(`Error al obtener el pago parcial: ${error.message}`);
        }
    }

    static async deleteById(id) {
        try {
            const [result] = await connection.execute('DELETE FROM Pagos_parciales WHERE idPagos_Parciales = ?', [id]);
            return result;
        } catch (error) {
            throw new Error(`Error al eliminar el pago parcial: ${error.message}`);
        }
    }
}

module.exports = Pagos_parciales;