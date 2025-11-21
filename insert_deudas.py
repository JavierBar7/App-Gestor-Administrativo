import re

# Read the file
with open('src/views/estudiantes.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Define the Deudas section to insert
deudas_section = '''
                    <section>
                        <h3>Deudas</h3>
                        <table id="det-deudas-table">
                            <thead>
                                <tr>
                                    <th>Concepto</th>
                                    <th>Monto USD</th>
                                    <th>Fecha Emisión</th>
                                    <th>Vencimiento</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </section>
'''

# Find the position to insert (after the Pagos section, before Historial de Grupos)
pattern = r'(                    </section>\r?\n)\r?\n\r?\n(                    <section>\r?\n                        <h3>Historial de Grupos</h3>)'
replacement = r'\1' + deudas_section + r'\2'

# Replace
new_content = re.sub(pattern, replacement, content)

# Write back
with open('src/views/estudiantes.html', 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(new_content)

print("Deudas section inserted successfully!")
