/* Pawfect Pal - Dashboard Logic */
document.addEventListener("DOMContentLoaded", function () {
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");
    const role = localStorage.getItem("role");

    if (!role || !userId) {
        alert("You are not logged in.");
        window.location.href = "../login/login.html";
        return;
    }

    document.getElementById("sidebarOwnerFName").textContent = userName || "Guest";
    document.getElementById("sidebarOwnerLName").textContent = "";
    document.getElementById("welcomeOwnerFName").textContent = userName || "User";

    loadDashboardSummary(userId, role);
    loadPets(userId);
});

async function loadDashboardSummary(userId, role) {
    const url = role.toLowerCase() === "admin"
        ? "http://localhost:5182/api/Dashboard/admin-summary"
        : `http://localhost:5182/api/Dashboard/user-summary/${userId}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Failed to load dashboard summary.");
        }

        const data = await response.json();

        document.getElementById("TotalPetsCount").textContent = data.totalPets ?? 0;
        document.getElementById("AptCount").textContent = data.totalAppointments ?? 0;
        document.getElementById("RemindCount").textContent = data.totalReminders ?? 0;
        document.getElementById("HealthCount").textContent = data.totalHealthRecords ?? 0;

    } catch (error) {
        console.error("Dashboard summary error:", error);
        alert("Could not load dashboard data.");
    }
}

async function loadPets(userId) {
    try {
        const response = await fetch(`http://localhost:5182/api/Pet/user/${userId}`);

        if (!response.ok) {
            throw new Error(`Failed to load pets. Status: ${response.status}`);
        }

        const pets = await response.json();

        const container = document.getElementById("PetsList");
        const empty = document.getElementById("EmptyPets");

        if (!Array.isArray(pets) || pets.length === 0) {
            container.innerHTML = "";
            empty.style.display = "block";
            return;
        }

        empty.style.display = "none";

        container.innerHTML = pets.map(pet => `
            <div class="status-row" style="grid-template-columns: 1.5fr 1fr 1fr;">
                <span>${pet.name}</span>
                <span>${pet.species}</span>
                <span>${pet.breed}</span>
            </div>
        `).join("");

    } catch (err) {
        console.error("Load pets error:", err);
    }
}

window.onload = function() {
    const today = new Date().toISOString().split('T')[0];
    const bookingDate = document.getElementById('bookingDate');
    if (bookingDate) {
        bookingDate.setAttribute('min', today);
    }
};

function openActionModal(type) {
    const modals = {
        'Add Pet': 'addPetModal',
        'Appointment': 'bookAppointmentModal',
        'Reminders': 'remindersModal'
    };
    if (modals[type]) document.getElementById(modals[type]).style.display = 'flex';
}

function closeActionModal(type) {
    const modals = {
        'Add Pet': 'addPetModal',
        'Appointment': 'bookAppointmentModal',
        'Reminders': 'remindersModal'
    };
    const id = modals[type];
    if (id) {
        document.getElementById(id).style.display = 'none';
        if (type === 'Reminders') {
            const dot = document.getElementById('RemindDot');
            if (dot) dot.classList.remove('active');
        } else {
            const formId = type === 'Add Pet' ? 'addPetForm' : 'bookAppointmentForm';
            const form = document.getElementById(formId);
            if (form) form.reset();
            
            if (type === 'Add Pet') document.getElementById('otherSpeciesGroup').style.display = 'none';
            if (type === 'Appointment') {
                document.getElementById('bookingTotal').innerText = '₱0';
                document.getElementById('gcashDetails').style.display = 'none';
            }
            clearErrors();
        }
    }
}

function showSuccessMessage(title, message) {
    document.getElementById('successTitle').innerText = title;
    document.getElementById('successMessage').innerText = message;
    document.getElementById('successModal').style.display = 'flex';
}

function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
}

function clearErrors() {
    document.querySelectorAll('.error-msg').forEach(e => e.style.display = 'none');
    document.querySelectorAll('.input-error').forEach(i => i.classList.remove('input-error'));
}

function toggleGcashDetails() {
    const payment = document.getElementById('bookingPayment').value;
    const gcashBox = document.getElementById('gcashDetails');
    if (gcashBox) {
        gcashBox.style.display = payment === 'GCash' ? 'block' : 'none';
    }
}

// Full logic for service price calculation
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
    el.addEventListener('input', function() {
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
}

function calculateAge() {
    const birthDateInput = document.getElementById('petBirthday').value;
    if (!birthDateInput) return;
    const birthDate = new Date(birthDateInput);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    
    // Alive data requirement: show "X years old"
    const displayAge = age <= 0 ? "Less than a year" : age + (age === 1 ? " year old" : " years old");
    document.getElementById('petAge').value = displayAge;
}

document.getElementById('petBirthday').addEventListener('change', calculateAge);

document.getElementById("addPetForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const userId = localStorage.getItem("userId");

    const speciesSelect = document.getElementById("petSpecies").value;
    const otherSpecies = document.getElementById("otherSpeciesInput").value.trim();

    const pet = {
        userId: parseInt(userId),
        name: document.getElementById("petName").value.trim(),
        species: speciesSelect === "Others" ? otherSpecies : speciesSelect,
        color: document.getElementById("petColor").value.trim(),
        breed: document.getElementById("petBreed").value.trim(),
        gender: document.getElementById("petGender").value,
        birthdate: document.getElementById("petBirthday").value
    };

    try {
        const response = await fetch("http://localhost:5182/api/Pet", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(pet)
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Failed to add pet.");
            return;
        }

        closeActionModal("Add Pet");
        showSuccessMessage("Pet Added", "Your pet has been added successfully.");

        loadDashboardSummary(userId, localStorage.getItem("role"));
        loadPets(userId);

    } catch (error) {
        console.error("Add pet error:", error);
        alert("Could not connect to the server.");
    }
});

document.getElementById('bookAppointmentForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!e.target.querySelector('.input-error')) { 
        closeActionModal('Appointment'); 
        showSuccessMessage("Booking Sent", "Your appointment request has been submitted."); 
    }
});

window.onclick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        closeActionModal('Add Pet');
        closeActionModal('Appointment');
        closeActionModal('Reminders');
        closeSuccessModal();
    }
};
