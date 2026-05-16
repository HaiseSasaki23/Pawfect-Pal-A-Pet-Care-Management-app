document.addEventListener("DOMContentLoaded", function () {
    const user = requireLogin("User");
    if (!user) return;

    showDashboardSkeletons();
    showPetsSkeleton();

    loadDashboardSummary(user.userId, user.role);
    loadPets(user.userId);
    loadAppointments(user.userId);
    loadPetsForDropdown();

    const petPhotoInput = document.getElementById("petPhoto");
    if (petPhotoInput) {
        petPhotoInput.addEventListener("change", function () {
            const file = this.files[0];
            const img = document.getElementById("petPhotoImg");
            const emoji = document.getElementById("defaultPetEmoji");
            if (file) {
                const reader = new FileReader();
                reader.onload = e => {
                    img.src = e.target.result;
                    img.style.display = "block";
                    emoji.style.display = "none";
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // update default emoji when species changes
    document.getElementById("petSpecies")?.addEventListener("change", updateDefaultEmoji);
});

async function loadDashboardSummary(userId, role) {
    const url = role.toLowerCase() === "admin"
        ? "http://localhost:5182/api/Dashboard/admin-summary"
        : `http://localhost:5182/api/Dashboard/my-summary`;

    try {
        const response = await fetch(url, {
            headers: getAuthHeaders()
        });

        if (handleUnauthorized(response)) return;

        if (!response.ok) throw new Error("Failed to load dashboard summary.");
        const data = await response.json();

        function updateStat(id, value) {
            const el = document.getElementById(id);
            if (!el) return;
            el.style.opacity = "0";
            setTimeout(() => {
                el.textContent = value ?? 0;
                el.style.opacity = "1";
            }, 120);
        }

        updateStat("TotalPetsCount", data.totalPets);
        updateStat("AptCount", data.totalAppointments);

        // due Balance
        const dueEl = document.getElementById("DueBalance");
        if (dueEl) {
            dueEl.style.opacity = "0";
            setTimeout(() => {
                const amount = data.dueBalance ?? 0;
                dueEl.textContent = `₱${amount.toLocaleString()}`;
                if (amount > 0) {
                    dueEl.classList.add("overdue");
                } else {
                    dueEl.classList.remove("overdue");
                }
                dueEl.style.opacity = "1";
            }, 120);
        }

        // check appointments for overdue (2 weeks after completed)
        if (data.appointments) {
            markOverdueBalances(data.appointments);
        }

    } catch (error) {
        console.error("Dashboard summary error:", error);
    }
}

// mark due balance red if appointment was completed >2 weeks ago and unpaid
function markOverdueBalances(appointments) {
    const now = new Date();
    const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;
    appointments.forEach(apt => {
        if (apt.status === "Completed" && !apt.isPaid) {
            const completedDate = new Date(apt.completedDate || apt.date);
            if (now - completedDate > twoWeeksMs) {
                const dueEl = document.getElementById("DueBalance");
                if (dueEl) dueEl.classList.add("overdue");
                const pill = dueEl?.closest(".stat-pill");
                if (pill) pill.classList.add("overdue-pill");
            }
        }
    });
}

async function loadPets(userId) {
    try {
        const response = await fetch(`http://localhost:5182/api/Pet/user/${userId}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error(`Failed to load pets. Status: ${response.status}`);
        const pets = await response.json();

        const container = document.getElementById("PetsList");
        const empty = document.getElementById("EmptyPets");

        if (!Array.isArray(pets) || pets.length === 0) {
            setTimeout(() => {
                container.innerHTML = "";
                empty.style.display = "flex";
            }, 200);
            return;
        }

        empty.style.display = "none";
        container.style.opacity = "0";
        setTimeout(() => {
            container.innerHTML = pets.map(pet => {
                const emoji = getSpeciesEmoji(pet.species);
                return `
                <div class="pet-list-item">
                    <div class="pet-avatar-emoji">${emoji}</div>
                    <div class="pet-details-list">
                        <div class="pet-name-row">
                            <strong>${pet.name}</strong>
                            <span class="species-tag" style="${getSpeciesTagStyle(pet.species)}">${pet.species}</span>
                        </div>
                        <div class="breed-text">${pet.breed}</div>
                    </div>
                    <div class="pet-info-right">
                        <span>${pet.gender || ""}</span>
                    </div>
                </div>`;
            }).join("");
            container.style.opacity = "1";
        }, 120);
    } catch (err) {
        console.error("Load pets error:", err);
    }
}

async function loadPetsForDropdown() {
    const userId = localStorage.getItem("userId");
    const select = document.getElementById("bookingPetName");

    if (!userId || !select) return;

    select.innerHTML = `<option value="" disabled selected>Loading pets...</option>`;

    try {
        const response = await fetch(`http://localhost:5182/api/Pet/user/${userId}?t=${Date.now()}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`Failed to load pets. Status: ${response.status}`);
        }

        const pets = await response.json();

        select.innerHTML = `<option value="" disabled selected>Select Pet</option>`;

        if (!Array.isArray(pets) || pets.length === 0) {
            select.innerHTML = `<option value="" disabled selected>No pets found. Please add a pet first.</option>`;
            return;
        }

        pets.forEach(pet => {
            const option = document.createElement("option");
            option.value = pet.petId;
            option.textContent = `${getSpeciesEmoji(pet.species)} ${pet.name}`;
            select.appendChild(option);
        });

    } catch (error) {
        console.error("Error loading pets for dropdown:", error);
        select.innerHTML = `<option value="" disabled selected>Failed to load pets</option>`;
    }
}

async function loadAppointments(userId) {
    try {
        const response = await fetch(`http://localhost:5182/api/Appointment/my`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            throw new Error("Failed to load appointments");
        }

        const appointments = await response.json();

        const container = document.getElementById("AptList");
        const empty = document.getElementById("EmptyApt");

        if (!appointments || appointments.length === 0) {
            container.innerHTML = "";
            empty.style.display = "flex";
            return;
        }

        empty.style.display = "none";

        container.innerHTML = appointments.map(apt => {
            const date = new Date(apt.appointmentDate);
            const day = date.getDate();
            const month = date.toLocaleString('default', { month: 'short' });

            return `
                <div class="appointment-list-item">
                    <div class="calendar-mini">
                        <div class="cal-month">${month}</div>
                        <div class="cal-day">${day}</div>
                    </div>
                    <div class="apt-details-list">
                        <strong>${apt.petName}</strong>
                        <div class="apt-time-row">
                            ⏰ ${apt.appointmentTime || ""}
                        </div>
                        <div class="apt-time-row">
                            🛠 ${apt.services || "No service"}
                        </div>
                    </div>
                </div>
            `;
        }).join("");

    } catch (error) {
        console.error("Load appointments error:", error);
    }
}

function getSpeciesEmoji(species) {
    const s = (species || "").toLowerCase();
    if (s === "dog") return "🐶";
    if (s === "cat") return "🐱";
    return "🐾";
}

function getSpeciesTagStyle(species) {
    const s = (species || "").toLowerCase();
    if (s === "dog") return "background:#ede3ff; color:#9d72d6;";
    if (s === "cat") return "background:#dbfce8; color:#2e9e5b;";
    return "background:#ffefe0; color:#e07820;";
}

function updateDefaultEmoji() {
    const species = document.getElementById("petSpecies")?.value;
    const emoji = document.getElementById("defaultPetEmoji");
    const img = document.getElementById("petPhotoImg");
    if (!emoji || img?.style.display === "block") return;
    if (species === "Dog") emoji.textContent = "🐶";
    else if (species === "Cat") emoji.textContent = "🐱";
    else emoji.textContent = "🐾";
}

// skeleton loaders 
window.onload = function () {
    const today = new Date().toISOString().split('T')[0];
    const bookingDate = document.getElementById('bookingDate');
    if (bookingDate) bookingDate.setAttribute('min', today);
};

function showDashboardSkeletons() {
    ["TotalPetsCount", "AptCount", "DueBalance"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = `<span class="skeleton" style="display:inline-block;width:55px;height:24px;"></span>`;
    });
}

function showPetsSkeleton() {
    const container = document.getElementById("PetsList");
    const empty = document.getElementById("EmptyPets");
    if (!container) return;
    if (empty) empty.style.display = "none";
    container.innerHTML = `
        <div class="skeleton skeleton-row"></div>
        <div class="skeleton skeleton-row"></div>
        <div class="skeleton skeleton-row"></div>
    `;
}

const MODAL_MAP = {
    'Add Pet': 'addPetModal',
    'Appointment': 'bookAppointmentModal',
    'Reminders': 'remindersModal'
};

function openActionModal(type) {
    const modals = {
        'Add Pet': 'addPetModal',
        'Appointment': 'bookAppointmentModal',
        'Reminders': 'remindersModal'
    };
    if (modals[type]) {
        if (type === 'Appointment') {
            loadPetsForDropdown();
        }
        
        document.getElementById(modals[type]).style.display = 'flex';
    document.querySelector('.dashboard-container').classList.add('page-blurred');
    if (MODAL_MAP[type]) {
        document.getElementById(MODAL_MAP[type]).style.display = 'flex';
        document.body.classList.add('modal-open');
        if (type === 'Appointment') populatePetDropdown();
        }
    }
}

async function populatePetDropdown() {
    await loadPetsForDropdown();
}

function formHasChanges(type) {
    if (type === 'Add Pet') {
        const fields = ['petName', 'petColor', 'petBreed'];
        return fields.some(id => (document.getElementById(id)?.value || "").trim() !== "") ||
            (document.getElementById('petBirthday')?.value || "") !== "" ||
            (document.getElementById('petSpecies')?.value || "") !== "" ||
            (document.getElementById('petGender')?.value || "") !== "";
    }
    if (type === 'Appointment') {
        const servicesChecked = document.querySelectorAll('input[name="services"]:checked').length > 0;
        return (document.getElementById('bookingPetName')?.value || "") !== "" ||
            (document.getElementById('bookingDate')?.value || "") !== "" ||
            (document.getElementById('bookingTime')?.value || "") !== "" ||
            servicesChecked ||
            (document.getElementById('bookingPayment')?.value || "") !== "";
    }
    return false;
}

let _pendingCloseType = null;

function requestCloseModal(type) {
    if (formHasChanges(type)) {
        _pendingCloseType = type;
        document.getElementById('unsavedModal').style.display = 'flex';
        document.body.classList.add('modal-unsaved');
    } else {
        closeActionModal(type);
    }
}

document.getElementById('unsavedContinueBtn')?.addEventListener('click', () => {
    document.getElementById('unsavedModal').style.display = 'none';
    document.body.classList.remove('modal-unsaved');
    _pendingCloseType = null;
});
document.getElementById('unsavedDiscardBtn')?.addEventListener('click', () => {
    document.getElementById('unsavedModal').style.display = 'none';
    document.body.classList.remove('modal-unsaved');
    if (_pendingCloseType) {
        closeActionModal(_pendingCloseType);
        _pendingCloseType = null;
    }
});

function closeActionModal(type) {
    document.querySelector('.dashboard-container').classList.remove('page-blurred');
    const id = MODAL_MAP[type];
    if (!id) return;
    document.getElementById(id).style.display = 'none';
    document.body.classList.remove('modal-open', 'modal-unsaved');

    if (type === 'Reminders') {
        const dot = document.getElementById('RemindDot');
        if (dot) dot.classList.remove('active');
    } else {
        const formId = type === 'Add Pet' ? 'addPetForm' : 'bookAppointmentForm';
        const form = document.getElementById(formId);
        if (form) form.reset();

        if (type === 'Add Pet') {
            document.getElementById('otherSpeciesGroup').style.display = 'none';
            const img = document.getElementById('petPhotoImg');
            const emoji = document.getElementById('defaultPetEmoji');
            if (img) { img.style.display = 'none'; img.src = ''; }
            if (emoji) { emoji.style.display = 'block'; emoji.textContent = '🐾'; }
        }
        if (type === 'Appointment') {
            document.getElementById('bookingTotal').innerText = '₱0';
            document.getElementById('gcashDetails').style.display = 'none';
        }
        clearErrors();
    }
}

function showAlertModal(title, message, icon = "") {
    const iconEl = document.getElementById('alertIcon');
    if (icon) {
        iconEl.textContent = icon;
        iconEl.style.display = 'block';
    } else {
        iconEl.style.display = 'none';
    }
    document.getElementById('alertTitle').textContent = title;
    document.getElementById('alertMessage').textContent = message;
    document.getElementById('alertModal').style.display = 'flex';
    document.body.classList.add('modal-open');
}

function closeAlertModal() {
    document.getElementById('alertModal').style.display = 'none';
    document.body.classList.remove('modal-open', 'modal-unsaved');
}

function showSuccessMessage(title, message) {
    document.getElementById('successTitle').innerText = title;
    document.getElementById('successMessage').innerText = message;
    document.getElementById('successModal').style.display = 'flex';
    document.body.classList.add('modal-open');
}

function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
    document.body.classList.remove('modal-open', 'modal-unsaved');
}

function clearErrors() {
    document.querySelectorAll('.error-msg').forEach(e => e.style.display = 'none');
    document.querySelectorAll('.input-error').forEach(i => i.classList.remove('input-error'));
}

function toggleGcashDetails() {
    const payment = document.getElementById('bookingPayment').value;
    const gcashBox = document.getElementById('gcashDetails');
    if (gcashBox) gcashBox.style.display = payment === 'GCash' ? 'block' : 'none';
}

// service price calculation
document.querySelectorAll('input[name="services"]').forEach(cb => {
    cb.addEventListener('change', () => {
        let total = 0;
        document.querySelectorAll('input[name="services"]:checked').forEach(checked => {
            total += parseInt(checked.getAttribute('data-price'));
        });
        document.getElementById('bookingTotal').innerText = `₱${total.toLocaleString()}`;
    });
});

const validator = (id, errorId, type) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', function () {
        const lettersOnly = /^[A-Za-z\s]*$/;
        const numbersOnly = /^[0-9]*$/;
        const err = document.getElementById(errorId);
        let isValid = type === 'text' ? lettersOnly.test(this.value) : numbersOnly.test(this.value);
        if (!isValid) {
            this.classList.add('input-error');
            if (err) err.style.display = 'block';
        } else {
            this.classList.remove('input-error');
            if (err) err.style.display = 'none';
        }
    });
};

