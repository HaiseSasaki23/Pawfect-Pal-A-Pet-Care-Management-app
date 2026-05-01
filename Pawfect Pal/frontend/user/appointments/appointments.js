document.addEventListener("DOMContentLoaded", function () {
    const user = requireLogin("User");
    if (!user) return;

    initAppointmentPage();
});

function initAppointmentPage() {
    setMinimumBookingDate();
    setupServiceCalculation();
    setupBookAppointmentForm();
    setupOutsideClickClose();
}

/* --- date limit --- */
function setMinimumBookingDate() {
    const today = new Date().toISOString().split("T")[0];
    const bookingDate = document.getElementById("bookingDate");

    if (bookingDate) {
        bookingDate.setAttribute("min", today);
    }
}

/* --- modal control functions --- */
function openModal(id) {
    const modal = document.getElementById(id);

    if (modal) {
        modal.style.display = "flex";
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);

    if (modal) {
        modal.style.display = "none";

        const form = modal.querySelector("form");

        if (form) {
            form.reset();

            const gcashBox = document.getElementById("gcashDetails");
            if (gcashBox) {
                gcashBox.style.display = "none";
            }

            const totalText = document.getElementById("bookingTotal");
            if (totalText) {
                totalText.innerText = "₱0";
            }
        }
    }
}

/* --- service calculation logic --- */
function setupServiceCalculation() {
    const serviceCheckboxes = document.querySelectorAll('input[name="services"]');

    serviceCheckboxes.forEach(function (checkbox) {
        checkbox.addEventListener("change", function () {
            let total = 0;

            const checkedServices = document.querySelectorAll('input[name="services"]:checked');

            checkedServices.forEach(function (checked) {
                const price = parseInt(checked.getAttribute("data-price")) || 0;
                total += price;
            });

            const totalDisplay = document.getElementById("bookingTotal");

            if (totalDisplay) {
                totalDisplay.innerText = "₱" + total.toLocaleString();
            }
        });
    });
}

/* --- gcash detail toggle --- */
function toggleGcashDetails() {
    const paymentSelect = document.getElementById("bookingPayment");
    const gcashBox = document.getElementById("gcashDetails");

    if (!paymentSelect || !gcashBox) return;

    if (paymentSelect.value === "GCash") {
        gcashBox.style.display = "block";
    } else {
        gcashBox.style.display = "none";
    }
}

/* --- form submission logic --- */
function setupBookAppointmentForm() {
    const bookAppointmentForm = document.getElementById("bookAppointmentForm");

    if (!bookAppointmentForm) return;

    bookAppointmentForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const selectedServiceElements = document.querySelectorAll('input[name="services"]:checked');

        const serviceIDs = Array.from(selectedServiceElements).map(function (el) {
            return el.value;
        });

        const petSelect = document.getElementById("bookingPetName");
        const dateInput = document.getElementById("bookingDate");
        const timeInput = document.getElementById("bookingTime");
        const gcashRef = document.getElementById("gcashRef");

        if (!petSelect || !dateInput || !timeInput) {
            alert("Booking form is incomplete.");
            return;
        }

        if (serviceIDs.length === 0) {
            alert("Please select at least one service.");
            return;
        }

        const datePart = dateInput.value;
        const timePart = timeInput.value;
        const fullDateTime = `${datePart} ${timePart}:00`;

        const appointmentPayload = {
            appointment: {
                PetID: parseInt(petSelect.value),
                AppointmentDate: fullDateTime,
                RequestStatus: "Pending",
                AppStatus: "Pending",
                Notes: gcashRef ? gcashRef.value : "",
                UserID: parseInt(localStorage.getItem("userId"))
            },
            services: serviceIDs
        };

        console.log("Junction-Table Ready Data:", appointmentPayload);

        closeModal("bookAppointmentModal");
        showSuccessMessage();
    });
}

/* --- success message --- */
function showSuccessMessage() {
    const successToast = document.getElementById("successToast");

    if (successToast) {
        successToast.style.display = "flex";
    }
}

function hideSuccessMessage() {
    const successToast = document.getElementById("successToast");

    if (successToast) {
        successToast.style.display = "none";
    }
}

/* --- unified filter logic --- */
function filterAppointments() {
    const searchInput = document.getElementById("appSearch");
    const speciesFilter = document.getElementById("speciesFilter");
    const statusSelect = document.getElementById("statusSelect");

    if (!searchInput || !speciesFilter || !statusSelect) return;

    const searchVal = searchInput.value.toLowerCase();
    const speciesVal = speciesFilter.value.toLowerCase();
    const statusVal = statusSelect.value.toLowerCase();

    const checkedServiceInputs = document.querySelectorAll(".service-filter-check:checked");

    const selectedServiceIDs = Array.from(checkedServiceInputs).map(function (input) {
        return input.value;
    });

    const cards = document.querySelectorAll(".appointment-card");

    cards.forEach(function (card) {
        const petName = (card.getAttribute("data-pet") || "").toLowerCase();
        const species = (card.getAttribute("data-species") || "").toLowerCase();
        const status = (card.getAttribute("data-status") || "").toLowerCase();

        const cardServicesAttr = card.getAttribute("data-services") || "";
        const cardServicesArray = cardServicesAttr ? cardServicesAttr.split(",") : [];

        const matchesSearch = petName.includes(searchVal);
        const matchesSpecies = speciesVal === "all" || species === speciesVal;
        const matchesStatus = statusVal === "all" || status === statusVal;

        const matchesService =
            selectedServiceIDs.length === 0 ||
            selectedServiceIDs.every(function (id) {
                return cardServicesArray.includes(id);
            });

        if (matchesSearch && matchesSpecies && matchesStatus && matchesService) {
            card.style.display = "grid";
        } else {
            card.style.display = "none";
        }
    });
}

/* --- clear all filters logic --- */
function clearAllFilters() {
    const searchInput = document.getElementById("appSearch");
    const speciesFilter = document.getElementById("speciesFilter");
    const statusSelect = document.getElementById("statusSelect");

    if (searchInput) searchInput.value = "";
    if (speciesFilter) speciesFilter.value = "all";
    if (statusSelect) statusSelect.value = "all";

    const serviceChecks = document.querySelectorAll(".service-filter-check");

    serviceChecks.forEach(function (check) {
        check.checked = false;
    });

    const dropdownContainer = document.querySelector(".dropdown-check-container");

    if (dropdownContainer) {
        dropdownContainer.classList.remove("active");
    }

    filterAppointments();
}

/* --- service dropdown --- */
function toggleServiceDropdown() {
    const container = document.querySelector(".dropdown-check-container");

    if (container) {
        container.classList.toggle("active");
    }
}

/* --- close dropdown and modal when clicking outside --- */
function setupOutsideClickClose() {
    window.addEventListener("click", function (e) {
        const container = document.querySelector(".dropdown-check-container");

        if (container && !container.contains(e.target)) {
            container.classList.remove("active");
        }

        if (e.target.classList.contains("modal-overlay")) {
            closeModal("bookAppointmentModal");
            closeModal("confirmModal");
        }
    });
}