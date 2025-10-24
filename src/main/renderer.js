document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const username = usernameInput.value;
            const password = passwordInput.value;

            errorMessage.textContent = ''; // Limpiar errores anteriores
            
            // 1. Llamar a la API de Electron (ipcRenderer.invoke -> ipcMain.handle)
            const result = await window.electronAPI.loginAttempt(username, password);

            if (result.success) {
                // 2. Éxito: Llamar a la función de navegación (ipcRenderer.send -> ipcMain.on)
                console.log(`Login exitoso, navegando al dashboard para rol: ${result.role}`);
                window.electronAPI.navigateToDashboard(result.role);
            } else {
                // 3. Mostrar error de credenciales
                errorMessage.textContent = result.message;
            }
        });
    }
});
