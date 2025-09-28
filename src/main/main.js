const { app, BrowserWindow } = require ("electron");
const path = require ("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false, // seguridad
    },
  });

  // En desarrollo, apunta al servidor de React
  win.loadURL("http://localhost:3000");

  // En producción, carga el build de React
  // win.loadFile(path.join(__dirname, "../renderer/dist/index.html"));
}

app.on("ready", createWindow);
