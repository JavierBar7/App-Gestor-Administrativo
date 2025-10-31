// renderer.js
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

            errorMessage.textContent = '';

            const result = await window.electronAPI.loginAttempt(username, password);

            if (result.success) {
                console.log(`Login exitoso, rol: ${result.role}`);
                window.electronAPI.navigateToDashboard(result.role);
            } else {
                errorMessage.textContent = result.message;
            }
        });
    }
});
