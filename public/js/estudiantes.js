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
    let currentView = 'cards'; // 'cards' or 'list'

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

    // Función robusta para formatear moneda
    function formatMoney(amount, currency) {
        const num = Number(amount);
        if (isNaN(num)) return '0.00';

        if (currency === 'USD') {
            // Si es entero (ej: 30.00), mostrar 30. Si tiene decimales (30.50), mostrar 30.50
            return num % 1 === 0 ? num.toString() : num.toFixed(2);
        } else {
            // Bs siempre con 2 decimales
            return num.toFixed(2);
        }
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
        if (sel) sel.value = id; 
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
                if (acInput) acInput.value = ''; 
                renderSuggestions([]); 
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

    function createStudentRow(s) {
        try {
            const tr = document.createElement('tr');
            let edadDisplay = (s.edad !== null && s.edad !== undefined) ? s.edad : '—';

            // Último Pago
            let lastPayDisplay = '—';
            if (s.lastPayment) {
                const p = s.lastPayment;
                const metodo = p.Metodo || 'Pago';
                const monto = formatMoney(p.Monto_usd, 'USD'); 
                const mes = formatMes(p.Mes_Pagado, p.Fecha_pago);
                const mesStr = mes ? `(${mes})` : '';
                lastPayDisplay = `<strong>${metodo}:</strong> $${monto} <small>${mesStr}</small>`;
            }

            // Deuda
            let debtDisplay = '<span class="badge-status badge-deuda">Deuda</span>';
            const deudaTotal = Number(s.pendingDebt);
            if (deudaTotal <= 0.01) {
                debtDisplay = '<span class="badge-status badge-solvente">Solvente</span>';
            } else {
                debtDisplay = '<span class="badge-status badge-deuda">Deuda</span>';
            }

            tr.innerHTML = `
                <td class="student-name" data-id="${s.idEstudiante}" style="cursor:pointer;color:blue;text-decoration:underline;">${s.Nombres || ''} ${s.Apellidos || ''}</td>
                <td>${edadDisplay}</td>
                <td>${lastPayDisplay}</td>
                <td style="text-align:center;">${debtDisplay}</td>
                <td class="action-buttons-cell">
                    <button class="edit-student" data-id="${s.idEstudiante}">Editar</button>
                    <button class="register-payment" data-id="${s.idEstudiante}">Registrar Pago</button>
                </td>
            `;

            // Event Listeners for the row
            tr.querySelector('.student-name').addEventListener('click', async () => {
                await openStudentDetails(s.idEstudiante);
            });

            tr.querySelector('.register-payment').addEventListener('click', (ev) => {
                ev.preventDefault();
                window.location.href = `registrar_pago.html?studentId=${s.idEstudiante}`;
            });

            tr.querySelector('.edit-student').addEventListener('click', () => openEditStudentModal(s.idEstudiante));

            return tr;
        } catch (rowErr) { 
            console.error(rowErr); 
            return null;
        }
    }

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
                    const tr = createStudentRow(s);
                    if (tr) studentsTbody.appendChild(tr);
                });
            }

            currentGroupId = idGrupo;
            currentGroupName = groupName;
            document.getElementById('grupos-cards').style.display = 'none';
            document.getElementById('all-students-list').style.display = 'none'; // Ensure list view is hidden
            grupoStudentsEl.style.display = 'block';
            document.getElementById('grupo-students-title').textContent = `Estudiantes — ${groupName || ''}`;
            
            // Ensure back button works for single group view
            document.getElementById('back-to-groups').style.display = 'inline-block';

        } catch (err) { console.error(err); }
    }

    async function renderAllStudentsList() {
        const listContainer = document.getElementById('all-students-list');
        listContainer.innerHTML = '<p style="text-align:center; padding:20px;">Cargando lista completa...</p>';
        
        try {
            // Ensure groups are loaded
            if (!gruposCache || gruposCache.length === 0) {
                await loadGrupos();
            }

            listContainer.innerHTML = ''; // Clear loading

            if (gruposCache.length === 0) {
                listContainer.innerHTML = '<p>No hay grupos disponibles.</p>';
                return;
            }

            for (const group of gruposCache) {
                // Create Section for Group
                const section = document.createElement('div');
                section.className = 'group-section';
                section.style.marginBottom = '30px';
                section.style.background = '#fff';
                section.style.padding = '15px';
                section.style.borderRadius = '8px';
                section.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';

                const header = document.createElement('h3');
                header.textContent = `${group.Nombre_Grupo} (${group.Nombre_Curso || ''})`;
                header.style.borderBottom = '2px solid #eee';
                header.style.paddingBottom = '10px';
                header.style.marginBottom = '15px';
                header.style.color = '#333';
                section.appendChild(header);

                // Fetch students for this group
                const res = await fetch(`http://localhost:3000/api/grupos/${group.idGrupo}/estudiantes`);
                const students = await res.json();

                if (students && students.length > 0) {
                    const tableContainer = document.createElement('div');
                    tableContainer.className = 'user-table-container';
                    
                    const table = document.createElement('table');
                    table.innerHTML = `
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Edad</th>
                                <th>Último pago realizado</th>
                                <th style="text-align: center;">Estado</th> <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    `;
                    
                    const tbody = table.querySelector('tbody');
                    students.forEach(s => {
                        const tr = createStudentRow(s);
                        if (tr) tbody.appendChild(tr);
                    });

                    tableContainer.appendChild(table);
                    section.appendChild(tableContainer);
                } else {
                    const noData = document.createElement('p');
                    noData.textContent = 'No hay estudiantes en este grupo.';
                    noData.style.color = '#777';
                    noData.style.fontStyle = 'italic';
                    section.appendChild(noData);
                }

                listContainer.appendChild(section);
            }

        } catch (err) {
            console.error(err);
            listContainer.innerHTML = '<p style="color:red;">Error cargando la lista de estudiantes.</p>';
        }
    }

    // --- MODAL DETALLES MODERNO ---
    // --- MODAL DETALLES MODERNO (ACTUALIZADO) ---
    async function openStudentDetails(id) {
        try {
            const res = await fetch(`http://localhost:3000/api/estudiantes/${id}`);
            const data = await res.json();
            if (!data || !data.success) return alert('Error al cargar detalles');
            
            const est = data.estudiante;

            // --- PROCESAR GRUPOS ---
            let gruposStr = 'Sin grupos asignados';
            if (data.grupos && data.grupos.length > 0) {
                gruposStr = data.grupos.map(g => g.Nombre_Grupo).join(', ');
            }

            // --- 1. INYECTAR HTML MODERNO EN EL CUERPO DEL MODAL ---
            const detailsBody = document.getElementById('details-body');
            
            let fechaNac = est.Fecha_Nacimiento ? new Date(est.Fecha_Nacimiento).toISOString().slice(0, 10) : 'N/A';
            
            // Construcción del HTML del Representante (DATOS COMPLETOS)
            let repHtml = '<span style="color:#888; font-style:italic;">No posee representante registrado.</span>';
            if (data.representante) {
                const r = data.representante;
                repHtml = `
                    <div class="info-grid">
                        <div class="info-item"><span class="info-label">Nombre</span><span class="info-value">${r.Nombres} ${r.Apellidos}</span></div>
                        <div class="info-item"><span class="info-label">Parentesco</span><span class="info-value">${r.Parentesco}</span></div>
                        <div class="info-item"><span class="info-label">Cédula</span><span class="info-value">${r.Cedula}</span></div>
                        <div class="info-item"><span class="info-label">Teléfonos</span><span class="info-value">${r.Telefonos || 'N/A'}</span></div>
                        <div class="info-item"><span class="info-label">Correo</span><span class="info-value">${r.Correo || 'N/A'}</span></div>
                        <div class="info-item"><span class="info-label">Dirección</span><span class="info-value">${r.Direccion || 'N/A'}</span></div>
                    </div>
                `;
            }

            // Construcción del HTML de Pagos
            let pagosHtml = '';
            if (data.pagos && data.pagos.length > 0) {
                data.pagos.forEach(p => {
                    const fecha = p.Fecha_pago ? new Date(p.Fecha_pago).toISOString().slice(0, 10) : '';
                    const mes = formatMes(p.Mes_control || p.Mes_referencia, p.Fecha_pago);
                    const mBs = formatMoney(p.Monto_bs, 'Bs');
                    const mUsd = formatMoney(p.Monto_usd, 'USD');
                    
                    pagosHtml += `
                        <tr>
                            <td>${fecha}</td>
                            <td>${mes}</td>
                            <td>${p.Referencia || 'N/A'}</td>
                            <td>${p.Observacion || ''}</td>
                            <td>Bs. ${mBs}</td>
                            <td>$${mUsd}</td>
                        </tr>
                    `;
                });
            } else {
                pagosHtml = '<tr><td colspan="6" style="text-align:center; padding:15px; color:#777;">No hay pagos registrados.</td></tr>';
            }

            // Construcción del HTML de Deudas
            let deudasHtml = '';
            if (data.deudas && data.deudas.length > 0) {
                data.deudas.forEach(d => {
                    const totalPagado = Number(d.Total_Pagado || 0);
                    const montoUsd = Number(d.Monto_usd || 0);
                    const pendiente = montoUsd - totalPagado;
                    
                    deudasHtml += `<tr>
                        <td>${d.Concepto || ''}</td>
                        <td>$${montoUsd.toFixed(2)}</td>
                        <td>${d.Estado || ''} ${pendiente > 0.01 ? `<br><span style="color:red; font-size:0.85em;">(Resta: $${pendiente.toFixed(2)})</span>` : ''}</td>
                    </tr>`;
                });
            } else {
                deudasHtml = '<tr><td colspan="3" style="text-align:center; padding:15px; color:#2e7d32;">¡Excelente! No posee deudas pendientes.</td></tr>';
            }

            // Renderizado Final del Modal
            detailsBody.innerHTML = `
                <div class="detail-section">
                    <h3 class="section-title">Datos Personales</h3>
                    <div class="info-grid">
                        <div class="info-item"><span class="info-label">Nombre Completo</span><span class="info-value">${est.Nombres} ${est.Apellidos}</span></div>
                        <div class="info-item"><span class="info-label">Cédula</span><span class="info-value">${est.Cedula || 'N/A'}</span></div>
                        <div class="info-item"><span class="info-label">Fecha Nacimiento</span><span class="info-value">${fechaNac}</span></div>
                        <div class="info-item"><span class="info-label">Teléfono</span><span class="info-value">${est.Telefono || 'N/A'}</span></div>
                        <div class="info-item"><span class="info-label">Correo</span><span class="info-value">${est.Correo || 'N/A'}</span></div>
                        <div class="info-item"><span class="info-label">Dirección</span><span class="info-value">${est.Direccion || 'N/A'}</span></div>
                        
                        <div class="info-item" style="grid-column: 1 / -1; margin-top:10px; padding:10px; background-color:#e3f2fd; border-radius:6px; border-left: 4px solid #2196f3;">
                            <span class="info-label" style="color:#1565c0;">Grupos Inscritos</span>
                            <div class="info-value" style="font-weight:bold; color:#0d47a1; font-size:1.1em;">${gruposStr}</div>
                        </div>
                    </div>
                </div>

                <div class="detail-section representante-card">
                    <h3 class="section-title" style="border-color: #ffcc80; color: #e65100;">Representante</h3>
                    ${repHtml}
                </div>

                <div class="detail-section">
                    <h3 class="section-title">Historial de Pagos</h3>
                    <div style="overflow-x:auto;">
                        <table class="details-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Mes</th>
                                    <th>Referencia</th>
                                    <th>Observación</th>
                                    <th>Monto Bs</th>
                                    <th>Monto USD</th>
                                </tr>
                            </thead>
                            <tbody>${pagosHtml}</tbody>
                        </table>
                    </div>
                </div>

                <div class="detail-section">
                    <h3 class="section-title">Deudas Pendientes</h3>
                    <table class="details-table">
                        <thead>
                            <tr>
                                <th>Concepto</th>
                                <th>Monto Original</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>${deudasHtml}</tbody>
                    </table>
                </div>
            `;

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
                if (data.success && data.rate) document.getElementById('tasa-input').value = Number(data.rate.Tasa_usd_a_bs).toFixed(2);
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
                tr.innerHTML = `<td style="padding:6px">${h.Fecha_Registro.slice(0,10)}</td><td style="text-align:right">${Number(h.Tasa_Registrada).toFixed(2)}</td>`;
                body.appendChild(tr);
            });
        });
    }
    if (closeTasaHistBtn) closeTasaHistBtn.addEventListener('click', () => tasaHistModal.style.display = 'none');

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

    const backToGroupsBtn = document.getElementById('back-to-groups');
    if (backToGroupsBtn) backToGroupsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('grupo-students').style.display = 'none';
        
        if (currentView === 'cards') {
            document.getElementById('grupos-cards').style.display = 'grid';
            document.getElementById('all-students-list').style.display = 'none';
            renderGroupCards();
        } else {
            document.getElementById('grupos-cards').style.display = 'none';
            document.getElementById('all-students-list').style.display = 'block';
        }
    });

    // --- VIEW TOGGLE LOGIC ---
    const viewCardsBtn = document.getElementById('view-cards-btn');
    const viewListBtn = document.getElementById('view-list-btn');
    const cardsContainer = document.getElementById('grupos-cards');
    const listContainer = document.getElementById('all-students-list');
    const singleGroupContainer = document.getElementById('grupo-students');

    if (viewCardsBtn && viewListBtn) {
        viewCardsBtn.addEventListener('click', () => {
            if (currentView === 'cards') return;
            currentView = 'cards';
            
            viewCardsBtn.classList.add('active');
            viewCardsBtn.style.background = '#fff';
            viewCardsBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            viewCardsBtn.style.color = '#000';
            
            viewListBtn.classList.remove('active');
            viewListBtn.style.background = 'transparent';
            viewListBtn.style.boxShadow = 'none';
            viewListBtn.style.color = '#666';

            listContainer.style.display = 'none';
            singleGroupContainer.style.display = 'none';
            cardsContainer.style.display = 'grid';
            
            renderGroupCards();
        });

        viewListBtn.addEventListener('click', () => {
            if (currentView === 'list') return;
            currentView = 'list';

            viewListBtn.classList.add('active');
            viewListBtn.style.background = '#fff';
            viewListBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            viewListBtn.style.color = '#000';

            viewCardsBtn.classList.remove('active');
            viewCardsBtn.style.background = 'transparent';
            viewCardsBtn.style.boxShadow = 'none';
            viewCardsBtn.style.color = '#666';

            cardsContainer.style.display = 'none';
            singleGroupContainer.style.display = 'none';
            listContainer.style.display = 'block';

            renderAllStudentsList();
        });
    }

    // Cargas iniciales
    await loadGrupos();
    await loadTasa();
    await renderGroupCards();
});