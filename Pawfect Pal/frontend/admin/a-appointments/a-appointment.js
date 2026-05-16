const API_BASE_URL = "http://localhost:5182/api";

let token = null;
let currentAdmin = null;
/* =========================
   DROPDOWN LOADERS
========================= */

async function loadUsersDropdown() {

    try {

        const response = await fetch(`${API_BASE_URL}/User`, {
            headers: getAuthHeaders()
        });

        if (handleUnauthorized(response)) return;

        if (!response.ok) {
            throw new Error("Failed to load users.");
        }

        const users = await response.json();
        const userSelect =
            document.getElementById("apptUserId");

        userSelect.innerHTML =
            `<option value="">Select User</option>`;

        users.forEach(user => {

            userSelect.innerHTML += `
                <option value="${user.userId}">
                    ${user.ownerFName} ${user.ownerLName}
                </option>
            `;
        });

    } catch (error) {

        console.error(
            "Load users error:",
            error
        );
    }
}

async function loadServicesIntoDropdown() {

    try {

        const response = await fetch(
            "http://localhost:5182/api/Service",
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error("Failed to load services.");
        }

        const services = await response.json();

        const dropdown =
            document.getElementById(
                "serviceDropdownList"
            );

        dropdown.innerHTML = "";

        services.forEach(service => {

            dropdown.innerHTML += `
                <label class="svc-option">
                    <input
                        type="checkbox"
                        value="${service.serviceId || service.serviceID}"
                        data-name="${service.serviceType}"
                        onchange="updateServiceSelection()"
                    >
                    ${service.serviceType}
                </label>
            `;
        });

    } catch (error) {

        console.error(
            "Load services error:",
            error
        );
    }
}

async function loadPetsByUser(userId) {

    try {

        const response = await fetch(
            `http://localhost:5182/api/Pet/user/${userId}`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error("Failed to load pets.");
        }

        const pets = await response.json();

        const petSelect =
            document.getElementById("apptPetId");

        petSelect.innerHTML =
            `<option value="">Select Pet</option>`;

        pets.forEach(pet => {

            petSelect.innerHTML += `
                <option value="${pet.petId}">
                    ${pet.name}
                </option>
            `;
        });

    } catch (error) {

        console.error(
            "Load pets error:",
            error
        );
    }
}

function updateSelectedServices() {

    const checked =
        document.querySelectorAll(
            '#serviceDropdownList input:checked'
        );

    const selectedNames =
        Array.from(checked)
        .map(x => x.dataset.name);

    const display =
        document.getElementById(
            "serviceDropdownDisplay"
        );

    display.textContent =
        selectedNames.length
            ? selectedNames.join(", ")
            : "Select Services";

    updateBookingTotal();
}

function updateServiceSelection() {

    const checked =
        document.querySelectorAll(
            '#serviceDropdownList input:checked'
        );

    const names =
        Array.from(checked)
        .map(x => x.dataset.name);

    const display =
        document.getElementById(
            "serviceDropdownDisplay"
        );

    if (names.length === 0) {

        display.textContent =
            "Select Services";

    } else {

        display.textContent =
            names.join(", ");
    }

    updateBookingTotal();
}

function getSelectedServiceIds() {

    return Array.from(
        document.querySelectorAll(
            '#serviceDropdownList input:checked'
        )
    ).map(x => parseInt(x.value));
}

function getSelectedServiceNames() {

    return Array.from(
        document.querySelectorAll(
            '#serviceDropdownList input:checked'
        )
    ).map(x => x.dataset.name);
}

function loadTimeDropdown() {

    const timeSelect =
        document.getElementById("apptTime");

    timeSelect.innerHTML =
        `<option value="">Select Time</option>`;

    const times = [
        "07:00",
        "07:30",
        "08:00",
        "08:30",
        "09:00",
        "09:30",
        "10:00",
        "10:30",
        "11:00",
        "11:30",
        "13:00",
        "13:30",
        "14:00",
        "14:30",
        "15:00",
        "15:30",
        "16:00",
        "16:30",
        "17:00"
    ];

    times.forEach(time => {

        timeSelect.innerHTML += `
            <option value="${time}">
                ${time}
            </option>
        `;
    });
}

