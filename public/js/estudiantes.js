document.addEventListener('DOMContentLoaded', async () => {
    const studentsTableBody = document.getElementById('students-table-body');
    const noStudentsMessage = document.getElementById('no-students-message');
    const logoutBtn = document.getElementById('logout-btn');

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

    async function loadStudents() {
        try {
            const response = await fetch('http://localhost:3000/api/estudiantes');
            const students = await response.json();
            studentsTableBody.innerHTML = '';
            if (!students || students.length === 0) {
                noStudentsMessage.style.display = 'block';
                return;
            }
            noStudentsMessage.style.display = 'none';
            students.forEach(s => {
                const row = studentsTableBody.insertRow();
                row.innerHTML = `
                    <td>${s.idEstudiante}</td>
                    <td>${s.Nombres}</td>
                    <td>${s.Apellidos}</td>
                    <td>${s.Cedula}</td>
                    <td>${s.Fecha_Nacimiento ? s.Fecha_Nacimiento.split('T')[0] : ''}</td>
                    <td>${s.Telefono || ''}</td>
                    <td>${s.Correo || ''}</td>
                    <td>${s.Direccion || ''}</td>
                    <td><button class="edit-student" data-id="${s.idEstudiante}">Editar</button></td>
                `;
            });
        } catch (err) {
            console.error('Error cargando estudiantes:', err);
            noStudentsMessage.style.display = 'block';
        }
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
                idCurso: document.getElementById('ins-idCurso') ? document.getElementById('ins-idCurso').value : null
            };

            const edad = calcularEdad(payload.Fecha_Nacimiento);
            if (edad < 18) {
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
                    loadStudents();
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

    // volver a gestion
    const backBtn = document.getElementById('back-to-gestion');
    if (backBtn) backBtn.addEventListener('click', (e) => { e.preventDefault(); window.electronAPI.navigateToDashboard(); });

    if (logoutBtn) logoutBtn.addEventListener('click', () => window.electronAPI.logout());

    loadStudents();
});