document.addEventListener("DOMContentLoaded", async () => {
    // ===== USER INFO / LOCAL STORAGE =====
    const role = localStorage.getItem("role");
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName") || "User";

    // Update welcome + sidebar names
    const sidebarFName = document.getElementById("sidebarOwnerFName");
    const sidebarLName = document.getElementById("sidebarOwnerLName");
    const welcomeFName = document.getElementById("welcomeOwnerFName");

    if (sidebarFName) sidebarFName.textContent = userName;
    if (sidebarLName) sidebarLName.textContent = "";
    if (welcomeFName) welcomeFName.textContent = userName;

    // ===== DASHBOARD SUMMARY FETCH =====
    try {
        let url = "";

        if (role === "Admin") {
            url = "http://localhost:5182/api/Dashboard/admin-summary";
        } else if (userId) {
            url = `http://localhost:5182/api/Dashboard/user-summary/${userId}`;
        }

        if (url) {
            const response = await fetch(url);
            const data = await response.json();

            if (response.ok) {
                const totalPets = document.getElementById("TotalPetsCount");
                const aptCount = document.getElementById("AptCount");
                const remindCount = document.getElementById("RemindCount");
                const healthCount = document.getElementById("HealthCount");

                if (totalPets) totalPets.textContent = data.totalPets ?? 0;
                if (aptCount) aptCount.textContent = data.totalAppointments ?? 0;
                if (remindCount) remindCount.textContent = data.totalReminders ?? 0;
                if (healthCount) healthCount.textContent = data.totalHealthRecords ?? 0;
            } else {
                console.error("Dashboard summary failed:", data.message);
            }
        }
    } catch (error) {
        console.error("Dashboard fetch error:", error);
    }

    // ===== PASSWORD/ROLE/USER DEBUG =====
    console.log("Dashboard loaded for:", {
        userId,
        userName,
        role
    });
});

// ===== MODAL REFERENCES =====
const modal = document.getElementById("mainModal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");

// ===== CLOSE MODAL =====
function closeModal() {
    modal.style.display = "none";
}

// ===== VIEW MODALS =====
function openViewModal(type) {
    modalTitle.innerText = "All " + type;
    modal.style.display = "flex";

    if (type === "Pets") {
        modalBody.innerHTML = `
            <div class="view-all-grid" id="pets-view-target" style="grid-template-columns: repeat(4, 1fr);">
                <strong>Name</strong>
                <strong>Species</strong>
                <strong>Breed</strong>
                <strong>Last Visit</strong>
            </div>`;
    } 
    else if (type === "Appointments") {
        modalBody.innerHTML = `
            <div class="view-all-grid" id="apt-view-target" style="grid-template-columns: repeat(3, 1fr);">
                <strong>Pet Name</strong>
                <strong>Service</strong>
                <strong>Date</strong>
            </div>`;
    } 
    else if (type === "Reminders") {
        modalBody.innerHTML = `
            <div class="view-all-grid" id="remind-view-target" style="grid-template-columns: 1.5fr 1fr 1fr;">
                <strong>Pet</strong>
                <strong>Description</strong>
                <strong>Status</strong>
            </div>`;
    }
}

