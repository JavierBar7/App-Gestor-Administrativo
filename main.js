// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');

let serverProcess; // referencia para poder cerrar el servidor luego

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    win.loadFile(path.join(__dirname, 'src/views/login.html'));
}

// Esperar que Electron esté listo
app.whenReady().then(() => {
    // 🚀 1️⃣ Iniciar el servidor Express automáticamente
    serverProcess = spawn('node', ['src/server/server.js'], {
        cwd: __dirname,
        stdio: 'inherit',
        shell: true
    });

    serverProcess.on('error', (err) => {
        console.error('❌ Error al iniciar el servidor:', err);
    });

    serverProcess.on('exit', (code) => {
        console.log(`🛑 Servidor Express finalizó con código ${code}`);
    });

    // 🚀 2️⃣ Crear la ventana principal
    createWindow();
});

// 3️⃣ Cerrar el servidor cuando se cierre la app
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        if (serverProcess) {
            console.log('🛑 Cerrando servidor Express...');
            serverProcess.kill();
        }
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// 🔐 Manejador de login desde el frontend
ipcMain.handle('login-attempt', async (event, username, password) => {
    try {
        const response = await axios.post('http://localhost:3000/api/auth/login', { username, password });
        return response.data;
    } catch (error) {
        // Si el servidor respondió con un error 5xx/4xx, devolver el cuerpo de la respuesta
        if (error.response) {
            console.error('Error en login-attempt:', error.response.status, error.response.data);
            return error.response.data;
        }
        console.error('Error en login-attempt:', error.message);
        return { success: false, message: 'Error al conectar con el servidor' };
    }
});

// 🔄 Redirección a dashboard
ipcMain.on('navigate-dashboard', (event, role) => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
        win.loadFile(path.join(__dirname, 'src/views/gestion.html'));
    }
});

ipcMain.on('logout', (event) => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
        win.loadFile(path.join(__dirname, 'src/views/login.html')); // 👈 vuelve al login
    }
});

// Navegar a vista de estudiantes
ipcMain.on('navigate-estudiantes', (event) => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
        win.loadFile(path.join(__dirname, 'src/views/estudiantes.html'));
    }
});

// Navegar a vista de cursos
ipcMain.on('navigate-cursos', (event) => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
        win.loadFile(path.join(__dirname, 'src/views/cursos.html'));
    }
});

// --- 👇 NUEVO BLOQUE PARA DEUDORES 👇 ---
// Navegar a vista de deudores
ipcMain.on('navigate-deudores', (event) => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
        // Asegúrate de que este archivo exista en src/views/deudores.html
        win.loadFile(path.join(__dirname, 'src/views/deudores.html'));
    }
});