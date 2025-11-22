document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const studentId = urlParams.get('studentId');

    if (!studentId) {
        alert('No se especificó un estudiante.');
        window.location.href = 'estudiantes.html';
        return;
    }

    // --- ELEMENTOS DEL DOM ---
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

    // Secciones Dinámicas
    const sectionInscripcion = document.getElementById('opt-inscripcion'); 
    const sectionMensualidad = document.getElementById('opt-mensualidad');
    const sectionDeuda = document.getElementById('opt-deuda');
    const sectionAbono = document.getElementById('opt-abono');
    
    const debtSelect = document.getElementById('pay-deuda-select');
    const deudaInfoTotal = document.getElementById('deuda-info-total');
    const deudaInfoRestante = document.getElementById('deuda-info-restante');
    const conceptoInscripcionInput = document.getElementById('pay-concepto-inscripcion'); 

    // --- ESTADO ---
    let currentTasa = 0;
    let currentGroupId = null;
    let studentGroupNames = [];
    let paymentMethods = [];
    let selectedMethods = new Set(); 
    let studentDebts = []; 

    // --- INICIALIZACIÓN ---
    currentDateEl.textContent = new Date().toLocaleDateString();

    try {
        await loadStudentData();
        await loadTasa();
        await loadPaymentMethods();
    } catch (error) {
        console.error('Error cargando datos:', error);
        alert('Error cargando datos iniciales.');
    }

    // --- EVENT LISTENERS ---
    cancelBtn.addEventListener('click', () => {
        window.location.href = 'estudiantes.html';
    });

    submitBtn.addEventListener('click', handleSubmit);

    // Lógica de Radio Buttons
    const radios = document.getElementsByName('payment-type');
    radios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            handlePaymentTypeChange(e.target.value);
        });
    });

    function handlePaymentTypeChange(type) {
        if(sectionInscripcion) sectionInscripcion.style.display = 'none';
        if(sectionMensualidad) sectionMensualidad.style.display = 'none';
        if(sectionDeuda) sectionDeuda.style.display = 'none';
        if(sectionAbono) sectionAbono.style.display = 'none';

        if (type === 'inscripcion') {
            if(sectionInscripcion) {
                sectionInscripcion.style.display = 'block';
                const gruposStr = studentGroupNames.length > 0 ? studentGroupNames.join(', ') : 'Sin grupo asignado';
                conceptoInscripcionInput.value = `Inscripción (${gruposStr})`;
            }
        } else if (type === 'mensualidad') {
            if(sectionMensualidad) sectionMensualidad.style.display = 'block';
        } else if (type === 'deuda') {
            if(sectionDeuda) sectionDeuda.style.display = 'block';
            loadDebts();
        } else if (type === 'abono') {
            if(sectionAbono) sectionAbono.style.display = 'block';
        }
    }

    if (debtSelect) {
        debtSelect.addEventListener('change', () => {
            const selectedOption = debtSelect.options[debtSelect.selectedIndex];
            if (selectedOption.value) {
                const total = selectedOption.getAttribute('data-total');
                const remaining = selectedOption.getAttribute('data-remaining');
                if (deudaInfoTotal) deudaInfoTotal.textContent = `$${parseFloat(total).toFixed(2)}`;
                if (deudaInfoRestante) deudaInfoRestante.textContent = `$${parseFloat(remaining).toFixed(2)}`;
            } else {
                if (deudaInfoTotal) deudaInfoTotal.textContent = '$0.00';
                if (deudaInfoRestante) deudaInfoRestante.textContent = '$0.00';
            }
        });
    }

    // --- CARGA DE DATOS ---
    async function loadStudentData() {
        try {
            const response = await fetch(`http://localhost:3000/api/estudiantes/${studentId}`);
            const data = await response.json();
            if (data.success) {
                const s = data.estudiante;
                studentNameEl.textContent = `${s.Nombres} ${s.Apellidos}`;
                
                if (data.grupos && data.grupos.length > 0) {
                    studentGroupNames = data.grupos.map(g => g.Nombre_Grupo);
                    if (data.grupos.length === 1) {
                        studentGroupEl.textContent = `Grupo: ${data.grupos[0].Nombre_Grupo}`;
                        currentGroupId = data.grupos[0].idGrupo;
                    } else {
                        studentGroupEl.textContent = `Grupos: ${studentGroupNames.join(', ')}`;
                        currentGroupId = data.grupos[0].idGrupo;
                    }
                } else {
                    studentGroupEl.textContent = 'Grupo: Sin asignar';
                    currentGroupId = null;
                    studentGroupNames = [];
                }
            }
        } catch (e) { console.error("Error loading student", e); }
    }

    async function loadTasa() {
        try {
            const res = await fetch('http://localhost:3000/api/tasa/latest');
            const data = await res.json();
            if (data.success && data.rate) {
                currentTasa = Number(data.rate.Tasa_usd_a_bs);
                tasaDisplayEl.textContent = currentTasa.toFixed(4);
            }
        } catch (e) { console.error('Error loading tasa', e); }
    }

    async function loadPaymentMethods() {
        try {
            const res = await fetch('http://localhost:3000/api/metodos_pagos/metodos');
            const data = await res.json();
            if (Array.isArray(data)) {
                paymentMethods = data;
                renderPaymentMethods();
            } else if (data.success && data.metodos) {
                paymentMethods = data.metodos;
                renderPaymentMethods();
            }
        } catch (e) { console.error('Error loading methods', e); }
    }

    async function loadDebts() {
        try {
            debtSelect.innerHTML = '<option>Cargando...</option>';
            const res = await fetch(`http://localhost:3000/api/estudiantes/${studentId}/deudas`);
            const data = await res.json();
            debtSelect.innerHTML = '<option value="">-- Seleccione --</option>';
            if (data.success && data.deudas) {
                studentDebts = data.deudas;
                studentDebts.forEach(d => {
                    const opt = document.createElement('option');
                    opt.value = d.idDeuda;
                    const montoTotal = Number(d.Monto_usd);
                    const pagado = Number(d.Total_Pagado || 0);
                    const restante = d.esVirtual ? montoTotal : (montoTotal - pagado);
                    opt.textContent = `${d.Concepto} - Pendiente: $${restante.toFixed(2)}`;
                    opt.setAttribute('data-total', montoTotal);
                    opt.setAttribute('data-remaining', restante);
                    debtSelect.appendChild(opt);
                });
            } else {
                const opt = document.createElement('option'); opt.textContent = "No hay deudas pendientes"; debtSelect.appendChild(opt);
            }
        } catch (e) {
            console.error('Error loading debts', e);
            debtSelect.innerHTML = '<option>Error al cargar</option>';
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
        
        let isUsd = false;
        if (isCashUsd || nameLower.includes('usd') || nameLower.includes('dolar')) isUsd = true;
        else if (method.Moneda_asociada && (method.Moneda_asociada.toLowerCase() === 'usd' || method.Moneda_asociada.toLowerCase() === 'dolar')) isUsd = true;

        const needsReference = !isCashUsd && !isEfectivoBs;
        const needsBills = isCashUsd;
        const currencyLabel = isUsd ? 'USD' : 'Bs';

        let html = `<h4>${method.Nombre}</h4>`;
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
        // Campo de referencia (Solo si es necesario)
        if (needsReference) {
            html += `
                <div class="input-group">
                    <label>Referencia / Comprobante <span style="color:red">*</span></label>
                    <input type="text" class="ref-input" placeholder="Obligatorio">
                </div>
            `;
        }
        html += `</div>`;

        if (needsBills) {
            html += `<div class="billetes-section"><label>Detalle de Billetes (Cash USD)</label><div class="billetes-list" id="billetes-list-${id}"></div><button type="button" class="btn-add-billete" style="margin-top:5px; font-size:0.8em; padding:4px 8px;">+ Agregar Billete</button></div>`;
        }

        container.innerHTML = html;
        activeMethodsForms.appendChild(container);

        const amountInput = container.querySelector('.amount-input');
        amountInput.addEventListener('input', (e) => {
            const val = Number(e.target.value);
            const equivSpan = container.querySelector('.equiv-display');
            if (isUsd) equivSpan.textContent = (val * currentTasa).toFixed(2);
            else equivSpan.textContent = (currentTasa > 0 ? val / currentTasa : 0).toFixed(2);
            updateTotals();
        });

        const addBilleteBtn = container.querySelector('.btn-add-billete');
        if (addBilleteBtn) {
            const list = container.querySelector(`#billetes-list-${id}`);
            addBilleteBtn.onclick = () => addBilleteRow(list);
            addBilleteRow(list);
        }
    }

    function addBilleteRow(container) {
        const row = document.createElement('div');
        row.className = 'billete-row';
        row.innerHTML = `<input type="text" placeholder="Serial" class="billete-serial" style="flex:2;"><input type="number" placeholder="Denominación" class="billete-denom" style="flex:1;"><button type="button" class="remove-billete" style="color:red; border:none; background:none; cursor:pointer;">&times;</button>`;
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
            if (isUsd) { totalUsd += val; totalBs += val * currentTasa; }
            else { totalBs += val; totalUsd += (currentTasa > 0 ? val / currentTasa : 0); }
        });
        totalUsdEl.textContent = `$${totalUsd.toFixed(2)} USD`;
        totalBsEl.textContent = `Bs. ${totalBs.toFixed(2)}`;
    }

    async function handleSubmit() {
        if (selectedMethods.size === 0) return alert('Seleccione al menos un método de pago.');

        const paymentType = document.querySelector('input[name="payment-type"]:checked').value;
        let mesReferencia = null;
        let idDeudaSeleccionada = null;
        let conceptoFinal = null;

        // VALIDAR TIPO DE PAGO
        if (paymentType === 'inscripcion') {
            conceptoFinal = document.getElementById('pay-concepto-inscripcion').value;
        } 
        else if (paymentType === 'mensualidad') {
            mesReferencia = document.getElementById('pay-mes-selector').value;
            if (!mesReferencia) return alert('Por favor seleccione el Mes a pagar.');
            conceptoFinal = `Mensualidad ${mesReferencia}`;
        } 
        else if (paymentType === 'deuda') {
            idDeudaSeleccionada = document.getElementById('pay-deuda-select').value;
            if (!idDeudaSeleccionada) return alert('Por favor seleccione una Deuda.');
            if (idDeudaSeleccionada.toString().startsWith('virtual_')) {
                mesReferencia = idDeudaSeleccionada.split('virtual_')[1];
                idDeudaSeleccionada = null;
                conceptoFinal = `Mensualidad ${mesReferencia}`;
            }
        } 
        else if (paymentType === 'abono') {
            const desc = document.getElementById('pay-concepto-abono').value;
            if (!desc || desc.trim() === '') return alert('Por favor escriba el concepto del abono.');
            conceptoFinal = `Abono: ${desc}`;
        }

        const observacion = document.getElementById('pay-observacion').value;
        const payments = [];
        let hasError = false;

        for (const id of selectedMethods) {
            const container = document.getElementById(`method-form-${id}`);
            const amount = Number(container.querySelector('.amount-input').value);
            
            if (amount <= 0) {
                alert('El monto debe ser mayor a 0.');
                hasError = true;
                break;
            }

            const refInput = container.querySelector('.ref-input');
            const referencia = refInput ? refInput.value.trim() : null;

            // --- VALIDACIÓN DE REFERENCIA OBLIGATORIA ---
            // Si el campo de referencia existe (es visible), es obligatorio
            if (refInput && (!referencia || referencia === '')) {
                alert('⚠️ El número de referencia es obligatorio para este método de pago.');
                hasError = true;
                refInput.focus();
                break;
            }

            const isUsd = container.querySelector('.amount-input').dataset.currency === 'usd';
            const billetes = [];
            const billeteRows = container.querySelectorAll('.billete-row');
            billeteRows.forEach(row => {
                const serial = row.querySelector('.billete-serial').value;
                const denom = row.querySelector('.billete-denom').value;
                if (serial && denom) billetes.push({ Codigo_billete: serial, Denominacion: denom });
            });

            payments.push({
                idEstudiante: studentId,
                metodoId: id,
                monto: amount,
                moneda: isUsd ? 'usd' : 'bs',
                referencia: referencia, // Se enviará null si es efectivo/cash (si no hay input)
                billetes: billetes,
                Mes_referencia: mesReferencia,
                idDeuda: idDeudaSeleccionada,
                Concepto_Manual: conceptoFinal,
                Observacion: observacion,
                idGrupo: currentGroupId
            });
        }

        if (hasError) return;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Procesando...';

        try {
            for (const p of payments) {
                const res = await fetch('http://localhost:3000/api/pagos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(p)
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.message || 'Error registrando pago.');
            }
            alert('Pagos registrados exitosamente.');
            window.location.href = 'estudiantes.html';
        } catch (e) {
            console.error(e);
            alert('Error: ' + e.message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Registrar Pago';
        }
    }
});