// server.js
const express = require('express');
const path = require('path');
const app = express();
require('dotenv').config();


app.set('views', path.join(__dirname, 'app/views')); 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Montar rutas de autenticación
const loginRoutes = require('../routes/loginRoutes');
const userRoutes = require('../routes/usuarioRoutes')
const estudianteRoutes = require('../routes/estudianteRoutes');
app.use('/api/auth', loginRoutes);
app.use('/api/users', userRoutes);
app.use('/api/estudiantes', estudianteRoutes);
// Rutas para cursos y grupos
const cursoRoutes = require('../routes/cursoRoutes');
const grupoRoutes = require('../routes/grupoRoutes');
app.use('/api/cursos', cursoRoutes);
app.use('/api/grupos', grupoRoutes);

app.get('/', (req, res) => {
    res.render('login'); 
});

app.listen(3000, () => console.log('Servidor corriendo en http://localhost:3000'));
