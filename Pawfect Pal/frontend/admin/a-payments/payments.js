let currentMethod = 'cash'; 
const partialBalances = {};

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function setEmptyState(show) {
    const tableElement = document.querySelector('.payment-table');
    const emptyState = document.getElementById('no-payments');
    if (show) {
        tableElement.style.display = "none";
        emptyState.style.display = "block";
    } else {
        tableElement.style.display = "table";
        emptyState.style.display = "none";
    }
}

function switchMethod(method) {
    currentMethod = method;

    const btnCash = document.getElementById('btnCash');
    const btnGcash = document.getElementById('btnGcash');
    const cashReceivedGroup = document.getElementById('cashReceivedGroup');
    const gcashAmountGroup = document.getElementById('gcashAmountGroup');
    const changeSection = document.getElementById('changeSection');
    const gcashSection = document.getElementById('gcashSection');
    const submitBtn = document.getElementById('submitPaymentBtn');

    if (method === 'cash') {
        btnCash.classList.add('active');
        btnGcash.classList.remove('active');
        cashReceivedGroup.style.display = '';
        gcashAmountGroup.style.display = 'none';
        changeSection.style.display = '';
        gcashSection.style.display = 'none';
        submitBtn.textContent = '+ Record Cash Payment';
        document.getElementById('gcashName').value = '';
        document.getElementById('gcashRef').value = '';
        document.getElementById('gcashAmountPaid').value = '';
    } else {
        btnGcash.classList.add('active');
        btnCash.classList.remove('active');
        cashReceivedGroup.style.display = 'none';
        gcashAmountGroup.style.display = '';
        changeSection.style.display = 'none';
        gcashSection.style.display = '';
        submitBtn.textContent = '+ Record GCash Payment';
        document.getElementById('cashReceived').value = '';
        document.getElementById('payChange').value = '0.00';
    }
}

function autoPopulateDetails() {
    const select = document.getElementById('appointmentSelect');
    const selectedOption = select.options[select.selectedIndex];
    const appointmentId = select.value;

    const user = selectedOption.getAttribute('data-user') || "";
    const pet = selectedOption.getAttribute('data-pet') || "";

    let amount;
    if (partialBalances[appointmentId] !== undefined) {
        amount = partialBalances[appointmentId].toFixed(2);
    } else {
        amount = selectedOption.getAttribute('data-amount') || "0.00";
    }

    document.getElementById('payUser').value = user;
    document.getElementById('payPet').value = pet;
    document.getElementById('payAmount').value = amount;

    document.getElementById('cashReceived').value = "";
    document.getElementById('gcashAmountPaid').value = "";
    document.getElementById('payChange').value = "0.00";
}

function calculateChange() {
    const amountDue = parseFloat(document.getElementById('payAmount').value) || 0;
    const cashReceived = parseFloat(document.getElementById('cashReceived').value) || 0;
    const change = cashReceived - amountDue;
    document.getElementById('payChange').value = change > 0 ? change.toFixed(2) : "0.00";
}

function addTransactionRow({ paymentId, user, pet, appointmentId, method, amountPaid, isPartial, remainingBalance }) {
    const tbody = document.getElementById('transactionBody');
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const methodClass = method === 'gcash' ? 'gcash' : 'cash';
    const methodLabel = method === 'gcash' ? 'GCash' : 'Cash';

    const partialHtml = isPartial
        ? `<br><span class="partial-badge">Partial</span>
           <span class="balance-due">Bal: P ${remainingBalance.toFixed(2)}</span>`
        : '';

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${paymentId}</td>
        <td><div class="user-cell">${user}</div></td>
        <td><div class="pet-cell">${pet}</div></td>
        <td>${appointmentId}</td>
        <td>${dateStr}, ${timeStr}</td>
        <td><span class="method-tag ${methodClass}">${methodLabel}</span></td>
        <td>
            <strong>P ${parseFloat(amountPaid).toFixed(2)}</strong>
            ${partialHtml}
        </td>
    `;

    tbody.appendChild(row);
    setEmptyState(false);
}

async function openDuePaymentsModal() {
    const modal = document.getElementById('mainModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.innerText = "Appointments with Pending Payments";

    const select = document.getElementById('appointmentSelect');
    const options = Array.from(select.options).filter(o => o.value);

    if (options.length === 0) {
        modalBody.innerHTML = `<p style="text-align:center; color: var(--text-muted); padding: 30px 0;">No pending appointments found.</p>`;
        modal.style.display = "flex";
        return;
    }

    let html = `
        <table class="payment-table" style="width: 100%;">
            <thead>
                <tr>
                    <th>Appointment ID</th>
                    <th>User</th>
                    <th>Pet</th>
                    <th>Amount Due</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
    `;

    options.forEach(opt => {
        const id = opt.value;
        const user = opt.getAttribute('data-user') || '—';
        const pet = opt.getAttribute('data-pet') || '—';
        const originalAmount = parseFloat(opt.getAttribute('data-amount')) || 0;
        const remaining = partialBalances[id] !== undefined ? partialBalances[id] : originalAmount;

        const statusHtml = partialBalances[id] !== undefined
            ? `<span class="remaining-badge">Partial — P ${remaining.toFixed(2)} left</span>`
            : `<span style="color: var(--text-muted); font-size: 13px;">Unpaid</span>`;

        html += `
            <tr>
                <td>${id}</td>
                <td>${user}</td>
                <td>${pet}</td>
                <td><strong>P ${remaining.toFixed(2)}</strong></td>
                <td>${statusHtml}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    modalBody.innerHTML = html;
    modal.style.display = "flex";
}

