const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    loginAttempt: (username, password) => ipcRenderer.invoke('login-attempt', username, password),
    navigateToDashboard: (role) => ipcRenderer.send('navigate-dashboard', role),
    navigateToEstudiantes: () => ipcRenderer.send('navigate-estudiantes'),
    logout: () => ipcRenderer.send('logout')
});
