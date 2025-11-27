// Funcionalidad de búsqueda mejorada para estudiantes y grupos
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-grupos');

    if (searchInput) {
        // Estilos de foco
        searchInput.addEventListener('focus', function() {
            this.style.borderColor = '#2196f3';
            this.style.boxShadow = '0 0 0 3px rgba(33, 150, 243, 0.1)';
        });
        
        searchInput.addEventListener('blur', function() {
            this.style.borderColor = '#ddd';
            this.style.boxShadow = 'none';
        });
        
        // Funcionalidad de filtrado mejorada
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            
            // Filtrar en Vista de Tarjetas (grupos)
            const cards = document.querySelectorAll('.group-card');
            cards.forEach(card => {
                const text = card.textContent.toLowerCase();
                card.style.display = text.includes(query) ? '' : 'none';
            });

            // Filtrar en Vista de Lista (estudiantes agrupados)
            const listSections = document.querySelectorAll('#all-students-list > div');
            listSections.forEach(section => {
                // Buscar en el nombre del grupo (header)
                const groupHeader = section.querySelector('h3');
                const groupName = groupHeader ? groupHeader.textContent.toLowerCase() : '';
                
                // Buscar en los nombres de estudiantes (filas de la tabla)
                const studentRows = section.querySelectorAll('tbody tr');
                let hasVisibleStudents = false;
                
                studentRows.forEach(row => {
                    const studentName = row.querySelector('.student-name');
                    const studentText = studentName ? studentName.textContent.toLowerCase() : '';
                    
                    // Mostrar fila si coincide con el nombre del estudiante o del grupo
                    if (studentText.includes(query) || groupName.includes(query)) {
                        row.style.display = '';
                        hasVisibleStudents = true;
                    } else {
                        row.style.display = 'none';
                    }
                });
                
                // Mostrar/ocultar toda la sección del grupo
                // Si hay estudiantes visibles O si el nombre del grupo coincide, mostrar la sección
                if (hasVisibleStudents || groupName.includes(query) || query === '') {
                    section.style.display = '';
                } else {
                    section.style.display = 'none';
                }
            });

            // Filtrar en Vista de Grupo Individual (tabla de estudiantes de un grupo específico)
            const singleGroupRows = document.querySelectorAll('#students-table-body tr');
            singleGroupRows.forEach(row => {
                const studentName = row.querySelector('.student-name');
                const studentText = studentName ? studentName.textContent.toLowerCase() : '';
                
                if (studentText.includes(query) || query === '') {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
});
