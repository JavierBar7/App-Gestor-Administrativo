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

    let currentGroupId = null;
    let currentGroupName = null;

    // Render students for a specific group (fetches /api/grupos/:id/estudiantes)
    async function renderStudentsForGroup(idGrupo, groupName) {
        try {
            const res = await fetch(`http://localhost:3000/api/grupos/${idGrupo}/estudiantes`);
            let students;
            if (!res.ok) {
                const text = await res.text();
                console.error(`Error HTTP ${res.status} cargando estudiantes del grupo:`, text);
                document.getElementById('students-table-body').innerHTML = '';
                document.getElementById('no-students-message').textContent = 'Error al cargar estudiantes (ver consola)';
                document.getElementById('no-students-message').style.display = 'block';
                return;
            }
            try {
                students = await res.json();
            } catch (jsonErr) {
                const txt = await res.text();
                console.error('Respuesta no es JSON al pedir estudiantes:', txt, jsonErr);
                document.getElementById('students-table-body').innerHTML = '';
                document.getElementById('no-students-message').textContent = 'Respuesta inválida del servidor (ver consola)';
                document.getElementById('no-students-message').style.display = 'block';
                return;
            }
            const grupoStudentsEl = document.getElementById('grupo-students');
            const studentsTbody = document.getElementById('students-table-body');
            const noMsg = document.getElementById('no-students-message');

            studentsTbody.innerHTML = '';
            if (!students || students.length === 0) {
                noMsg.style.display = 'block';
            } else {
                noMsg.style.display = 'none';
                students.forEach(s => {
                    try {
                        const tr = document.createElement('tr');

                        // proteger Fecha_Nacimiento: puede venir como Date, string o null
                        let fecha = '';
                        if (s.Fecha_Nacimiento) {
                            if (typeof s.Fecha_Nacimiento === 'string' && s.Fecha_Nacimiento.includes('T')) {
                                fecha = s.Fecha_Nacimiento.split('T')[0];
                            } else {
                                try {
                                    fecha = new Date(s.Fecha_Nacimiento).toISOString().slice(0,10);
                                } catch (e) {
                                    fecha = '';
                                }
                            }
                        }

                        // calcular edad a partir de Fecha_Nacimiento
                        let edadDisplay = '—';
                        try {
                            if (s.Fecha_Nacimiento) {
                                const calc = calcularEdad(s.Fecha_Nacimiento);
                                edadDisplay = isNaN(calc) ? '—' : calc;
                            }
                        } catch (e) {
                            edadDisplay = '—';
                        }

                        tr.innerHTML = `
                            <td class="student-name" data-id="${s.idEstudiante}" style="cursor:pointer;color:blue;text-decoration:underline;">${s.Nombres || ''} ${s.Apellidos || ''}</td>
                            <td>${edadDisplay}</td>
                            <td>—</td>
                            <td>
                                <button class="edit-student" data-id="${s.idEstudiante}">Editar</button>
                            </td>
                        `;
                        studentsTbody.appendChild(tr);
                    } catch (rowErr) {
                        console.error('Error renderizando estudiante', s, rowErr);
                    }
                });

                // attach click handler to student name cells to view details
                studentsTbody.querySelectorAll('.student-name').forEach(cell => {
                    cell.addEventListener('click', async (e) => {
                        const id = cell.getAttribute('data-id');
                        try {
                            const res = await fetch(`http://localhost:3000/api/estudiantes/${id}`);
                            const data = await res.json();
                            if (!data || !data.success) {
                                alert('No se pudieron obtener los detalles del estudiante');
                                return;
                            }
                            // fill modal
                            const est = data.estudiante;
                            document.getElementById('det-nombre').textContent = `${est.Nombres} ${est.Apellidos}`;
                            document.getElementById('det-cedula').textContent = `Cédula: ${est.Cedula || ''}`;
                            document.getElementById('det-fecha-nac').textContent = `Fecha de Nacimiento: ${est.Fecha_Nacimiento ? (typeof est.Fecha_Nacimiento === 'string' && est.Fecha_Nacimiento.includes('T') ? est.Fecha_Nacimiento.split('T')[0] : new Date(est.Fecha_Nacimiento).toISOString().slice(0,10)) : ''}`;
                            document.getElementById('det-telefono').textContent = `Teléfono: ${est.Telefono || ''}`;
                            document.getElementById('det-correo').textContent = `Correo: ${est.Correo || ''}`;
                            document.getElementById('det-direccion').textContent = `Dirección: ${est.Direccion || ''}`;

                            // representante
                            const repEl = document.getElementById('det-representante');
                            if (data.representante) {
                                const r = data.representante;
                                repEl.innerHTML = `<p>${r.Nombres} ${r.Apellidos} — ${r.Parentesco || ''}</p><p>Cédula: ${r.Cedula || ''}</p><p>Teléfonos: ${r.Telefonos || ''}</p><p>Correo: ${r.Correo || ''}</p><p>Dirección: ${r.Direccion || ''}</p>`;
                            } else {
                                repEl.textContent = 'No posee representante registrado.';
                            }

                            // pagos
                            const pagosTbody = document.querySelector('#det-pagos-table tbody');
                            pagosTbody.innerHTML = '';
                            if (Array.isArray(data.pagos) && data.pagos.length) {
                                data.pagos.forEach(p => {
                                    const row = document.createElement('tr');
                                    const fecha = p.Fecha_pago ? (typeof p.Fecha_pago === 'string' && p.Fecha_pago.includes('T') ? p.Fecha_pago.split('T')[0] : new Date(p.Fecha_pago).toISOString().slice(0,10)) : '';
                                    row.innerHTML = `<td>${fecha}</td><td>${p.Referencia || ''}</td><td>${p.Monto_bs != null ? p.Monto_bs : ''}</td><td>${p.Monto_usd != null ? p.Monto_usd : ''}</td>`;
                                    pagosTbody.appendChild(row);
                                });
                            } else {
                                pagosTbody.innerHTML = '<tr><td colspan="4">No hay pagos registrados.</td></tr>';
                            }

                            // grupos
                            const gruposTbody = document.querySelector('#det-grupos-table tbody');
                            gruposTbody.innerHTML = '';
                            if (Array.isArray(data.grupos) && data.grupos.length) {
                                data.grupos.forEach(g => {
                                    const row = document.createElement('tr');
                                    const fecha = g.Fecha_inscripcion ? (typeof g.Fecha_inscripcion === 'string' && g.Fecha_inscripcion.includes('T') ? g.Fecha_inscripcion.split('T')[0] : new Date(g.Fecha_inscripcion).toISOString().slice(0,10)) : '';
                                    row.innerHTML = `<td>${fecha}</td><td>${g.Nombre_Grupo || ''}</td><td>${g.Nombre_Curso || ''}</td>`;
                                    gruposTbody.appendChild(row);
                                });
                            } else {
                                gruposTbody.innerHTML = '<tr><td colspan="3">No hay historial de grupos.</td></tr>';
                            }

                            // show modal
                            document.getElementById('student-details-modal').style.display = 'flex';
                        } catch (err) {
                            console.error('Error cargando detalles:', err);
                            alert('Error cargando detalles del estudiante');
                        }
                    });
                });

                studentsTbody.querySelectorAll('.edit-student').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const id = btn.getAttribute('data-id');
                        // fetch student details from API or reuse students array
                        const studRes = await fetch(`http://localhost:3000/api/estudiantes`);
                        const allStudents = await studRes.json();
                        const student = allStudents.find(sg => String(sg.idEstudiante) === String(id));
                        if (!student) return;
                        // Open modal and fill form
                        document.getElementById('student-modal-title').textContent = 'Editar Estudiante';
                        addStudentModal.style.display = 'flex';
                        addStudentForm.setAttribute('data-edit-id', id);
                        document.getElementById('est-Nombres').value = student.Nombres || '';
                        document.getElementById('est-Apellidos').value = student.Apellidos || '';
                        document.getElementById('est-Cedula').value = student.Cedula || '';
                        document.getElementById('est-Fecha_Nacimiento').value = student.Fecha_Nacimiento ? (typeof student.Fecha_Nacimiento === 'string' && student.Fecha_Nacimiento.includes('T') ? student.Fecha_Nacimiento.split('T')[0] : new Date(student.Fecha_Nacimiento).toISOString().slice(0,10)) : '';
                        document.getElementById('est-Telefono').value = student.Telefono || '';
                        document.getElementById('est-Correo').value = student.Correo || '';
                        document.getElementById('est-Direccion').value = student.Direccion || '';
                    });
                });
            }

            currentGroupId = idGrupo;
            currentGroupName = groupName;
            // show students panel and hide cards
            document.getElementById('grupos-cards').style.display = 'none';
            grupoStudentsEl.style.display = 'block';
            document.getElementById('grupo-students-title').textContent = `Estudiantes — ${groupName || ''}`;
        } catch (err) {
            console.error('Error cargando estudiantes del grupo:', err);
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

    // Load payment methods to populate select
    async function loadMetodosPago() {
        try {
            const res = await fetch('http://localhost:3000/api/metodos_pagos/metodos');
            const metodos = await res.json();
            const select = document.getElementById('pay-metodo');
            if (select) {
                select.innerHTML = '<option value="">-- Seleccione método --</option>';
                (Array.isArray(metodos) ? metodos : []).forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m.idMetodos_pago;
                    opt.textContent = `${m.Nombre} (${m.Moneda_asociada || ''})`;
                    select.appendChild(opt);
                });
            }
        } catch (err) {
            console.error('Error cargando métodos de pago:', err);
        }
    }

    // Render group cards (summary endpoint)
    async function renderGroupCards() {
        try {
            const res = await fetch('http://localhost:3000/api/grupos/summary');
            if (!res.ok) {
                const text = await res.text();
                console.error('Error HTTP cargando resumen de grupos:', res.status, text);
                document.getElementById('grupos-cards').innerHTML = '<p>Error al cargar grupos. Revisa servidor.</p>';
                return;
            }
            const groups = await res.json();
            const container = document.getElementById('grupos-cards');
            container.innerHTML = '';
            if (!groups || groups.length === 0) {
                container.innerHTML = '<p>No hay grupos disponibles.</p>';
                return;
            }
            groups.forEach(g => {
                const card = document.createElement('div');
                card.className = 'group-card';
                card.style.border = '1px solid #ddd';
                card.style.padding = '12px';
                card.style.width = '220px';
                card.style.borderRadius = '6px';
                card.style.cursor = 'pointer';
                card.innerHTML = `<h4>${g.Nombre_Grupo}</h4><p><b>Curso:</b> ${g.Nombre_Curso || g.idCurso}</p><p><b>Estudiantes:</b> ${g.studentCount}</p>`;
                card.addEventListener('click', () => {
                    renderStudentsForGroup(g.idGrupo, g.Nombre_Grupo);
                });
                container.appendChild(card);
            });
        } catch (err) {
            console.error('Error cargando resumen de grupos:', err);
        }
    }

    if (addStudentBtn) {
        addStudentBtn.addEventListener('click', () => {
            // prepare modal for new student
            addStudentForm.removeAttribute('data-edit-id');
            addStudentForm.reset();
            // set inscripción date default to today
            const fechaInsInput = document.getElementById('ins-Fecha_inscripcion');
            if (fechaInsInput) fechaInsInput.value = new Date().toISOString().slice(0,10);
            document.getElementById('student-modal-title').textContent = 'Agregar Estudiante';
            addStudentModal.style.display = 'flex';
        });
    }
    if (closeAddStudentBtn) {
        closeAddStudentBtn.addEventListener('click', () => {
            addStudentModal.style.display = 'none';
        });
    }

    // Close student details modal
    const closeDetailsBtn = document.getElementById('close-student-details');
    if (closeDetailsBtn) {
        closeDetailsBtn.addEventListener('click', () => {
            document.getElementById('student-details-modal').style.display = 'none';
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
                // Prefer enviar idGrupo para que el backend resuelva idCurso; también incluimos fecha de inscripción
                idGrupo: selectedGrupoId || null,
                Fecha_inscripcion: document.getElementById('ins-Fecha_inscripcion') ? document.getElementById('ins-Fecha_inscripcion').value : null
            };

            // Adjuntar info de pago si el usuario completó monto
            const payMontoEl = document.getElementById('pay-monto');
            if (payMontoEl && payMontoEl.value && Number(payMontoEl.value) > 0) {
                payload.pago = {
                    metodoId: document.getElementById('pay-metodo') ? document.getElementById('pay-metodo').value : null,
                    monto: document.getElementById('pay-monto').value,
                    moneda: document.getElementById('pay-moneda') ? document.getElementById('pay-moneda').value : 'bs',
                    referencia: document.getElementById('pay-referencia') ? document.getElementById('pay-referencia').value : null,
                    idCuenta_Destino: document.getElementById('pay-cuenta') ? document.getElementById('pay-cuenta').value : null
                };
            }
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
                    // reset fecha de inscripción to today
                    const fechaInsInput = document.getElementById('ins-Fecha_inscripcion');
                    if (fechaInsInput) fechaInsInput.value = new Date().toISOString().slice(0,10);
                    // refresh current view: if viewing a group, reload its students; otherwise reload cards
                    if (currentGroupId) {
                        await renderStudentsForGroup(currentGroupId, currentGroupName);
                    } else {
                        await renderGroupCards();
                    }
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

    // Back from students view to groups
    const backToGroupsBtn = document.getElementById('back-to-groups');
    if (backToGroupsBtn) backToGroupsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('grupo-students').style.display = 'none';
        document.getElementById('grupos-cards').style.display = 'flex';
    });

    if (logoutBtn) logoutBtn.addEventListener('click', () => window.electronAPI.logout());
    await loadGrupos();
    await loadMetodosPago();
    await renderGroupCards();
});