function onUserChange() {

    const userId =
        document.getElementById(
            "apptUserId"
        ).value;

    if (userId) {
        loadPetsByUser(userId);
    }
}
function updateSummaryCards() {

    const rows =
        document.querySelectorAll(
            "#appointmentTableBody tr"
        );

    let total = 0;
    let checkedIn = 0;
    let inProgress = 0;
    let completed = 0;

    rows.forEach(row => {

        total++;

        const status =
            row.dataset.status;

        if (status === "Checked-In") {
            checkedIn++;
        }

        if (status === "In-Progress") {
            inProgress++;
        }

        if (status === "Completed") {
            completed++;
        }
    });

    document.querySelector(
        ".card-total .card-count"
    ).textContent = total;

    document.querySelector(
        ".card-checkedin .card-count"
    ).textContent = checkedIn;

    document.querySelector(
        ".card-inprogress .card-count"
    ).textContent = inProgress;

    document.querySelector(
        ".card-completed .card-count"
    ).textContent = completed;
}

/* =========================
   SERVICE PRICES / PAYMENT
========================= */

const SERVICE_PRICES = {
    'Check-up': 500,
    'Vaccination': 1200,
    'Deworming': 350,
    'Grooming': 1500,
};

function calcTotal(services) {
    let serviceList = [];

    if (Array.isArray(services)) {
        serviceList = services;
    } else if (typeof services === "string") {
        serviceList = services
            .split(",")
            .map(s => s.trim())
            .filter(Boolean);
    }

    return serviceList.reduce(
        (sum, s) => sum + (SERVICE_PRICES[s] || 0),
        0
    );
}

/* =========================
   GLOBALS
========================= */

let appointments = [];
let originalAppointments = [];
let apptIdCounter = 1000;

const ALL_SERVICES = [
    'Check-up',
    'Vaccination',
    'Deworming',
    'Grooming'
];

let activeFilters = {
    search: '',
    date: '',
    status: '',
    services: [],
    payment: ''
};

let formDirty = false;
let editMode = false;
let editApptId = null;
let viewEditDirty = false;
let viewEditActive = false;

/* =========================
   LOAD APPOINTMENTS
========================= */

async function loadAppointments() {
    try {
        const response = await fetch(`${API_BASE_URL}/Appointment`, {
            headers: getAuthHeaders()
        });

        if (handleUnauthorized(response)) return;

        if (!response.ok) {
            throw new Error("Failed to load appointments.");
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Failed to load appointments."
            );
        }

        appointments = data.map(a => ({
            apptId: a.appointmentId,
            userId: a.userId,
            petId: a.petId,
            rawDate: a.appointmentDate,

            ownerName:
                `${a.ownerFName ?? ""} ${a.ownerLName ?? ""}`.trim(),

            petName: a.petName ?? `Pet ${a.petId}`,

            services: Array.isArray(a.services)
                ? a.services
                : (a.services || "")
                    .split(",")
                    .map(s => s.trim())
                    .filter(Boolean),

            serviceType: Array.isArray(a.services)
                ? a.services.join(", ")
                : (a.services || ""),

            date: new Date(a.appointmentDate)
                .toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                }),

            time: new Date(a.appointmentDate)
                .toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit"
                }),

            status: a.appStatus,
            notes: a.notes ?? "",

            totalAmount:
                calcTotal(a.services ?? []),

            amountPaid:
                a.amountPaid ?? 0,

            paymentStatus:
                a.paymentStatus ?? "Unpaid",

            paymentMethod:
                a.paymentMethod ?? "Cash",

            gcashName:
                a.gcashName ?? "",

            gcashRef:
                a.gcashRef ?? ""

        }));
        
        originalAppointments = [...appointments];
        renderAppointmentsTable();
        updateSummaryCards();

    } catch (error) {
        console.error("Load appointments error:", error);
    }
}

