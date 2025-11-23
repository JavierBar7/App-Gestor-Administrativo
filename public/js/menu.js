document.addEventListener('DOMContentLoaded', async () => {
    // Attach common sidebar link handlers. Views should include the same sidebar markup.
    const viewUsersBtn = document.getElementById('view-users-btn');
    const viewStudentsBtn = document.getElementById('view-students-btn');
    const viewCursosBtn = document.getElementById('view-cursos-btn');
    const viewDeudoresBtn = document.getElementById('view-deudores-btn'); // <--- NUEVA REFERENCIA
    const logoutBtn = document.getElementById('logout-btn');

    // Check user role and hide "Gestión" menu if not admin
    const userRole = await window.electronAPI.getUserRole();
    console.log('User role from menu.js:', userRole); // Debug log
    
    // Only hide if we're sure the user is NOT admin (role is 2 or other non-1 value)
    // If role is null or 1, show the menu
    if (userRole !== null && userRole !== 1 && viewUsersBtn) {
        // Hide the entire list item containing the "Gestión" link
        const listItem = viewUsersBtn.closest('li');
        if (listItem) {
            listItem.style.display = 'none';
            console.log('Hiding Gestión menu for non-admin user');
        }
    } else {
        console.log('Showing Gestión menu (role is admin or null)');
    }

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