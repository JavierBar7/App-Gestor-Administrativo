// server.js
const express = require('express');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'app/views')); // Carpeta donde están tus .ejs

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // CSS, JS, imágenes

app.get('/', (req, res) => {
    res.render('login'); // renderiza login.ejs
});

app.listen(3000, () => console.log('Servidor corriendo en http://localhost:3000'));
