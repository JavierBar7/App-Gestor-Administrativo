const conn = require('../config/database');

async function seedDatabase() {
    try {
        console.log('🔄 Sincronizando base de datos con la información compartida...');

        // 1. Desactivar protección de llaves foráneas para poder limpiar y reescribir
        await conn.promise().query('SET FOREIGN_KEY_CHECKS = 0');

        // 2. Limpiar tablas para asegurar que ambos tengan EXACTAMENTE la misma data
        // (Esto NO borra la base de datos, solo vacía estas tablas específicas)
        const tablas = [
            'inscripciones',
            'representante_estudiante',
            'telefonos_representante',
            'estudiantes',
            'grupos',
            'cursos',
            'representantes',
            'pagos',            // Limpiamos pagos para evitar huérfanos
            'deudas',           // Limpiamos deudas para evitar huérfanos
            'control_mensualidades'
        ];

        for (const tabla of tablas) {
            await conn.promise().query(`TRUNCATE TABLE ${tabla}`);
        }
        console.log('🧹 Tablas limpiadas para sincronización.');

        // 3. Insertar CURSOS
        console.log('📥 Insertando Cursos...');
        await conn.promise().query(`
            INSERT INTO cursos (idCurso, Nombre_Curso, Descripcion_Curso) VALUES 
            (1, 'Dibujo Artístico', 'Curso de técnicas de dibujo y pintura'),
            (2, 'Inglés', 'Curso de idioma inglés niveles básicos'),
            (3, 'Francés', 'Curso de idioma francés intensivo'),
            (4, 'Oratoria', 'Curso de expresión oral y liderazgo');
        `);

        // 4. Insertar GRUPOS
        console.log('📥 Insertando Grupos...');
        await conn.promise().query(`
            INSERT INTO grupos (idGrupo, idCurso, Nombre_Grupo, Fecha_inicio, Estado) VALUES 
            (1, 1, 'Dibujo - Mañana', '2025-11-19', 'Activo'),
            (2, 2, 'Ingles - Tarde1', '2025-09-05', 'Activo'),
            (3, 3, 'Frances - Sábado', '2025-09-06', 'Activo'),
            (4, 4, 'Oratoria - Tarde', '2025-09-20', 'Activo'),
            (5, 2, 'Ingles - Tarde2', '2025-11-10', 'Activo'),
            (6, 3, 'Frances - Mañana1', '2025-08-06', 'Activo'),
            (7, 4, 'Oratoria - Tarde2', '2025-10-16', 'Activo');
        `);

        // 5. Insertar REPRESENTANTES
        console.log('📥 Insertando Representantes...');
        await conn.promise().query(`
            INSERT INTO representantes (idRepresentante, Nombres, Apellidos, Cedula, Parentesco, Correo, Direccion) VALUES 
            (1, 'María', 'Pérez', 'V-12345678', 'Madre', 'maria@mail.com', 'Av. Bolívar, Los Teques'),
            (2, 'Carlos', 'Ruiz', 'V-87654321', 'Padre', 'carlos@mail.com', 'La Matica'),
            (3, 'Ana', 'Gómez', 'V-11223344', 'Tía', 'ana@mail.com', 'El Tambor');
        `);

        // 6. Insertar TELÉFONOS
        console.log('📥 Insertando Teléfonos...');
        await conn.promise().query(`
            INSERT INTO telefonos_representante (idTelefonos_Representante, idRepresentante, Numero, Tipo) VALUES 
            (1, 1, '0414-1112233', 'Móvil'),
            (2, 2, '0412-4445566', 'Móvil'),
            (3, 3, '0212-3210000', 'Casa');
        `);

        // 7. Insertar ESTUDIANTES
        console.log('📥 Insertando Estudiantes...');
        await conn.promise().query(`
            INSERT INTO estudiantes (idEstudiante, Nombres, Apellidos, Cedula, Fecha_Nacimiento, Telefono, Correo, Direccion) VALUES 
            (1, 'Luisito', 'Pérez', 'V-32000111', '2012-05-15', '0426-222222', 'luisito@mail.com', 'Av. Bolívar'),
            (2, 'Sofía', 'Ruiz', 'V-33000222', '2014-08-20', '0424-1111111', 'sofia@mail.com', 'La Matica'),
            (3, 'Pedrito', 'Gómez', 'V-31000333', '2010-01-10', '0416-0000000', 'pedro@mail.com', 'El Tambor'),
            (4, 'Javier', 'Barrios', 'V-26498141', '1998-10-12', '0412-9998877', 'javierbarrios89@gmail.com', 'Los teques'),
            (5, 'Gabriela', 'Amaro', 'V-25702452', '1996-03-25', '0414-5556677', 'gabrielaamarog21@gmail.com', 'Los teques'),
            (6, 'Roberto', 'Mendoza', 'V-20555666', '1990-07-30', '0424-1112223', 'robert@mail.com', 'Los Lagos');
        `);

        // 8. Relacionar REPRESENTANTE - ESTUDIANTE
        console.log('📥 Vinculando Representantes...');
        await conn.promise().query(`
            INSERT INTO representante_estudiante (idRepresentante, idEstudiante) VALUES 
            (1, 1),
            (2, 2),
            (3, 3);
        `);

        // 9. Insertar INSCRIPCIONES
        console.log('📥 Inscribiendo estudiantes en cursos...');
        await conn.promise().query(`
            INSERT INTO inscripciones (idEstudiante, idCurso, idGrupo, Fecha_inscripcion) VALUES 
            (1, 1, 1, '2025-09-01'),
            (1, 2, 2, '2025-09-01'),
            (4, 3, 3, '2025-09-02'),
            (4, 4, 4, '2025-09-02'),
            (2, 1, 1, '2025-09-03'),
            (3, 2, 2, '2025-09-04'),
            (5, 3, 3, '2025-09-05'),
            (6, 4, 4, '2025-09-06');
        `);

        // 10. Reactivar seguridad
        await conn.promise().query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('✅ ¡Datos sincronizados correctamente! Ambos equipos tienen la misma información.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error al ejecutar la semilla:', error);
        process.exit(1);
    }
}

seedDatabase();