function showPaymentSuccessModal(appointmentId, amountDue, amountPaid, method, gcashName, gcashRef) {
    const modal = document.getElementById('paymentAlertModal');
    const title = document.getElementById('alertTitle');
    const message = document.getElementById('alertMessage');
    const button = document.getElementById('alertBtn');

    const due = parseFloat(amountDue);
    const paid = parseFloat(amountPaid);
    const balance = due - paid;
    const isPartial = balance > 0.001;

    title.style.color = "var(--primary-purple)";

    let extraInfo = '';
    if (method === 'gcash') {
        extraInfo = `<br><span style="color: var(--text-muted); font-size: 13px;">GCash: ${gcashName} &middot; Ref# ${gcashRef}</span>`;
    }

    if (isPartial) {
        title.innerText = "Partial Payment Recorded";
        message.innerHTML = `
            Payment for <strong>${appointmentId}</strong> recorded.<br>
            Paid: <strong>P ${paid.toFixed(2)}</strong> via ${method === 'gcash' ? 'GCash' : 'Cash'}
            ${extraInfo}<br>
            <span style="color: #ff5e78; font-weight: bold; margin-top: 6px; display:inline-block;">
                Remaining Balance: P ${balance.toFixed(2)}
            </span>`;
    } else {
        title.innerText = "Payment Successful!";
        message.innerHTML = `
            Transaction for <strong>${appointmentId}</strong> completed.<br>
            Amount: <strong>P ${paid.toFixed(2)}</strong> via ${method === 'gcash' ? 'GCash' : 'Cash'}
            ${extraInfo}`;
    }

    button.innerText = "Done";
    button.style.backgroundColor = "var(--primary-purple)";
    button.onclick = () => {
        modal.style.display = 'none';
        resetForm();
    };
    modal.style.display = "flex";
}

function showPaymentErrorModal(header, text) {
    const modal = document.getElementById('paymentAlertModal');
    const title = document.getElementById('alertTitle');
    const message = document.getElementById('alertMessage');
    const button = document.getElementById('alertBtn');

    title.innerText = header;
    title.style.color = "#ff5e78";
    message.innerText = text;
    button.innerText = "Try Again";
    button.style.backgroundColor = "#ff5e78";
    button.onclick = () => { modal.style.display = 'none'; };
    modal.style.display = "flex";
}

function resetForm() {
    document.getElementById('cashPaymentForm').reset();
    document.getElementById('payChange').value = "0.00";
    switchMethod('cash');
}

/* ---------- GENERATE PAYMENT ID ---------- */
function generatePaymentId() {
    return 'PAY-' + Date.now().toString().slice(-6);
}

