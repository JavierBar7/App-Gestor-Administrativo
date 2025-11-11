document.addEventListener('DOMContentLoaded', () => {
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
            try {
                const res = await fetch('http://localhost:3000/api/cursos', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (data.success) {
                    cursoMsg.textContent = 'Curso creado correctamente';
                    formCurso.reset();
                    loadCursosIntoSelect();
                } else {
                    cursoMsg.textContent = data.message || 'Error creando curso';
                }
            } catch (err) {
                console.error('Error creando curso:', err);
                cursoMsg.textContent = 'Error al conectar con el servidor';
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
            try {
                const res = await fetch('http://localhost:3000/api/grupos', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (data.success) {
                    grupoMsg.textContent = 'Grupo creado correctamente';
                    formGrupo.reset();
                } else {
                    grupoMsg.textContent = data.message || 'Error creando grupo';
                }
            } catch (err) {
                console.error('Error creando grupo:', err);
                grupoMsg.textContent = 'Error al conectar con el servidor';
            }
        });
    }

});
