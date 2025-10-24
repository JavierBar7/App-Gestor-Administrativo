/*window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})*/

const { contextBridge, ipcRenderer } = require('electron');

// Expone un objeto 'electronAPI' al proceso de renderizado (index.html y dashboard.html)
contextBridge.exposeInMainWorld('electronAPI', {
    // Para el Login (IPC Handle, bidireccional, retorna promesa)
    loginAttempt: (username, password) => ipcRenderer.invoke('login-attempt', { username, password }),

    // Para la Navegación y Logout (IPC Send, unidireccional)
    navigateToDashboard: (role) => ipcRenderer.send('navigate-to-dashboard', role),
    logout: () => ipcRenderer.send('logout'),

    // Funcionalidades de Dashboard (Simuladas en el dashboard.js en este caso, pero se exponen por si se necesitan)
    // Nota: Estas funciones están simuladas localmente en dashboard.js por ahora.
    // Si se usaran, deberían definirse como ipcRenderer.invoke en el dashboard.js
    // y tener su ipcMain.handle correspondiente en el main.js.
});