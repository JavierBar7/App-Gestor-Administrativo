// Payment Request Tracking for Deudores View
// This script extends the deudores view with payment request tracking functionality

(function() {
    'use strict';

    let originalLoadDeudores = null;
    let solicitudModal = null;

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        createSolicitudModal();
        setupModalHandlers();
        enhanceDeudoresTable();
    });

    // Create the payment request modal
    function createSolicitudModal() {
        const modalHTML = `
            <div id="solicitud-modal" class="modal" style="display:none;">
                <div class="modal-content">
                    <span class="close-button" id="close-solicitud">&times;</span>
                    <h2>Registrar Solicitud de Pago</h2>
                    <form id="solicitud-form" style="margin-top: 20px;">
                        <input type="hidden" id="solicitud-estudiante-id">
                        <input type="hidden" id="solicitud-estudiante-nombre">
                        
                        <div style="margin-bottom: 15px;">
                            <strong id="solicitud-nombre-display" style="color: #2c3e50; font-size: 1.1em;"></strong>
                        </div>
                        
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Tipo de Solicitud:</label>
                        <div style="margin: 10px 0 20px 0;">
                            <label style="margin-right: 15px; cursor: pointer;">
                                <input type="radio" name="tipo" value="WhatsApp" required> 
                                <span style="margin-left: 5px;">WhatsApp</span>
                            </label>
                            <label style="margin-right: 15px; cursor: pointer;">
                                <input type="radio" name="tipo" value="Email"> 
                                <span style="margin-left: 5px;">Email</span>
                            </label>
                            <label style="cursor: pointer;">
                                <input type="radio" name="tipo" value="Llamada"> 
                                <span style="margin-left: 5px;">Llamada</span>
                            </label>
                        </div>
                        
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Fecha de Solicitud:</label>
                        <input type="date" id="solicitud-fecha" required style="width: 100%; padding: 8px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px;">
                        
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Notas (opcional):</label>
                        <textarea id="solicitud-notas" rows="3" style="width: 100%; padding: 8px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;"></textarea>
                        
                        <div style="text-align: right;">
                            <button type="button" id="cancel-solicitud" style="background: #95a5a6; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-right: 10px;">Cancelar</button>
                            <button type="submit" class="btn-pay" style="padding: 10px 20px;">Guardar Solicitud</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        solicitudModal = document.getElementById('solicitud-modal');
    }

    // Setup modal event handlers
    function setupModalHandlers() {
        const closeBtn = document.getElementById('close-solicitud');
        const cancelBtn = document.getElementById('cancel-solicitud');
        const form = document.getElementById('solicitud-form');

        if (closeBtn) {
            closeBtn.addEventListener('click', closeSolicitudModal);
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeSolicitudModal);
        }

        if (form) {
            form.addEventListener('submit', handleSolicitudSubmit);
        }

        // Close on outside click
        window.addEventListener('click', function(event) {
            if (event.target === solicitudModal) {
                closeSolicitudModal();
            }
        });
    }

    // Open solicitud modal
    window.openSolicitudModal = function(idEstudiante, nombreCompleto) {
        document.getElementById('solicitud-estudiante-id').value = idEstudiante;
        document.getElementById('solicitud-estudiante-nombre').value = nombreCompleto;
        document.getElementById('solicitud-nombre-display').textContent = `Estudiante: ${nombreCompleto}`;
        document.getElementById('solicitud-fecha').value = new Date().toISOString().split('T')[0];
        document.getElementById('solicitud-notas').value = '';
        
        // Reset radio buttons
        const radios = document.querySelectorAll('input[name="tipo"]');
        radios.forEach(r => r.checked = false);
        
        solicitudModal.style.display = 'flex';
    };

    // Close solicitud modal
    function closeSolicitudModal() {
        solicitudModal.style.display = 'none';
        document.getElementById('solicitud-form').reset();
    }

    // Handle solicitud form submission
    async function handleSolicitudSubmit(e) {
        e.preventDefault();
        
        const idEstudiante = document.getElementById('solicitud-estudiante-id').value;
        const tipo = document.querySelector('input[name="tipo"]:checked')?.value;
        const fecha = document.getElementById('solicitud-fecha').value;
        const notas = document.getElementById('solicitud-notas').value;

        if (!tipo) {
            alert('Por favor selecciona un tipo de solicitud');
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/estudiantes/${idEstudiante}/solicitudes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    Tipo_Solicitud: tipo,
                    Fecha_Solicitud: fecha,
                    Notas: notas
                })
            });

            const data = await response.json();

            if (data.success) {
                alert('Solicitud registrada exitosamente');
                closeSolicitudModal();
                // Reload the table
                if (window.location.reload) {
                    window.location.reload();
                }
            } else {
                alert('Error al registrar solicitud: ' + (data.message || 'Error desconocido'));
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al registrar solicitud');
        }
    }

    // Enhance deudores table to add solicitud column and button
    function enhanceDeudoresTable() {
        // Wait for table to be loaded
        const checkTable = setInterval(function() {
            const thead = document.querySelector('.user-table-container thead tr');
            const tbody = document.getElementById('deudores-table-body');
            
            if (thead && tbody && tbody.children.length > 0 && tbody.children[0].children.length > 1) {
                clearInterval(checkTable);
                
                // Add header column if not already added
                if (thead.children.length === 4) {
                    const th = document.createElement('th');
                    th.style.textAlign = 'left';
                    th.textContent = 'Última Solicitud';
                    thead.insertBefore(th, thead.children[3]); // Insert before "Acciones"
                }
                
                // Enhance each row
                enhanceTableRows();
            }
        }, 500);

        // Stop checking after 10 seconds
        setTimeout(() => clearInterval(checkTable), 10000);
    }

    // Enhance table rows with solicitud info and button
    async function enhanceTableRows() {
        const tbody = document.getElementById('deudores-table-body');
        if (!tbody) return;

        const rows = tbody.querySelectorAll('tr');
        
        for (const row of rows) {
            const cells = row.children;
            if (cells.length < 4) continue;

            // Extract student ID from existing onclick
            const nameCell = cells[0];
            const onclickAttr = nameCell.getAttribute('onclick');
            if (!onclickAttr) continue;

            const idMatch = onclickAttr.match(/verDetalles\((\d+)/);
            if (!idMatch) continue;

            const idEstudiante = idMatch[1];
            const nombreCompleto = nameCell.textContent.trim();

            // Fetch last solicitud
            try {
                const response = await fetch(`http://localhost:3000/api/estudiantes/${idEstudiante}/solicitudes`);
                const data = await response.json();
                
                let solicitudText = 'Sin solicitudes';
                if (data.success && data.solicitudes && data.solicitudes.length > 0) {
                    const ultima = data.solicitudes[0];
                    const fecha = new Date(ultima.Fecha_Solicitud).toLocaleDateString('es-ES');
                    solicitudText = `${ultima.Tipo_Solicitud} - ${fecha}`;
                }

                // Insert solicitud cell before actions
                const solicitudCell = document.createElement('td');
                solicitudCell.textContent = solicitudText;
                solicitudCell.style.fontSize = '0.9em';
                row.insertBefore(solicitudCell, cells[3]);

                // Add solicitud button to actions cell
                const actionsCell = cells[4]; // Now it's the 5th cell
                const solicitudBtn = document.createElement('button');
                solicitudBtn.textContent = 'Registrar Solicitud';
                solicitudBtn.className = 'btn-pay';
                solicitudBtn.style.marginLeft = '8px';
                solicitudBtn.style.background = '#3498db';
                solicitudBtn.onclick = function() {
                    openSolicitudModal(idEstudiante, nombreCompleto);
                };
                actionsCell.appendChild(solicitudBtn);

            } catch (error) {
                console.error('Error fetching solicitudes:', error);
                // Insert empty cell on error
                const solicitudCell = document.createElement('td');
                solicitudCell.textContent = 'Error';
                row.insertBefore(solicitudCell, cells[3]);
            }
        }
    }

})();
