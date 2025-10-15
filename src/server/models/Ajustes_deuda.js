const connection = require('../config/db');

class AjustesDeuda {   
    constructor(idAjustes, idDeudas, Tipo_ajuste, Monto_usd, Fecha_ajuste, Descripcion, Deudas_idDeudas) {
        this.idAjustes = idAjustes;
        this.idDeudas = idDeudas;
        this.Tipo_ajuste = Tipo_ajuste;
        this.Monto_usd = Monto_usd;
        this.Fecha_ajuste = Fecha_ajuste;
        this.Descripcion = Descripcion;
        this.Deudas_idDeudas = Deudas_idDeudas;
    }
    async save() {
        try {
            const query = 'INSERT INTO Ajustes_deuda (idAjustes, idDeudas, Tipo_ajuste, Monto_usd, Fecha_ajuste, Descripcion, Deudas_idDeudas) VALUES (?, ?, ?, ?, ?, ?, ?)'; 
            const [result] = await connection.execute(query, [
                this.idAjustes,
                this.idDeudas,
                this.Tipo_ajuste,
                this.Monto_usd,
                this.Fecha_ajuste,
                this.Descripcion,
                this.Deudas_idDeudas
            ]);
            return result;
        } catch (error) {
            throw new Error(`Error al guardar el ajuste de deuda: ${error.message}`);
        }
    }
    async update() {
        try {
            const query = 'UPDATE Ajustes_deuda SET idDeudas = ?, Tipo_ajuste = ?, Monto_usd = ?, Fecha_ajuste = ?, Descripcion = ?, Deudas_idDeudas = ? WHERE idAjustes = ?';      
            const [result] = await connection.execute(query, [
                this.idDeudas,
                this.Tipo_ajuste,
                this.Monto_usd,
                this.Fecha_ajuste,
                this.Descripcion,
                this.Deudas_idDeudas,
                this.idAjustes
            ]);
            return result;
        }   catch (error) { 
            throw new Error(`Error al actualizar el ajuste de deuda: ${error.message}`);
        }  
    }
    static async findAll() {
        try {
            const [rows] = await connection.execute('SELECT * FROM Ajustes_deuda');
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener los ajustes de deuda: ${error.message}`);
        }
    }
    static async findById(id) {
        try {
            const [rows] = await connection.execute('SELECT * FROM Ajustes_deuda WHERE idAjustes = ?', [id]);
            if (rows.length > 0) {
                const r = rows[0];
                return new AjustesDeuda(r.idAjustes, r.idDeudas, r.Tipo_ajuste, r.Monto_usd, r.Fecha_ajuste, r.Descripcion, r.Deudas_idDeudas);
            }
            return null;
        } catch (error) {
            throw new Error(`Error al obtener el ajuste de deuda: ${error.message}`);
        }
    }
    static async deleteById(id) {
        try {
            const [result] = await connection.execute('DELETE FROM Ajustes_deuda WHERE idAjustes = ?', [id]);
            return result;
        } catch (error) {
            throw new Error(`Error al eliminar el ajuste de deuda: ${error.message}`);
        }
    } 
}

module.exports = AjustesDeuda;