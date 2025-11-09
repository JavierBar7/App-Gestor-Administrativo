// renderer.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');

    if (loginForm) {
        // helper: show a small toast message
        function showToast(message, duration = 3000) {
            let toast = document.getElementById('toast-notification');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'toast-notification';
                toast.className = 'toast';
                document.body.appendChild(toast);
            }
            toast.textContent = message;
            // force reflow to restart animation
            void toast.offsetWidth;
            toast.classList.add('show');
            clearTimeout(toast._hideTimeout);
            toast._hideTimeout = setTimeout(() => {
                toast.classList.remove('show');
            }, duration);
        }

        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const username = usernameInput.value;
            const password = passwordInput.value;

            errorMessage.textContent = '';

            const result = await window.electronAPI.loginAttempt(username, password);

            if (result.success) {
                window.electronAPI.navigateToDashboard(result.role);
            } else {
                // mostrar mensaje en el span de error y en un toast
                const msg = result.message || 'Usuario o contraseña incorrectos';
                if (errorMessage) {
                    errorMessage.textContent = msg;
                    errorMessage.classList.add('visible');
                }
                showToast(msg);
            }
        });
    }
});
