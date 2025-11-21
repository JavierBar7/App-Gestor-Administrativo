const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    loginAttempt: (username, password) => ipcRenderer.invoke('login-attempt', username, password),
    navigateToDashboard: (role) => ipcRenderer.send('navigate-dashboard', role),
    navigateToEstudiantes: () => ipcRenderer.send('navigate-estudiantes'),
    navigateToCursos: () => ipcRenderer.send('navigate-cursos'),
    navigateToDeudores: () => ipcRenderer.send('navigate-deudores'), // <--- NUEVA LÍNEA
    logout: () => ipcRenderer.send('logout')
});