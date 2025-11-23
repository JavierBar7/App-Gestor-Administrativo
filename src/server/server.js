// server.js
const express = require('express');
const path = require('path');
const app = express();
require('dotenv').config();


app.set('views', path.join(__dirname, 'app/views')); 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(express.static(path.join(__dirname, 'public')));

// Request logging (simple)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// Reportes (PDF/Excel) - MOVED TO TOP
const reportesRoutes = require('../routes/reportesRoutes');
console.log('Mounting reportesRoutes at /api/reportes');
app.use('/api/reportes', reportesRoutes);
app.all('/api/test', (req, res) => res.send('API Test OK'));

// Montar rutas de autenticación
const loginRoutes = require('../routes/loginRoutes');
const userRoutes = require('../routes/usuarioRoutes')
const estudianteRoutes = require('../routes/estudianteRoutes');
app.use('/api/auth', loginRoutes);
app.use('/api/users', userRoutes);
app.use('/api/estudiantes', estudianteRoutes);
// rutas para pagos/metodos
const pagosRoutes = require('../routes/pagosRoutes');
app.use('/api/metodos_pagos', pagosRoutes);
// API for creating payments
const pagosApiRoutes = require('../routes/pagosApiRoutes');
app.use('/api/pagos', pagosApiRoutes);
// Rutas para cursos y grupos
const cursoRoutes = require('../routes/cursoRoutes');
const grupoRoutes = require('../routes/grupoRoutes');
app.use('/api/cursos', cursoRoutes);
app.use('/api/grupos', grupoRoutes);
// Tasa de cambio (USD -> BS)
const tasaRoutes = require('../routes/tasaRoutes');
app.use('/api/tasa', tasaRoutes);





// Error handler - centraliza logging de errores y devuelve JSON
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err && err.stack ? err.stack : err);
    if (res.headersSent) return next(err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

app.get('/', (req, res) => {
    res.render('login'); 
});

// Simple healthcheck
app.get('/_health', (req, res) => res.json({ ok: true }));

// Debug: list mounted routes (useful for troubleshooting)
app.get('/_routes', (req, res) => {
    try {
        const routes = [];
        app._router.stack.forEach(mw => {
            if (mw.route && mw.route.path) {
                const methods = Object.keys(mw.route.methods).join(',').toUpperCase();
                routes.push({ path: mw.route.path, methods });
            }
        });
        res.json({ routes });
    } catch (err) {
        res.status(500).json({ error: String(err) });
    }
});

app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000', 'PID:', process.pid);
});

process.on('uncaughtException', (err) => {
    console.error('UncaughtException:', err && err.stack ? err.stack : err);
});

process.on('unhandledRejection', (reason) => {
    console.error('UnhandledRejection:', reason);
});
