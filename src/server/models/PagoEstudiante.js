const connection = require('../../config/database');

class PagoEstudiante {
    constructor(idPagos_Estudiantes, Precios, Fecha_pago, Metodo_pago, Serial_divisa, Referencia_pago, Concepto, Inscripciones_idInscripciones, Inscripciones_Estudiantes_idEstudiantes, Inscripciones_Grupos_idGrupos, Inscripciones_Grupos_Profesores_idProfesores) {
        this.idPagos_Estudiantes = idPagos_Estudiantes;
        this.Precios = Precios;
        this.Fecha_pago = Fecha_pago;
        this.Metodo_pago = Metodo_pago;
        this.Serial_divisa = Serial_divisa;
        this.Referencia_pago = Referencia_pago;
        this.Concepto = Concepto;
        this.Inscripciones_idInscripciones = Inscripciones_idInscripciones;
        this.Inscripciones_Estudiantes_idEstudiantes = Inscripciones_Estudiantes_idEstudiantes;
        this.Inscripciones_Grupos_idGrupos = Inscripciones_Grupos_idGrupos;
        this.Inscripciones_Grupos_Profesores_idProfesores = Inscripciones_Grupos_Profesores_idProfesores;
    }

    async save() {
        try {
            const query = `
                INSERT INTO Pagos_Estudiantes 
                (Precios, Fecha_pago, Metodo_pago, Serial_divisa, Referencia_pago, Concepto, Inscripciones_idInscripciones, Inscripciones_Estudiantes_idEstudiantes, Inscripciones_Grupos_idGrupos, Inscripciones_Grupos_Profesores_idProfesores) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const [result] = await connection.execute(query, [
                this.Precios, this.Fecha_pago, this.Metodo_pago, this.Serial_divisa, this.Referencia_pago, this.Concepto, this.Inscripciones_idInscripciones, this.Inscripciones_Estudiantes_idEstudiantes, this.Inscripciones_Grupos_idGrupos, this.Inscripciones_Grupos_Profesores_idProfesores
            ]);
            this.idPagos_Estudiantes = result.insertId;
            return result;
        } catch (error) {
            throw new Error(`Error al guardar el pago del estudiante: ${error.message}`);
        }
    }

    // El método update es complejo, se omite por brevedad pero seguiría el mismo patrón del WHERE compuesto.

    static async findAll() {
        try {
            const [rows] = await connection.execute('SELECT * FROM Pagos_Estudiantes');
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener los pagos de estudiantes: ${error.message}`);
        }
    }

    // Los métodos findByIds y deleteByIds requerirían los 5 componentes de la clave primaria.
}

module.exports = PagoEstudiante;