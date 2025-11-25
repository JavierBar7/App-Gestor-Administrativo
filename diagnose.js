// Script de diagnóstico para verificar el estado del sistema
const mysql = require('mysql2');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

console.log('=== DIAGNÓSTICO DEL SISTEMA ===\n');

// 1. Verificar variables de entorno
console.log('1. Variables de entorno:');
console.log('   DB_HOST:', process.env.DB_HOST || 'NO DEFINIDO');
console.log('   DB_USER:', process.env.DB_USER || 'NO DEFINIDO');
console.log('   DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'NO DEFINIDO');
console.log('   DB_NAME:', process.env.DB_NAME || process.env.DB_DATABASE || 'NO DEFINIDO');
console.log('');

// 2. Intentar conectar a la base de datos
console.log('2. Probando conexión a MySQL...');
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || process.env.DB_DATABASE
});

connection.connect((err) => {
    if (err) {
        console.log('   ❌ ERROR al conectar a MySQL:');
        console.log('   ', err.message);
        console.log('   Código de error:', err.code);
        console.log('');
    } else {
        console.log('   ✅ Conexión a MySQL exitosa');
        console.log('');

        // 3. Verificar que existe la tabla usuarios
        console.log('3. Verificando tabla usuarios...');
        connection.query('SELECT COUNT(*) as count FROM usuarios', (err, results) => {
            if (err) {
                console.log('   ❌ ERROR al consultar tabla usuarios:');
                console.log('   ', err.message);
            } else {
                console.log('   ✅ Tabla usuarios existe');
                console.log('   Número de usuarios:', results[0].count);
            }
            console.log('');

            // 4. Verificar usuario Admin
            console.log('4. Verificando usuario Admin...');
            connection.query('SELECT Nombre_Usuario, idRol FROM usuarios WHERE Nombre_Usuario = "Admin"', (err, results) => {
                if (err) {
                    console.log('   ❌ ERROR al buscar usuario Admin:');
                    console.log('   ', err.message);
                } else if (results.length === 0) {
                    console.log('   ❌ Usuario Admin NO existe en la base de datos');
                } else {
                    console.log('   ✅ Usuario Admin encontrado');
                    console.log('   Rol ID:', results[0].idRol);
                }
                console.log('');

                connection.end();

                // 5. Verificar si el servidor está corriendo
                console.log('5. Verificando servidor Express en puerto 3000...');
                axios.get('http://localhost:3000/_health')
                    .then(response => {
                        console.log('   ✅ Servidor Express está corriendo');
                        console.log('   Respuesta:', response.data);
                    })
                    .catch(error => {
                        console.log('   ❌ Servidor Express NO está respondiendo');
                        if (error.code === 'ECONNREFUSED') {
                            console.log('   El servidor no está escuchando en el puerto 3000');
                        } else {
                            console.log('   Error:', error.message);
                        }
                    })
                    .finally(() => {
                        console.log('');
                        console.log('=== FIN DEL DIAGNÓSTICO ===');
                    });
            });
        });
    }
});
