document.addEventListener('DOMContentLoaded', () => {
    // Attach common sidebar link handlers. Views should include the same sidebar markup.
    const viewUsersBtn = document.getElementById('view-users-btn');
    const viewStudentsBtn = document.getElementById('view-students-btn');
    const viewCursosBtn = document.getElementById('view-cursos-btn');
    const logoutBtn = document.getElementById('logout-btn');

    if (viewUsersBtn) viewUsersBtn.addEventListener('click', (e) => { e.preventDefault(); window.electronAPI.navigateToDashboard(); });
    if (viewStudentsBtn) viewStudentsBtn.addEventListener('click', (e) => { e.preventDefault(); window.electronAPI.navigateToEstudiantes(); });
    if (viewCursosBtn) viewCursosBtn.addEventListener('click', (e) => { e.preventDefault(); window.electronAPI.navigateToCursos(); });
    if (logoutBtn) logoutBtn.addEventListener('click', (e) => { e.preventDefault(); window.electronAPI.logout(); });
});
