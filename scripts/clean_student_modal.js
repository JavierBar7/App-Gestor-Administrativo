const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'views', 'estudiantes.html');
let content = fs.readFileSync(filePath, 'utf8');

// The unwanted content that needs to be removed (curso/grupo creation buttons and forms)
const unwantedContent = `                <button class="tab-btn active" data-tab="tab-curso">Crear Curso</button>\r
                <button class="tab-btn" data-tab="tab-grupo">Crear Grupo</button>\r
            </div>\r
\r
            <div id="tab-curso" class="tab active">\r
                <form id="form-curso">\r
                    <div class="input-group">\r
                        <label>Nombre del Curso</label>\r
                        <input type="text" id="curso-Nombre_Curso" required maxlength="50">\r
                    </div>\r
                    <div class="input-group">\r
                        <label>Descripción</label>\r
                        <input type="text" id="curso-Descripcion_Curso" maxlength="50">\r
                    </div>\r
                    <button type="submit">Crear Curso</button>\r
                    <p id="curso-msg" class="info-message"></p>\r
                </form>\r
            </div>\r
\r
            <div id="tab-grupo" class="tab" style="display:none;">\r
                <form id="form-grupo">\r
                    <div class="input-group">\r
                        <label>Curso</label>\r
                        <select id="grupo-idCurso" required>\r
                            <option value="">-- Seleccione un curso --</option>\r
                        </select>\r
                    </div>\r
                    <div class="input-group">\r
                        <label>Nombre del Grupo</label>\r
                        <input type="text" id="grupo-Nombre_Grupo" required maxlength="50">\r
                    </div>\r
                    <div class="input-group">\r
                        <label>Fecha inicio</label>\r
                        <input type="datetime-local" id="grupo-Fecha_inicio">\r
                    </div>\r
                    <div class="input-group">\r
                        <label>Estado</label>\r
                        <input type="text" id="grupo-Estado" maxlength="50">\r
                    </div>\r
                    <button type="submit">Crear Grupo</button>\r
                    <p id="grupo-msg" class="info-message"></p>\r
                </form>\r
            </div>\r
        </div>\r
    </div>`;

// What should remain (just closing the form properly)
const replacement = `            </form>\r
        </div>\r
    </div>`;

if (content.includes(unwantedContent)) {
    content = content.replace(unwantedContent, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Successfully cleaned student modal - removed curso/grupo creation elements');
} else {
    console.log('❌ Pattern not found. Checking if already cleaned...');
    if (!content.includes('tab-btn active')) {
        console.log('✅ File appears to already be cleaned (no tab buttons found)');
    } else {
        console.log('⚠️  File structure may be different than expected');
    }
}