function applyFilters() {
    const searchValue = document.getElementById("searchInput")?.value.toLowerCase() || "";
    const statusValue = document.getElementById("statusFilterValue")?.value || "All";
    const serviceValue = document.getElementById("serviceFilterValue")?.value || "All";
    const paymentValue = document.getElementById("paymentFilterValue")?.value || "All";
    const dateValue = document.getElementById("dateFilterValue")?.value || "";

    appointments = originalAppointments.filter(app => {
        const matchesSearch =
            app.ownerName.toLowerCase().includes(searchValue) ||
            app.petName.toLowerCase().includes(searchValue) ||
            String(app.apptId).includes(searchValue);

        const matchesStatus =
            statusValue === "All" || app.status === statusValue;

        const matchesService =
            serviceValue === "All" || app.services.includes(serviceValue);

        const matchesPayment =
            paymentValue === "All" || app.paymentStatus === paymentValue;

        const matchesDate =
            !dateValue || new Date(app.rawDate).toISOString().split("T")[0] === dateValue;

        return matchesSearch && matchesStatus && matchesService && matchesPayment && matchesDate;
    });

    renderAppointmentsTable();
    updateSummaryCards();
}

function setupFilters() {
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", applyFilters);
    }

    setupDropdownFilter("btnStatusFilter", "statusFilterLabel", "statusFilterValue", [
        "All", "Pending", "Checked-In", "In-Progress", "Completed", "No-Show"
    ]);

    setupDropdownFilter("btnServiceFilter", "serviceFilterLabel", "serviceFilterValue", [
        "All", "Check-up", "Vaccination", "Deworming", "Grooming"
    ]);

    setupDropdownFilter("btnPaymentFilter", "paymentFilterLabel", "paymentFilterValue", [
        "All", "Paid", "Partial", "Unpaid"
    ]);

    const dateBtn = document.getElementById("btnDateFilter");
    const dateInput = document.getElementById("dateFilterValue");
    const dateLabel = document.getElementById("dateFilterLabel");

    if (dateBtn && dateInput) {
        dateBtn.addEventListener("click", () => dateInput.showPicker ? dateInput.showPicker() : dateInput.click());

        dateInput.addEventListener("change", () => {
            dateLabel.textContent = dateInput.value || "Select Date";
            applyFilters();
        });
    }
}

function setupDropdownFilter(buttonId, labelId, hiddenInputId, options) {
    const button = document.getElementById(buttonId);
    const label = document.getElementById(labelId);
    const hiddenInput = document.getElementById(hiddenInputId);

    if (!button || !label || !hiddenInput) return;

    const dropdown = document.createElement("div");
    dropdown.className = "filter-dropdown";
    dropdown.style.display = "none";

    options.forEach(option => {
        const item = document.createElement("div");
        item.className = "filter-dropdown-item";
        item.textContent = option;

        item.addEventListener("click", e => {
            e.stopPropagation();

            hiddenInput.value = option;
            label.textContent = option === "All"
                ? label.dataset.default || button.dataset.default || option
                : option;

            dropdown.style.display = "none";
            applyFilters();
        });

        dropdown.appendChild(item);
    });

    button.style.position = "relative";
    button.appendChild(dropdown);

    button.addEventListener("click", e => {
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
    });

    document.addEventListener("click", () => {
        dropdown.style.display = "none";
    });
}

