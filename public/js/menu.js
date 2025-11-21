document.addEventListener('DOMContentLoaded', () => {
    // Attach common sidebar link handlers. Views should include the same sidebar markup.
    const viewUsersBtn = document.getElementById('view-users-btn');
    const viewStudentsBtn = document.getElementById('view-students-btn');
    const viewCursosBtn = document.getElementById('view-cursos-btn');
    const viewDeudoresBtn = document.getElementById('view-deudores-btn'); // <--- NUEVA REFERENCIA
    const logoutBtn = document.getElementById('logout-btn');

    if (viewUsersBtn) viewUsersBtn.addEventListener('click', (e) => { e.preventDefault(); window.electronAPI.navigateToDashboard(); });
    if (viewStudentsBtn) viewStudentsBtn.addEventListener('click', (e) => { e.preventDefault(); window.electronAPI.navigateToEstudiantes(); });
    if (viewCursosBtn) viewCursosBtn.addEventListener('click', (e) => { e.preventDefault(); window.electronAPI.navigateToCursos(); });
    
    // --- NUEVO EVENTO PARA DEUDORES ---
    if (viewDeudoresBtn) viewDeudoresBtn.addEventListener('click', (e) => { 
        e.preventDefault(); 
        window.electronAPI.navigateToDeudores(); 
    });

    if (logoutBtn) logoutBtn.addEventListener('click', (e) => { e.preventDefault(); window.electronAPI.logout(); });
});