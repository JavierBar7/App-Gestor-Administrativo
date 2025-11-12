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
                    <td>
                        <button class="edit-student" data-id="${s.idEstudiante}">Editar</button>
                    </td>
                `;
            });
            // Add event listeners for edit buttons
            document.querySelectorAll('.edit-student').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = btn.getAttribute('data-id');
                    const student = students.find(s => String(s.idEstudiante) === String(id));
                    if (!student) return;
                    // Open modal and fill form
                    document.getElementById('student-modal-title').textContent = 'Editar Estudiante';
                    addStudentModal.style.display = 'flex';
                    addStudentForm.setAttribute('data-edit-id', id);
                    document.getElementById('est-Nombres').value = student.Nombres || '';
                    document.getElementById('est-Apellidos').value = student.Apellidos || '';
                    document.getElementById('est-Cedula').value = student.Cedula || '';
                    document.getElementById('est-Fecha_Nacimiento').value = student.Fecha_Nacimiento ? student.Fecha_Nacimiento.split('T')[0] : '';
                    document.getElementById('est-Telefono').value = student.Telefono || '';
                    document.getElementById('est-Correo').value = student.Correo || '';
                    document.getElementById('est-Direccion').value = student.Direccion || '';
                });
            });
        } catch (err) {
            console.error('Error cargando estudiantes:', err);
            noStudentsMessage.style.display = 'block';
        }
    }

    // Load grupos to populate inscription select (maps to curso id internally)
    let gruposCache = [];
    async function loadGrupos() {
        try {
            const res = await fetch('http://localhost:3000/api/grupos');
            const grupos = await res.json();
            gruposCache = Array.isArray(grupos) ? grupos : [];
            const select = document.getElementById('ins-idGrupo');
            if (select) {
                select.innerHTML = '<option value="">-- Seleccione un grupo --</option>';
                gruposCache.forEach(g => {
                    const opt = document.createElement('option');
                    opt.value = g.idGrupo;
                    opt.textContent = `${g.Nombre_Grupo}`;
                    select.appendChild(opt);
                });
            }
        } catch (err) {
            console.error('Error cargando grupos:', err);
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
            const selectedGrupoId = document.getElementById('ins-idGrupo') ? document.getElementById('ins-idGrupo').value : null;
            let mappedIdCurso = null;
            if (selectedGrupoId) {
                const found = gruposCache.find(g => String(g.idGrupo) === String(selectedGrupoId));
                if (found) mappedIdCurso = found.idCurso;
            }
            const payload = {
                Nombres: document.getElementById('est-Nombres').value,
                Apellidos: document.getElementById('est-Apellidos').value,
                Cedula: document.getElementById('est-Cedula').value,
                Fecha_Nacimiento: document.getElementById('est-Fecha_Nacimiento').value,
                Telefono: document.getElementById('est-Telefono').value,
                Correo: document.getElementById('est-Correo').value,
                Direccion: document.getElementById('est-Direccion').value,
                idCurso: mappedIdCurso
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
            // Si el form tiene data-edit-id, es edición
            const editId = addStudentForm.getAttribute('data-edit-id');
            let url = 'http://localhost:3000/api/estudiantes';
            let method = 'POST';
            if (editId) {
                url += `/${editId}`;
                method = 'PUT';
            }
            try {
                const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();
                if (result.success) {
                    alert(editId ? 'Estudiante editado correctamente' : 'Estudiante creado correctamente');
                    addStudentModal.style.display = 'none';
                    addStudentForm.removeAttribute('data-edit-id');
                    document.getElementById('student-modal-title').textContent = 'Agregar Estudiante';
                    addStudentForm.reset();
                    loadStudents();
                } else {
                    const errEl = document.getElementById('add-student-error');
                    errEl.textContent = result.message || (editId ? 'Error al editar estudiante' : 'Error al crear estudiante');
                    errEl.classList.add('visible');
                }
            } catch (err) {
                console.error(editId ? 'Error editando estudiante:' : 'Error creando estudiante:', err);
                const errEl = document.getElementById('add-student-error');
                errEl.textContent = editId ? 'Error al conectar con el servidor (edición)' : 'Error al conectar con el servidor';
                errEl.classList.add('visible');
            }
        });
    }

    // volver a gestion
    const backBtn = document.getElementById('back-to-gestion');
    if (backBtn) backBtn.addEventListener('click', (e) => { e.preventDefault(); window.electronAPI.navigateToDashboard(); });

    if (logoutBtn) logoutBtn.addEventListener('click', () => window.electronAPI.logout());
    await loadGrupos();
    loadStudents();
});