function renderAppointmentsTable() {
    const tbody = document.getElementById("appointmentTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!appointments.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding:30px;">
                    No appointments found.
                </td>
            </tr>
        `;
        return;
    }

    appointments.forEach(app => {
        const serviceBadges = app.services.map(service => {
            const cls = getServiceClass(service);
            return `<span class="service-badge ${cls}">${service}</span>`;
        }).join("");

        const statusClass = getStatusClass(app.status);
        const paymentClass = getPaymentClass(app.paymentStatus);

        tbody.innerHTML += `
            <tr data-status="${app.status}">
                <td><strong>APT-${String(app.apptId).padStart(4, "0")}</strong></td>

                <td><strong>${app.ownerName || "N/A"}</strong></td>

                <td><strong>${app.petName || "N/A"}</strong></td>

                <td>
                    <div class="service-chip-wrap">
                        ${serviceBadges}
                    </div>
                </td>

                <td>
                    <div class="date-time-cell">
                        <div>📅 <strong>${app.date}</strong></div>
                        <div>🕘 ${app.time}</div>
                    </div>
                </td>

                <td style="white-space: nowrap;">
                    <span class="status-badge ${statusClass}">
                        ${app.status || "Pending"}
                    </span>
                </td>

                <td style="white-space: nowrap;">
                    <span class="payment-badge ${paymentClass}">
                        ${app.paymentStatus || "Unpaid"}
                    </span>
                    <div class="balance-small">
                        ₱${Number(app.totalAmount || 0).toLocaleString()}
                    </div>
                </td>

                <td style="white-space: nowrap;">
                    <button class="icon-action view-action" onclick="viewAppointment(${app.apptId})">👁</button>
                    <button class="icon-action delete-action" onclick="deleteAppointment(${app.apptId})">🗑</button>
                </td>
            </tr>
        `;
    });
}

function getServiceClass(service) {
    const s = (service || "").toLowerCase();

    if (s.includes("check")) return "svc-checkup";
    if (s.includes("vaccination")) return "svc-vaccination";
    if (s.includes("deworming")) return "svc-deworming";
    if (s.includes("grooming")) return "svc-grooming";

    return "";
}

function getStatusClass(status) {
    const s = (status || "").toLowerCase();

    if (s === "checked-in") return "status-checkedin";
    if (s === "in-progress") return "status-inprogress";
    if (s === "completed") return "status-completed";
    if (s === "pending") return "status-pending";

    return "status-pending";
}

function getPaymentClass(status) {
    const s = (status || "").toLowerCase();

    if (s === "paid") return "payment-paid";
    if (s === "partial") return "payment-partial";
    if (s === "unpaid") return "payment-unpaid";

    return "payment-unpaid";
}
/* =========================
   HELPERS
========================= */

function closeModal(modalId) {

    const modal =
        document.getElementById(
            modalId
        );

    if (modal) {
        modal.style.display = "none";
    }
}

function onFormChange() {
    formDirty = true;
}

function onViewEditChange() {
    viewEditDirty = true;
}

/* =========================
   PAYMENT METHOD
========================= */

function onPaymentMethodChange() {
    const gcash =
        document.getElementById('pmGcash')?.checked;

    const gcashFields =
        document.getElementById('gcashFields');

    if (gcashFields) {
        gcashFields.classList.toggle(
            'visible',
            !!gcash
        );
    }
}

/* =========================
   DELETE APPOINTMENT
========================= */

async function deleteAppointment(apptId) {
    try {
        const response = await fetch(
            `http://localhost:5182/api/Appointment/${apptId}`,
            {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Delete failed."
            );
        }

        appointments = appointments.filter(
            a => a.apptId != apptId
        );

        closeModal('deleteConfirmModal');

        renderAppointmentsTable();
        updateSummaryCards();

    } catch (error) {
        console.error("Delete error:", error);
        alert(error.message);
    }
}

/* =========================
   BOOKING TOTAL
========================= */

function updateBookingTotal() {

    const checkedServices =
        document.querySelectorAll(
            '#serviceDropdownList input:checked'
        );

    const services =
        Array.from(checkedServices)
        .map(x => x.dataset.name);

    const total =
        calcTotal(services);

    const totalEl =
        document.getElementById(
            'bookingTotal'
        );

    if (totalEl) {

        totalEl.textContent =
            '₱' + total.toLocaleString();
    }

    const paidEl =
        document.getElementById(
            'apptAmountPaid'
        );

    const statusEl =
        document.getElementById(
            'apptPaymentStatus'
        );

    if (paidEl && statusEl) {

        const paid =
            parseFloat(
                paidEl.value
            ) || 0;

        if (paid <= 0) {

            statusEl.value = 'Unpaid';

        } else if (paid < total) {

            statusEl.value = 'Partial';

        } else {

            statusEl.value = 'Paid';
        }
    }
}

