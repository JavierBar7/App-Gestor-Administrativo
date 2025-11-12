// Helpers para render y edición
async function renderCursosList() {
        const container = document.getElementById('cursos-list');
        if (!container) return;
        try {
            const res = await fetch('http://localhost:3000/api/cursos');
            const cursos = await res.json();
            container.innerHTML = '<h3>Cursos</h3>';
            cursos.forEach(c => {
                const div = document.createElement('div');
                div.innerHTML = `<b>${c.Nombre_Curso}</b> (${c.Descripcion_Curso || ''}) <button class="edit-curso" data-id="${c.idCurso}">Editar</button>`;
                container.appendChild(div);
            });
            // Editar curso
            container.querySelectorAll('.edit-curso').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    const curso = cursos.find(c => String(c.idCurso) === String(id));
                    if (!curso) return;
                    document.getElementById('curso-Nombre_Curso').value = curso.Nombre_Curso;
                    document.getElementById('curso-Descripcion_Curso').value = curso.Descripcion_Curso || '';
                    formCurso.setAttribute('data-edit-id', id);
                    cursoMsg.textContent = 'Editando curso...';
                });
            });
        } catch (err) { container.innerHTML = 'Error cargando cursos'; }
    }

    async function renderGruposList() {
        const container = document.getElementById('grupos-list');
        if (!container) return;
        try {
            const res = await fetch('http://localhost:3000/api/grupos');
            const grupos = await res.json();
            container.innerHTML = '<h3>Grupos</h3>';
            grupos.forEach(g => {
                const div = document.createElement('div');
                div.innerHTML = `<b>${g.Nombre_Grupo}</b> (Curso: ${g.idCurso}) <button class="edit-grupo" data-id="${g.idGrupo}">Editar</button>`;
                container.appendChild(div);
            });
            // Editar grupo
            container.querySelectorAll('.edit-grupo').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    const grupo = grupos.find(g => String(g.idGrupo) === String(id));
                    if (!grupo) return;
                    document.getElementById('grupo-idCurso').value = grupo.idCurso;
                    document.getElementById('grupo-Nombre_Grupo').value = grupo.Nombre_Grupo;
                    document.getElementById('grupo-Fecha_inicio').value = grupo.Fecha_inicio ? grupo.Fecha_inicio.slice(0,16) : '';
                    document.getElementById('grupo-Estado').value = grupo.Estado || '';
                    formGrupo.setAttribute('data-edit-id', id);
                    grupoMsg.textContent = 'Editando grupo...';
                });
            });
        } catch (err) { container.innerHTML = 'Error cargando grupos'; }
    }
