
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const studentId = urlParams.get('studentId');

    if (!studentId) {
        alert('No se especificó un estudiante.');
        window.location.href = 'estudiantes.html';
        return;
    }

    // Elements
    const studentNameEl = document.getElementById('student-name');
    const studentGroupEl = document.getElementById('student-group');
    const currentDateEl = document.getElementById('current-date');
    const methodsContainer = document.getElementById('methods-container');
    const activeMethodsForms = document.getElementById('active-methods-forms');
    const totalUsdEl = document.getElementById('total-usd');
    const totalBsEl = document.getElementById('total-bs');
    const tasaDisplayEl = document.getElementById('tasa-display');
    const submitBtn = document.getElementById('submit-payment-btn');
    const cancelBtn = document.getElementById('cancel-btn');

    // State
    let currentTasa = 0;
    let currentGroupId = null;
    let paymentMethods = [];
    let selectedMethods = new Set(); // Set of method IDs
    
    // Initialize
    currentDateEl.textContent = new Date().toLocaleDateString();
    
    // Load Data
    try {
        await loadStudentData();
        await loadTasa();
        await loadPaymentMethods();
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Error cargando datos iniciales.');
    }

    // Event Listeners
    cancelBtn.addEventListener('click', () => {
        window.location.href = 'estudiantes.html';
    });

    submitBtn.addEventListener('click', handleSubmit);

    async function loadStudentData() {
        const response = await fetch(`http://localhost:3000/api/estudiantes/${studentId}`);
        const data = await response.json();
        if (data.success) {
            const s = data.estudiante;
            studentNameEl.textContent = `${s.Nombres} ${s.Apellidos}`;
            
            // Groups are returned in the same response
            if (data.grupos && data.grupos.length > 0) {
                const lastGroup = data.grupos[0];
                studentGroupEl.textContent = `Grupo: ${lastGroup.Nombre_Grupo || 'Sin grupo'}`;
                currentGroupId = lastGroup.idGrupo;
            } else {
                studentGroupEl.textContent = 'Grupo: Sin asignar';
                currentGroupId = null;
            }
        }
    }

    async function loadTasa() {
        try {
            const res = await fetch('http://localhost:3000/api/tasa/latest');
            const data = await res.json();
            if (data.success && data.rate) {
                currentTasa = Number(data.rate.Tasa_usd_a_bs);
                tasaDisplayEl.textContent = currentTasa.toFixed(4);
            }
        } catch (e) {
            console.error('Error loading tasa', e);
        }
    }

    async function loadPaymentMethods() {
        try {
            const res = await fetch('http://localhost:3000/api/metodos_pagos/metodos');
            const data = await res.json();
            // The controller returns the array directly
            if (Array.isArray(data)) {
                paymentMethods = data;
                renderPaymentMethods();
            } else if (data.success && data.metodos) {
                 // Fallback if structure changes
                paymentMethods = data.metodos;
                renderPaymentMethods();
            }
        } catch (e) {
            console.error('Error loading methods', e);
        }
    }

    let studentDebts = [];
    const debtSelect = document.getElementById('pay-deuda-select');
    const totalDebtInput = document.getElementById('total-debt-amount');
    const debtRemainingDisplay = document.getElementById('debt-remaining-display');
    const partialSection = document.getElementById('partial-payment-section');
    const paymentTypeRadios = document.getElementsByName('payment-type');

    // Toggle Partial Section
    paymentTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'partial') {
                partialSection.style.display = 'block';
                loadDebts(); // Ensure debts are loaded
            } else {
                partialSection.style.display = 'none';
                debtSelect.value = '';
                totalDebtInput.value = '';
                debtRemainingDisplay.value = '';
                updateRemainingCalc();
            }
        });
    });

    debtSelect.addEventListener('change', () => {
        const idDeuda = debtSelect.value;
        if (idDeuda) {
            const opt = debtSelect.selectedOptions[0];
            totalDebtInput.value = opt.dataset.remaining; 
        } else {
            totalDebtInput.value = '';
        }
        updateRemainingCalc();
    });

    totalDebtInput.addEventListener('input', updateRemainingCalc);

    async function loadDebts() {
        try {
            // Only load if not already loaded
            if (studentDebts.length > 0) return;

            const res = await fetch(`http://localhost:3000/api/estudiantes/${studentId}/deudas`);
            const data = await res.json();
            if (data.success && data.deudas.length > 0) {
                studentDebts = data.deudas;
                
                // Clear existing options except first
                debtSelect.innerHTML = '<option value="">-- Nueva / Otra --</option>';

                studentDebts.forEach(d => {
                    const opt = document.createElement('option');
                    opt.value = d.idDeuda;
                    const remaining = Number(d.Monto_usd) - Number(d.Total_Pagado);
                    // Show Concept and Remaining in dropdown
                    opt.textContent = `${d.Concepto} (Restante: $${remaining.toFixed(2)})`;
                    opt.dataset.remaining = remaining;
                    opt.dataset.original = d.Monto_usd;
                    opt.dataset.paid = d.Total_Pagado;
                    debtSelect.appendChild(opt);
                });
            }
        } catch (e) {
            console.error('Error loading debts', e);
        }
    }

    function updateRemainingCalc() {
        // If not partial mode, do nothing or clear
        const isPartial = document.querySelector('input[name="payment-type"]:checked').value === 'partial';
        if (!isPartial) return;

        const totalDebt = Number(totalDebtInput.value) || 0;
        
        // Calculate total being paid now (in USD)
        let currentPaymentTotalUsd = 0;
        const inputs = document.querySelectorAll('.amount-input');
        inputs.forEach(input => {
            const val = Number(input.value) || 0;
            const isUsd = input.dataset.currency === 'usd';
            if (isUsd) {
                currentPaymentTotalUsd += val;
            } else {
                currentPaymentTotalUsd += (currentTasa > 0 ? val / currentTasa : 0);
            }
        });

        const newRemaining = totalDebt - currentPaymentTotalUsd;
        debtRemainingDisplay.value = `$${newRemaining.toFixed(2)}`;
        
        if (newRemaining < 0) {
            debtRemainingDisplay.style.color = 'red'; // Overpayment
        } else if (newRemaining === 0) {
            debtRemainingDisplay.style.color = 'green'; // Fully paid
        } else {
            debtRemainingDisplay.style.color = 'black'; // Partial
        }
    }

    function renderPaymentMethods() {
        methodsContainer.innerHTML = '';
        paymentMethods.forEach(method => {
            const tab = document.createElement('div');
            tab.className = 'method-tab';
            tab.textContent = method.Nombre;
            tab.dataset.id = method.idMetodos_pago;
            tab.onclick = () => toggleMethod(method);
            methodsContainer.appendChild(tab);
        });
    }

    function toggleMethod(method) {
        const id = method.idMetodos_pago;
        const tab = methodsContainer.querySelector(`.method-tab[data-id="${id}"]`);
        
        if (selectedMethods.has(id)) {
            selectedMethods.delete(id);
            tab.classList.remove('active');
            removeMethodForm(id);
        } else {
            selectedMethods.add(id);
            tab.classList.add('active');
            addMethodForm(method);
        }
        updateTotals();
    }

    function addMethodForm(method) {
        const id = method.idMetodos_pago;
        const container = document.createElement('div');
        container.className = 'payment-details-section';
        container.id = `method-form-${id}`;
        container.dataset.id = id;

        const nameLower = method.Nombre.toLowerCase();
        
        const isCashUsd = nameLower.includes('cash'); 
        const isEfectivoBs = nameLower.includes('efectivo');
        
        // Determine Currency
        let isUsd = false;
        if (isCashUsd || nameLower.includes('usd') || nameLower.includes('dolar')) {
            isUsd = true;
        } else if (method.Moneda_asociada && (method.Moneda_asociada.toLowerCase() === 'usd' || method.Moneda_asociada.toLowerCase() === 'dolar')) {
            isUsd = true;
        }

        // Determine if it needs Reference (Transfers, Pago Movil, Zelle)
        // Cash and Efectivo usually don't have reference.
        const needsReference = !isCashUsd && !isEfectivoBs;

        // Determine if it needs Bill Details (Only Cash USD per request interpretation)
        const needsBills = isCashUsd;

        const currencyLabel = isUsd ? 'USD' : 'Bs';

        let html = `<h4>${method.Nombre}</h4>`;
        
        // Amount Input
        html += `
            <div class="split-payment-row">
                <div class="input-group">
                    <label>Monto (${currencyLabel})</label>
                    <input type="number" class="amount-input" step="0.01" data-id="${id}" data-currency="${isUsd ? 'usd' : 'bs'}">
                </div>
                <div class="input-group">
                    <label>Equivalente: <span class="equiv-display">0.00</span> ${isUsd ? 'Bs' : 'USD'}</label>
                </div>
        `;

        // Reference Input
        if (needsReference) {
            html += `
                <div class="input-group">
                    <label>Referencia / Comprobante</label>
                    <input type="text" class="ref-input">
                </div>
            `;
        }
        html += `</div>`; // End row

        // Cash Bills Section
        if (needsBills) {
            html += `
                <div class="billetes-section">
                    <label>Detalle de Billetes (Cash USD)</label>
                    <div class="billetes-list" id="billetes-list-${id}"></div>
                    <button type="button" class="btn-add-billete" style="margin-top:5px; font-size:0.8em; padding:4px 8px;">+ Agregar Billete</button>
                </div>
            `;
        }

        container.innerHTML = html;
        activeMethodsForms.appendChild(container);

        // Bind events
        const amountInput = container.querySelector('.amount-input');
        amountInput.addEventListener('input', (e) => {
            const val = Number(e.target.value);
            const equivSpan = container.querySelector('.equiv-display');
            if (isUsd) {
                equivSpan.textContent = (val * currentTasa).toFixed(2);
            } else {
                equivSpan.textContent = (currentTasa > 0 ? val / currentTasa : 0).toFixed(2);
            }
            updateTotals();
        });

        const addBilleteBtn = container.querySelector('.btn-add-billete');
        if (addBilleteBtn) {
            const list = container.querySelector(`#billetes-list-${id}`);
            addBilleteBtn.onclick = () => addBilleteRow(list);
            // Add one row by default
            addBilleteRow(list);
        }
    }

    function addBilleteRow(container) {
        const row = document.createElement('div');
        row.className = 'billete-row';
        row.innerHTML = `
            <input type="text" placeholder="Serial" class="billete-serial" style="flex:2;">
            <input type="number" placeholder="Denominación" class="billete-denom" style="flex:1;">
            <button type="button" class="remove-billete" style="color:red; border:none; background:none; cursor:pointer;">&times;</button>
        `;
        row.querySelector('.remove-billete').onclick = () => row.remove();
        container.appendChild(row);
    }

    function removeMethodForm(id) {
        const el = document.getElementById(`method-form-${id}`);
        if (el) el.remove();
    }

    function updateTotals() {
        let totalUsd = 0;
        let totalBs = 0;

        const inputs = document.querySelectorAll('.amount-input');
        inputs.forEach(input => {
            const val = Number(input.value) || 0;
            const isUsd = input.dataset.currency === 'usd';
            
            if (isUsd) {
                totalUsd += val;
                totalBs += val * currentTasa;
            } else {
                totalBs += val;
                totalUsd += (currentTasa > 0 ? val / currentTasa : 0);
            }
        });

        totalUsdEl.textContent = `$${totalUsd.toFixed(2)} USD`;
        totalBsEl.textContent = `Bs. ${totalBs.toFixed(2)}`;
        
        if (typeof updateRemainingCalc === 'function') {
            updateRemainingCalc();
        }
    }

    async function handleSubmit() {
        if (selectedMethods.size === 0) {
            alert('Seleccione al menos un método de pago.');
            return;
        }

        const mesGlobal = document.getElementById('pay-mes-global').value;
        const observacion = document.getElementById('pay-observacion').value;
        const idDeuda = document.getElementById('pay-deuda-select').value || null;
        
        console.log('Form values - Mes:', mesGlobal, 'idGrupo:', currentGroupId, 'idDeuda:', idDeuda);
        
        // Collect data
        const payments = [];
        let hasError = false;

        for (const id of selectedMethods) {
            const container = document.getElementById(`method-form-${id}`);
            const amountInput = container.querySelector('.amount-input');
            const amount = Number(amountInput.value);
            
            if (amount <= 0) {
                alert('El monto debe ser mayor a 0 para todos los métodos seleccionados.');
                hasError = true;
                break;
            }

            const isUsd = amountInput.dataset.currency === 'usd';
            const refInput = container.querySelector('.ref-input');
            const referencia = refInput ? refInput.value : null;

            // Billetes
            const billetes = [];
            const billeteRows = container.querySelectorAll('.billete-row');
            billeteRows.forEach(row => {
                const serial = row.querySelector('.billete-serial').value;
                const denom = row.querySelector('.billete-denom').value;
                if (serial && denom) {
                    billetes.push({ Codigo_billete: serial, Denominacion: denom });
                }
            });

            payments.push({
                idEstudiante: studentId,
                metodoId: id,
                monto: amount,
                moneda: isUsd ? 'usd' : 'bs',
                referencia: referencia,
                billetes: billetes,
                Mes_referencia: mesGlobal, // Optional
                Observacion: observacion,
                idDeuda: idDeuda,
                idGrupo: currentGroupId // Add idGrupo to payload
            });
        }

        if (hasError) return;

        // Send requests sequentially
        submitBtn.disabled = true;
        submitBtn.textContent = 'Procesando...';

        try {
            for (const p of payments) {
                console.log('Sending payment payload:', JSON.stringify(p, null, 2));
                const res = await fetch('http://localhost:3000/api/pagos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(p)
                });
                const data = await res.json();
                if (!data.success) {
                    throw new Error(data.message || 'Error registrando uno de los pagos.');
                }
            }
            alert('Pagos registrados exitosamente.');
            window.location.href = 'estudiantes.html';
        } catch (e) {
            console.error(e);
            alert('Error: ' + e.message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Registrar Venta';
        }
    }
});
