document.addEventListener("DOMContentLoaded", function () {
    const user = requireLogin("User");
    if (!user) return;

    loadPets(user.userId);
});

/* global elements */
const modal = document.getElementById("mainModal");
const confirmModal = document.getElementById("confirmModal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const petsGrid = document.getElementById("petsGrid");

let allPets = [];
let petToDeleteId = null;

/* utility */
function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

function toggleDrop(id) {
    document.getElementById(id).classList.toggle("show");
}

/* load pets */
async function loadPets(userId) {
    try {
        const response = await fetch(`http://localhost:5182/api/Pet/user/${userId}`);

        if (!response.ok) {
            throw new Error(`Failed to load pets. Status: ${response.status}`);
        }

        allPets = await response.json();
        renderPets(allPets);

    } catch (error) {
        console.error("Load pets error:", error);
        petsGrid.innerHTML = `<p>Could not load pets.</p>`;
    }
}

/* render pets */
function renderPets(pets) {
    petsGrid.innerHTML = "";

    const existingEmpty = document.getElementById("emptyState");
    if (existingEmpty) existingEmpty.remove();

    if (!Array.isArray(pets) || pets.length === 0) {
        petsGrid.style.display = "none";

        petsGrid.insertAdjacentHTML("afterend", `
            <div id="emptyState" class="empty-state-container">
                <img src="user-pets/no-pets.png" alt="No pets found" class="empty-state-img">
                <p>No furry friends found matching those filters!</p>
            </div>
        `);
        return;
    }

    petsGrid.style.display = "grid";

    pets.forEach(pet => {
        const birthdate = pet.birthdate ? pet.birthdate.split("T")[0] : "";
        const ageText = getAgeText(pet.birthdate);

        petsGrid.insertAdjacentHTML("beforeend", `
            <div class="pet-card border-blue"
                 data-id="${pet.petId}"
                 data-species="${pet.species}"
                 data-birthday="${birthdate}">
                 
                <div class="pet-image-container">
                    <img src="user-pets/default-pet.png" alt="Pet">
                </div>

                <div class="pet-card-content">
                    <h3>${pet.name}</h3>
                    <p>${pet.species} • ${pet.breed} • ${ageText}</p>
                    <span class="pet-gender">🐾 ${pet.gender}</span>

                    <div class="pet-card-actions">
                        <button class="action-btn view-btn">View</button>
                        <button class="action-btn edit-btn">Edit</button>
                        <button class="action-btn delete-btn">Delete</button>
                    </div>
                </div>
            </div>
        `);
    });
}

/* filtering */
function handleFilter() {
    const searchTerm = document.getElementById("petSearch").value.toLowerCase();
    const speciesSel = document.getElementById("speciesFilter").value;
    const genderSel = document.getElementById("genderFilter").value;
    const ageSel = document.getElementById("ageFilter").value;

    let visibleCount = 0;

    document.querySelectorAll(".pet-card").forEach(card => {
        const name = card.querySelector("h3").innerText.toLowerCase();
        const species = card.getAttribute("data-species");
        const gender = card.querySelector(".pet-gender").innerText.includes("Male") ? "Male" : "Female";
        const ageText = card.querySelector("p").innerText;

        let ageInYears = 0;
        const match = ageText.match(/\d+/);

        if (match) {
            if (ageText.includes("month")) {
                ageInYears = parseInt(match[0]) / 12;
            } else {
                ageInYears = parseInt(match[0]);
            }
        }

        let ageMatch = true;
        if (ageSel === "0-1") ageMatch = ageInYears <= 1;
        else if (ageSel === "2-5") ageMatch = ageInYears >= 2 && ageInYears <= 5;
        else if (ageSel === "6+") ageMatch = ageInYears >= 6;

        const isVisible =
            name.includes(searchTerm) &&
            (speciesSel === "All" || species === speciesSel) &&
            (genderSel === "All" || gender === genderSel) &&
            (ageSel === "All" || ageMatch);

        card.style.display = isVisible ? "block" : "none";
        if (isVisible) visibleCount++;
    });

    const existingEmpty = document.getElementById("emptyState");

    if (visibleCount === 0) {
        if (!existingEmpty) {
            petsGrid.insertAdjacentHTML("afterend", `
                <div id="emptyState" class="empty-state-container">
                    <img src="user-pets/no-pets.png" alt="No pets found" class="empty-state-img">
                    <p>No furry friends found matching those filters!</p>
                </div>
            `);
        }
    } else {
        if (existingEmpty) existingEmpty.remove();
    }
}

function clearFilters() {
    document.getElementById("petSearch").value = "";
    document.getElementById("speciesFilter").value = "All";
    document.getElementById("genderFilter").value = "All";
    document.getElementById("ageFilter").value = "All";

    document.querySelectorAll(".pet-card").forEach(card => {
        card.style.display = "block";
    });

    const existingEmpty = document.getElementById("emptyState");
    if (existingEmpty) existingEmpty.remove();
}

/* age */
function getAgeText(birthdateString) {
    if (!birthdateString) return "Unknown age";

    const birthdate = new Date(birthdateString);
    const today = new Date();

    let years = today.getFullYear() - birthdate.getFullYear();
    let months = today.getMonth() - birthdate.getMonth();

    if (months < 0 || (months === 0 && today.getDate() < birthdate.getDate())) {
        years--;
        months += 12;
    }

    if (years > 0) return years === 1 ? "1 yr" : `${years} yrs`;
    return months <= 1 ? "1 month" : `${months} months`;
}

function calculateAge(birthDateString) {
    if (!birthDateString) return;

    const birthday = new Date(birthDateString);
    const today = new Date();

    if (birthday > today) {
        alert("Pet birthdays cannot be in the future.");
        const dateInput = document.getElementsByName("Birthdate")[0];
        if (dateInput) dateInput.value = "";
        return;
    }

    const display = document.getElementsByName("AgeDisplay")[0];
    if (display) display.value = getAgeText(birthDateString);
}

/* custom dropdown */
function setVal(val, textId, dropId) {
    document.getElementById(textId).innerText = val;
    document.getElementById(dropId).classList.remove("show");

    if (textId === "specText") {
        document.getElementById("hidSpec").value = val;
        document.getElementById("otherSpec").style.display = val === "Others" ? "block" : "none";
    } else {
        document.getElementById("hidGen").value = val;
    }
}

/* validation */
function validateInput(input) {
    const error = input.nextElementSibling;
    if (error && error.classList.contains("validation-error")) {
        error.style.display = !input.checkValidity() && input.value !== "" ? "block" : "none";
        error.innerText = input.title;
    }
}

/* card actions */
petsGrid.addEventListener("click", function (e) {
    const card = e.target.closest(".pet-card");
    if (!card) return;

    const id = parseInt(card.getAttribute("data-id"));
    const pet = allPets.find(p => p.petId === id);
    if (!pet) return;

    if (e.target.classList.contains("view-btn")) {
        openViewPetModal(pet);
    }

    if (e.target.classList.contains("edit-btn")) {
        openActionModal("Edit Pet", id);
    }

    if (e.target.classList.contains("delete-btn")) {
        petToDeleteId = id;
        document.getElementById("confirmMessage").innerText = `Remove ${pet.name} (ID: ${id})?`;

        const confirmBtn = document.getElementById("btnConfirmDelete");
        confirmBtn.innerText = "Remove";
        confirmBtn.style.backgroundColor = "#ff5e78";

        confirmBtn.onclick = deletePet;

        confirmModal.style.display = "flex";
    }
});

/* view modal */
function openViewPetModal(pet) {
    const birthdate = pet.birthdate ? pet.birthdate.split("T")[0] : "";
    const formattedDate = birthdate
        ? new Date(birthdate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        })
        : "Not specified";

    modalTitle.innerText = "Pet Profile: " + pet.name;

    modalBody.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 15px;">
            <div style="display: flex; gap: 20px; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 15px;">
                <img src="user-pets/default-pet.png" style="width: 80px; height: 80px; border-radius: 15px; object-fit: cover;">
                <div>
                    <h3>${pet.name}</h3>
                    <p style="color: #999; font-size: 13px;">ID: #PP-${pet.petId}</p>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px;">
                <div><strong style="color:var(--primary-purple)">Species:</strong><br>${pet.species}</div>
                <div><strong style="color:var(--primary-purple)">Breed:</strong><br>${pet.breed}</div>
                <div><strong style="color:var(--primary-purple)">Color:</strong><br>${pet.color}</div>
                <div><strong style="color:var(--primary-purple)">Birthday:</strong><br>${formattedDate}</div>
                <div><strong style="color:var(--primary-purple)">Age:</strong><br>${getAgeText(pet.birthdate)}</div>
                <div><strong style="color:var(--primary-purple)">Gender:</strong><br>${pet.gender}</div>
            </div>
        </div>
    `;

    modal.style.display = "flex";
}

/* add/edit modal */
function openActionModal(action, id = null) {
    const isEdit = action === "Edit Pet";
    const pet = isEdit ? allPets.find(p => p.petId === parseInt(id)) : null;

    modalTitle.innerText = action;
    modal.style.display = "flex";

    const todayDate = new Date().toISOString().split("T")[0];
    const birthdate = pet?.birthdate ? pet.birthdate.split("T")[0] : "";

    modalBody.innerHTML = `
        <form class="modal-form" id="petForm" novalidate>
            <div class="image-upload-wrapper">
                <label>Pet Photo</label>
                <input type="file" name="PetImage" accept="image/*">
            </div>

            <input type="text" name="Name" placeholder="Pet Name" value="${pet?.name ?? ""}" pattern="[A-Za-z\\s]+" title="Letters only." required oninput="validateInput(this)">
            <div class="validation-error"></div>

            <div class="date-group">
                <label>Birthday</label>
                <input type="date" name="Birthdate" max="${todayDate}" value="${birthdate}" onchange="calculateAge(this.value)" required>
            </div>

            <input type="text" name="AgeDisplay" placeholder="Age" value="${birthdate ? getAgeText(birthdate) : ""}" readonly>

            <div class="custom-select-wrapper">
                <div class="select-box" onclick="toggleDrop('specDrop')">
                    <span id="specText">${pet?.species ?? "Select Species"}</span>
                </div>
                <div id="specDrop" class="select-options">
                    <div class="opt" onclick="setVal('Dog', 'specText', 'specDrop')">Dog</div>
                    <div class="opt" onclick="setVal('Cat', 'specText', 'specDrop')">Cat</div>
                    <div class="opt" onclick="setVal('Rabbit', 'specText', 'specDrop')">Rabbit</div>
                    <div class="opt" onclick="setVal('Bird', 'specText', 'specDrop')">Bird</div>
                    <div class="opt" onclick="setVal('Hamster', 'specText', 'specDrop')">Hamster</div>
                    <div class="opt" onclick="setVal('Others', 'specText', 'specDrop')">Others</div>
                </div>
                <input type="hidden" name="Species" id="hidSpec" value="${pet?.species ?? ""}">
            </div>

            <input type="text" id="otherSpec" style="display:none" placeholder="Specify Species" pattern="[A-Za-z\\s]+" title="Letters only." oninput="validateInput(this)">
            <div class="validation-error"></div>

            <input type="text" name="Color" placeholder="Color" value="${pet?.color ?? ""}" pattern="[A-Za-z\\s]+" title="Letters only." required oninput="validateInput(this)">
            <div class="validation-error"></div>

            <input type="text" name="Breed" placeholder="Breed" value="${pet?.breed ?? ""}" pattern="[A-Za-z\\s]+" title="Letters only." required oninput="validateInput(this)">
            <div class="validation-error"></div>

            <div class="custom-select-wrapper">
                <div class="select-box" onclick="toggleDrop('genDrop')">
                    <span id="genText">${pet?.gender ?? "Gender"}</span>
                </div>
                <div id="genDrop" class="select-options">
                    <div class="opt" onclick="setVal('Male', 'genText', 'genDrop')">Male</div>
                    <div class="opt" onclick="setVal('Female', 'genText', 'genDrop')">Female</div>
                </div>
                <input type="hidden" name="Gender" id="hidGen" value="${pet?.gender ?? ""}">
            </div>

            <button type="submit" class="submit-btn">${isEdit ? "Update" : "Register"}</button>
        </form>
    `;

    document.getElementById("petForm").onsubmit = function (e) {
        e.preventDefault();
        isEdit ? updatePet(id) : addPet();
    };
}

/* add pet */
async function addPet() {
    const form = document.getElementById("petForm");
    const userId = localStorage.getItem("userId");

    const species = form.Species.value === "Others"
        ? document.getElementById("otherSpec").value.trim()
        : form.Species.value;

    const pet = {
        userId: parseInt(userId),
        name: form.Name.value.trim(),
        species: species,
        color: form.Color.value.trim(),
        breed: form.Breed.value.trim(),
        gender: form.Gender.value,
        birthdate: form.Birthdate.value
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

        closeModal("mainModal");
        await loadPets(userId);

    } catch (error) {
        console.error("Add pet error:", error);
        alert("Could not connect to the server.");
    }
}

/* update pet */
async function updatePet(id) {
    const form = document.getElementById("petForm");
    const userId = localStorage.getItem("userId");

    const species = form.Species.value === "Others"
        ? document.getElementById("otherSpec").value.trim()
        : form.Species.value;

    const pet = {
        petId: parseInt(id),
        userId: parseInt(userId),
        name: form.Name.value.trim(),
        species: species,
        color: form.Color.value.trim(),
        breed: form.Breed.value.trim(),
        gender: form.Gender.value,
        birthdate: form.Birthdate.value
    };

    try {
        const response = await fetch(`http://localhost:5182/api/Pet/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(pet)
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Failed to update pet.");
            return;
        }

        closeModal("mainModal");
        await loadPets(userId);

    } catch (error) {
        console.error("Update pet error:", error);
        alert("Could not connect to the server.");
    }
}

/* delete pet */
async function deletePet() {
    if (!petToDeleteId) return;

    try {
        const response = await fetch(`http://localhost:5182/api/Pet/${petToDeleteId}`, {
            method: "DELETE"
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Failed to delete pet.");
            return;
        }

        closeModal("confirmModal");
        await loadPets(localStorage.getItem("userId"));

    } catch (error) {
        console.error("Delete pet error:", error);
        alert("Could not connect to the server.");
    }
}