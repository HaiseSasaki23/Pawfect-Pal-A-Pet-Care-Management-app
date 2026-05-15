document.addEventListener("DOMContentLoaded", function () {
    const user = requireLogin("User");
    if (!user) return;

    initAppointmentPage();
});

function initAppointmentPage() {
    setMinimumBookingDate();
    setupBookAppointmentForm();
    setupOutsideClickClose();
    loadPetsDropdown();
    loadServices();    
    loadAppointments();
}

/* API Configuration*/
const API_BASE_URL = 'http://localhost:5182';

/* date limit */
function setMinimumBookingDate() {
    const today = new Date().toISOString().split("T")[0];
    const bookingDate = document.getElementById("bookingDate");

    if (bookingDate) {
        bookingDate.setAttribute("min", today);
    }
}

/* Load pets */
async function loadAppointments() {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/Appointment/my?t=${Date.now()}`, {
            headers: getAuthHeaders()
        });      

        if (handleUnauthorized(response)) return;    

        const text = await response.text();

        console.log("RAW RESPONSE:", text);

        let data = [];

        if (text) {
            data = JSON.parse(text);
        }        

        const container = document.getElementById("appointmentList");
        container.innerHTML = "";

        if (!data.length) {
            container.innerHTML = "<p>No appointments found.</p>";
            return;
        }

        const petsResponse = await fetch(`${API_BASE_URL}/api/Pet/user/${userId}?t=${Date.now()}`, {
            headers: getAuthHeaders()
        });
        const pets = await petsResponse.json();
        
        const petSpeciesMap = {};
        pets.forEach(pet => {
            const petId = pet.id || pet.petId;
            petSpeciesMap[petId] = pet.species || "Unknown";
        });

        data.forEach(app => {
            const card = document.createElement("div");
            card.className = "appointment-card";

          
            const species = petSpeciesMap[app.petId] || "Unknown";

            let servicesText = app.services || "N/A";
            if (Array.isArray(app.services)) {
                servicesText = app.services.join(', ');
            }

            const dateObj = new Date(app.appointmentDate);
            const datePart = dateObj.toLocaleString('en-US', { 
                year: 'numeric',
                month: 'long', 
                day: 'numeric'
            });
            const timePart = dateObj.toLocaleString('en-US', { 
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            const formattedDate = `${datePart} | ${timePart}`;

            card.innerHTML = `
            <span></span>
            <span>
                ${app.petName}<br>
                <small style="color: #999; font-size: 11px;">${species}</small>
            </span>
            <span>${servicesText}</span>
            <span>${formattedDate}</span>
            <span class="status-badge ${(app.appStatus || "pending").toLowerCase()}">${app.appStatus || "Pending"}</span>
            `;

            card.setAttribute("data-pet", (app.petName || "").toLowerCase());
            card.setAttribute("data-status", (app.appStatus || "").toLowerCase());
            card.setAttribute("data-species", species.toLowerCase());
            
            let serviceIds = app.serviceIds || [];
            if (typeof serviceIds === 'string') {
                serviceIds = serviceIds.split(',');
            } else if (typeof serviceIds === 'number') {
                serviceIds = [serviceIds.toString()];
            } else if (!Array.isArray(serviceIds)) {
                serviceIds = [];
            }
            card.setAttribute("data-services", serviceIds.join(','));

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Error loading appointments:", error);
        const container = document.getElementById("appointmentList");
        if (container) {
            container.innerHTML = `<p style='text-align:center; padding:40px; color:red;'>Failed to load appointments.<br>Error: ${error.message}</p>`;
        }
    }
}

async function loadPetsDropdown() {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/Pet/user/${userId}?t=${Date.now()}`, {
            headers: getAuthHeaders()
        });
        const pets = await response.json();

        const select = document.getElementById("bookingPetName");

        if (!select) return;

        select.innerHTML = `<option value="" disabled selected>Select Pet</option>`;

        pets.forEach(pet => {
            const option = document.createElement("option");
            option.value = pet.petId;
            option.textContent = pet.name;

            select.appendChild(option);
        });

    } catch (error) {
        console.error("Error loading pets:", error);
    }
}