validator('petName', 'nameError', 'text');
validator('petBreed', 'breedError', 'text');
validator('otherSpeciesInput', 'otherError', 'text');
validator('gcashName', 'gcashNameError', 'text');
validator('gcashRef', 'gcashRefError', 'number');

function toggleOtherSpecies() {
    const select = document.getElementById('petSpecies');
    const group = document.getElementById('otherSpeciesGroup');
    group.style.display = select.value === 'Others' ? 'block' : 'none';
    updateDefaultEmoji();
}

function calculateAge() {
    const birthDateInput = document.getElementById('petBirthday').value;
    if (!birthDateInput) return;
    const birthDate = new Date(birthDateInput);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    const displayAge = age <= 0 ? "Less than a year" : age + (age === 1 ? " year old" : " years old");
    document.getElementById('petAge').value = displayAge;
}

document.getElementById('petBirthday')?.addEventListener('change', calculateAge);

// add pet form submit 
document.getElementById("addPetForm")?.addEventListener("submit", async function (e) {
    e.preventDefault();

    // validation: required fields
    const petName = document.getElementById("petName").value.trim();
    const petSpecies = document.getElementById("petSpecies").value;
    const petColor = document.getElementById("petColor").value.trim();
    const petBreed = document.getElementById("petBreed").value.trim();
    const petGender = document.getElementById("petGender").value;
    const petBirthday = document.getElementById("petBirthday").value;

    if (!petName) { showAlertModal("Missing Details", "Please enter your pet's name.", ""); return; }
    if (!petSpecies) { showAlertModal("Missing Details", "Please select your pet's species.", ""); return; }
    if (petSpecies === "Others" && !document.getElementById("otherSpeciesInput").value.trim()) {
        showAlertModal("Missing Details", "Please specify your pet's species.", ""); return;
    }
    if (!petColor) { showAlertModal("Missing Details", "Please enter your pet's color.", ""); return; }
    if (!petBreed) { showAlertModal("Missing Details", "Please enter your pet's breed.", ""); return; }
    if (!petGender) { showAlertModal("Missing Details", "Please select your pet's gender.", ""); return; }
    if (!petBirthday) { showAlertModal("Missing Details", "Please enter your pet's birthday.", ""); return; }

    if (document.querySelector('#addPetForm .input-error')) {
        showAlertModal("Invalid Input", "Please fix the highlighted fields before submitting.", "");
        return;
    }

    const userId = localStorage.getItem("userId");
    const speciesSelect = document.getElementById("petSpecies").value;
    const otherSpecies = document.getElementById("otherSpeciesInput").value.trim();
    const pet = {
        userId: parseInt(userId),
        name: petName,
        species: speciesSelect === "Others" ? otherSpecies : speciesSelect,
        color: petColor,
        breed: petBreed,
        gender: petGender,
        birthdate: petBirthday
    };

    try {
        const response = await fetch("http://localhost:5182/api/Pet", {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(pet)
        });
    const data = await response.json();

        if (!response.ok) {
            showAlertModal("Oops!", data.message || JSON.stringify(data) || "Failed to add pet.", "");
            return;
        }

        closeActionModal("Add Pet");
        showSuccessMessage("Registration Sent!", "Your pet registration has been submitted and is pending admin approval.");

    } catch (error) {
        console.error("Add pet error:", error);
        showAlertModal("Connection Error", "Could not connect to the server. Please try again.", "");
    }
});

