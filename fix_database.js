const conn = require('./config/database');

async function fixDatabase() {
    try {
        console.log("Creating 'solicitudes_pago' table...");
        
        const query = `
            CREATE TABLE IF NOT EXISTS \`solicitudes_pago\` (
              \`idSolicitud\` int NOT NULL AUTO_INCREMENT,
              \`idEstudiante\` int NOT NULL,
              \`Tipo_Solicitud\` varchar(50) NOT NULL,
              \`Fecha_Solicitud\` datetime NOT NULL,
              \`Notas\` text,
              \`Fecha_Registro\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (\`idSolicitud\`),
              KEY \`idEstudiante\` (\`idEstudiante\`),
              CONSTRAINT \`solicitudes_pago_ibfk_1\` FOREIGN KEY (\`idEstudiante\`) REFERENCES \`estudiantes\` (\`idEstudiante\`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `;

        await conn.promise().query(query);
        console.log("Table 'solicitudes_pago' created successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error creating table:", error);
        process.exit(1);
    }
}

fixDatabase();