const modal = document.getElementById('curso-grupo-modal');
const openBtn = document.getElementById('add-curso-grupo-btn');
const closeBtn = document.getElementById('close-curso-grupo');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabs = document.querySelectorAll('.tab');

    // Forms
    const formCurso = document.getElementById('form-curso');
    const formGrupo = document.getElementById('form-grupo');
    const cursoMsg = document.getElementById('curso-msg');
    const grupoMsg = document.getElementById('grupo-msg');
    const grupoSelect = document.getElementById('grupo-idCurso');

    function openModal() { modal.style.display = 'flex'; loadCursosIntoSelect(); }
    function closeModal() { modal.style.display = 'none'; clearMessages(); }
    function clearMessages() { if (cursoMsg) cursoMsg.textContent = ''; if (grupoMsg) grupoMsg.textContent = ''; }

    if (openBtn) openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    // Tabs
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            tabs.forEach(t => { t.classList.remove('active'); t.style.display = 'none'; });
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            const tabEl = document.getElementById(tabId);
            if (tabEl) { tabEl.classList.add('active'); tabEl.style.display = 'block'; }
        });
    });

    async function loadCursosIntoSelect() {
        try {
            const res = await fetch('http://localhost:3000/api/cursos');
            if (!res.ok) throw new Error('No se pudieron cargar los cursos');
            const cursos = await res.json();
            grupoSelect.innerHTML = '<option value="">-- Seleccione un curso --</option>';
            cursos.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.idCurso;
                opt.textContent = `${c.Nombre_Curso} (${c.idCurso})`;
                grupoSelect.appendChild(opt);
            });
        } catch (err) {
            console.error('Error cargando cursos:', err);
            grupoSelect.innerHTML = '<option value="">Error cargando cursos</option>';
        }
    }

    if (formCurso) {
        formCurso.addEventListener('submit', async (e) => {
            e.preventDefault();
            cursoMsg.textContent = '';
            const payload = {
                Nombre_Curso: document.getElementById('curso-Nombre_Curso').value.trim(),
                Descripcion_Curso: document.getElementById('curso-Descripcion_Curso').value.trim()
            };
            if (!payload.Nombre_Curso) { cursoMsg.textContent = 'El nombre del curso es requerido'; return; }
            // Si el form tiene data-edit-id, es edición
            const editId = formCurso.getAttribute('data-edit-id');
            let url = 'http://localhost:3000/api/cursos';
            let method = 'POST';
            if (editId) {
                url += `/${editId}`;
                method = 'PUT';
            }
            try {
                const res = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (data.success) {
                    cursoMsg.textContent = editId ? 'Curso editado correctamente' : 'Curso creado correctamente';
                    formCurso.reset();
                    formCurso.removeAttribute('data-edit-id');
                    loadCursosIntoSelect();
                    renderCursosList();
                    // If we are on the grouped cursos page, refresh it too
                    if (typeof renderGroupedCursos === 'function') renderGroupedCursos();
                } else {
                    cursoMsg.textContent = data.message || (editId ? 'Error editando curso' : 'Error creando curso');
                }
            } catch (err) {
                console.error(editId ? 'Error editando curso:' : 'Error creando curso:', err);
                cursoMsg.textContent = editId ? 'Error al conectar con el servidor (edición)' : 'Error al conectar con el servidor';
            }
        });
    }

    if (formGrupo) {
        formGrupo.addEventListener('submit', async (e) => {
            e.preventDefault();
            grupoMsg.textContent = '';
            const payload = {
                idCurso: Number(document.getElementById('grupo-idCurso').value) || null,
                Nombre_Grupo: document.getElementById('grupo-Nombre_Grupo').value.trim(),
                Fecha_inicio: document.getElementById('grupo-Fecha_inicio').value || null,
                Estado: document.getElementById('grupo-Estado').value.trim() || null
            };
            if (!payload.idCurso) { grupoMsg.textContent = 'Debe seleccionar un curso'; return; }
            if (!payload.Nombre_Grupo) { grupoMsg.textContent = 'Nombre del grupo es requerido'; return; }
            // Si el form tiene data-edit-id, es edición
            const editId = formGrupo.getAttribute('data-edit-id');
            let url = 'http://localhost:3000/api/grupos';
            let method = 'POST';
            if (editId) {
                url += `/${editId}`;
                method = 'PUT';
            }
            try {
                const res = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (data.success) {
                    grupoMsg.textContent = editId ? 'Grupo editado correctamente' : 'Grupo creado correctamente';
                    formGrupo.reset();
                    formGrupo.removeAttribute('data-edit-id');
                    renderGruposList();
                        if (typeof renderGroupedCursos === 'function') renderGroupedCursos();
                } else {
                    grupoMsg.textContent = data.message || (editId ? 'Error editando grupo' : 'Error creando grupo');
                }
            } catch (err) {
                console.error(editId ? 'Error editando grupo:' : 'Error creando grupo:', err);
                grupoMsg.textContent = editId ? 'Error al conectar con el servidor (edición)' : 'Error al conectar con el servidor';
            }
        });
    }

    // Render lists on modal open
    if (openBtn) openBtn.addEventListener('click', () => { renderCursosList(); renderGruposList(); });

// Utility to switch to a specific tab inside the modal
function switchToTab(tabId) {
    tabButtons.forEach(b => b.classList.remove('active'));
    tabs.forEach(t => { t.classList.remove('active'); t.style.display = 'none'; });
    const btn = Array.from(tabButtons).find(b => b.getAttribute('data-tab') === tabId);
    const tabEl = document.getElementById(tabId);
    if (btn) btn.classList.add('active');
    if (tabEl) { tabEl.classList.add('active'); tabEl.style.display = 'block'; }
}