async function loadServices() {
    const servicesBox = document.getElementById("servicesBox");
    const serviceDropdown = document.getElementById("serviceDropdown");

    try {
        const response = await fetch(`${API_BASE_URL}/api/Service?t=${Date.now()}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error("Failed to load services.");
        }

        const services = await response.json();

        if (!Array.isArray(services) || services.length === 0) {
            return;
        }

        servicesBox.innerHTML = services.map(service => `
            <div class="beck-option">
                <input type="checkbox"
                       id="s${service.serviceID}"
                       name="services"
                       data-price="${service.price}"
                       value="${service.serviceID}">
                <label for="s${service.serviceID}">
                    ${service.serviceType} <span>₱${Number(service.price).toLocaleString()}</span>
                </label>
            </div>
        `).join("");

        serviceDropdown.innerHTML = services.map(service => `
            <label>
                <input type="checkbox"
                       class="service-filter-check"
                       value="${service.serviceID}"
                       onchange="filterAppointments()">
                ${service.serviceType}
            </label>
        `).join("");

        setupServiceCalculation();

    } catch (error) {
        console.error("Load services error:", error);
    }
}

/* modal control functions */
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

/* service calculation logic */
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

/* gcash detail toggle */
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

/* form submission logic with backend connection */
function setupBookAppointmentForm() {
    const bookAppointmentForm = document.getElementById("bookAppointmentForm");

    if (!bookAppointmentForm) return;

    bookAppointmentForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const selectedServiceElements = document.querySelectorAll('input[name="services"]:checked');
        
        const serviceIds = Array.from(selectedServiceElements)
            .map(el => parseInt(el.value))
            .filter(id => !isNaN(id));

        const petSelect = document.getElementById("bookingPetName");
        const dateInput = document.getElementById("bookingDate");
        const timeInput = document.getElementById("bookingTime");
        const gcashRef = document.getElementById("gcashRef");

        if (!petSelect.value) {
            alert("Please select a pet");
            return;
        }

        if (serviceIds.length === 0) {
            alert("Please select at least one service.");
            return;
        }

        if (!dateInput.value || !timeInput.value) {
            alert("Please select date and time");
            return;
        }

        const datePart = dateInput.value;
        const timePart = timeInput.value;
        const fullDateTime = `${datePart} ${timePart}:00`;

        const paymentMode =
            document.getElementById("bookingPayment").value;

        if (
            paymentMode === "GCash" &&
            !gcashRef.value.trim()
        ) {
            alert("GCash reference number is required.");
            return;
        }

        const appointmentData = {
            userId: parseInt(localStorage.getItem("userId")),
            petId: parseInt(petSelect.value),
            appointmentDate: fullDateTime.replace(' ', 'T'),
            requestStatus: "Pending",
            appStatus: "Pending",
            notes: gcashRef ? gcashRef.value : "",
            serviceIds: serviceIds,
            paymentMode: paymentMode
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/appointment`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(appointmentData)
            });

            const text = await response.text();

            console.log("BOOK RESPONSE:", text);

            const result = text ? JSON.parse(text) : {};

            if (response.ok) {
                closeModal("bookAppointmentModal");
                showSuccessMessage();
                loadAppointments();
            } else {
                alert("Error: " + result.message);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Cannot connect to backend. Make sure it's running at " + API_BASE_URL);
        }
    });
}

/* success message  */
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

/* unified filter logic */
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

/* clear all filters logic */
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

/* service dropdown */
function toggleServiceDropdown() {
    const container = document.querySelector(".dropdown-check-container");

    if (container) {
        container.classList.toggle("active");
    }
}

/* close dropdown and modal when clicking outside */
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

