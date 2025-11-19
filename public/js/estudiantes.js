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
    let metodosCache = [];

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
                                <button class="register-payment" data-id="${s.idEstudiante}" style="margin-left:8px;">Registrar Pago</button>
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
                                    const mes = formatMes(p.Mes_control || p.Mes_referencia || '', p.Fecha_pago);
                                    const referencia = p.Referencia || '';
                                    const grupo = p.Grupo_nombre || '';
                                    const obs = p.Observacion || '';
                                    const montoBs = p.Monto_bs != null ? p.Monto_bs : '';
                                    const montoUsd = p.Monto_usd != null ? p.Monto_usd : '';
                                    row.innerHTML = `<td>${fecha}</td><td>${mes}</td><td>${referencia}</td><td>${grupo}</td><td>${obs}</td><td>${montoBs}</td><td>${montoUsd}</td>`;
                                    pagosTbody.appendChild(row);
                                });
                            } else {
                                pagosTbody.innerHTML = '<tr><td colspan="7">No hay pagos registrados.</td></tr>';
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
                            // Actions are provided in the table's actions column; no injection needed here.
                        } catch (err) {
                            console.error('Error cargando detalles:', err);
                            alert('Error cargando detalles del estudiante');
                        }
                    });
                });

                // attach click handler to register-payment buttons in the actions column
                studentsTbody.querySelectorAll('.register-payment').forEach(btn => {
                    btn.addEventListener('click', (ev) => {
                        ev.preventDefault();
                        const id = btn.getAttribute('data-id');
                        openRegisterPaymentModal(id);
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
    let selectedGrupos = []; // array of idGrupo selected via autocomplete
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

            // Setup autocomplete input for groups
            const acInput = document.getElementById('ins-grupo-autocomplete');
            const suggestionsEl = document.getElementById('ins-grupo-suggestions');
            const selectedContainer = document.getElementById('ins-selected-grupos');

            function renderSuggestions(list) {
                if (!suggestionsEl) return;
                suggestionsEl.innerHTML = '';
                if (!list || list.length === 0) return;
                const ul = document.createElement('ul');
                ul.style.listStyle = 'none'; ul.style.padding = '6px'; ul.style.margin = '0'; ul.style.background = '#fff'; ul.style.border = '1px solid #ccc'; ul.style.maxHeight = '160px'; ul.style.overflow = 'auto'; ul.style.position = 'absolute'; ul.style.zIndex = 1000; ul.style.width = acInput ? acInput.offsetWidth + 'px' : '240px';
                list.forEach(g => {
                    const li = document.createElement('li');
                    li.style.padding = '6px'; li.style.cursor = 'pointer';
                    li.textContent = `${g.Nombre_Grupo} ${g.Nombre_Curso ? ' — ' + g.Nombre_Curso : ''}`;
                    li.addEventListener('click', () => {
                        addSelectedGrupo(g.idGrupo);
                        if (acInput) acInput.value = '';
                        renderSuggestions([]);
                    });
                    ul.appendChild(li);
                });
                suggestionsEl.appendChild(ul);
            }

            function renderSelectedGrupos() {
                if (!selectedContainer) return;
                selectedContainer.innerHTML = '';
                selectedGrupos.forEach(id => {
                    const g = gruposCache.find(x => String(x.idGrupo) === String(id));
                    const chip = document.createElement('div');
                    chip.style.padding = '6px 8px'; chip.style.border = '1px solid #ccc'; chip.style.borderRadius = '16px'; chip.style.background = '#f5f5f5'; chip.style.display = 'flex'; chip.style.alignItems = 'center'; chip.style.gap = '8px';
                    chip.innerHTML = `<span>${g ? g.Nombre_Grupo : id}</span><button type="button" data-id="${id}" class="remove-grupo-btn" style="background:transparent;border:none;cursor:pointer;font-weight:700;color:#900;">&times;</button>`;
                    selectedContainer.appendChild(chip);
                    chip.querySelector('.remove-grupo-btn').addEventListener('click', (e) => { removeSelectedGrupo(id); });
                });
            }

            function addSelectedGrupo(id) {
                if (!id) return;
                if (selectedGrupos.find(x => String(x) === String(id))) return; // avoid duplicates
                selectedGrupos.push(id);
                // also set hidden select for fallback
                const sel = document.getElementById('ins-idGrupo'); if (sel) sel.value = id;
                renderSelectedGrupos();
            }

            function removeSelectedGrupo(id) {
                selectedGrupos = selectedGrupos.filter(x => String(x) !== String(id));
                const sel = document.getElementById('ins-idGrupo'); if (sel) sel.value = selectedGrupos.length ? selectedGrupos[0] : '';
                renderSelectedGrupos();
            }

            if (acInput) {
                acInput.addEventListener('input', (e) => {
                    const q = (e.target.value || '').trim().toLowerCase();
                    if (!q) { renderSuggestions([]); return; }
                    const matches = gruposCache.filter(g => (g.Nombre_Grupo || '').toLowerCase().includes(q) || (g.Nombre_Curso || '').toLowerCase().includes(q));
                    // exclude already-selected
                    const filtered = matches.filter(m => !selectedGrupos.find(x => String(x) === String(m.idGrupo))).slice(0, 20);
                    renderSuggestions(filtered);
                });

                // hide suggestions on blur with slight delay to allow click
                acInput.addEventListener('blur', () => { setTimeout(() => renderSuggestions([]), 150); });
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
            metodosCache = Array.isArray(metodos) ? metodos : [];
            const select = document.getElementById('pay-metodo');
            const modalSelect = document.getElementById('pay-method-modal');
            if (select) {
                select.innerHTML = '<option value="">-- Seleccione método --</option>';
                metodosCache.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m.idMetodos_pago;
                    opt.textContent = `${m.Nombre} (${m.Moneda_asociada || ''})`;
                    select.appendChild(opt);
                });
            }
            if (modalSelect) {
                modalSelect.innerHTML = '<option value="">-- Seleccione método --</option>';
                metodosCache.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m.idMetodos_pago;
                    opt.textContent = `${m.Nombre} (${m.Moneda_asociada || ''})`;
                    modalSelect.appendChild(opt);
                });
            }
            // also wire change handler for the add-student payment select to reflect pago movil behavior
            const addPaySelect = document.getElementById('pay-metodo');
            if (addPaySelect) {
                addPaySelect.addEventListener('change', () => {
                    const sel = addPaySelect.value;
                    const method = metodosCache.find(m => String(m.idMetodos_pago) === String(sel));
                    const name = method ? String(method.Nombre || '').toLowerCase() : '';
                    const tipo = method ? String(method.Tipo_Validacion || '').toLowerCase() : '';
                    // if pago movil, ensure referencia input is visible and show equivalent next to add-student monto
                    const refEl = document.getElementById('pay-referencia');
                    const montoEl = document.getElementById('pay-monto');
                    let equivEl = document.getElementById('pay-equivalent-add');
                    if (!equivEl && montoEl) {
                        equivEl = document.createElement('div'); equivEl.id = 'pay-equivalent-add'; equivEl.textContent = '—'; montoEl.parentNode.appendChild(equivEl);
                    }
                    if (tipo.includes('movil') || name.includes('pago movil') || name.includes('movil')) {
                        if (refEl) refEl.style.display = 'block';
                        if (equivEl) equivEl.style.display = 'block';
                    } else {
                        if (refEl) refEl.style.display = 'block';
                        if (equivEl) equivEl.style.display = 'none';
                    }
                });
            }
        } catch (err) {
            console.error('Error cargando métodos de pago:', err);
        }
    }

    // Load current tasa (latest)
    async function loadTasa() {
        try {
            const res = await fetch('http://localhost:3000/api/tasa/latest');
            if (!res.ok) return;
            const data = await res.json();
            if (data && data.success && data.rate) {
                const el = document.getElementById('tasa-input');
                if (el) el.value = data.rate.Tasa_usd_a_bs;
                window.__currentTasa = Number(data.rate.Tasa_usd_a_bs) || null;
            }
        } catch (err) {
            console.error('Error cargando tasa actual:', err);
        }
    }

    // Save new tasa to server
    async function saveTasa() {
        const input = document.getElementById('tasa-input');
        const msg = document.getElementById('tasa-msg');
        if (!input) return;
        const val = input.value;
        if (val == null || val === '' || isNaN(Number(val))) {
            if (msg) {
                msg.style.display = 'inline';
                msg.style.color = '#c33';
                msg.textContent = 'Valor inválido';
            }
            return;
        }
        try {
            const res = await fetch('http://localhost:3000/api/tasa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Tasa_usd_a_bs: Number(val) })
            });
            if (!res.ok) {
                // Try to read text to provide a helpful message
                const txt = await res.text().catch(() => null);
                console.error('Error guardando tasa (HTTP ' + res.status + '):', txt);
                if (msg) {
                    msg.style.display = 'inline';
                    msg.style.color = '#c33';
                    msg.textContent = txt || ('Error HTTP ' + res.status);
                }
            } else {
                // parse JSON safely
                let data = null;
                try { data = await res.json(); } catch (e) { data = null; }
                if (data && data.success) {
                    if (msg) {
                        msg.style.display = 'inline';
                        msg.style.color = '#2a7';
                        msg.textContent = 'Tasa guardada';
                    }
                } else {
                    const txt = data && data.message ? data.message : 'Respuesta inesperada del servidor';
                    if (msg) {
                        msg.style.display = 'inline';
                        msg.style.color = '#c33';
                        msg.textContent = txt;
                    }
                }
            }
        } catch (err) {
            console.error('Error guardando tasa:', err);
            if (msg) {
                msg.style.display = 'inline';
                msg.style.color = '#c33';
                msg.textContent = 'Error de conexión';
            }
        }
        setTimeout(() => { if (msg) msg.style.display = 'none'; }, 3000);
    }

    // Load historial of tasas and render into modal
    async function loadHistorial() {
        const body = document.getElementById('tasa-hist-body');
        if (!body) return;
        body.innerHTML = '<tr><td colspan="2">Cargando...</td></tr>';
        try {
            const res = await fetch('http://localhost:3000/api/tasa/historial');
            if (!res.ok) {
                const txt = await res.text().catch(() => null);
                body.innerHTML = `<tr><td colspan="2">Error cargando historial: ${res.status}</td></tr>`;
                console.error('Error cargando historial tasa:', res.status, txt);
                return;
            }
            const data = await res.json().catch(() => null);
            if (!data || !data.success || !Array.isArray(data.historial)) {
                body.innerHTML = '<tr><td colspan="2">No hay historial disponible.</td></tr>';
                return;
            }
            if (data.historial.length === 0) {
                body.innerHTML = '<tr><td colspan="2">No hay registros.</td></tr>';
                return;
            }
            body.innerHTML = '';
            data.historial.forEach(h => {
                const tr = document.createElement('tr');
                const fecha = h.Fecha_Registro ? (typeof h.Fecha_Registro === 'string' && h.Fecha_Registro.includes('T') ? h.Fecha_Registro.split('T')[0] : new Date(h.Fecha_Registro).toISOString().slice(0,10)) : '';
                tr.innerHTML = `<td style="padding:6px">${fecha}</td><td style="padding:6px;text-align:right">${h.Tasa_Registrada != null ? Number(h.Tasa_Registrada).toFixed(4) : ''}</td>`;
                body.appendChild(tr);
            });
        } catch (err) {
            console.error('Error cargando historial tasa:', err);
            body.innerHTML = '<tr><td colspan="2">Error de conexión</td></tr>';
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

    // --- Payment modal helpers ---
    function clearBilletesList() {
        const container = document.getElementById('pay-billetes-list');
        if (!container) return;
        container.innerHTML = '';
    }

    function addBilleteRow(billete) {
        const container = document.getElementById('pay-billetes-list');
        if (!container) return;
        const idx = Date.now();
        const row = document.createElement('div');
        row.className = 'billete-row';
        row.style.display = 'flex';
        row.style.gap = '8px';
        row.style.marginBottom = '6px';
        row.innerHTML = `
            <input placeholder="Denominación" data-denom id="bil-den-${idx}" value="${billete && billete.Denominacion ? billete.Denominacion : ''}">
            <input placeholder="Código / Serial" data-cod id="bil-cod-${idx}" value="${billete && billete.Codigo_billete ? billete.Codigo_billete : ''}">
            <button type="button" data-remove>Eliminar</button>
        `;
        container.appendChild(row);
        const removeBtn = row.querySelector('[data-remove]');
        removeBtn.addEventListener('click', () => row.remove());
    }

    function openRegisterPaymentModal(idEstudiante) {
        const modal = document.getElementById('register-payment-modal');
        if (!modal) return;
        document.getElementById('pay-idEstudiante').value = idEstudiante;
        // reset fields
        document.getElementById('pay-method-modal').value = '';
        document.getElementById('pay-monto-transfer').value = '';
        document.getElementById('pay-referencia-transfer').value = '';
        document.getElementById('pay-monto-efectivo').value = '';
        document.getElementById('pay-monto-cash').value = '';
        document.getElementById('pay-monto-parcial').value = '';
        clearBilletesList();
        modal.style.display = 'flex';
    }

    // Wire modal controls
    const registerPaymentModal = document.getElementById('register-payment-modal');
    const closeRegisterPaymentBtn = document.getElementById('close-register-payment');
    if (closeRegisterPaymentBtn && registerPaymentModal) {
        closeRegisterPaymentBtn.addEventListener('click', (e) => { e.preventDefault(); registerPaymentModal.style.display = 'none'; });
    }

    // add billete button
    const payAddBilleteBtn = document.getElementById('pay-add-billete');
    if (payAddBilleteBtn) {
        payAddBilleteBtn.addEventListener('click', (e) => { e.preventDefault(); addBilleteRow(); });
    }

    // method change handler to show appropriate section
    const payMethodModalSel = document.getElementById('pay-method-modal');
    if (payMethodModalSel) {
        payMethodModalSel.addEventListener('change', (e) => {
            const sel = payMethodModalSel.value;
            const method = metodosCache.find(m => String(m.idMetodos_pago) === String(sel));
            const name = method ? String(method.Nombre || '').toLowerCase() : '';
            const tipo = method ? String(method.Tipo_Validacion || '').toLowerCase() : '';
            // hide all
            document.getElementById('pay-section-transfer').style.display = 'none';
            document.getElementById('pay-section-efectivo').style.display = 'none';
            document.getElementById('pay-section-cash').style.display = 'none';
            // show transfer section for transfer OR for pago movil (they share same fields)
            if (name.includes('transfer') || name.includes('transferencia') || tipo.includes('movil') || name.includes('pago movil') || name.includes('movil')) {
                document.getElementById('pay-section-transfer').style.display = 'block';
            } else if (name.includes('efectivo') || tipo.includes('efectivo')) {
                document.getElementById('pay-section-efectivo').style.display = 'block';
            } else if (name.includes('cash') || tipo.includes('cash')) {
                document.getElementById('pay-section-cash').style.display = 'block';
            }
        });
    }

    // compute equivalents when amounts change
    function computeEquivalent(bsAmount) {
        const tasa = window.__currentTasa || null;
        if (!tasa || !bsAmount) return '—';
        const usd = Number((Number(bsAmount) / tasa).toFixed(4));
        return usd;
    }

    // Format Mes value to 'MM/YYYY'. Accepts several input formats:
    // - 'YYYY-MM' (from <input type="month">)
    // - 'YYYYMM' (numeric)
    // - numeric month (1-12) -> use payment year or current year
    // - otherwise returns original string
    function formatMes(mesVal, fechaPago) {
        if (mesVal === null || mesVal === undefined || mesVal === '') return '';
        const s = String(mesVal).trim();
        // YYYY-MM
        const reYmDash = /^\d{4}-\d{2}$/;
        if (reYmDash.test(s)) {
            const [y, m] = s.split('-');
            return `${m}/${y}`;
        }
        // YYYYMM
        const reYm = /^\d{6}$/;
        if (reYm.test(s)) {
            const y = s.slice(0,4); const m = s.slice(4,6);
            return `${m}/${y}`;
        }
        // pure year YYYY
        const reY = /^\d{4}$/;
        if (reY.test(s)) return s;
        // numeric month
        const num = Number(s);
        if (!isNaN(num) && num >= 1 && num <= 12) {
            let year = (fechaPago ? new Date(fechaPago).getFullYear() : null) || new Date().getFullYear();
            return `${String(num).padStart(2,'0')}/${year}`;
        }
        return s;
    }

    document.addEventListener('input', (e) => {
        if (!e.target) return;
        if (e.target.id === 'pay-monto-transfer') {
            const val = e.target.value; document.getElementById('pay-equivalent-transfer').textContent = computeEquivalent(val);
        } else if (e.target.id === 'pay-monto-efectivo') {
            const val = e.target.value; document.getElementById('pay-equivalent-efectivo').textContent = computeEquivalent(val);
        } else if (e.target.id === 'pay-monto') {
            const equivEl = document.getElementById('pay-equivalent-add');
            if (equivEl) equivEl.textContent = computeEquivalent(e.target.value);
        } else if (e.target.id === 'pay-monto-cash') {
            // optionally show equivalent somewhere
        }
    });

    // submit payment handler
    const registerPaymentForm = document.getElementById('register-payment-form');
    if (registerPaymentForm) {
        registerPaymentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const idEstudiante = document.getElementById('pay-idEstudiante').value;
            const metodoId = document.getElementById('pay-method-modal').value;
            if (!idEstudiante || !metodoId) return alert('Seleccione método y estudiante');

            const methodObj = metodosCache.find(m => String(m.idMetodos_pago) === String(metodoId));
            const name = methodObj ? String(methodObj.Nombre || '').toLowerCase() : '';

            let payload = { idEstudiante: Number(idEstudiante), metodoId: Number(metodoId) };

            // Decide by Tipo_Validacion OR Nombre (covers Pago Móvil entries configured in DB)
            const tipo = methodObj ? String(methodObj.Tipo_Validacion || '').toLowerCase() : '';
            if (name.includes('transfer') || name.includes('transferencia') || tipo.includes('movil') || name.includes('pago movil') || name.includes('movil')) {
                const monto = Number(document.getElementById('pay-monto-transfer').value || 0);
                const referencia = document.getElementById('pay-referencia-transfer').value || null;
                const mesRef = document.getElementById('pay-mes-modal') ? document.getElementById('pay-mes-modal').value : null;
                payload.monto = monto;
                payload.moneda = 'bs';
                payload.referencia = referencia;
                // If this is Pago Móvil, ensure referencia and monto are provided
                if (tipo.includes('movil') || name.includes('pago movil') || name.includes('movil')) {
                    if (!referencia || String(referencia).trim() === '') return alert('Pago móvil requiere referencia de la transacción');
                    if (isNaN(monto) || monto <= 0) return alert('Pago móvil requiere el monto de la transacción');
                }
                if (mesRef) payload.Mes_referencia = mesRef;
            } else if (name.includes('efectivo')) {
                const monto = Number(document.getElementById('pay-monto-efectivo').value || 0);
                const mesRef = document.getElementById('pay-mes-modal') ? document.getElementById('pay-mes-modal').value : null;
                payload.monto = monto;
                payload.moneda = 'bs';
                if (mesRef) payload.Mes_referencia = mesRef;
            } else if (name.includes('cash')) {
                const monto = Number(document.getElementById('pay-monto-cash').value || 0);
                const mesRef = document.getElementById('pay-mes-modal') ? document.getElementById('pay-mes-modal').value : null;
                payload.monto = monto;
                payload.moneda = 'bs';
                // collect billetes
                const billetes = [];
                const container = document.getElementById('pay-billetes-list');
                if (container) {
                    const rows = container.querySelectorAll('.billete-row');
                    rows.forEach(r => {
                        const denomEl = r.querySelector('[data-denom]');
                        const codEl = r.querySelector('[data-cod]');
                        if (denomEl && codEl) {
                            const denom = Number(denomEl.value || 0);
                            const cod = codEl.value || null;
                            if (denom > 0 && cod) billetes.push({ Codigo_billete: cod, Denominacion: denom });
                        }
                    });
                }
                payload.billetes = billetes;
                if (mesRef) payload.Mes_referencia = mesRef;
            }

            // optional parcial
            const parcialVal = Number(document.getElementById('pay-monto-parcial').value || 0);
            if (parcialVal && parcialVal > 0) {
                payload.parciales = [{ monto: parcialVal }];
            }

            try {
                const res = await fetch('http://localhost:3000/api/pagos', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
                });
                const data = await res.json().catch(() => null);
                if (data && data.success) {
                    alert('Pago registrado');
                    registerPaymentModal.style.display = 'none';
                    // refresh student details (re-fetch)
                    const btn = document.querySelector('.student-name[data-id="' + idEstudiante + '"]');
                    if (btn) btn.click();
                } else {
                    alert((data && data.message) || 'Error registrando pago');
                }
            } catch (err) {
                console.error('Error registrando pago:', err);
                alert('Error conectando al servidor');
            }
        });
    }

    // Validate pago data in add-student form when provided (require referencia for Pago Móvil)

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
            // collect selected grupos from autocomplete. If none, fall back to select value
            let gruposToSend = [];
            if (selectedGrupos && selectedGrupos.length) {
                gruposToSend = selectedGrupos.slice();
            } else {
                const selectedGrupoId = document.getElementById('ins-idGrupo') ? document.getElementById('ins-idGrupo').value : null;
                if (selectedGrupoId) gruposToSend = [selectedGrupoId];
            }
            const payload = {
                Nombres: document.getElementById('est-Nombres').value,
                Apellidos: document.getElementById('est-Apellidos').value,
                Cedula: document.getElementById('est-Cedula').value,
                Fecha_Nacimiento: document.getElementById('est-Fecha_Nacimiento').value,
                Telefono: document.getElementById('est-Telefono').value,
                Correo: document.getElementById('est-Correo').value,
                Direccion: document.getElementById('est-Direccion').value,
                // Enviar array `grupos` (ids) para inscribir en uno o varios grupos; también incluimos fecha de inscripción
                grupos: gruposToSend,
                Fecha_inscripcion: document.getElementById('ins-Fecha_inscripcion') ? document.getElementById('ins-Fecha_inscripcion').value : null
            };

            // Adjuntar info de pago si el usuario completó monto
            const payMontoEl = document.getElementById('pay-monto');
            if (payMontoEl && payMontoEl.value && Number(payMontoEl.value) > 0) {
                payload.pago = {
                    metodoId: document.getElementById('pay-metodo') ? document.getElementById('pay-metodo').value : null,
                    monto: document.getElementById('pay-monto').value,
                    Mes_referencia: document.getElementById('pay-mes') ? document.getElementById('pay-mes').value : null,
                    moneda: document.getElementById('pay-moneda') ? document.getElementById('pay-moneda').value : 'bs',
                    referencia: document.getElementById('pay-referencia') ? document.getElementById('pay-referencia').value : null,
                    idCuenta_Destino: document.getElementById('pay-cuenta') ? document.getElementById('pay-cuenta').value : null
                };
                // Validate Pago Móvil requirements if method is Pago Móvil
                try {
                    const mid = payload.pago.metodoId;
                    const methodObj = metodosCache.find(m => String(m.idMetodos_pago) === String(mid));
                    const mname = methodObj ? String(methodObj.Nombre || '').toLowerCase() : '';
                    const mtipo = methodObj ? String(methodObj.Tipo_Validacion || '').toLowerCase() : '';
                    const isMovil = mtipo.includes('movil') || mname.includes('pago movil') || mname.includes('movil');
                    if (isMovil) {
                        const ref = payload.pago.referencia;
                        const m = Number(payload.pago.monto || 0);
                        if (!ref || String(ref).trim() === '') {
                            const errEl = document.getElementById('add-student-error');
                            errEl.textContent = 'Pago móvil requiere referencia de la transacción';
                            errEl.classList.add('visible');
                            return;
                        }
                        if (isNaN(m) || m <= 0) {
                            const errEl = document.getElementById('add-student-error');
                            errEl.textContent = 'Pago móvil requiere el monto de la transacción';
                            errEl.classList.add('visible');
                            return;
                        }
                    }
                } catch (vErr) {
                    console.warn('Validación Pago Móvil (add-student) falló:', vErr);
                }
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
    await loadTasa();
    // attach tasa save handler
    const tasaSaveBtn = document.getElementById('tasa-save-btn');
    if (tasaSaveBtn) tasaSaveBtn.addEventListener('click', (e) => { e.preventDefault(); saveTasa(); });
    // attach historial button handler
    const tasaHistBtn = document.getElementById('tasa-hist-btn');
    const tasaHistModal = document.getElementById('tasa-hist-modal');
    const closeTasaHistBtn = document.getElementById('close-tasa-hist');
    if (tasaHistBtn && tasaHistModal) {
        tasaHistBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            tasaHistModal.style.display = 'flex';
            await loadHistorial();
        });
    }
    if (closeTasaHistBtn && tasaHistModal) {
        closeTasaHistBtn.addEventListener('click', (e) => {
            e.preventDefault();
            tasaHistModal.style.display = 'none';
        });
    }
    await renderGroupCards();
});