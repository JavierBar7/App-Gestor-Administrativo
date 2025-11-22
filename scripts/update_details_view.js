const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'js', 'estudiantes.js');

try {
    let content = fs.readFileSync(filePath, 'utf8');

    // La nueva función optimizada con Grupos y Datos Completos del Representante
    const newFunction = `
    // --- MODAL DETALLES MODERNO (ACTUALIZADO) ---
    async function openStudentDetails(id) {
        try {
            const res = await fetch(\`http://localhost:3000/api/estudiantes/\${id}\`);
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
                repHtml = \`
                    <div class="info-grid">
                        <div class="info-item"><span class="info-label">Nombre</span><span class="info-value">\${r.Nombres} \${r.Apellidos}</span></div>
                        <div class="info-item"><span class="info-label">Parentesco</span><span class="info-value">\${r.Parentesco}</span></div>
                        <div class="info-item"><span class="info-label">Cédula</span><span class="info-value">\${r.Cedula}</span></div>
                        <div class="info-item"><span class="info-label">Teléfonos</span><span class="info-value">\${r.Telefonos || 'N/A'}</span></div>
                        <div class="info-item"><span class="info-label">Correo</span><span class="info-value">\${r.Correo || 'N/A'}</span></div>
                        <div class="info-item"><span class="info-label">Dirección</span><span class="info-value">\${r.Direccion || 'N/A'}</span></div>
                    </div>
                \`;
            }

            // Construcción del HTML de Pagos
            let pagosHtml = '';
            if (data.pagos && data.pagos.length > 0) {
                data.pagos.forEach(p => {
                    const fecha = p.Fecha_pago ? new Date(p.Fecha_pago).toISOString().slice(0, 10) : '';
                    const mes = formatMes(p.Mes_control || p.Mes_referencia, p.Fecha_pago);
                    const mBs = formatMoney(p.Monto_bs, 'Bs');
                    const mUsd = formatMoney(p.Monto_usd, 'USD');
                    
                    pagosHtml += \`
                        <tr>
                            <td>\${fecha}</td>
                            <td>\${mes}</td>
                            <td>\${p.Referencia || 'N/A'}</td>
                            <td>\${p.Observacion || ''}</td>
                            <td>Bs. \${mBs}</td>
                            <td>$\${mUsd}</td>
                        </tr>
                    \`;
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
                    
                    deudasHtml += \`<tr>
                        <td>\${d.Concepto || ''}</td>
                        <td>$\${montoUsd.toFixed(2)}</td>
                        <td>\${d.Estado || ''} \${pendiente > 0.01 ? \`<br><span style="color:red; font-size:0.85em;">(Resta: $\${pendiente.toFixed(2)})</span>\` : ''}</td>
                    </tr>\`;
                });
            } else {
                deudasHtml = '<tr><td colspan="3" style="text-align:center; padding:15px; color:#2e7d32;">¡Excelente! No posee deudas pendientes.</td></tr>';
            }

            // Renderizado Final del Modal
            detailsBody.innerHTML = \`
                <div class="detail-section">
                    <h3 class="section-title">Datos Personales</h3>
                    <div class="info-grid">
                        <div class="info-item"><span class="info-label">Nombre Completo</span><span class="info-value">\${est.Nombres} \${est.Apellidos}</span></div>
                        <div class="info-item"><span class="info-label">Cédula</span><span class="info-value">\${est.Cedula || 'N/A'}</span></div>
                        <div class="info-item"><span class="info-label">Fecha Nacimiento</span><span class="info-value">\${fechaNac}</span></div>
                        <div class="info-item"><span class="info-label">Teléfono</span><span class="info-value">\${est.Telefono || 'N/A'}</span></div>
                        <div class="info-item"><span class="info-label">Correo</span><span class="info-value">\${est.Correo || 'N/A'}</span></div>
                        <div class="info-item"><span class="info-label">Dirección</span><span class="info-value">\${est.Direccion || 'N/A'}</span></div>
                        
                        <div class="info-item" style="grid-column: 1 / -1; margin-top:10px; padding:10px; background-color:#e3f2fd; border-radius:6px; border-left: 4px solid #2196f3;">
                            <span class="info-label" style="color:#1565c0;">Grupos Inscritos</span>
                            <div class="info-value" style="font-weight:bold; color:#0d47a1; font-size:1.1em;">\${gruposStr}</div>
                        </div>
                    </div>
                </div>

                <div class="detail-section representante-card">
                    <h3 class="section-title" style="border-color: #ffcc80; color: #e65100;">Representante</h3>
                    \${repHtml}
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
                            <tbody>\${pagosHtml}</tbody>
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
                        <tbody>\${deudasHtml}</tbody>
                    </table>
                </div>
            \`;

            document.getElementById('student-details-modal').style.display = 'flex';
        } catch (err) { console.error(err); }
    }
    `;

    // Encontrar el inicio de la función antigua
    const startMarker = 'async function openStudentDetails(id) {';
    const endMarker = 'async function openEditStudentModal(id) {';

    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker);

    if (startIndex === -1 || endIndex === -1) {
        console.error('❌ No se pudo encontrar la función original para reemplazar.');
        process.exit(1);
    }

    // Reconstruir el archivo reemplazando la función
    const newContent = content.substring(0, startIndex) + newFunction.trim() + '\n\n    ' + content.substring(endIndex);

    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('✅ Vista de detalles actualizada:');
    console.log('   - Grupos agregados a Datos Personales');
    console.log('   - Correo y Dirección agregados a Representante');

} catch (err) {
    console.error('❌ Error:', err);
}