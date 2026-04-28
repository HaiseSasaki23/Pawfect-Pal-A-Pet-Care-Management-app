/* global gui elements */
const modal = document.getElementById('mainModal');
const confirmModal = document.getElementById('confirmModal');

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('.search-input');
    
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            const filter = this.value.toLowerCase();
            const tableRows = document.querySelectorAll('.transaction-table tbody tr');

            tableRows.forEach(row => {
                // Get text from Pet Name (2nd column) and Description (3rd column)
                const petName = row.cells[1].textContent.toLowerCase();
                const description = row.cells[2].textContent.toLowerCase();

                if (petName.includes(filter) || description.includes(filter)) {
                    row.style.display = ""; // Show row
                } else {
                    row.style.display = "none"; // Hide row
                }
            });
        });
    }
});

// Replace your toggleTransactions function with this refined version
function toggleTransactions() {
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const upcomingSection = document.getElementById('upcomingSection');

    modalTitle.innerText = "Payment Details";
    modalBody.innerHTML = upcomingSection.innerHTML;
    modal.style.display = 'flex';

    // Check for empty state inside the modal specifically
    const selectionList = modalBody.querySelector('.selection-list');
    const upcomingEmpty = modalBody.querySelector('#upcomingEmptyState');
    const instructions = modalBody.querySelectorAll('.modal-instruction');
    const gcashSection = modalBody.querySelector('.gcash-details-section');
    const totalRow = modalBody.querySelector('.total-pay-row');

    if (selectionList && selectionList.querySelectorAll('.selection-item').length === 0) {
        upcomingEmpty.style.display = 'flex';
        // Hide payment elements since there's nothing to pay
        instructions.forEach(i => i.style.display = 'none');
        if (gcashSection) gcashSection.style.display = 'none';
        if (totalRow) totalRow.style.display = 'none';
    } else {
        upcomingEmpty.style.display = 'none';
    }

    // Existing checkbox logic
    const modalCheckboxes = modalBody.querySelectorAll('.pay-check');
    const display = modalBody.querySelector('#totalDisplay');

    modalCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            let total = 0;
            modalCheckboxes.forEach(c => {
                if (c.checked) total += parseInt(c.dataset.amount);
            });
            display.innerText = `₱ ${total.toLocaleString()}.00`;
        });
    });
}

function processPayment() {
    const modalBody = document.getElementById('modalBody');
    const nameInput = modalBody.querySelector('#gcashName');
    const refInput = modalBody.querySelector('#gcashRef');

    if (!nameInput.checkValidity() || !refInput.checkValidity()) {
        alert("Please fix the errors shown in red before confirming.");
        return;
    }

    const ownerFName = document.getElementById('OwnerFName')?.innerText || 'user';

    const modalTitle = document.getElementById('modalTitle');
    modalTitle.innerText = "Payment Successful";
    modalBody.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <img src="user-payment/confirm.png" style="width: 30px; height: 30px; margin-bottom: 15px;" alt="Success">
            <h3 style="color: var(--text-dark); margin-bottom: 10px;">Payment Confirmed!</h3>
            <p style="color: var(--text-muted); font-size: 14px;">Thank you, ${ownerFName}! Your payment has been received.</p>
            <button onclick="location.reload()" class="submit-btn" style="width: 100%; margin-top: 20px;">Done</button>
        </div>
    `;
}
// Add this to payment.js
function updateEmptyState(hasData) {
    const table = document.querySelector('.transaction-table');
    const emptyState = document.getElementById('emptyState');
    const balanceText = document.getElementById('totalBalance');
    const statusLabel = document.getElementById('balanceStatus');

    if (hasData) {
        table.style.display = "table";
        emptyState.style.display = "none";
    } else {
        table.style.display = "none";
        emptyState.style.display = "flex";
        balanceText.innerText = "₱ ---"; // Or "₱ 0.00"
        statusLabel.innerText = "All caught up!";
    }
}

function triggerLogout() {
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmBtn = document.getElementById('btnConfirmDelete');

    confirmMessage.innerText = "Are you sure you want to log out of Pawfect Pal?";
    confirmBtn.innerText = "Logout";
    confirmBtn.style.backgroundColor = "#ff5e78";

    confirmBtn.onclick = function() {
        window.location.href = "login.html"; 
    };

    confirmModal.style.display = 'flex';
}

function closeModal(modalId) { 
    document.getElementById(modalId).style.display = 'none'; 
}

function checkDataStates() {
    const tableBody = document.querySelector('.transaction-table tbody');
    const tableHeader = document.querySelector('.transaction-table thead');
    const tableEmptyState = document.getElementById('emptyState');
    
    // Use .children.length and check if it's actually empty
    // We also use .trim() logic just in case the backend left a blank space
    const isTableEmpty = !tableBody || tableBody.innerHTML.trim() === "";

    if (isTableEmpty) {
        if (tableEmptyState) tableEmptyState.style.display = 'flex';
        if (tableHeader) tableHeader.style.display = 'none';
    } else {
        if (tableEmptyState) tableEmptyState.style.display = 'none';
        if (tableHeader) tableHeader.style.display = 'table-header-group';
    }

    // Banner logic for "No balance due"
    const balanceText = document.getElementById('totalBalance');
    const balanceStatus = document.getElementById('balanceStatus');
    const selectionList = document.querySelector('.selection-list');
    const upcomingItems = selectionList ? selectionList.querySelectorAll('.selection-item') : [];
    
    if (upcomingItems.length === 0) {
        balanceText.innerText = "₱ 0.00";
        balanceStatus.innerText = "No balance due";
        balanceStatus.style.color = "#38b2ac"; 
    } else {
        let totalDue = 0;
        upcomingItems.forEach(item => {
            const checkbox = item.querySelector('.pay-check');
            totalDue += parseInt(checkbox.dataset.amount || 0);
        });
        balanceText.innerText = `₱ ${totalDue.toLocaleString()}.00`;
        balanceStatus.innerText = "Outstanding balance";
        balanceStatus.style.color = "var(--primary-purple)";
    }
}
// This runs automatically when the page finishes loading
document.addEventListener('DOMContentLoaded', () => {
    // 1. First, check the states immediately
    checkDataStates();

    // 2. Add your existing search listener logic here
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            const filter = this.value.toLowerCase();
            const tableRows = document.querySelectorAll('.transaction-table tbody tr');

            tableRows.forEach(row => {
                const petName = row.cells[1].textContent.toLowerCase();
                const description = row.cells[2].textContent.toLowerCase();
                row.style.display = (petName.includes(filter) || description.includes(filter)) ? "" : "none";
            });
        });
    }
});