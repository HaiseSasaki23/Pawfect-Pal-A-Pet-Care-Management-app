/* global gui elements */
const modal = document.getElementById('mainModal');
const confirmModal = document.getElementById('confirmModal');

/* logout feature */
function triggerLogout() {
    const confirmMessage = document.getElementById("confirmMessage");
    const confirmBtn = document.getElementById("btnConfirmDelete");
    const modal = document.getElementById("confirmModal");

    if (!confirmMessage || !confirmBtn || !modal) {
        if (confirm("Are you sure you want to logout?")) {
            logoutNow();
        }
        return;
    }

    confirmMessage.innerText = "Are you sure you want to log out of Pawfect Pal?";
    confirmBtn.innerText = "Logout";
    confirmBtn.style.backgroundColor = "#ff5e78";
    confirmBtn.onclick = logoutNow;

    modal.style.display = "flex";
}

function logoutNow() {
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("ownerFName");
    localStorage.removeItem("ownerLName");
    localStorage.removeItem("role");

    window.location.href = "../../login/login.html";
}

document.addEventListener("DOMContentLoaded", () => {
    initImageLoading();
});


function closeModal(modalId) { 
    document.getElementById(modalId).style.display = 'none'; 
}

function autoPopulateDetails() {
    const select = document.getElementById('appointmentSelect');
    const selectedOption = select.options[select.selectedIndex];
 
    const user = selectedOption.getAttribute('data-user') || "";
    const pet = selectedOption.getAttribute('data-pet') || "";
    const amount = selectedOption.getAttribute('data-amount') || "0.00";
 
    document.getElementById('payUser').value = user;
    document.getElementById('payPet').value = pet;
    document.getElementById('payAmount').value = amount;
 
    document.getElementById('cashReceived').value = "";
    document.getElementById('payChange').value = "0.00";
}
 
function calculateChange() {
    const amountDue = parseFloat(document.getElementById('payAmount').value) || 0;
    const cashReceived = parseFloat(document.getElementById('cashReceived').value) || 0;
    
    const change = cashReceived - amountDue;
    document.getElementById('payChange').value = change > 0 ? change.toFixed(2) : "0.00";
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
            const dateText = row.cells[4].innerText;
 
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
 
    const cashForm = document.getElementById('cashPaymentForm');
    if (cashForm) {
        cashForm.addEventListener('submit', function(e) {
            e.preventDefault();
 
            const appointmentId = document.getElementById('appointmentSelect').value;
            const amountDue = document.getElementById('payAmount').value;
            const cashReceived = document.getElementById('cashReceived').value;
 
            if (!appointmentId) {
                showPaymentErrorModal("No Appointment Selected", "Please select an appointment before recording a payment.");
                return;
            }
 
            if (!cashReceived || parseFloat(cashReceived) <= 0) {
                showPaymentErrorModal("Missing Details", "Please enter the cash received amount.");
                return;
            }
 
            showPaymentSuccessModal(appointmentId, amountDue, cashReceived);
        });
    }
});
 
async function openDuePaymentsModal() {
    const modal = document.getElementById('mainModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
 
    modalTitle.innerText = "Appointments with Pending Payments";
 
    const duePayments = await fetch('/api/get-pending-payments').then(res => res.json());
 
    let html = `
        <table class="payment-table" style="width: 100%;">
            <thead>
                <tr>
                    <th>Appointment ID</th>
                    <th>User</th>
                    <th>Pet</th>
                    <th>Amount</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
    `;
 
    duePayments.forEach(item => {
        html += `
            <tr>
                <td>${item.id}</td>
                <td>${item.user}</td>
                <td>${item.pet}</td>
                <td><strong>P ${item.amount}</strong></td>
                <td>${item.date}</td>
            </tr>
        `;
    });
 
    html += `</tbody></table>`;
 
    modalBody.innerHTML = html;
    modal.style.display = "flex";
}
 
function showPaymentSuccessModal(id, amountDue, cashReceived) {
    const modal = document.getElementById('paymentAlertModal');
    const title = document.getElementById('alertTitle');
    const message = document.getElementById('alertMessage');
    const button = document.getElementById('alertBtn');
 
    const due = parseFloat(amountDue);
    const received = parseFloat(cashReceived);
    const balance = due - received;
 
    title.style.color = "var(--primary-purple)";
    
    if (balance > 0) {
        title.innerText = "Partial Payment Recorded";
        message.innerHTML = `
            Payment for <strong>${id}</strong> received.<br>
            Paid: <strong>P ${received.toFixed(2)}</strong><br>
            <span style="color: #ff5e78; font-weight: bold;">
                Remaining Balance: P ${balance.toFixed(2)}
            </span>`;
    } else {
        title.innerText = "Payment Successful";
        message.innerHTML = `
            Transaction for <strong>${id}</strong> completed.<br>
            Amount: <strong>P ${due.toFixed(2)}</strong>`;
    }
 
    button.innerText = "Done";
    button.style.backgroundColor = "var(--primary-purple)";
    
    button.onclick = () => {
        modal.style.display = 'none';
        document.getElementById('cashPaymentForm').reset();
        document.getElementById('payChange').value = "0.00";
    };
 
    modal.style.display = "flex";
}
 
// Dedicated Error Function
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
    
    button.onclick = () => {
        modal.style.display = 'none';
    };
 
    modal.style.display = "flex";
}