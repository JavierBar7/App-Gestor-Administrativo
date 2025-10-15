const connecection = require('../database/connection');

class Especialidad {
    constructor(idEspecialidades, Nombre, Profesores_idProfesores) {
        this.idEspecialidades = idEspecialidades;
        this.Nombre = Nombre;
        this.Profesores_idProfesores = Profesores_idProfesores;
    }

    async save() {
        try {
            // idEspecialidades no es AUTO_INCREMENT, debe ser provisto.   
            const query = 'INSERT INTO Especialidades (idEspecialidades, Nombre, Profesores_idProfesores) VALUES (?, ?, ?)';
            const [result] = await connecection.execute(query, [
                this.idEspecialidades,
                this.Nombre,
                this.Profesores_idProfesores
            ]);
            return result;
        } catch (error) {
            throw new Error(`Error al guardar la especialidad: ${error.message}`);
        }
    }

    async update() {
        try {
            const query = 'UPDATE Especialidades SET Nombre = ?, Profesores_idProfesores = ? WHERE idEspecialidades = ?';   
            const [result] = await connecection.execute(query, [
                this.Nombre,
                this.Profesores_idProfesores,
                this.idEspecialidades
            ]);
            return result;
        } catch (error) {
            throw new Error(`Error al actualizar la especialidad: ${error.message}`);
        }
    }

    static async findAll() {
        try {
            const [rows] = await connecection.execute('SELECT * FROM Especialidades');
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener las especialidades: ${error.message}`);
        }
    }

    static async findById(id) {
        try {
            const [rows] = await connecection.execute('SELECT * FROM Especialidades WHERE idEspecialidades = ?', [id]);
            if (rows.length > 0) {
                const e = rows[0];
                return new Especialidad(e.idEspecialidades, e.Nombre, e.Profesores_idProfesores);
            }
            return null;
        } catch (error) {
            throw new Error(`Error al obtener la especialidad: ${error.message}`);
        }
    }

    static async deleteById(id) {
        try {
            const query = 'DELETE FROM Especialidades WHERE idEspecialidades = ?';
            const [result] = await connecection.execute(query, [id]);
            return result;
        } catch (error) {
            throw new Error(`Error al eliminar la especialidad: ${error.message}`);
        }
    }
}

module.exports = Especialidad;