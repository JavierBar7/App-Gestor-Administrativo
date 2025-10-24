/*const { app, BrowserWindow } = require('electron/main')
const path = require('node:path')
const isDev = require('electron-is-dev')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (isDev) {
    // In development, load Vite dev server (default port 5173)
    win.loadURL('http://localhost:5173')
  } else {
    // In production, load the built index.html
    win.loadFile(path.join(__dirname, '..', '..', 'dist', 'index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})*/


/// Proceso Principal de Electron (Conexión Visual)
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;


const VIEWS_DIR = path.join(__dirname, 'views'); 

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 600,
        minWidth: 900,
        minHeight: 500,
        webPreferences: {
          preload: path.join(__dirname, 'preload.js'), 
          nodeIntegration: false, 
          contextIsolation: true 
}
});

// CARGA LA PÁGINA DE LOGIN (index.html)
// Usa la ruta absoluta: .../src/main/views/index.html
    mainWindow.loadFile(path.join(VIEWS_DIR, 'index.html')); 

// Opcional: Abre las herramientas de desarrollador al iniciar
// mainWindow.webContents.openDevTools();
}

// Inicialización y ciclo de vida de la aplicación
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          createWindow();
}
  });
});

app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
    }
});


// -----------------------------------------------------------------------------
// Lógica IPC (Solo Simulación de Navegación, SIN BASE DE DATOS)
// -----------------------------------------------------------------------------

ipcMain.handle('login-attempt', async (event, { username, password }) => {
// SIMULACIÓN de credenciales para permitir la navegación visual
    const users = {
        'admin': 'admin123',
        'Gestor': 'gestor456'
    };

    if (users[username] === password) {
// Éxito: retorna el rol
        return { success: true, role: username };
    } else {

        return { success: false, message: 'Usuario o contraseña incorrectos (Solo simulación).' };  
      }
});

ipcMain.on('navigate-to-dashboard', (event, role) => {
    console.log(`Navegando a dashboard para el rol: ${role}`);
    if (mainWindow) {
// Carga el DASHBOARD
        mainWindow.loadFile(path.join(VIEWS_DIR, 'dashboard.html'));
    }
});

ipcMain.on('logout', () => {
    if (mainWindow) {
// Carga la página de LOGIN
      mainWindow.loadFile(path.join(VIEWS_DIR, 'index.html'));
    }
});