document.getElementById('bookAppointmentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');

    if (submitBtn.disabled) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";    

    const petId = document.getElementById('bookingPetName').value;
    const date = document.getElementById('bookingDate').value;
    const time = document.getElementById('bookingTime').value;
    const servicesChecked = document.querySelectorAll('input[name="services"]:checked');
    const payment = document.getElementById('bookingPayment').value;

    if (!petId) { showAlertModal("Missing Details", "Please select a pet for this appointment.", ""); return; }
    if (!date) { showAlertModal("Missing Details", "Please pick a date for the appointment.", ""); return; }
    if (!time) { showAlertModal("Missing Details", "Please select a time slot.", ""); return; }
    if (servicesChecked.length === 0) { showAlertModal("No Services Selected", "Please select at least one service.", ""); return; }
    if (!payment) { showAlertModal("Missing Details", "Please choose a payment mode.", ""); return; }

    if (payment === "GCash") {
        const gcashName = document.getElementById('gcashName').value.trim();
        const gcashRef = document.getElementById('gcashRef').value.trim();

        if (!gcashName) { showAlertModal("Missing Details", "Please enter your GCash account name.", ""); return; }
        if (!gcashRef || gcashRef.length !== 13) {
            showAlertModal("Invalid Reference", "GCash reference number must be 13 digits.", "");
            return;
        }
    }

    if (document.querySelector('#bookAppointmentForm .input-error')) {
        showAlertModal("Invalid Input", "Please fix the highlighted fields before submitting.", "");
        return;
    }

    const userId = localStorage.getItem("userId");
    const appointmentDate = `${date}T${time}:00`;

    const serviceMap = {
        checkup: 1,
        vaccination: 2,
        deworming: 3,
        grooming: 4
    };

    const serviceIds = Array.from(servicesChecked).map(cb => {
        const rawValue = cb.value;
        const numericValue = parseInt(rawValue);

        if (!isNaN(numericValue)) return numericValue;

        return serviceMap[rawValue.toLowerCase()];
    }).filter(id => id);

    const payload = {
        userId: parseInt(userId),
        petId: parseInt(petId),
        appointmentDate: appointmentDate,
        notes: "",
        serviceIds: serviceIds
    };

    try {
        const response = await fetch("http://localhost:5182/api/Appointment", {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            showAlertModal("Booking Failed", data.message || "Could not submit your appointment request.", "");
            return;
        }

        closeActionModal('Appointment');
        showSuccessMessage("Booking Request Sent!", "Your appointment has been submitted and is pending admin confirmation.");

        loadDashboardSummary(userId, localStorage.getItem("role"));
        loadAppointments(userId);

    } catch (error) {
        console.error("Booking error:", error);
        showAlertModal("Connection Error", "Could not connect to the server. Please try again.", "");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Request Booking";
    }
});