// Render a grouped view (courses with their groups) for a dedicated page
async function renderGroupedCursos() {
    const container = document.getElementById('cursos-grouped');
    if (!container) return;
    container.innerHTML = 'Cargando cursos...';
    try {
        const [resCursos, resGrupos] = await Promise.all([
            fetch('http://localhost:3000/api/cursos'),
            fetch('http://localhost:3000/api/grupos')
        ]);
        const cursos = await resCursos.json();
        const grupos = await resGrupos.json();

        if (!Array.isArray(cursos) || !Array.isArray(grupos)) {
            container.innerHTML = '<p>Error al cargar datos.</p>';
            return;
        }

        container.innerHTML = '';
        cursos.forEach(c => {
            const card = document.createElement('div');
            card.className = 'curso-card';
            const title = document.createElement('h3');
            title.textContent = c.Nombre_Curso + (c.Descripcion_Curso ? (' - ' + c.Descripcion_Curso) : '');
            card.appendChild(title);

            const grupoList = document.createElement('ul');
            const gruposDelCurso = grupos.filter(g => String(g.idCurso) === String(c.idCurso));
            if (gruposDelCurso.length === 0) {
                const li = document.createElement('li');
                li.textContent = 'No hay grupos para este curso.';
                grupoList.appendChild(li);
            } else {
                gruposDelCurso.forEach(g => {
                    const li = document.createElement('li');
                    li.innerHTML = `${g.Nombre_Grupo} &nbsp; <button class="edit-grupo" data-id="${g.idGrupo}">Editar</button>`;
                    grupoList.appendChild(li);
                });
            }

            // Edit curso button
            const editCursoBtn = document.createElement('button');
            editCursoBtn.className = 'edit-curso';
            editCursoBtn.setAttribute('data-id', c.idCurso);
            editCursoBtn.textContent = 'Editar Curso';
            card.appendChild(editCursoBtn);

            card.appendChild(grupoList);
            container.appendChild(card);
        });

        // Attach edit handlers that open the modal and populate fields
        document.querySelectorAll('.edit-curso').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const res = await fetch('http://localhost:3000/api/cursos');
                const cursosAll = await res.json();
                const curso = cursosAll.find(x => String(x.idCurso) === String(id));
                if (!curso) return;
                document.getElementById('curso-Nombre_Curso').value = curso.Nombre_Curso;
                document.getElementById('curso-Descripcion_Curso').value = curso.Descripcion_Curso || '';
                const formCurso = document.getElementById('form-curso');
                formCurso.setAttribute('data-edit-id', id);
                // open modal and switch to curso tab
                if (modal) { modal.style.display = 'flex'; loadCursosIntoSelect(); }
                switchToTab('tab-curso');
                if (document.getElementById('curso-msg')) document.getElementById('curso-msg').textContent = 'Editando curso...';
            });
        });

        document.querySelectorAll('.edit-grupo').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const res = await fetch('http://localhost:3000/api/grupos');
                const gruposAll = await res.json();
                const grupo = gruposAll.find(x => String(x.idGrupo) === String(id));
                if (!grupo) return;
                // populate group fields
                document.getElementById('grupo-idCurso').value = grupo.idCurso;
                document.getElementById('grupo-Nombre_Grupo').value = grupo.Nombre_Grupo;
                document.getElementById('grupo-Fecha_inicio').value = grupo.Fecha_inicio ? grupo.Fecha_inicio.slice(0,16) : '';
                document.getElementById('grupo-Estado').value = grupo.Estado || '';
                const formGrupo = document.getElementById('form-grupo');
                formGrupo.setAttribute('data-edit-id', id);
                if (modal) { modal.style.display = 'flex'; loadCursosIntoSelect(); }
                // switch to grupo tab so user can edit group-specific fields
                switchToTab('tab-grupo');
                if (document.getElementById('grupo-msg')) document.getElementById('grupo-msg').textContent = 'Editando grupo...';
            });
        });

    } catch (err) {
        console.error('Error rendering grouped cursos:', err);
        container.innerHTML = '<p>Error al cargar cursos y grupos.</p>';
    }
}

// Expose grouped renderer globally so pages can call it
window.renderGroupedCursos = renderGroupedCursos;

// Auto-init: if the page includes the modal and lists, wire handlers and initial renders
document.addEventListener('DOMContentLoaded', () => {
    if (openBtn) openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            tabs.forEach(t => { t.classList.remove('active'); t.style.display = 'none'; });
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            const tabEl = document.getElementById(tabId);
            if (tabEl) { tabEl.classList.add('active'); tabEl.style.display = 'block'; }
        });
    });

    // If the page has cursos-list or grupos-list, render them as before
    if (document.getElementById('cursos-list')) renderCursosList();
    if (document.getElementById('grupos-list')) renderGruposList();

    // If the page has the grouped container, render grouped cursos
    if (document.getElementById('cursos-grouped')) renderGroupedCursos();

    // If modal close was used on grouped page, refresh grouped view shortly after
    if (closeBtn) closeBtn.addEventListener('click', () => { setTimeout(() => { if (document.getElementById('cursos-grouped')) renderGroupedCursos(); }, 300); });
});
