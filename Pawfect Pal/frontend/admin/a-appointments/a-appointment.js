const user = requireLogin("Admin");

if (!user) {
    throw new Error("Unauthorized");
}

const token = localStorage.getItem("token");

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
    return (services || []).reduce(
        (sum, s) => sum + (SERVICE_PRICES[s] || 0),
        0
    );
}

/* =========================
   GLOBALS
========================= */

let appointments = [];
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
        const response = await fetch(
            "http://localhost:5182/api/Appointment",
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

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

            ownerName:
                `${a.ownerFName ?? ""} ${a.ownerLName ?? ""}`.trim(),

            petName: a.petName ?? `Pet ${a.petId}`,

            services: a.services ?? [],
            serviceType: (a.services ?? []).join(", "),

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

        applyFilters();
        updateSummaryCards();

    } catch (error) {
        console.error("Load appointments error:", error);
    }
}

/* =========================
   HELPERS
========================= */

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
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

        applyFilters();
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

    const services =
        getSelectedServicesFrom(
            'serviceDropdownList'
        );

    const total = calcTotal(services);

    const el =
        document.getElementById('bookingTotal');

    if (el) {
        el.textContent =
            '₱' + total.toLocaleString();
    }

    const paidEl =
        document.getElementById('apptAmountPaid');

    const psEl =
        document.getElementById('apptPaymentStatus');

    if (paidEl && psEl) {

        const paid =
            parseFloat(paidEl.value) || 0;

        if (paid <= 0) {
            psEl.value = 'Unpaid';
        }
        else if (paid < total) {
            psEl.value = 'Partial';
        }
        else {
            psEl.value = 'Paid';
        }
    }
}

/* =========================
   SUBMIT APPOINTMENT
========================= */

function submitNewAppointment() {

    const userId =
        document.getElementById('apptUserId').value;

    const petId =
        document.getElementById('apptPetId').value;

    const services =
        getSelectedServicesFrom(
            'serviceDropdownList'
        );

    const date =
        document.getElementById('apptDate').value;

    const time =
        document.getElementById('apptTime').value;

    const notes =
        document.getElementById('apptNotes')
            .value.trim();

    const totalAmount =
        calcTotal(services);

    const amountPaidRaw =
        parseFloat(
            document.getElementById(
                'apptAmountPaid'
            )?.value
        ) || 0;

    const amountPaid =
        Math.min(amountPaidRaw, totalAmount);

    const paymentStatus =
        document.getElementById(
            'apptPaymentStatus'
        )?.value || 'Unpaid';

    const paymentMethod =
        document.querySelector(
            'input[name="paymentMethod"]:checked'
        )?.value || 'Cash';

    const gcashName =
        document.getElementById(
            'apptGcashName'
        )?.value.trim() || '';

    const gcashRef =
        document.getElementById(
            'apptGcashRef'
        )?.value.trim() || '';

    console.log({
        userId,
        petId,
        services,
        totalAmount,
        amountPaid,
        paymentStatus,
        paymentMethod,
        gcashName,
        gcashRef
    });

    // continue existing save logic here
}

/* =========================
   DOM READY
========================= */

document.addEventListener('DOMContentLoaded', () => {

    const userName =
        localStorage.getItem("userName");

    if (userName) {
        document.getElementById(
            "UserName"
        ).textContent = userName;
    }

    buildTimeOptions();

    buildServiceDropdown(
        'serviceDropdownBtn',
        'serviceDropdownList',
        'serviceDropdownDisplay',
        false
    );

    buildStatusDropdown();

    buildServiceFilterDropdown();

    buildPaymentFilterDropdown();

    loadAppointments();

    updateSummaryCards();
});