const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'js', 'estudiantes.js');
let content = fs.readFileSync(filePath, 'utf8');

// The exact code we're looking for (with \r\n line endings)
const searchPattern = "                        // calcular edad a partir de Fecha_Nacimiento\r\n" +
                      "                        let edadDisplay = '—';\r\n" +
                      "                        try {\r\n" +
                      "                            if (s.Fecha_Nacimiento) {\r\n" +
                      "                                const calc = calcularEdad(s.Fecha_Nacimiento);\r\n" +
                      "                                edadDisplay = isNaN(calc) ? '—' : calc;\r\n" +
                      "                            }\r\n" +
                      "                        } catch (e) {\r\n" +
                      "                            edadDisplay = '—';\r\n" +
                      "                        }\r\n" +
                      "\r\n" +
                      "                        tr.innerHTML = `\r\n" +
                      "                            <td class=\"student-name\" data-id=\"${s.idEstudiante}\" style=\"cursor:pointer;color:blue;text-decoration:underline;\">${s.Nombres || ''} ${s.Apellidos || ''}</td>\r\n" +
                      "                            <td>${edadDisplay}</td>\r\n" +
                      "                            <td>—</td>\r\n" +
                      "                            <td>\r\n" +
                      "                                <button class=\"edit-student\" data-id=\"${s.idEstudiante}\">Editar</button>\r\n" +
                      "                                <button class=\"register-payment\" data-id=\"${s.idEstudiante}\" style=\"margin-left:8px;\">Registrar Pago</button>\r\n" +
                      "                            </td>\r\n" +
                      "                        `;";

// NEW replacement with default "Deuda" logic
const replacement = "                        // Usar edad del backend\r\n" +
                    "                        let edadDisplay = '—';\r\n" +
                    "                        if (s.edad !== null && s.edad !== undefined) {\r\n" +
                    "                            edadDisplay = s.edad;\r\n" +
                    "                        }\r\n" +
                    "\r\n" +
                    "                        // Last Payment Display\r\n" +
                    "                        let lastPayDisplay = '—';\r\n" +
                    "                        if (s.lastPayment) {\r\n" +
                    "                            const p = s.lastPayment;\r\n" +
                    "                            const metodo = p.Metodo || 'Pago';\r\n" +
                    "                            const monto = p.Monto_usd ? `$${p.Monto_usd}` : (p.Monto_bs ? `Bs.${p.Monto_bs}` : '');\r\n" +
                    "                            const ref = p.Referencia ? `Ref: ${p.Referencia}` : '';\r\n" +
                    "                            const mes = p.Mes_Pagado ? `Mes: ${formatMes(p.Mes_Pagado)}` : '';\r\n" +
                    "                            \r\n" +
                    "                            // Combine parts\r\n" +
                    "                            let details = [];\r\n" +
                    "                            if (ref) details.push(ref);\r\n" +
                    "                            if (mes) details.push(mes);\r\n" +
                    "                            const detailStr = details.length ? `(${details.join(' - ')})` : '';\r\n" +
                    "                            \r\n" +
                    "                            lastPayDisplay = `<strong>${metodo}:</strong> ${monto} <small>${detailStr}</small>`;\r\n" +
                    "                        }\r\n" +
                    "\r\n" +
                    "                        // Pending Debt Display - Default is Deuda\r\n" +
                    "                        let debtDisplay = '<span style=\"color:red; font-weight:bold;\">Deuda</span>';\r\n" +
                    "                        if (s.pendingDebt && Number(s.pendingDebt) > 0) {\r\n" +
                    "                            // Show specific debt amount\r\n" +
                    "                            debtDisplay = `<span style=\"color:red; font-weight:bold;\">$${Number(s.pendingDebt).toFixed(2)}</span>`;\r\n" +
                    "                        } else if (s.pendingDebt === 0 || s.pendingDebt === '0') {\r\n" +
                    "                            // Only show Solvente if explicitly no debt\r\n" +
                    "                            debtDisplay = '<span style=\"color:green;\">Solvente</span>';\r\n" +
                    "                        }\r\n" +
                    "\r\n" +
                    "                        tr.innerHTML = `\r\n" +
                    "                            <td class=\"student-name\" data-id=\"${s.idEstudiante}\" style=\"cursor:pointer;color:blue;text-decoration:underline;\">${s.Nombres || ''} ${s.Apellidos || ''}</td>\r\n" +
                    "                            <td>${edadDisplay}</td>\r\n" +
                    "                            <td>${lastPayDisplay}</td>\r\n" +
                    "                            <td>${debtDisplay}</td>\r\n" +
                    "                            <td>\r\n" +
                    "                                <button class=\"edit-student\" data-id=\"${s.idEstudiante}\">Editar</button>\r\n" +
                    "                                <button class=\"register-payment\" data-id=\"${s.idEstudiante}\" style=\"margin-left:8px;\">Registrar Pago</button>\r\n" +
                    "                            </td>\r\n" +
                    "                        `;";

if (content.includes(searchPattern)) {
    content = content.replace(searchPattern, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Successfully updated estudiantes.js with default "Deuda" logic');
} else {
    console.log('❌ Pattern not found in file');
    console.log('Checking if already updated...');
    if (content.includes('Default is Deuda')) {
        console.log('✅ File already has the updated "Deuda" logic');
    } else if (content.includes('s.lastPayment')) {
        console.log('⚠️  File has lastPayment code but not the new Deuda logic');
    } else {
        console.log('❌ File needs manual update');
    }
}
