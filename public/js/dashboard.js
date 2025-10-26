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
    let usersData = [
        { username: 'admin', password: 'admin123', role: 'Administrador', createdAt: new Date().toLocaleDateString() },
        { username: 'Gestor', password: 'gestor456', role: 'Gestor', createdAt: new Date().toLocaleDateString() }
    ];

    window.electronAPI.getUsers = async () => {
        return usersData;
    };

    window.electronAPI.deleteUser = async (usernameToDelete) => {
        const initialLength = usersData.length;
        usersData = usersData.filter(user => user.username !== usernameToDelete);
        return usersData.length < initialLength; 
    };

    window.electronAPI.editUser = async (usernameToEdit, newPassword) => {
        const userIndex = usersData.findIndex(user => user.username === usernameToEdit);
        if (userIndex !== -1) {
            usersData[userIndex].password = newPassword;
            return true;
        }
        return false;
    };

    async function loadUsers() {
        const users = usersData;

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
                <td>**********${user.password.slice(-2)}</td> <td>${user.role}</td>
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
                    const success = await window.electronAPI.deleteUser(username);
                    if (success) {
                        alert(`Usuario ${username} eliminado.`);
                        loadUsers(); // Recargar la tabla
                    } else {
                        alert('Error al eliminar usuario.');
                    }
                }
            });
        });
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

        if (newPassword.length < 6) { 
            modalErrorMessage.textContent = 'La contraseña debe tener al menos 6 caracteres.';
            modalErrorMessage.classList.add('visible');
            return;
        }

        const success = await window.electronAPI.editUser(currentEditingUser, newPassword);
        if (success) {
            alert(`Contraseña del usuario ${currentEditingUser} actualizada.`);
            editUserModal.style.display = 'none';
            loadUsers(); 
        } else {
            modalErrorMessage.textContent = 'Error al actualizar la contraseña.';
            modalErrorMessage.classList.add('visible');
        }
    });
});