const API_BASE_URL = "http://localhost:5182";

let unpaidBills = [];

document.addEventListener("DOMContentLoaded", async function () {

    const user = requireLogin("User");

    if (!user) return;

    await loadUserUnpaidBills();
    await loadPaymentHistory();

    setupSearch();
});

const modal = document.getElementById('mainModal');

async function loadUserUnpaidBills(userId) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/Billing/my/unpaid`,
            {
                headers: getAuthHeaders()
            }
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
            `${API_BASE_URL}/api/Payment/my/history`,
            {
                headers: getAuthHeaders()
            }
        );

        if (handleUnauthorized(response)) return;

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
        (sum, bill) => sum + Number(bill.remainingBalance),
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

    const selectionList =
        document.querySelector(".selection-list");

    if (!selectionList) return;

    if (unpaidBills.length === 0) {
        selectionList.innerHTML = "";
        return;
    }

    selectionList.innerHTML =
        unpaidBills.map(bill => {

            const isCash =
                bill.paymentMode === "Cash";

            return `
                <label class="selection-item">

                    ${
                        isCash
                        ? `
                            <input
                                type="checkbox"
                                disabled
                            >
                        `
                        : `
                            <input
                                type="checkbox"
                                class="pay-check"
                                value="${bill.billingId}"
                                data-amount="${bill.remainingBalance}">
                        `
                    }

                    <div style="flex:1;">

                        <strong>
                            Appointment #${bill.appointmentId}
                        </strong>

                        <div style="
                            font-size:13px;
                            color:#999;
                        ">
                            ${bill.petName}
                        </div>

                        <div style="
                            font-size:12px;
                            margin-top:5px;
                            color:
                                ${isCash ? "#e67e22" : "#38b2ac"};
                        ">

                            ${
                                isCash
                                ? "Pay at Clinic (Cash)"
                                : "Online Payment (GCash)"
                            }

                        </div>

                    </div>

                    <strong>
                        ₱ ${Number(
                            bill.remainingBalance
                        ).toLocaleString()}
                    </strong>

                </label>
            `;
        }).join("");
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

    const modalBody =
        document.getElementById('modalBody');

    const nameInput =
        modalBody.querySelector('#gcashName');

    const refInput =
        modalBody.querySelector('#gcashRef');

    if (
        !nameInput.checkValidity() ||
        !refInput.checkValidity()
    ) {
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

                billingId:
                    parseInt(bill.value),

                paymentMethod: "GCash",

                referenceNumber:
                    refInput.value.trim(),

                paidAmount:
                    parseFloat(
                        bill.dataset.amount
                    )
            };

            const response = await fetch(
                `${API_BASE_URL}/api/Payment`,
                {
                    method: "POST",

                    headers: getAuthHeaders(),

                    body: JSON.stringify(paymentData)
                }
            );

            if (handleUnauthorized(response)) return;

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Payment failed."
                );
            }
        }

        modalBody.innerHTML = `
            <div style="text-align:center;padding:20px;">

                <img
                    src="user-payment/confirm.png"
                    style="
                        width:40px;
                        height:40px;
                        margin-bottom:15px;
                    ">

                <h3 style="margin-bottom:10px;">
                    Payment Successful
                </h3>

                <p style="color:#777;">
                    Your payment has been recorded.
                </p>

                <button
                    onclick="location.reload()"
                    class="submit-btn"
                    style="
                        width:100%;
                        margin-top:20px;
                    ">

                    Done
                </button>
            </div>
        `;

    } catch (error) {

        console.error(error);

        alert(
            error.message || "Payment failed."
        );
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

function populateAppointmentDropdown() {

    const select =
        document.getElementById("appointmentSelect");

    select.innerHTML = `
        <option value="" disabled selected>
            Search appointment...
        </option>
    `;

    unpaidBills.forEach(bill => {

        const option = document.createElement("option");

        option.value = bill.billingId;

        option.textContent =
            `APT-${bill.appointmentId} • `
            + `${bill.petName}`;

        option.setAttribute(
            "data-user",
            bill.userName
        );

        option.setAttribute(
            "data-pet",
            bill.petName
        );

        option.setAttribute(
            "data-amount",
            bill.remainingBalance
        );

        option.setAttribute(
            "data-appointment-id",
            bill.appointmentId
        );

        select.appendChild(option);
    });
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

