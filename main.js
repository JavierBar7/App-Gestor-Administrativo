const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fetch = require('axios'); 

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // preload separado
            contextIsolation: true, // importante
            nodeIntegration: false  // importante
        }
    });

    win.loadFile(path.join(__dirname, 'src/views/login.html'));
}

app.whenReady().then(createWindow);

ipcMain.handle('login-attempt', async (event, username, password) => {
    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        return await response.json();
    } catch (error) {
        return { success: false, message: 'Error al conectar con el servidor' };
    }
});