document.addEventListener("DOMContentLoaded", () => {
    if (typeof initImageLoading === 'function') initImageLoading();

    const searchInput = document.querySelector('.table-filters .search-box input');
    const methodFilter = document.querySelector('.table-method-filter');
    const dateFilter = document.querySelector('.date-input-top');
    const transactionBody = document.getElementById('transactionBody');

    function checkInitialEmptiness() {
        const totalRows = transactionBody.querySelectorAll('tr').length;
        setEmptyState(totalRows === 0);
    }

    function filterTable() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedMethod = methodFilter.value.toLowerCase();
        const selectedDate = dateFilter.value;

        const rows = transactionBody.querySelectorAll('tr');
        let visibleCount = 0;

        rows.forEach(row => {
            const rowText = row.innerText.toLowerCase();
            const methodTag = row.querySelector('.method-tag');
            const methodText = methodTag ? methodTag.innerText.toLowerCase() : "";
            const dateCell = row.cells[4];
            const dateText = dateCell ? dateCell.innerText : "";

            const matchesSearch = rowText.includes(searchTerm);
            const matchesMethod = selectedMethod === 'payment methods' || methodText === selectedMethod;

            let matchesDate = true;
            if (selectedDate) {
                const dateObj = new Date(selectedDate);
                const formattedFilterDate = dateObj.toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });
                matchesDate = dateText.includes(formattedFilterDate);
            }

            if (matchesSearch && matchesMethod && matchesDate) {
                row.style.display = "";
                visibleCount++;
            } else {
                row.style.display = "none";
            }
        });

        setEmptyState(visibleCount === 0);
    }

    searchInput.addEventListener('input', filterTable);
    methodFilter.addEventListener('change', filterTable);
    dateFilter.addEventListener('input', filterTable);

    const clearBtn = document.querySelector('.clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            methodFilter.selectedIndex = 0;
            dateFilter.value = '';
            filterTable();
        });
    }

    checkInitialEmptiness();

    /* --- form submission --- */
    const cashForm = document.getElementById('cashPaymentForm');
    if (cashForm) {
        cashForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const appointmentId = document.getElementById('appointmentSelect').value;
            const amountDue = parseFloat(document.getElementById('payAmount').value) || 0;

            if (!appointmentId) {
                showPaymentErrorModal("No Appointment Selected", "Please select an appointment before recording a payment.");
                return;
            }

            let amountPaid = 0;
            let gcashName = '';
            let gcashRef = '';

            if (currentMethod === 'cash') {
                const cashReceived = parseFloat(document.getElementById('cashReceived').value) || 0;
                if (cashReceived <= 0) {
                    showPaymentErrorModal("Missing Details", "Please enter the cash received amount.");
                    return;
                }
                // amount paid is capped at amount due (no overpay recorded)
                amountPaid = Math.min(cashReceived, amountDue);

            } else {
                amountPaid = parseFloat(document.getElementById('gcashAmountPaid').value) || 0;
                gcashName = document.getElementById('gcashName').value.trim();
                gcashRef = document.getElementById('gcashRef').value.trim();

                if (amountPaid <= 0) {
                    showPaymentErrorModal("Missing Amount", "Please enter the amount paid via GCash.");
                    return;
                }
                if (!gcashName) {
                    showPaymentErrorModal("Missing GCash Name", "Please enter the GCash account name.");
                    return;
                }
                if (!gcashRef) {
                    showPaymentErrorModal("Missing Reference Number", "Please enter the GCash reference number.");
                    return;
                }
            }

            const balance = amountDue - amountPaid;
            const isPartial = balance > 0.001;

            if (isPartial) {
                // update remaining balance
                partialBalances[appointmentId] = balance;
                // update the option's amount so next time it auto-populates correctly
                const select = document.getElementById('appointmentSelect');
                const opt = Array.from(select.options).find(o => o.value === appointmentId);
                if (opt) opt.setAttribute('data-amount', balance.toFixed(2));
            } else {
                // fully paid — remove from due list
                delete partialBalances[appointmentId];
                const select = document.getElementById('appointmentSelect');
                const opt = Array.from(select.options).find(o => o.value === appointmentId);
                if (opt) opt.remove();
            }

            const select = document.getElementById('appointmentSelect');
            const selectedOpt = Array.from(select.options).find(o => o.value === appointmentId);
            const user = selectedOpt ? selectedOpt.getAttribute('data-user') : document.getElementById('payUser').value;
            const pet = selectedOpt ? selectedOpt.getAttribute('data-pet') : document.getElementById('payPet').value;

            addTransactionRow({
                paymentId: generatePaymentId(),
                user,
                pet,
                appointmentId,
                method: currentMethod,
                amountPaid,
                isPartial,
                remainingBalance: balance
            });

            showPaymentSuccessModal(appointmentId, amountDue, amountPaid, currentMethod, gcashName, gcashRef);
        });
    }
});
