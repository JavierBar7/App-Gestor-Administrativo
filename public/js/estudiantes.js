document.addEventListener('DOMContentLoaded', async () => {
    // --- REFERENCIAS DOM ---
    const studentsTableBody = document.getElementById('students-table-body');
    const noStudentsMessage = document.getElementById('no-students-message');
    const logoutBtn = document.getElementById('logout-btn');

    const addStudentBtn = document.getElementById('add-student-btn');
    const addStudentModal = document.getElementById('add-student-modal');
    const closeAddStudentBtn = document.getElementById('close-add-student');
    const addStudentForm = document.getElementById('add-student-form');
    const representanteSection = document.getElementById('representante-section');

    // --- VARIABLES DE ESTADO ---
    let currentGroupId = null;
    let currentGroupName = null;
    let metodosCache = [];
    let gruposCache = [];
    let selectedGrupos = []; // IDs de grupos seleccionados

    // --- FUNCIONES AUXILIARES ---
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

    function formatMes(mesVal, fechaPago) {
        if (mesVal && typeof mesVal === 'string' && (mesVal.includes('T') || mesVal.length >= 10)) {
            const d = new Date(mesVal);
            if (!isNaN(d.getTime())) {
                const nm = d.toLocaleString('es-ES', { month: 'long' });
                const year = d.getFullYear();
                return nm.charAt(0).toUpperCase() + nm.slice(1) + ' ' + year;
            }
        }
        if (mesVal && /^\d{4}-\d{2}-\d{2}$/.test(mesVal)) {
            const d = new Date(mesVal);
            if (!isNaN(d.getTime())) {
                const nm = d.toLocaleString('es-ES', { month: 'long' });
                const year = d.getFullYear();
                return nm.charAt(0).toUpperCase() + nm.slice(1) + ' ' + year;
            }
        }
        if (mesVal && /^\d{4}-\d{2}$/.test(mesVal)) {
            const [y, m] = mesVal.split('-');
            const d = new Date(y, m - 1, 1);
            if (!isNaN(d.getTime())) {
                const nm = d.toLocaleString('es-ES', { month: 'long' });
                return nm.charAt(0).toUpperCase() + nm.slice(1) + ' ' + y;
            }
        }
        if (!mesVal && fechaPago) {
            const d = new Date(fechaPago);
            if (!isNaN(d.getTime())) {
                const nm = d.toLocaleString('es-ES', { month: 'long' });
                const year = d.getFullYear();
                return nm.charAt(0).toUpperCase() + nm.slice(1) + ' ' + year;
            }
        }
        return mesVal || '';
    }

    // --- LÓGICA DE GRUPOS (AUTOCOMPLETADO) ---
    function renderSelectedGrupos() {
        const selectedContainer = document.getElementById('ins-selected-grupos');
        if (!selectedContainer) return;
        selectedContainer.innerHTML = '';
        
        selectedGrupos.forEach(id => {
            const g = gruposCache.find(x => String(x.idGrupo) === String(id));
            const chip = document.createElement('div');
            chip.style.padding = '6px 8px'; 
            chip.style.border = '1px solid #ccc'; 
            chip.style.borderRadius = '16px'; 
            chip.style.background = '#f5f5f5'; 
            chip.style.display = 'flex'; 
            chip.style.alignItems = 'center'; 
            chip.style.gap = '8px';
            
            chip.innerHTML = `<span>${g ? g.Nombre_Grupo : id}</span><button type="button" data-id="${id}" class="remove-grupo-btn" style="background:transparent;border:none;cursor:pointer;font-weight:700;color:#900;">&times;</button>`;
            selectedContainer.appendChild(chip);
            
            chip.querySelector('.remove-grupo-btn').addEventListener('click', (e) => { 
                removeSelectedGrupo(id); 
            });
        });
    }

    function addSelectedGrupo(id) {
        if (!id) return;
        if (selectedGrupos.find(x => String(x) === String(id))) return; 
        selectedGrupos.push(id);
        const sel = document.getElementById('ins-idGrupo'); 
        if (sel) sel.value = id; // Actualizar select oculto por compatibilidad
        renderSelectedGrupos();
    }

    function removeSelectedGrupo(id) {
        selectedGrupos = selectedGrupos.filter(x => String(x) !== String(id));
        const sel = document.getElementById('ins-idGrupo'); 
        if (sel) sel.value = selectedGrupos.length ? selectedGrupos[0] : '';
        renderSelectedGrupos();
    }

    function renderSuggestions(list) {
        const suggestionsEl = document.getElementById('ins-grupo-suggestions');
        const acInput = document.getElementById('ins-grupo-autocomplete');
        if (!suggestionsEl) return;
        
        suggestionsEl.innerHTML = '';
        if (!list || list.length === 0) return;
        
        const ul = document.createElement('ul');
        ul.style.listStyle = 'none'; 
        ul.style.padding = '6px'; 
        ul.style.margin = '0'; 
        ul.style.background = '#fff'; 
        ul.style.border = '1px solid #ccc'; 
        ul.style.maxHeight = '160px'; 
        ul.style.overflow = 'auto'; 
        ul.style.position = 'absolute'; 
        ul.style.zIndex = 1000; 
        ul.style.width = acInput ? acInput.offsetWidth + 'px' : '240px';
        
        list.forEach(g => {
            const li = document.createElement('li');
            li.style.padding = '6px'; 
            li.style.cursor = 'pointer';
            li.textContent = `${g.Nombre_Grupo} ${g.Nombre_Curso ? ' — ' + g.Nombre_Curso : ''}`;
            li.addEventListener('click', () => {
                addSelectedGrupo(g.idGrupo);
                if (acInput) acInput.value = ''; // Limpiar input
                renderSuggestions([]); // Cerrar sugerencias
            });
            ul.appendChild(li);
        });
        suggestionsEl.appendChild(ul);
    }

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

            const acInput = document.getElementById('ins-grupo-autocomplete');
            if (acInput) {
                acInput.addEventListener('input', (e) => {
                    const q = (e.target.value || '').trim().toLowerCase();
                    if (!q) { renderSuggestions([]); return; }
                    const matches = gruposCache.filter(g => (g.Nombre_Grupo || '').toLowerCase().includes(q) || (g.Nombre_Curso || '').toLowerCase().includes(q));
                    // Filtrar los ya seleccionados
                    const filtered = matches.filter(m => !selectedGrupos.find(x => String(x) === String(m.idGrupo))).slice(0, 20);
                    renderSuggestions(filtered);
                });
                acInput.addEventListener('blur', () => { 
                    setTimeout(() => renderSuggestions([]), 200); 
                });
            }
        } catch (err) {
            console.error('Error cargando grupos:', err);
        }
    }

    // --- RENDERIZADO DE ESTUDIANTES ---
    async function renderStudentsForGroup(idGrupo, groupName) {
        try {
            const res = await fetch(`http://localhost:3000/api/grupos/${idGrupo}/estudiantes`);
            if (!res.ok) return;
            const students = await res.json();
            
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
                        let edadDisplay = (s.edad !== null && s.edad !== undefined) ? s.edad : '—';

                        // Último Pago
                        let lastPayDisplay = '—';
                        if (s.lastPayment) {
                            const p = s.lastPayment;
                            const metodo = p.Metodo || 'Pago';
                            const monto = p.Monto_usd ? `${p.Monto_usd}` : (p.Monto_bs ? `Bs.${p.Monto_bs}` : '');
                            const mes = formatMes(p.Mes_Pagado, p.Fecha_pago);
                            const mesStr = mes ? `(${mes})` : '';
                            lastPayDisplay = `<strong>${metodo}:</strong> ${monto} <small>${mesStr}</small>`;
                        }

                        // Deuda
                        let debtDisplay = '<span style="color:red; font-weight:bold;">Deuda</span>';
                        if (s.pendingDebt === 0 || s.pendingDebt === '0') {
                            debtDisplay = '<span style="color:green;">Solvente</span>';
                        } else if (s.pendingDebt && !isNaN(Number(s.pendingDebt)) && Number(s.pendingDebt) > 0) {
                            debtDisplay = `<span style="color:red; font-weight:bold;">${Number(s.pendingDebt).toFixed(2)}</span>`;
                        }

                        tr.innerHTML = `
                            <td class="student-name" data-id="${s.idEstudiante}" style="cursor:pointer;color:blue;text-decoration:underline;">${s.Nombres || ''} ${s.Apellidos || ''}</td>
                            <td>${edadDisplay}</td>
                            <td>${lastPayDisplay}</td>
                            <td>${debtDisplay}</td>
                            <td>
                                <button class="edit-student" data-id="${s.idEstudiante}">Editar</button>
                                <button class="register-payment" data-id="${s.idEstudiante}" style="margin-left:8px;">Registrar Pago</button>
                            </td>
                        `;
                        studentsTbody.appendChild(tr);
                    } catch (rowErr) { console.error(rowErr); }
                });

                // Click en nombre: Detalles
                studentsTbody.querySelectorAll('.student-name').forEach(cell => {
                    cell.addEventListener('click', async (e) => {
                        const id = cell.getAttribute('data-id');
                        await openStudentDetails(id);
                    });
                });

                // Botones Acción
                studentsTbody.querySelectorAll('.register-payment').forEach(btn => {
                    btn.addEventListener('click', (ev) => {
                        ev.preventDefault();
                        window.location.href = `registrar_pago.html?studentId=${btn.getAttribute('data-id')}`;
                    });
                });

                studentsTbody.querySelectorAll('.edit-student').forEach(btn => {
                    btn.addEventListener('click', () => openEditStudentModal(btn.getAttribute('data-id')));
                });
            }

            currentGroupId = idGrupo;
            currentGroupName = groupName;
            document.getElementById('grupos-cards').style.display = 'none';
            grupoStudentsEl.style.display = 'block';
            document.getElementById('grupo-students-title').textContent = `Estudiantes — ${groupName || ''}`;
        } catch (err) { console.error(err); }
    }

    async function openStudentDetails(id) {
        try {
            const res = await fetch(`http://localhost:3000/api/estudiantes/${id}`);
            const data = await res.json();
            if (!data || !data.success) return alert('Error al cargar detalles');
            
            const est = data.estudiante;
            document.getElementById('det-nombre').textContent = `${est.Nombres} ${est.Apellidos}`;
            document.getElementById('det-cedula').textContent = est.Cedula || '';
            document.getElementById('det-fecha-nac').textContent = est.Fecha_Nacimiento ? new Date(est.Fecha_Nacimiento).toISOString().slice(0, 10) : '';
            document.getElementById('det-telefono').textContent = est.Telefono || '';
            document.getElementById('det-correo').textContent = est.Correo || '';
            document.getElementById('det-direccion').textContent = est.Direccion || '';

            const repEl = document.getElementById('det-representante');
            if (data.representante) {
                const r = data.representante;
                repEl.innerHTML = `<p>${r.Nombres} ${r.Apellidos} — ${r.Parentesco || ''}</p><p>Cédula: ${r.Cedula || ''}</p><p>Teléfonos: ${r.Telefonos || ''}</p><p>Correo: ${r.Correo || ''}</p><p>Dirección: ${r.Direccion || ''}</p>`;
            } else { repEl.textContent = 'No posee representante registrado.'; }

            // Pagos
            const pagosTbody = document.querySelector('#det-pagos-table tbody');
            pagosTbody.innerHTML = '';
            if (data.pagos?.length) {
                data.pagos.forEach(p => {
                    const row = document.createElement('tr');
                    const fecha = p.Fecha_pago ? new Date(p.Fecha_pago).toISOString().slice(0, 10) : '';
                    const mes = formatMes(p.Mes_control || p.Mes_referencia, p.Fecha_pago);
                    const ref = p.Referencia || 'N/A';
                    const obs = p.Observacion || '';
                    const mBs = p.Monto_bs != null ? p.Monto_bs : '';
                    const mUsd = p.Monto_usd != null ? p.Monto_usd : '';
                    row.innerHTML = `<td>${fecha}</td><td>${mes}</td><td>${ref}</td><td>${obs}</td><td>${mBs}</td><td>${mUsd}</td>`;
                    pagosTbody.appendChild(row);
                });
            } else { pagosTbody.innerHTML = '<tr><td colspan="6">No hay pagos registrados.</td></tr>'; }

            // Deudas
            const deudasTbody = document.querySelector('#det-deudas-table tbody');
            deudasTbody.innerHTML = '';
            if (data.deudas?.length) {
                data.deudas.forEach(d => {
                    const row = document.createElement('tr');
                    const totalPagado = Number(d.Total_Pagado || 0);
                    const montoUsd = Number(d.Monto_usd || 0);
                    const pendiente = montoUsd - totalPagado;
                    row.innerHTML = `<td>${d.Concepto || ''}</td><td>${montoUsd.toFixed(2)}</td><td>${d.Estado || ''}${pendiente > 0 ? ' — Pendiente: $' + pendiente.toFixed(2) : ''}</td>`;
                    deudasTbody.appendChild(row);
                });
            } else { deudasTbody.innerHTML = '<tr><td colspan="3" style="padding:8px;color:#555;">No posee deudas pendientes.</td></tr>'; }

            // Grupos
            const gruposTbody = document.querySelector('#det-grupos-table tbody');
            gruposTbody.innerHTML = '';
            if (data.grupos?.length) {
                data.grupos.forEach(g => {
                    const row = document.createElement('tr');
                    const fecha = g.Fecha_inscripcion ? new Date(g.Fecha_inscripcion).toISOString().slice(0, 10) : '';
                    row.innerHTML = `<td>${fecha}</td><td>${g.Nombre_Grupo || ''}</td><td>${g.Nombre_Curso || ''}</td>`;
                    gruposTbody.appendChild(row);
                });
            } else { gruposTbody.innerHTML = '<tr><td colspan="3">No hay historial de grupos.</td></tr>'; }

            document.getElementById('student-details-modal').style.display = 'flex';
        } catch (err) { console.error(err); }
    }

    async function openEditStudentModal(id) {
        const studRes = await fetch(`http://localhost:3000/api/estudiantes`);
        const allStudents = await studRes.json();
        const student = allStudents.find(sg => String(sg.idEstudiante) === String(id));
        if (!student) return;
        
        document.getElementById('student-modal-title').textContent = 'Editar Estudiante';
        addStudentModal.style.display = 'flex';
        addStudentForm.setAttribute('data-edit-id', id);
        document.getElementById('est-Nombres').value = student.Nombres || '';
        document.getElementById('est-Apellidos').value = student.Apellidos || '';
        document.getElementById('est-Cedula').value = student.Cedula || '';
        document.getElementById('est-Fecha_Nacimiento').value = student.Fecha_Nacimiento ? new Date(student.Fecha_Nacimiento).toISOString().slice(0, 10) : '';
        document.getElementById('est-Telefono').value = student.Telefono || '';
        document.getElementById('est-Correo').value = student.Correo || '';
        document.getElementById('est-Direccion').value = student.Direccion || '';
        
        // Nota: La edición de grupos/inscripciones suele ser compleja, aquí solo editamos datos básicos.
    }

    // --- RENDER GRUPOS (CARDS) ---
    async function renderGroupCards() {
        try {
            const res = await fetch('http://localhost:3000/api/grupos/summary');
            if (!res.ok) return;
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
                card.innerHTML = `<h4>${g.Nombre_Grupo}</h4><p><b>Curso:</b> ${g.Nombre_Curso || g.idCurso}</p><p><b>Estudiantes:</b> ${g.studentCount}</p>`;
                card.addEventListener('click', () => renderStudentsForGroup(g.idGrupo, g.Nombre_Grupo));
                container.appendChild(card);
            });
        } catch (err) { console.error(err); }
    }

    // --- TASAS ---
    async function loadTasa() {
        try {
            const res = await fetch('http://localhost:3000/api/tasa/latest');
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.rate) document.getElementById('tasa-input').value = data.rate.Tasa_usd_a_bs;
            }
        } catch (err) { console.error(err); }
    }

    document.getElementById('tasa-save-btn').addEventListener('click', async (e) => {
        e.preventDefault();
        const val = document.getElementById('tasa-input').value;
        const msg = document.getElementById('tasa-msg');
        if (!val) return;
        await fetch('http://localhost:3000/api/tasa', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ Tasa_usd_a_bs: val }) });
        msg.style.display = 'inline'; msg.textContent = 'Guardada';
        setTimeout(() => msg.style.display = 'none', 2000);
    });

    // Historial Tasas
    const tasaHistBtn = document.getElementById('tasa-hist-btn');
    const tasaHistModal = document.getElementById('tasa-hist-modal');
    const closeTasaHistBtn = document.getElementById('close-tasa-hist');
    
    if (tasaHistBtn) {
        tasaHistBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            tasaHistModal.style.display = 'flex';
            const body = document.getElementById('tasa-hist-body');
            body.innerHTML = 'Loading...';
            const res = await fetch('http://localhost:3000/api/tasa/historial');
            const data = await res.json();
            body.innerHTML = '';
            data.historial.forEach(h => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td style="padding:6px">${h.Fecha_Registro.slice(0,10)}</td><td style="text-align:right">${h.Tasa_Registrada}</td>`;
                body.appendChild(tr);
            });
        });
    }
    if (closeTasaHistBtn) closeTasaHistBtn.addEventListener('click', () => tasaHistModal.style.display = 'none');


    // --- INICIALIZACIÓN Y EVENTOS PRINCIPALES ---
    
    if (logoutBtn) logoutBtn.addEventListener('click', () => window.electronAPI.logout());
    
    const backToGroupsBtn = document.getElementById('back-to-groups');
    if (backToGroupsBtn) backToGroupsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('grupo-students').style.display = 'none';
        document.getElementById('grupos-cards').style.display = 'flex';
        // Recargar tarjetas para actualizar conteo
        renderGroupCards();
    });

    // Botón Agregar Estudiante: LIMPIEZA COMPLETA
    if (addStudentBtn) {
        addStudentBtn.addEventListener('click', () => {
            addStudentForm.removeAttribute('data-edit-id');
            addStudentForm.reset();
            
            // LIMPIEZA DE GRUPOS SELECCIONADOS (CRUCIAL PARA EVITAR ERRORES)
            selectedGrupos = [];
            renderSelectedGrupos();
            const acInput = document.getElementById('ins-grupo-autocomplete');
            if(acInput) acInput.value = '';

            // Fecha automática
            const fechaInsInput = document.getElementById('ins-Fecha_inscripcion');
            if (fechaInsInput) fechaInsInput.value = new Date().toISOString().slice(0, 10);
            
            document.getElementById('student-modal-title').textContent = 'Agregar Estudiante';
            addStudentModal.style.display = 'flex';
            const errEl = document.getElementById('add-student-error');
            if (errEl) errEl.classList.remove('visible');
        });
    }
    
    if (closeAddStudentBtn) closeAddStudentBtn.addEventListener('click', () => addStudentModal.style.display = 'none');
    if (document.getElementById('close-student-details')) document.getElementById('close-student-details').addEventListener('click', () => document.getElementById('student-details-modal').style.display = 'none');

    // Cambio fecha nacimiento -> Mostrar representante
    const fechaNacimientoInput = document.getElementById('est-Fecha_Nacimiento');
    if (fechaNacimientoInput) {
        fechaNacimientoInput.addEventListener('change', () => {
            if (calcularEdad(fechaNacimientoInput.value) < 18) {
                representanteSection.style.display = 'block';
            } else {
                representanteSection.style.display = 'none';
            }
        });
    }

    // --- GUARDAR ESTUDIANTE ---
    if (addStudentForm) {
        addStudentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log("⏳ Guardando...");
            
            const errorMsg = document.getElementById('add-student-error');
            if (errorMsg) { errorMsg.textContent = ''; errorMsg.classList.remove('visible'); }

            const campoNombre = document.getElementById('est-Nombres');
            const campoCedula = document.getElementById('est-Cedula');
            
            if (!campoNombre.value || !campoCedula.value) {
                alert("⚠️ Faltan campos obligatorios.");
                return;
            }

            // Validación de Grupo Obligatorio (Opcional, pero recomendado para que aparezca en la lista)
            if (selectedGrupos.length === 0) {
                // Si prefieres permitir estudiantes sin grupo, borra este bloque.
                // Pero si el usuario se queja de que "no aparece", es mejor obligarlo.
                if (!confirm("⚠️ No has seleccionado ningún grupo. El estudiante se creará pero no aparecerá en las listas de grupos. ¿Deseas continuar?")) {
                    return;
                }
            }

            const payload = {
                Nombres: document.getElementById('est-Nombres').value,
                Apellidos: document.getElementById('est-Apellidos').value,
                Cedula: document.getElementById('est-Cedula').value,
                Fecha_Nacimiento: document.getElementById('est-Fecha_Nacimiento').value,
                Telefono: document.getElementById('est-Telefono').value,
                Correo: document.getElementById('est-Correo').value,
                Direccion: document.getElementById('est-Direccion').value,
                grupos: selectedGrupos, // Usamos la variable global gestionada por las funciones
                Fecha_inscripcion: document.getElementById('ins-Fecha_inscripcion').value || new Date().toISOString().slice(0, 10)
            };

            if (calcularEdad(payload.Fecha_Nacimiento) < 18) {
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
                const editId = addStudentForm.getAttribute('data-edit-id');
                const url = editId ? `http://localhost:3000/api/estudiantes/${editId}` : 'http://localhost:3000/api/estudiantes';
                const method = editId ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (result.success) {
                    alert(editId ? '✅ Actualizado' : '✅ Creado con éxito');
                    addStudentModal.style.display = 'none';
                    addStudentForm.reset();
                    
                    // Limpiar estado de grupos
                    selectedGrupos = [];
                    renderSelectedGrupos();

                    // Recargar vista
                    if (currentGroupId) renderStudentsForGroup(currentGroupId, currentGroupName);
                    else renderGroupCards();
                } else {
                    alert("❌ " + (result.message || "Error desconocido"));
                }
            } catch (err) {
                console.error(err);
                alert("❌ Error de conexión.");
            }
        });
    }

    // Cargas iniciales
    await loadGrupos();
    await loadTasa();
    await renderGroupCards();
});