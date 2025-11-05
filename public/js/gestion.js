document.addEventListener('DOMContentLoaded', async () => {
    const userTableBody = document.getElementById('user-table-body');
    const noUsersMessage = document.getElementById('no-users-message');
    const logoutBtn = document.getElementById('logout-btn');

    const editUserModal = document.getElementById('edit-user-modal');
    const closeModalBtn = editUserModal.querySelector('.close-button');
    const editUserForm = document.getElementById('edit-user-form');
    const modalUsernameInput = document.getElementById('modal-username');
    const modalNewPasswordInput = document.getElementById('modal-new-password');
    const modalErrorMessage = document.getElementById('modal-error-message');

    let currentEditingUser = null;

    async function loadUsers() {
        try {
            const response = await fetch('http://localhost:3000/api/users');
            const users = await response.json();

            userTableBody.innerHTML = '';
            if (users.length === 0) {
                noUsersMessage.style.display = 'block';
                return;
            } else {
                noUsersMessage.style.display = 'none';
            }

            users.forEach(user => {
                const row = userTableBody.insertRow();
                row.innerHTML = `
                    <td>${user.username}</td>
                    <td>**********${user.password.slice(-2)}</td>
                    <td>${user.rol}</td>
                    <td>${user.createdAt}</td>
                    <td class="action-buttons">
                        <button class="edit-btn" data-username="${user.username}">Editar</button>
                        <button class="delete-btn" data-username="${user.username}">Borrar</button>
                    </td>
                `;
            });

            document.querySelectorAll('.edit-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const username = event.target.dataset.username;
                    currentEditingUser = username;
                    modalUsernameInput.value = username;
                    modalNewPasswordInput.value = '';
                    modalErrorMessage.classList.remove('visible');
                    editUserModal.style.display = 'flex';
                });
            });

            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', async (event) => {
                    const username = event.target.dataset.username;
                    if (confirm(`¿Estás seguro de que quieres borrar al usuario ${username}?`)) {
                        // Implementar eliminación si es necesario
                        alert('Funcionalidad de eliminación no implementada aún.');
                    }
                });
            });
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            noUsersMessage.style.display = 'block';
        }
    }

    loadUsers();

    logoutBtn.addEventListener('click', () => {
        window.electronAPI.logout();
    });

    closeModalBtn.addEventListener('click', () => {
        editUserModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == editUserModal) {
            editUserModal.style.display = 'none';
        }
    });

    editUserForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const newPassword = modalNewPasswordInput.value;
        const newRol = document.getElementById('rol').value;

        if (newPassword.length < 6) {
            modalErrorMessage.textContent = 'La contraseña debe tener al menos 6 caracteres.';
            modalErrorMessage.classList.add('visible');
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/users/${currentEditingUser}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ newPassword, newRol })
            });

            const result = await response.json();

            if (result.success) {
                alert(`Usuario ${currentEditingUser} actualizado.`);
                editUserModal.style.display = 'none';
                loadUsers();
            } else {
                modalErrorMessage.textContent = result.message || 'Error al actualizar usuario.';
                modalErrorMessage.classList.add('visible');
            }
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            modalErrorMessage.textContent = 'Error al conectar con el servidor.';
            modalErrorMessage.classList.add('visible');
        }
    });
});
