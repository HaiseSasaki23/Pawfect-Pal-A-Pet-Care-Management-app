function getToken() {
    return localStorage.getItem("token");
}

function getAuthHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getToken()}`
    };
}

function handleUnauthorized(response) {
    if (response.status === 401) {

        alert("Session expired. Please login again.");

        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("userName");

        window.location.href = "../../login/login.html";

        return true;
    }

    return false;
}

function loadUserDisplay(admin) {

    const userNameEl =
        document.getElementById("UserName");

    if (userNameEl) {

        userNameEl.textContent =
            admin?.userName ||
            localStorage.getItem("userName") ||
            "Admin";
    }
}

const API_BASE_URL = "http://localhost:5182/api";

let currentMethod = "cash";
let unpaidBills = [];
let allPayments = [];

document.addEventListener("DOMContentLoaded", async () => {
    const admin = requireLogin("Admin");
    if (!admin) return;

    loadUserDisplay(admin);

    setupFilters();
    setupPaymentForm();

    await loadUnpaidBills();
    await loadPaymentHistory();

    switchMethod("cash");
});

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "none";
}

function setEmptyState(show) {
    const tableElement = document.querySelector(".payment-table");
    const emptyState = document.getElementById("no-payments");

    if (!tableElement || !emptyState) return;

    tableElement.style.display = show ? "none" : "table";
    emptyState.style.display = show ? "block" : "none";
}

async function loadUnpaidBills() {
    try {
        const response = await fetch(`${API_BASE_URL}/Billing/unpaid`, {
            headers: getAuthHeaders()
        });

        if (handleUnauthorized(response)) return;

        if (!response.ok) {
            throw new Error("Failed to load unpaid bills.");
        }

        unpaidBills = await response.json();
        populateAppointmentDropdown();

    } catch (error) {
        console.error("Load unpaid bills error:", error);
    }
}

async function loadPaymentHistory() {
    try {
        const response = await fetch(`${API_BASE_URL}/Payment/admin/history`, {
            headers: getAuthHeaders()
        });

        if (handleUnauthorized(response)) return;

        if (!response.ok) {
            throw new Error("Failed to load payment history.");
        }

        allPayments = await response.json();
        renderPaymentTable(allPayments);

    } catch (error) {
        console.error("Load payment history error:", error);
        setEmptyState(true);
    }
}

function populateAppointmentDropdown() {
    const select = document.getElementById("appointmentSelect");
    if (!select) return;

    select.innerHTML = `<option value="" disabled selected>Search appointment...</option>`;

    if (!Array.isArray(unpaidBills) || unpaidBills.length === 0) {
        select.innerHTML = `<option value="" disabled selected>No due payments found</option>`;
        return;
    }

    unpaidBills.forEach(bill => {
        const ownerName = `${bill.ownerFName || ""} ${bill.ownerLName || ""}`.trim() || bill.userName || "Unknown User";
        const remaining = Number(bill.remainingBalance ?? bill.totalAmount ?? 0);

        const option = document.createElement("option");
        option.value = bill.billingId;
        option.textContent = `APT-${bill.appointmentId} | ${ownerName} | ${bill.petName} | ₱${remaining.toLocaleString()}`;
        option.dataset.billingId = bill.billingId;
        option.dataset.appointmentId = bill.appointmentId;
        option.dataset.user = ownerName;
        option.dataset.pet = bill.petName || "N/A";
        option.dataset.amount = remaining;
        option.dataset.status = bill.billingStatus || "Unpaid";

        select.appendChild(option);
    });
}

function autoPopulateDetails() {
    const select = document.getElementById("appointmentSelect");
    const selectedOption = select.options[select.selectedIndex];

    if (!selectedOption || !selectedOption.value) return;

    document.getElementById("payUser").value = selectedOption.dataset.user || "";
    document.getElementById("payPet").value = selectedOption.dataset.pet || "";
    document.getElementById("payAmount").value = Number(selectedOption.dataset.amount || 0).toFixed(2);

    document.getElementById("cashReceived").value = "";
    document.getElementById("gcashAmountPaid").value = "";
    document.getElementById("payChange").value = "0.00";
}

function switchMethod(method) {
    currentMethod = method;

    const btnCash = document.getElementById("btnCash");
    const btnGcash = document.getElementById("btnGcash");
    const cashReceivedGroup = document.getElementById("cashReceivedGroup");
    const gcashAmountGroup = document.getElementById("gcashAmountGroup");
    const changeSection = document.getElementById("changeSection");
    const gcashSection = document.getElementById("gcashSection");
    const submitBtn = document.getElementById("submitPaymentBtn");

    if (method === "cash") {
        btnCash.classList.add("active");
        btnGcash.classList.remove("active");
        cashReceivedGroup.style.display = "";
        gcashAmountGroup.style.display = "none";
        changeSection.style.display = "";
        gcashSection.style.display = "none";
        submitBtn.textContent = "+ Record Cash Payment";
        document.getElementById("gcashName").value = "";
        document.getElementById("gcashRef").value = "";
        document.getElementById("gcashAmountPaid").value = "";
    } else {
        btnGcash.classList.add("active");
        btnCash.classList.remove("active");
        cashReceivedGroup.style.display = "none";
        gcashAmountGroup.style.display = "";
        changeSection.style.display = "none";
        gcashSection.style.display = "";
        submitBtn.textContent = "+ Record GCash Payment";
        document.getElementById("cashReceived").value = "";
        document.getElementById("payChange").value = "0.00";
    }
}

function calculateChange() {
    const amountDue = Number(document.getElementById("payAmount").value) || 0;
    const cashReceived = Number(document.getElementById("cashReceived").value) || 0;
    const change = cashReceived - amountDue;

    document.getElementById("payChange").value = change > 0 ? change.toFixed(2) : "0.00";
}

async function submitPayment() {
    const select = document.getElementById("appointmentSelect");
    const selectedOption = select.options[select.selectedIndex];

    if (!selectedOption || !selectedOption.value) {
        showPaymentErrorModal("Missing Appointment", "Please select an appointment with due payment.");
        return;
    }

    const billingId = parseInt(selectedOption.dataset.billingId);
    const appointmentId = selectedOption.dataset.appointmentId;
    const amountDue = Number(document.getElementById("payAmount").value) || 0;

    let paidAmount = 0;
    let paymentMethod = currentMethod === "gcash" ? "GCash" : "Cash";
    let referenceNumber = "";

    if (currentMethod === "cash") {
        paidAmount = Number(document.getElementById("cashReceived").value) || 0;

        if (paidAmount <= 0) {
            showPaymentErrorModal("Invalid Amount", "Cash received must be greater than zero.");
            return;
        }

        if (paidAmount > amountDue) {
            paidAmount = amountDue;
        }
    } else {
        paidAmount = Number(document.getElementById("gcashAmountPaid").value) || 0;
        referenceNumber = document.getElementById("gcashRef").value.trim();

        if (paidAmount <= 0) {
            showPaymentErrorModal("Invalid Amount", "GCash amount must be greater than zero.");
            return;
        }

        if (!referenceNumber) {
            showPaymentErrorModal("Missing Reference", "GCash reference number is required.");
            return;
        }

        if (paidAmount > amountDue) {
            showPaymentErrorModal("Invalid Amount", "GCash payment cannot exceed the remaining balance.");
            return;
        }
    }

    try {
        const response = await fetch(`${API_BASE_URL}/Payment`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
                billingId,
                paymentMethod,
                referenceNumber,
                paidAmount
            })
        });

        if (handleUnauthorized(response)) return;

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || "Payment failed.");
        }

        showPaymentSuccessModal(
            appointmentId,
            amountDue,
            paidAmount,
            currentMethod,
            document.getElementById("gcashName").value.trim(),
            referenceNumber
        );

        await loadUnpaidBills();
        await loadPaymentHistory();

    } catch (error) {
        console.error("Submit payment error:", error);
        showPaymentErrorModal("Payment Failed", error.message);
    }
}

function renderPaymentTable(payments) {
    const tbody = document.getElementById("transactionBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!Array.isArray(payments) || payments.length === 0) {
        setEmptyState(true);
        return;
    }

    payments.forEach(payment => {
        const ownerName = `${payment.ownerFName || ""} ${payment.ownerLName || ""}`.trim() || "N/A";
        const paidDate = new Date(payment.paidDate);

        const dateStr = paidDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });

        const timeStr = paidDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit"
        });

        const method = payment.paymentMethod || "Cash";
        const methodClass = method.toLowerCase() === "gcash" ? "gcash" : "cash";

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${payment.paymentId}</td>
            <td><div class="user-cell">${ownerName}</div></td>
            <td><div class="pet-cell">${payment.petName || "N/A"}</div></td>
            <td>${payment.appointmentId}</td>
            <td>${dateStr}, ${timeStr}</td>
            <td><span class="method-tag ${methodClass}">${method}</span></td>
            <td><strong>P ${Number(payment.paidAmount || 0).toFixed(2)}</strong></td>
        `;

        tbody.appendChild(row);
    });

    setEmptyState(false);
}

