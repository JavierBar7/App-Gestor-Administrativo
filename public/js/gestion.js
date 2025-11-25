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

    // -- Estudiantes: modal y formulario para agregar
    const addStudentBtn = document.getElementById('add-student-btn');
    const addStudentModal = document.getElementById('add-student-modal');
    const closeAddStudentBtn = document.getElementById('close-add-student');
    const addStudentForm = document.getElementById('add-student-form');
    const representanteSection = document.getElementById('representante-section');

    function calcularEdad(fechaStr) {
        const hoy = new Date();
        const fecha = new Date(fechaStr);
        let edad = hoy.getFullYear() - fecha.getFullYear();
        const m = hoy.getMonth() - fecha.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < fecha.getDate())) {
            edad--;
        }
        return edad;
    }

    if (addStudentBtn) {
        addStudentBtn.addEventListener('click', () => {
            addStudentModal.style.display = 'flex';
        });
    }

    if (closeAddStudentBtn) {
        closeAddStudentBtn.addEventListener('click', () => {
            addStudentModal.style.display = 'none';
        });
    }

    // Mostrar/ocultar datos de representante según fecha
    const fechaNacimientoInput = document.getElementById('est-Fecha_Nacimiento');
    if (fechaNacimientoInput) {
        fechaNacimientoInput.addEventListener('change', () => {
            const fecha = fechaNacimientoInput.value;
            if (!fecha) return;
            const edad = calcularEdad(fecha);
            if (edad < 18) {
                representanteSection.style.display = 'block';
            } else {
                representanteSection.style.display = 'none';
            }
        });
    }

    if (addStudentForm) {
        addStudentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            document.getElementById('add-student-error').classList.remove('visible');
            const payload = {
                Nombres: document.getElementById('est-Nombres').value,
                Apellidos: document.getElementById('est-Apellidos').value,
                Cedula: document.getElementById('est-Cedula').value,
                Fecha_Nacimiento: document.getElementById('est-Fecha_Nacimiento').value,
                Telefono: document.getElementById('est-Telefono').value,
                Correo: document.getElementById('est-Correo').value,
                Direccion: document.getElementById('est-Direccion').value,
                idCurso: document.getElementById('ins-idCurso').value || null
            };

            const edad = calcularEdad(payload.Fecha_Nacimiento);
            if (edad < 18) {
                // añadir representante
                payload.representante = {
                    Nombres: document.getElementById('rep-Nombres').value,
                    Apellidos: document.getElementById('rep-Apellidos').value,
                    Cedula: document.getElementById('rep-Cedula').value,
                    Parentesco: document.getElementById('rep-Parentesco').value,
                    Telefono: document.getElementById('rep-Telefono').value,
                    Correo: document.getElementById('rep-Correo').value
                };
            }

            try {
                const response = await fetch('http://localhost:3000/api/estudiantes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();
                if (result.success) {
                    alert('Estudiante creado correctamente');
                    addStudentModal.style.display = 'none';
                    // opcional: recargar lista de usuarios/estudiantes
                    loadUsers();
                } else {
                    const errEl = document.getElementById('add-student-error');
                    errEl.textContent = result.message || 'Error al crear estudiante';
                    errEl.classList.add('visible');
                }
            } catch (err) {
                console.error('Error creando estudiante:', err);
                const errEl = document.getElementById('add-student-error');
                errEl.textContent = 'Error al conectar con el servidor';
                errEl.classList.add('visible');
            }
        });
    }

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
                // API returns Nombre_Usuario and rol (Nombre_Rol) per server controller
                const username = user.Nombre_Usuario || user.username || '';
                const rol = user.rol || user.Nombre_Rol || '';
                const createdAt = user.createdAt || 'N/A';

                const row = userTableBody.insertRow();
                row.innerHTML = `
                    <td>${username}</td>
                    <td>********</td>
                    <td>${rol}</td>
                    <td>${createdAt}</td>
                    <td class="action-buttons">
                        <button class="edit-btn" data-username="${username}">Editar</button>
                        <button class="delete-btn" data-username="${username}">Borrar</button>
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

    // Navegar a la vista de estudiantes
    const viewStudentsBtn = document.getElementById('view-students-btn');
    if (viewStudentsBtn) viewStudentsBtn.addEventListener('click', (e) => { e.preventDefault(); window.electronAPI.navigateToEstudiantes(); });

    // Navegar a la vista de cursos
    const viewCursosBtn = document.getElementById('view-cursos-btn');
    if (viewCursosBtn) viewCursosBtn.addEventListener('click', (e) => { e.preventDefault(); window.electronAPI.navigateToCursos(); });

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

    // --- Lógica para Agregar Usuario ---
    const btnAddUser = document.getElementById('btn-add-user');
    const addUserModal = document.getElementById('add-user-modal');
    const closeAddUser = document.getElementById('close-add-user');
    const addUserForm = document.getElementById('add-user-form');
    const addUserError = document.getElementById('add-user-error');

    if (btnAddUser) {
        btnAddUser.addEventListener('click', () => {
            addUserForm.reset();
            addUserError.textContent = '';
            addUserModal.style.display = 'flex';
        });
    }

    if (closeAddUser) {
        closeAddUser.addEventListener('click', () => {
            addUserModal.style.display = 'none';
        });
    }

    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (e.target === addUserModal) {
            addUserModal.style.display = 'none';
        }
    });

    if (addUserForm) {
        addUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            addUserError.textContent = 'Guardando...';
            
            const username = document.getElementById('new-username').value;
            const password = document.getElementById('new-password').value;
            const rol = document.getElementById('new-rol').value;

            try {
                const response = await fetch('http://localhost:3000/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password, rol })
                });

                const data = await response.json();

                if (data.success) {
                    alert('Usuario creado exitosamente');
                    addUserModal.style.display = 'none';
                    loadUsers(); // Recargar tabla
                } else {
                    addUserError.textContent = data.message || 'Error al crear usuario';
                }
            } catch (error) {
                console.error('Error:', error);
                addUserError.textContent = 'Error de conexión';
            }
        });
    }
});