/* =========================
   SUBMIT APPOINTMENT
========================= */

async function submitNewAppointment() {
    const userId = document.getElementById("apptUserId").value;
    const petId = document.getElementById("apptPetId").value;
    const services = getSelectedServiceNames();
    const serviceIds = getSelectedServiceIds();
    const date = document.getElementById("apptDate").value;
    const time = document.getElementById("apptTime").value;
    const notes = document.getElementById("apptNotes").value.trim();

    const totalAmount = calcTotal(services);

    const amountPaidRaw =
        parseFloat(document.getElementById("apptAmountPaid")?.value) || 0;

    const amountPaid = Math.min(amountPaidRaw, totalAmount);

    const paymentStatus =
        document.getElementById("apptPaymentStatus")?.value || "Unpaid";

    const paymentMethod =
        document.querySelector('input[name="paymentMethod"]:checked')?.value || "Cash";

    const gcashName =
        document.getElementById("apptGcashName")?.value.trim() || "";

    const gcashRef =
        document.getElementById("apptGcashRef")?.value.trim() || "";

    if (!userId || !petId || serviceIds.length === 0 || !date || !time) {
        alert("Please complete all required fields.");
        return;
    }

    try {
        const response = await fetch("http://localhost:5182/api/Appointment/admin", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                userId: parseInt(userId),
                petId: parseInt(petId),
                appointmentDate: `${date}T${time}:00`,
                notes,
                serviceIds,
                amountPaid,
                paymentStatus,
                paymentMethod,
                gcashName,
                gcashRef
            })
        });

        const text = await response.text();
        let data = {};

        if (text.trim() !== "") {
            data = JSON.parse(text);
        }

        if (!response.ok) {
            throw new Error(data.message || `Failed to save appointment. Status: ${response.status}`);
        }

        formDirty = false;
        closeNewAppointmentModal();

        await loadAppointments();
        updateSummaryCards();

        alert(data.message || "Appointment created successfully.");

    } catch (error) {
        console.error("Save appointment error:", error);
        alert(error.message);
    }
}

function openNewAppointmentModal() {

    const modal =
        document.getElementById(
            "newAppointmentModal"
        );

    if (modal) {
        modal.style.display = "flex";
    }
}

function closeNewAppointmentModal() {
    if (formDirty) {
        const modal = document.getElementById("unsavedModal");
        if (modal) modal.style.display = "flex";
        return;
    }

    const modal = document.getElementById("newAppointmentModal");
    if (modal) {
        modal.style.display = "none";
    }
}

function viewAppointment(apptId) {
    const app = appointments.find(a => a.apptId == apptId);

    if (!app) {
        alert("Appointment not found.");
        return;
    }

    document.getElementById("viewApptId").textContent = `APT-${String(app.apptId).padStart(4, "0")}`;
    document.getElementById("viewUserId").textContent = app.userId || "N/A";
    document.getElementById("viewPetId").textContent = app.petId || "N/A";
    document.getElementById("viewOwner").textContent = app.ownerName || "N/A";
    document.getElementById("viewPet").textContent = app.petName || "N/A";
    document.getElementById("viewDateTime").textContent = `${app.date} at ${app.time}`;
    document.getElementById("viewNotes").textContent = app.notes || "No notes.";

    const serviceContainer = document.getElementById("viewServiceContainer");
    if (serviceContainer) {
        serviceContainer.innerHTML = app.services.map(service => `
            <span class="service-badge ${getServiceClass(service)}">${service}</span>
        `).join("");
    }

    const statusSelect = document.getElementById("viewStatusSelect");
    if (statusSelect) {
        statusSelect.value = app.status || "Pending";
        statusSelect.dataset.apptId = app.apptId;
    }

    const modal = document.getElementById("viewAppointmentModal");
    if (modal) modal.style.display = "flex";
}