function openDuePaymentsModal() {
    const modal = document.getElementById("mainModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalBody = document.getElementById("modalBody");

    modalTitle.innerText = "Appointments with Pending Payments";

    if (!Array.isArray(unpaidBills) || unpaidBills.length === 0) {
        modalBody.innerHTML = `
            <p style="text-align:center; color: var(--text-muted); padding: 30px 0;">
                No pending payments found.
            </p>
        `;
        modal.style.display = "flex";
        return;
    }

    modalBody.innerHTML = `
        <table class="payment-table" style="width:100%;">
            <thead>
                <tr>
                    <th>Billing ID</th>
                    <th>Appointment ID</th>
                    <th>User</th>
                    <th>Pet</th>
                    <th>Remaining</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${unpaidBills.map(bill => {
                    const ownerName = `${bill.ownerFName || ""} ${bill.ownerLName || ""}`.trim() || bill.userName || "N/A";
                    return `
                        <tr>
                            <td>${bill.billingId}</td>
                            <td>${bill.appointmentId}</td>
                            <td>${ownerName}</td>
                            <td>${bill.petName || "N/A"}</td>
                            <td><strong>P ${Number(bill.remainingBalance || 0).toFixed(2)}</strong></td>
                            <td><span class="remaining-badge">${bill.billingStatus || "Unpaid"}</span></td>
                        </tr>
                    `;
                }).join("")}
            </tbody>
        </table>
    `;

    modal.style.display = "flex";
}

function showPaymentSuccessModal(appointmentId, amountDue, amountPaid, method, gcashName, gcashRef) {
    const modal = document.getElementById("paymentAlertModal");
    const title = document.getElementById("alertTitle");
    const message = document.getElementById("alertMessage");
    const button = document.getElementById("alertBtn");

    const balance = amountDue - amountPaid;
    const isPartial = balance > 0.001;

    title.style.color = "var(--primary-purple)";

    if (isPartial) {
        title.innerText = "Partial Payment Recorded";
        message.innerHTML = `
            Payment for <strong>APT-${appointmentId}</strong> recorded.<br>
            Paid: <strong>P ${amountPaid.toFixed(2)}</strong> via ${method === "gcash" ? "GCash" : "Cash"}<br>
            <span style="color:#ff5e78; font-weight:bold; margin-top:6px; display:inline-block;">
                Remaining Balance: P ${balance.toFixed(2)}
            </span>
        `;
    } else {
        title.innerText = "Payment Successful!";
        message.innerHTML = `
            Transaction for <strong>APT-${appointmentId}</strong> completed.<br>
            Amount: <strong>P ${amountPaid.toFixed(2)}</strong> via ${method === "gcash" ? "GCash" : "Cash"}
        `;
    }

    if (method === "gcash") {
        message.innerHTML += `<br><span style="color:var(--text-muted); font-size:13px;">GCash: ${gcashName || "N/A"} · Ref# ${gcashRef}</span>`;
    }

    button.innerText = "Done";
    button.style.backgroundColor = "var(--primary-purple)";
    button.onclick = () => {
        modal.style.display = "none";
        resetForm();
    };

    modal.style.display = "flex";
}

function showPaymentErrorModal(header, text) {
    const modal = document.getElementById("paymentAlertModal");
    const title = document.getElementById("alertTitle");
    const message = document.getElementById("alertMessage");
    const button = document.getElementById("alertBtn");

    title.innerText = header;
    title.style.color = "#ff5e78";
    message.innerText = text;
    button.innerText = "Try Again";
    button.style.backgroundColor = "#ff5e78";
    button.onclick = () => {
        modal.style.display = "none";
    };

    modal.style.display = "flex";
}

function resetForm() {
    document.getElementById("cashPaymentForm").reset();
    document.getElementById("payUser").value = "";
    document.getElementById("payPet").value = "";
    document.getElementById("payAmount").value = "";
    document.getElementById("payChange").value = "0.00";
    switchMethod("cash");
}

function setupPaymentForm() {
    const cashForm = document.getElementById("cashPaymentForm");

    if (cashForm) {
        cashForm.addEventListener("submit", function (e) {
            e.preventDefault();
            submitPayment();
        });
    }
}
function triggerLogout() {

    const modal =
        document.getElementById("confirmModal");

    const message =
        document.getElementById("confirmMessage");

    const confirmBtn =
        document.getElementById("btnConfirmDelete");

    if (message) {
        message.textContent =
            "Are you sure you want to logout?";
    }

    if (confirmBtn) {

        confirmBtn.textContent = "Logout";

        confirmBtn.onclick = () => {

            localStorage.clear();

            window.location.href =
                "../../login/login.html";
        };
    }

    if (modal) {
        modal.style.display = "flex";
    }
}

function setupFilters() {
    const searchInput = document.querySelector(".table-filters .search-box input");
    const methodFilter = document.querySelector(".table-method-filter");
    const dateFilter = document.querySelector(".date-input-top");
    const clearBtn = document.querySelector(".clear-btn");

    function filterTable() {
        const searchTerm = (searchInput?.value || "").toLowerCase();
        const selectedMethod = (methodFilter?.value || "").toLowerCase();
        const selectedDate = dateFilter?.value || "";

        let filtered = [...allPayments];

        if (searchTerm) {
            filtered = filtered.filter(payment => {
                const ownerName = `${payment.ownerFName || ""} ${payment.ownerLName || ""}`.toLowerCase();

                return (
                    String(payment.paymentId).includes(searchTerm) ||
                    String(payment.appointmentId).includes(searchTerm) ||
                    ownerName.includes(searchTerm) ||
                    (payment.petName || "").toLowerCase().includes(searchTerm)
                );
            });
        }

        if (selectedMethod && selectedMethod !== "payment methods") {
            filtered = filtered.filter(payment =>
                (payment.paymentMethod || "").toLowerCase() === selectedMethod
            );
        }

        if (selectedDate) {
            filtered = filtered.filter(payment => {
                const paymentDate = new Date(payment.paidDate).toISOString().split("T")[0];
                return paymentDate === selectedDate;
            });
        }

        renderPaymentTable(filtered);
    }

    if (searchInput) searchInput.addEventListener("input", filterTable);
    if (methodFilter) methodFilter.addEventListener("change", filterTable);
    if (dateFilter) dateFilter.addEventListener("input", filterTable);

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            searchInput.value = "";
            methodFilter.selectedIndex = 0;
            dateFilter.value = "";
            renderPaymentTable(allPayments);
        });
    }
}