const { app, BrowserWindow } = require('electron/main')
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
})