function enableViewEdit() {

    const statusSelect =
        document.getElementById("viewStatusSelect");

    const editBtn =
        document.getElementById("viewEditBtn");

    if (!statusSelect || !editBtn) return;

    statusSelect.disabled = false;

    editBtn.textContent = "Save Changes";

    editBtn.onclick = async function () {

        await saveViewStatus();

        statusSelect.disabled = true;

        editBtn.textContent = "Edit Details";

        editBtn.onclick = enableViewEdit;
    };
}

async function saveViewStatus() {
    const statusSelect = document.getElementById("viewStatusSelect");
    if (!statusSelect) return;

    const apptId = statusSelect.dataset.apptId;
    const newStatus = statusSelect.value;

    try {
        const response = await fetch(`${API_BASE_URL}/Appointment/${apptId}/app-status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(newStatus)
        });

        const text = await response.text();
        let data = {};

        if (text.trim() !== "") {
            data = JSON.parse(text);
        }

        if (!response.ok) {
            throw new Error(data.message || "Failed to update status.");
        }

        closeModal("viewAppointmentModal");
        await loadAppointments();
        updateSummaryCards();

        alert("Appointment status updated successfully.");

    } catch (error) {
        console.error("Update status error:", error);
        alert(error.message);
    }
}

function closeViewModal() {
    closeModal("viewAppointmentModal");
}

function closeViewAppointmentModal() {
    closeModal("viewAppointmentModal");
}

async function saveViewChanges() {
    await saveViewStatus();
}

function enableViewEdit() {
    const statusSelect = document.getElementById("viewStatusSelect");
    const editBtn = document.getElementById("viewEditBtn");

    if (statusSelect) {
        statusSelect.disabled = false;
        statusSelect.focus();
    }

    if (editBtn) {
        editBtn.textContent = "Save Changes";
        editBtn.onclick = saveViewChanges;
    }
}

const unsavedDiscardBtn = document.getElementById("unsavedDiscardBtn");
const unsavedContinueBtn = document.getElementById("unsavedContinueBtn");

if (unsavedDiscardBtn) {
    unsavedDiscardBtn.addEventListener("click", function () {
        formDirty = false;
        closeModal("unsavedModal");
        closeNewAppointmentModal();
    });
}

if (unsavedContinueBtn) {
    unsavedContinueBtn.addEventListener("click", function () {
        closeModal("unsavedModal");
    });
}

/* =========================
   DOM READY
========================= */

document.addEventListener('DOMContentLoaded', async () => {

    currentAdmin = requireLogin("Admin");

    if (!currentAdmin) return;

    token = localStorage.getItem("token");

    console.log("TOKEN:", token);

    const userName =
        localStorage.getItem("userName");

    if (userName) {

        const userNameEl =
            document.getElementById("UserName");

        if (userNameEl) {
            userNameEl.textContent = userName;
        }
    }

    const userSelect =
        document.getElementById("apptUserId");

    if (userSelect) {

        userSelect.addEventListener(
            "change",
            function () {

                const userId = this.value;

                if (userId) {
                    loadPetsByUser(userId);
                }
            }
        );
    }

    loadTimeDropdown();

    await loadUsersDropdown();

    await loadServicesIntoDropdown();
    setupFilters();
    await loadAppointments();

    updateSummaryCards();

    onPaymentMethodChange();
});

document.addEventListener("click", function (e) {
    const button = document.getElementById("serviceDropdownBtn");
    const dropdown = document.getElementById("serviceDropdownList");

    if (!button || !dropdown) return;

    if (button.contains(e.target)) {
        e.stopPropagation();

        dropdown.style.display =
            dropdown.style.display === "block"
                ? "none"
                : "block";

        return;
    }

    if (!dropdown.contains(e.target)) {
        dropdown.style.display = "none";
    }
});