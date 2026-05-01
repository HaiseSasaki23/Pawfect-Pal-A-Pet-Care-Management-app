document.addEventListener("DOMContentLoaded", function () {
    const user = requireLogin("User");
    if (!user) return;

});

/* global gui elements */
const modal = document.getElementById('mainModal');
const confirmModal = document.getElementById('confirmModal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const petsGrid = document.getElementById('petsGrid');

let petToDelete = null;

/* utility functions */
function closeModal(modalId) { 
    document.getElementById(modalId).style.display = 'none'; 
}

function toggleDrop(id) { 
    document.getElementById(id).classList.toggle('show'); 
}

function handleFilter() {
    const searchTerm = document.getElementById('petSearch').value.toLowerCase();
    const speciesSel = document.getElementById('speciesFilter').value;
    const genderSel = document.getElementById('genderFilter').value;
    const ageSel = document.getElementById('ageFilter').value;

    let visibleCount = 0;

    document.querySelectorAll('.pet-card').forEach(card => {
        const name = card.querySelector('h3').innerText.toLowerCase();
        const species = card.getAttribute('data-species');
        const gender = card.querySelector('.pet-gender').innerText.includes("Male") ? "Male" : "Female";
        const ageText = card.querySelector('p').innerText; 
        
        let ageInYears = 0;
        if (ageText.includes("months")) {
            ageInYears = parseInt(ageText.match(/\d+/)[0]) / 12;
        } else {
            ageInYears = parseInt(ageText.match(/\d+/)[0]);
        }

        let ageMatch = true;
        if (ageSel === "0-1") ageMatch = (ageInYears <= 1);
        else if (ageSel === "2-5") ageMatch = (ageInYears >= 2 && ageInYears <= 5);
        else if (ageSel === "6+") ageMatch = (ageInYears >= 6);

        const isVisible = name.includes(searchTerm) && 
                          (speciesSel === "All" || species === speciesSel) && 
                          (genderSel === "All" || gender === genderSel) && 
                          (ageSel === "All" || ageMatch);

        card.style.display = isVisible ? "block" : "none";
        if (isVisible) visibleCount++;
    });

    // empty State Logic
    const existingEmpty = document.getElementById('emptyState');
    if (visibleCount === 0) {
        if (!existingEmpty) {
            const emptyHTML = `
                <div id="emptyState" class="empty-state-container">
                    <img src="user-pets/no-pets.png" alt="No pets found" class="empty-state-img">
                    <p>No furry friends found matching those filters!</p>
                </div>`;
            petsGrid.insertAdjacentHTML('afterend', emptyHTML);
            petsGrid.style.display = 'none';
            }
        } else {
            if (existingEmpty) {
            existingEmpty.remove();
            petsGrid.style.display = 'grid';
        }
    }
}

function clearFilters() {
    document.getElementById('petSearch').value = "";
    document.getElementById('speciesFilter').value = "All";
    document.getElementById('genderFilter').value = "All";
    document.getElementById('ageFilter').value = "All";
    document.querySelectorAll('.pet-card').forEach(c => c.style.display = "block");
}

/* --- data helper functions --- */
function calculateAge(birthDateString) {
    if (!birthDateString) return;

    const birthday = new Date(birthDateString);
    const today = new Date();
    
    // stops future-dated pets from breaking the logic
    if (birthday > today) {
        alert("pet birthdays cannot be in the future!");
        const dateInput = document.getElementsByName('Birthday')[0];
        if (dateInput) dateInput.value = "";
        return;
    }

    let years = today.getFullYear() - birthday.getFullYear();
    let months = today.getMonth() - birthday.getMonth();

    if (months < 0 || (months === 0 && today.getDate() < birthday.getDate())) {
        years--;
        months += 12;
    }

    const display = document.getElementsByName('AgeDisplay')[0];
    const hidden = document.getElementsByName('Age')[0];

    if (display) {
        if (years > 0) { 
            display.value = `${years} yrs`; 
            hidden.value = years; 
        } else { 
            display.value = `${months} months`; 
            hidden.value = 0; 
        }
    }
}

function validateInput(input) {
    const error = input.nextElementSibling;
    if (error && error.classList.contains('validation-error')) {
        error.style.display = (!input.checkValidity() && input.value !== "") ? 'block' : 'none';
        error.innerText = input.title;
    }
}

function setVal(val, textId, dropId) {
    document.getElementById(textId).innerText = val;
    document.getElementById(dropId).classList.remove('show');

    if (textId === 'specText') {
        document.getElementById('hidSpec').value = val;
        document.getElementById('otherSpec').style.display = (val === 'Others' ? 'block' : 'none');
    } else { 
        document.getElementById('hidGen').value = val; 
    }
}

petsGrid.addEventListener('click', function(e) {
    const card = e.target.closest('.pet-card');
    if (!card) return;

    const id = card.getAttribute('data-id');
    const birthday = card.getAttribute('data-birthday');
    const name = card.querySelector('h3').innerText;
    const deetString = card.querySelector('p').innerText;
    const deets = deetString.split(' • ');

    if (e.target.classList.contains('view-btn')) {
        const imgSrc = card.querySelector('img').src;
        const genderRaw = card.querySelector('.pet-gender').innerText.replace('🐾 ', '');
        const dateObj = new Date(birthday);
        const formattedDate = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        modalTitle.innerText = "Pet Profile: " + name;
        modalBody.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <div style="display: flex; gap: 20px; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 15px;">
                    <img src="${imgSrc}" style="width: 80px; height: 80px; border-radius: 15px; object-fit: cover;">
                    <div><h3>${name}</h3><p style="color: #999; font-size: 13px;">ID: #PP-${id}</p></div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px;">
                    <div><strong style="color:var(--primary-purple)">Species:</strong><br>${deets[0]}</div>
                    <div><strong style="color:var(--primary-purple)">Breed:</strong><br>${deets[1]}</div>
                    <div><strong style="color:var(--primary-purple)">Birthday:</strong><br>${formattedDate}</div>
                    <div><strong style="color:var(--primary-purple)">Age:</strong><br>${deets[2]}</div>
                    <div><strong style="color:var(--primary-purple)">Gender:</strong><br>${genderRaw}</div>
                </div>
            </div>`;
        modal.style.display = 'flex';
    }

    if (e.target.classList.contains('edit-btn')) { 
        openActionModal('Edit Pet', id); 
    }

    if (e.target.classList.contains('delete-btn')) {
        petToDelete = card;
        document.getElementById('confirmMessage').innerText = `Remove ${name} (ID: ${id})?`;
        const confirmBtn = document.getElementById('btnConfirmDelete');
        confirmBtn.innerText = "Remove";
        confirmBtn.style.backgroundColor = "#ff5e78";
        
        confirmBtn.onclick = function() {
            petToDelete.style.opacity = '0';
            setTimeout(() => petToDelete.remove(), 300);
            closeModal('confirmModal');
        };
        confirmModal.style.display = 'flex';
    }
});

/*  modal form generation  */
function openActionModal(action, id = null) {
    modalTitle.innerText = action; 
    modal.style.display = 'flex';
    
    // gets today's date formatted for the 'max' attribute
    const todayDate = new Date().toISOString().split('T')[0];

    modalBody.innerHTML = `
        <form class="modal-form" id="petForm" novalidate>
            <div class="image-upload-wrapper"><label>Pet Photo</label><input type="file" name="PetImage" accept="image/*"></div>
            <input type="text" name="Name" placeholder="Pet Name" pattern="[A-Za-z\\s]+" title="Letters only." required oninput="validateInput(this)">
            <div class="validation-error"></div>
            
            <div class="date-group">
                <label>Birthday</label>
                <input type="date" name="Birthday" max="${todayDate}" onchange="calculateAge(this.value)" required>
            </div>
            
            <input type="text" name="AgeDisplay" placeholder="Age" readonly>
            <input type="hidden" name="Age">
            <div class="custom-select-wrapper">
                <div class="select-box" onclick="toggleDrop('specDrop')"><span id="specText">Select Species</span></div>
                <div id="specDrop" class="select-options">
                    <div class="opt" onclick="setVal('Dog', 'specText', 'specDrop')">Dog</div>
                    <div class="opt" onclick="setVal('Cat', 'specText', 'specDrop')">Cat</div>
                    <div class="opt" onclick="setVal('Rabbit', 'specText', 'specDrop')">Rabbit</div>
                    <div class="opt" onclick="setVal('Bird', 'specText', 'specDrop')">Bird</div>
                    <div class="opt" onclick="setVal('Hamster', 'specText', 'specDrop')">Hamster</div>
                    <div class="opt" onclick="setVal('Others', 'specText', 'specDrop')">Others</div>
                </div>
                <input type="hidden" name="Species" id="hidSpec">
            </div>
            <input type="text" id="otherSpec" style="display:none" placeholder="Specify Species" pattern="[A-Za-z\\s]+" title="Letters only." oninput="validateInput(this)">
            <div class="validation-error"></div>
            <input type="text" name="Breed" placeholder="Breed" pattern="[A-Za-z\\s]+" title="Letters only." oninput="validateInput(this)">
            <div class="validation-error"></div>
            <div class="custom-select-wrapper">
                <div class="select-box" onclick="toggleDrop('genDrop')"><span id="genText">Gender</span></div>
                <div id="genDrop" class="select-options">
                    <div class="opt" onclick="setVal('Male', 'genText', 'genDrop')">Male</div>
                    <div class="opt" onclick="setVal('Female', 'genText', 'genDrop')">Female</div>
                </div>
                <input type="hidden" name="Gender" id="hidGen">
            </div>
            <button type="submit" class="submit-btn">${action === 'Edit Pet' ? 'Update' : 'Register'}</button>
        </form>`;

    document.getElementById('petForm').onsubmit = function(e) {
        e.preventDefault();
    };
}

function closeModal(modalId) { 
    document.getElementById(modalId).style.display = 'none'; 
}

handleFilter();
