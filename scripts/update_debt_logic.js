const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'js', 'estudiantes.js');
let content = fs.readFileSync(filePath, 'utf8');

// Find and replace the debt display logic
const oldDebtLogic = "                        // Pending Debt Display\r\n" +
                     "                        let debtDisplay = '—';\r\n" +
                     "                        if (s.pendingDebt && Number(s.pendingDebt) > 0) {\r\n" +
                     "                            debtDisplay = `<span style=\"color:red; font-weight:bold;\">$${Number(s.pendingDebt).toFixed(2)}</span>`;\r\n" +
                     "                        } else {\r\n" +
                     "                            debtDisplay = '<span style=\"color:green;\">Solvente</span>';\r\n" +
                     "                        }";

const newDebtLogic = "                        // Pending Debt Display - Default is Deuda\r\n" +
                     "                        let debtDisplay = '<span style=\"color:red; font-weight:bold;\">Deuda</span>';\r\n" +
                     "                        if (s.pendingDebt && Number(s.pendingDebt) > 0) {\r\n" +
                     "                            // Show specific debt amount\r\n" +
                     "                            debtDisplay = `<span style=\"color:red; font-weight:bold;\">$${Number(s.pendingDebt).toFixed(2)}</span>`;\r\n" +
                     "                        } else if (s.pendingDebt === 0 || s.pendingDebt === '0') {\r\n" +
                     "                            // Only show Solvente if explicitly no debt\r\n" +
                     "                            debtDisplay = '<span style=\"color:green;\">Solvente</span>';\r\n" +
                     "                        }";

if (content.includes(oldDebtLogic)) {
    content = content.replace(oldDebtLogic, newDebtLogic);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Successfully updated debt display logic in estudiantes.js');
} else {
    console.log('❌ Pattern not found. Checking current state...');
    if (content.includes('Default is Deuda')) {
        console.log('✅ File already has the updated debt logic');
    } else {
        console.log('❌ Manual intervention needed');
    }
}
