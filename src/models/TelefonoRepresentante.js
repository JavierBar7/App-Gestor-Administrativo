const connection = require('../../config/database');

class TelefonoRepresentante {
    constructor(idTelefonos_Representantes, Telefono, Representantes_idRepresentantes) {
        this.idTelefonos_Representantes = idTelefonos_Representantes;
        this.Telefono = Telefono;
        this.Representantes_idRepresentantes = Representantes_idRepresentantes;
    }

    async save() {
        try {
            // Nota: idTelefonos_Representantes no es AUTO_INCREMENT y debe ser provisto.
            const query = 'INSERT INTO Telefonos_Representantes (idTelefonos_Representantes, Telefono, Representantes_idRepresentantes) VALUES (?, ?, ?)';
            const [result] = await connection.execute(query, [
                this.idTelefonos_Representantes,
                this.Telefono,
                this.Representantes_idRepresentantes
            ]);
            return result;
        } catch (error) {
            throw new Error(`Error al guardar el teléfono: ${error.message}`);
        }
    }

    async update() {
        try {
            const query = 'UPDATE Telefonos_Representantes SET Telefono = ? WHERE idTelefonos_Representantes = ? AND Representantes_idRepresentantes = ?';
            const [result] = await connection.execute(query, [
                this.Telefono,
                this.idTelefonos_Representantes,
                this.Representantes_idRepresentantes
            ]);
            return result;
        } catch (error) {
            throw new Error(`Error al actualizar el teléfono: ${error.message}`);
        }
    }

    static async findAll() {
        try {
            const [rows] = await connection.execute('SELECT * FROM Telefonos_Representantes');
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener los teléfonos: ${error.message}`);
        }
    }

    static async findByRepresentanteId(idRepresentante) {
        try {
            const query = 'SELECT * FROM Telefonos_Representantes WHERE Representantes_idRepresentantes = ?';
            const [rows] = await connection.execute(query, [idRepresentante]);
            return rows;
        } catch (error) {
            throw new Error(`Error al buscar teléfonos por representante: ${error.message}`);
        }
    }

    static async deleteByIds(idTelefono, idRepresentante) {
        try {
            const query = 'DELETE FROM Telefonos_Representantes WHERE idTelefonos_Representantes = ? AND Representantes_idRepresentantes = ?';
            const [result] = await connection.execute(query, [idTelefono, idRepresentante]);
            return result;
        } catch (error) {
            throw new Error(`Error al eliminar el teléfono: ${error.message}`);
        }
    }
}

module.exports = TelefonoRepresentante;