// ===== ACTION MODALS =====
function openActionModal(action) {
    modalTitle.innerText = action;
    modal.style.display = "flex";

    if (action === "Add Pet") {
        modalBody.innerHTML = `
            <form class="modal-form" id="addPetForm">
                <input type="text" id="petName" placeholder="Pet Name" required>

                <select id="petSpecies" onchange="document.getElementById('otherSpec').style.display=(this.value==='Others'?'block':'none')" required>
                    <option value="">Select Species</option>
                    <option>Dog</option>
                    <option>Cat</option>
                    <option>Rabbit</option>
                    <option>Bird</option>
                    <option>Hamster</option>
                    <option value="Others">Others</option>
                </select>

                <input type="text" id="otherSpec" style="display:none" placeholder="Specify Species">
                <input type="text" id="petBreed" placeholder="Breed" required>
                <input type="text" id="petColor" placeholder="Color" required>
                <input type="number" id="petAge" placeholder="Age" required>

                <select id="petGender" required>
                    <option value="">Select Gender</option>
                    <option>Male</option>
                    <option>Female</option>
                </select>

                <button type="submit" class="submit-btn">Register Pet</button>
            </form>`;

        setTimeout(() => {
            const addPetForm = document.getElementById("addPetForm");
            if (addPetForm) {
                addPetForm.addEventListener("submit", async function (e) {
                    e.preventDefault();

                    const userId = localStorage.getItem("userId");
                    const selectedSpecies = document.getElementById("petSpecies").value;
                    const finalSpecies = selectedSpecies === "Others"
                        ? document.getElementById("otherSpec").value.trim()
                        : selectedSpecies;

                    const payload = {
                        userId: Number(userId),
                        name: document.getElementById("petName").value.trim(),
                        species: finalSpecies,
                        breed: document.getElementById("petBreed").value.trim(),
                        color: document.getElementById("petColor").value.trim(),
                        age: Number(document.getElementById("petAge").value),
                        gender: document.getElementById("petGender").value
                    };

                    try {
                        const response = await fetch("http://localhost:5182/api/Pet", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify(payload)
                        });

                        const data = await response.json();

                        if (response.ok) {
                            alert(data.message || "Pet added successfully.");
                            closeModal();
                            location.reload();
                        } else {
                            alert(data.message || "Failed to add pet.");
                        }
                    } catch (error) {
                        console.error("Add pet error:", error);
                        alert("Could not connect to the server.");
                    }
                });
            }
        }, 0);
    } 
    else if (action === "Appointment") {
        modalBody.innerHTML = `
            <form class="modal-form">
                <select><option>Select Pet</option></select>
                <select>
                    <option value="1">Grooming</option>
                    <option value="2">Vaccination</option>
                    <option value="3">Check-up</option>
                    <option value="4">Deworming</option>
                    <option value="5">Feeding Service / Meal Planning</option>
                </select>
                <input type="datetime-local" onfocus="this.max='9999-12-31T23:59'">
                <textarea placeholder="Notes (max 50 chars)"></textarea>
                <button type="submit" class="submit-btn">Book Appointment</button>
            </form>`;
    } 
    else if (action === "Payment") {
        modalBody.innerHTML = `
            <form class="modal-form">
                <p style="margin-bottom: 10px;">Current Balance: ₱<span id="CurrentBalance">0.00</span></p>
                
                <select required>
                    <option value="">Select Billing to Pay</option>
                </select>

                <input type="number" placeholder="₱ Amount to Pay" required>

                <select id="PaymentMethod" onchange="togglePaymentFields(this.value)" required>
                    <option value="">Select Payment Method</option>
                    <option value="Cash">Cash</option>
                    <option value="GCash">GCash</option>
                </select>

                <div id="dynamic-payment-fields" style="display: flex; flex-direction: column; gap: 12px;"></div>

                <button type="submit" class="submit-btn">Confirm Payment</button>
            </form>`;
    } 
    else if (action === "Status") {
        modalBody.innerHTML = `
            <div class="view-all-grid" style="grid-template-columns: 2fr 1fr; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 10px;">
                <strong>Request / Bill Description</strong>
                <strong>Status</strong>
            </div>
            <div id="status-row-target" class="status-list"></div>`;
    }
}

// ===== PAYMENT METHOD TOGGLE =====
function togglePaymentFields(method) {
    const container = document.getElementById("dynamic-payment-fields");
    if (!container) return;

    if (method === "GCash") {
        container.innerHTML = `
            <input type="text" placeholder="GCash Mobile Number" pattern="[0-9]*" maxlength="11" required>
            <input type="text" placeholder="Reference Number" required>`;
    } else if (method === "Cash") {
        container.innerHTML = `
            <input type="text" placeholder="Cash received by (staff/admin name)" required>`;
    } else {
        container.innerHTML = "";
    }
}