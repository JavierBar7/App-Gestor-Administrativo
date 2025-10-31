const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // preload separado
            contextIsolation: true, 
            nodeIntegration: false  
        }
    });

    win.loadFile(path.join(__dirname, 'src/views/login.html'));
}

app.whenReady().then(createWindow);

ipcMain.handle('login-attempt', async (event, username, password) => {
    console.log('Login attempt:', username, password);
    try {
        const response = await axios.post('http://localhost:3000/api/auth/login', { username, password });
        console.log('Login result:', response.data);
        return response.data;
    } catch (error) {
        console.log('Error en login-attempt:', error);
        return { success: false, message: 'Error al conectar con el servidor' };
    }
});

ipcMain.on('navigate-dashboard', (event, role) => {
    console.log('Navigate to dashboard with role:', role);
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
        win.loadFile(path.join(__dirname, 'src/views/dashboard.html'));
        console.log('Dashboard loaded');
    } else {
        console.log('No focused window found');
    }
});
