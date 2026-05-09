const API_BASE_URL = "http://localhost:5182";

let unpaidBills = [];

document.addEventListener("DOMContentLoaded", async function () {
    const user = requireLogin("User");
    if (!user) return;

    await loadUnpaidBills(user.userId);
    await loadPaymentHistory(user.userId);

    setupSearch();
});

const modal = document.getElementById('mainModal');

async function loadUnpaidBills(userId) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/Billing/user/${userId}/unpaid`
        );

        if (!response.ok) {
            throw new Error("Failed to load unpaid bills.");
        }

        unpaidBills = await response.json();

        renderBalanceBanner();
        renderUpcomingPayments();

    } catch (error) {
        console.error("Unpaid bills error:", error);
    }
}

async function loadPaymentHistory(userId) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/Payment/user/${userId}/history`
        );

        if (!response.ok) {
            throw new Error("Failed to load payment history.");
        }

        const payments = await response.json();

        renderTransactionTable(payments);

    } catch (error) {
        console.error("Payment history error:", error);
    }
}

function renderBalanceBanner() {
    const totalBalance = document.getElementById("totalBalance");
    const balanceStatus = document.getElementById("balanceStatus");

    const total = unpaidBills.reduce(
        (sum, bill) => sum + Number(bill.totalAmount),
        0
    );

    totalBalance.innerText = `₱ ${total.toLocaleString()}.00`;

    if (total <= 0) {
        balanceStatus.innerText = "No balance due";
        balanceStatus.style.color = "#38b2ac";
    } else {
        balanceStatus.innerText = "Outstanding balance";
        balanceStatus.style.color = "var(--primary-purple)";
    }
}

function renderUpcomingPayments() {
    const selectionList = document.querySelector(".selection-list");

    if (!selectionList) return;

    if (unpaidBills.length === 0) {
        selectionList.innerHTML = "";
        return;
    }

    selectionList.innerHTML = unpaidBills.map(bill => `
        <label class="selection-item">
            <input
                type="checkbox"
                class="pay-check"
                value="${bill.billingId}"
                data-amount="${bill.totalAmount}">

            <div style="flex:1;">
                <strong>Appointment #${bill.appointmentId}</strong>
                <div style="font-size:13px;color:#999;">
                    Billing ID: ${bill.billingId}
                </div>
            </div>

            <strong>
                ₱ ${Number(bill.totalAmount).toLocaleString()}
            </strong>
        </label>
    `).join("");
}

function renderTransactionTable(payments) {
    const tbody = document.querySelector(".transaction-table tbody");
    const emptyState = document.getElementById("emptyState");

    if (!tbody) return;

    if (!Array.isArray(payments) || payments.length === 0) {
        tbody.innerHTML = "";
        emptyState.style.display = "flex";
        return;
    }

    emptyState.style.display = "none";

    tbody.innerHTML = payments.map(payment => `
        <tr>
            <td>
                ${new Date(payment.paidDate).toLocaleDateString()}
            </td>

            <td>
                Billing #${payment.billingId}
            </td>

            <td>
                ${payment.paymentMethod}
            </td>

            <td>
                ₱ ${Number(payment.paidAmount).toLocaleString()}
            </td>
        </tr>
    `).join("");
}

function toggleTransactions() {
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const upcomingSection = document.getElementById('upcomingSection');

    modalTitle.innerText = "Payment Details";
    modalBody.innerHTML = upcomingSection.innerHTML;

    modal.style.display = 'flex';

    const modalCheckboxes =
        modalBody.querySelectorAll('.pay-check');

    const display =
        modalBody.querySelector('#totalDisplay');

    modalCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {

            let total = 0;

            modalCheckboxes.forEach(c => {
                if (c.checked) {
                    total += parseFloat(c.dataset.amount);
                }
            });

            display.innerText =
                `₱ ${total.toLocaleString()}.00`;
        });
    });
}

async function processPayment() {
    const modalBody = document.getElementById('modalBody');

    const nameInput = modalBody.querySelector('#gcashName');
    const refInput = modalBody.querySelector('#gcashRef');

    if (!nameInput.checkValidity() ||
        !refInput.checkValidity()) {

        alert("Please fix the errors first.");
        return;
    }

    const selectedBills = Array.from(
        modalBody.querySelectorAll('.pay-check:checked')
    );

    if (selectedBills.length === 0) {
        alert("Select at least one bill.");
        return;
    }

    try {

        for (const bill of selectedBills) {

            const paymentData = {
                billingId: parseInt(bill.value),
                paymentMethod: "GCash",
                referenceNumber: refInput.value.trim(),
                paidAmount: parseFloat(bill.dataset.amount)
            };

            const response = await fetch(
                `${API_BASE_URL}/api/Payment`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(paymentData)
                }
            );

            if (!response.ok) {
                throw new Error("Payment failed.");
            }
        }

        modalBody.innerHTML = `
            <div style="text-align:center;padding:20px;">
                <img src="user-payment/confirm.png"
                     style="width:40px;height:40px;margin-bottom:15px;">

                <h3 style="margin-bottom:10px;">
                    Payment Successful
                </h3>

                <p style="color:#777;">
                    Your payment has been recorded.
                </p>

                <button
                    onclick="location.reload()"
                    class="submit-btn"
                    style="width:100%;margin-top:20px;">

                    Done
                </button>
            </div>
        `;

    } catch (error) {
        console.error(error);
        alert("Payment failed.");
    }
}

function setupSearch() {
    const searchInput =
        document.querySelector('.search-input');

    if (!searchInput) return;

    searchInput.addEventListener('keyup', function () {

        const filter = this.value.toLowerCase();

        const tableRows =
            document.querySelectorAll(
                '.transaction-table tbody tr'
            );

        tableRows.forEach(row => {

            const text =
                row.innerText.toLowerCase();

            row.style.display =
                text.includes(filter)
                    ? ""
                    : "none";
        });
    });
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

