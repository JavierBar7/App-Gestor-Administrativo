// Funcionalidad de búsqueda para grupos en vista de Estudiantes
document.addEventListener('DOMContentLoaded', () => {
    // Crear el input de búsqueda si no existe
    const addStudentBtn = document.getElementById('add-student-btn');
    if (addStudentBtn && !document.getElementById('search-grupos')) {
        const searchContainer = document.createElement('div');
        searchContainer.style.cssText = 'margin: 12px 0; display: flex; gap: 9rem; align-items: center;';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.id = 'search-grupos';
        searchInput.placeholder = 'Buscar grupos por nombre o curso...';
        searchInput.style.cssText = 'flex: 1; max-width: 60%; padding: 10px 15px; border: 1.5px solid #e0e0e0; border-radius: 8px; font-size: 14px; transition: all 0.2s ease;';
        
        searchInput.addEventListener('focus', function() {
            this.style.borderColor = '#2196f3';
            this.style.boxShadow = '0 0 0 3px rgba(33, 150, 243, 0.1)';
        });
        
        searchInput.addEventListener('blur', function() {
            this.style.borderColor = '#e0e0e0';
            this.style.boxShadow = 'none';
        });
        
        // Funcionalidad de filtrado
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const cards = document.querySelectorAll('.group-card');
            
            cards.forEach(card => {
                const text = card.textContent.toLowerCase();
                card.style.display = text.includes(query) ? '' : 'none';
            });
        });
        
        const parentDiv = addStudentBtn.parentElement;
        searchContainer.appendChild(searchInput);
        searchContainer.appendChild(addStudentBtn);
        parentDiv.replaceWith(searchContainer);
    }
});
