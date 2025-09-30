const connection = require('../../config/database');

class Representante {
    constructor(idRepresentantes, Nombres, Apellidos, Cedula, Parentesco) {
        this.idRepresentantes = idRepresentantes;
        this.Nombres = Nombres;
        this.Apellidos = Apellidos;
        this.Cedula = Cedula;
        this.Parentesco = Parentesco;
    }

    async save() {
        try {
            // idRepresentantes no es AUTO_INCREMENT, debe ser provisto.
            const query = 'INSERT INTO Representantes (idRepresentantes, Nombres, Apellidos, Cedula, Parentesco) VALUES (?, ?, ?, ?, ?)';
            const [result] = await connection.execute(query, [
                this.idRepresentantes,
                this.Nombres,
                this.Apellidos,
                this.Cedula,
                this.Parentesco
            ]);
            return result;
        } catch (error) {
            throw new Error(`Error al guardar el representante: ${error.message}`);
        }
    }

    async update() {
        try {
            const query = 'UPDATE Representantes SET Nombres = ?, Apellidos = ?, Cedula = ?, Parentesco = ? WHERE idRepresentantes = ?';
            const [result] = await connection.execute(query, [
                this.Nombres,
                this.Apellidos,
                this.Cedula,
                this.Parentesco,
                this.idRepresentantes
            ]);
            return result;
        } catch (error) {
            throw new Error(`Error al actualizar el representante: ${error.message}`);
        }
    }

    static async findAll() {
        try {
            const [rows] = await connection.execute('SELECT * FROM Representantes');
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener los representantes: ${error.message}`);
        }
    }

    static async findById(id) {
        try {
            const [rows] = await connection.execute('SELECT * FROM Representantes WHERE idRepresentantes = ?', [id]);
            if (rows.length > 0) {
                const r = rows[0];
                return new Representante(r.idRepresentantes, r.Nombres, r.Apellidos, r.Cedula, r.Parentesco);
            }
            return null;
        } catch (error) {
            throw new Error(`Error al buscar el representante: ${error.message}`);
        }
    }

    static async deleteById(id) {
        try {
            const [result] = await connection.execute('DELETE FROM Representantes WHERE idRepresentantes = ?', [id]);
            return result;
        } catch (error) {
            throw new Error(`Error al eliminar el representante: ${error.message}`);
        }
    }
}

module.exports = Representante;