const modal = document.getElementById('mainModal');
const confirmModal = document.getElementById('confirmModal');

function triggerLogout() {
    const confirmMessage = document.getElementById("confirmMessage");
    const confirmBtn = document.getElementById("btnConfirmDelete");
    const modal = document.getElementById("confirmModal");

    if (!confirmMessage || !confirmBtn || !modal) {
        if (confirm("Are you sure you want to logout?")) {
            logoutNow();
        }
        return;
    }

    confirmMessage.innerText = "Are you sure you want to log out of Pawfect Pal?";
    confirmBtn.innerText = "Logout";
    confirmBtn.style.backgroundColor = "#ff5e78";
    confirmBtn.onclick = logoutNow;

    modal.style.display = "flex";
}

function logoutNow() {
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("ownerFName");
    localStorage.removeItem("ownerLName");
    localStorage.removeItem("role");

    window.location.href = "../../login/login.html";
}

document.addEventListener("DOMContentLoaded", () => {
    if (typeof initImageLoading === "function") initImageLoading();
    
    const userNameEl = document.getElementById('UserName');
    if (userNameEl) userNameEl.textContent = localStorage.getItem("userName") || "Admin User";

    // 2. FORC
    loadRequestData([]); 

    const searchInput = document.getElementById('requestSearchInput');
    const ownerFilter = document.getElementById('ownerFilter');
    const typeFilter = document.getElementById('requestTypeFilter');

    if (searchInput) searchInput.addEventListener('keyup', applyAllFilters);
    if (ownerFilter) ownerFilter.addEventListener('change', applyAllFilters);
    if (typeFilter) typeFilter.addEventListener('change', applyAllFilters);
    
    console.log("Empty state forced and listeners attached.");
});


function closeModal(modalId) { 
    document.getElementById(modalId).style.display = 'none'; 
}

let activeScale = 1;
let translateX = 0;
let translateY = 0;
let isDragging = false;
let activePetData = null;
let currentViewType = 'pet';


function applyAllFilters() {
    const searchVal = (document.getElementById('requestSearchInput')?.value || "").toLowerCase().trim();
    const typeVal = document.getElementById('requestTypeFilter')?.value || "all";
    const ownerDropdownVal = (document.getElementById('ownerFilter')?.value || "").trim();
    const selectedServices = Array.from(document.querySelectorAll('.service-opt:checked')).map(cb => cb.value.toLowerCase());

    const rows = document.querySelectorAll('#requestTableBody tr');

    rows.forEach(row => {
        const typeText = row.cells[0].innerText.toLowerCase(); 
        const petName = row.cells[1].innerText.toLowerCase(); 
        
        const fName = row.getAttribute('ownerFName') || "";
        const lName = row.getAttribute('ownerLName') || "";
        const fullName = (fName + " " + lName).trim();
        const fullNameLower = fullName.toLowerCase();

        // 1. mandatory type (acts as the primary gatekeeper)
        let matchesType = (typeVal === 'all');
        if (typeVal === 'pet') matchesType = typeText.includes('pet');
        if (typeVal === 'appointment') matchesType = typeText.includes('appt');

        // 2. search (automatically "passes" if search is empty)
        const matchesSearch = searchVal === "" || petName.includes(searchVal) || fullNameLower.includes(searchVal);

        // 3. owner (automatically "passes" if dropdown is empty)
        const matchesOwner = ownerDropdownVal === "" || fullName === ownerDropdownVal;

        // 4. service check
        let matchesService = true;
        if (selectedServices.length > 0) {
            if (typeText.includes('appt')) {
                const viewBtn = row.querySelector('.view-btn');
                const attrText = viewBtn ? viewBtn.getAttribute('onclick').toLowerCase() : "";
                const servicesMatch = attrText.match(/services:\s*\[(.*?)\]/);
                const actualServices = servicesMatch ? servicesMatch[1] : "";
                matchesService = selectedServices.every(s => actualServices.includes(s.toLowerCase()));
            } else {
                matchesService = false; 
            }
        }

        // final visibility: mandatory AND check
        const shouldShow = matchesType && matchesSearch && matchesOwner && matchesService;
        row.style.display = shouldShow ? "" : "none";
    });
}

function toggleAppointmentFilters(value) {
    const appointmentUI = document.getElementById('appointmentFilters');
    if (appointmentUI) {
        appointmentUI.style.display = (value === 'appointment') ? 'block' : 'none';
    }
    applyAllFilters(); 
}

function viewPetDetails(petData, type = 'pet') {
    activePetData = petData; 
    currentViewType = type;
    const modalBody = document.getElementById('modalBody');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.querySelector('#mainModal .modal-content');

    if (type === 'appt') {
        if (modalContent) {
            modalContent.style.setProperty('max-width', '600px', 'important');
            modalContent.style.setProperty('min-height', '450px', 'important');
            modalContent.style.setProperty('overflow-y', 'hidden', 'important');
            modalContent.style.setProperty('padding', '30px', 'important');
        }
        modalTitle.innerText = "Appointment Details";

        const servicesList = Array.isArray(petData.Services) ? petData.Services : ['Check-up'];
        modalBody.innerHTML = `
            <div class="appointment-summary-view" style="text-align: center; padding: 20px;">
                <div class="pet-image-container circle-crop" style="width: 180px; height: 180px; margin: 0 auto 25px; border: 4px solid var(--primary-purple); border-radius: 50%; overflow: hidden;">
                    <img src="" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <h2 style="color: var(--primary-purple); font-size: 26px; margin-bottom: 10px;">${petData.Name}</h2>
                <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 30px; color: var(--text-dark); font-weight: 500;">
                    <span>Owner: <strong style="color: var(--primary-purple);">${petData.ownerName || (petData.ownerFName + ' ' + petData.ownerLName)}</strong></span>
                </div>
                <div style="background: var(--bg-lavender); padding: 30px; border-radius: 25px; border: 1px solid #e0d5f0; max-width: 500px; margin: 0 auto;">
                    <strong style="display: block; color: var(--primary-purple); text-transform: uppercase; margin-bottom: 20px; font-size: 13px; letter-spacing: 1px;">Services Availed</strong>
                    <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                        ${servicesList.map(s => `<span style="background: white; color: var(--primary-purple); padding: 10px 20px; border-radius: 12px; font-weight: 700; border: 1px solid #e0d5f0;">${s}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;
    } else {
        if (modalContent) {
            modalContent.style.setProperty('max-width', '1100px', 'important');
            modalContent.style.setProperty('min-height', '700px', 'important');
            modalContent.style.setProperty('overflow-y', 'auto', 'important');
        }
        modalTitle.innerText = "Pet Information";
        
        const calculatedAge = activePetData.Birthdate ? calculateAgeString(activePetData.Birthdate) : "N/A";
        const displayOwner = activePetData.ownerName || ((activePetData.ownerFName || "") + " " + (activePetData.ownerLName || "")).trim();

        modalBody.innerHTML = `
            <div class="edit-grid">
                <div class="image-section">
                    <div class="pet-image-container circle-crop" style="width: 320px; height: 320px; margin: 0 auto; border-radius: 50%; overflow: hidden; border: 4px solid var(--primary-purple);">
                        <img id="petPreview" src="" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                </div>
                <div class="details-section">
                    <div id="detailsContent" style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px;">
                        <div><strong>Pet Name</strong> <p>${activePetData.Name}</p></div>
                        <div><strong>Owner Name</strong> <p>${displayOwner}</p></div>
                        <div><strong>Species</strong> <p>${activePetData.Species}</p></div>
                        <div><strong>Breed</strong> <p>${activePetData.Breed}</p></div>
                        <div><strong>Color</strong> <p>${activePetData.Color || 'N/A'}</p></div>
                        <div><strong>Gender</strong> <p>${activePetData.Gender}</p></div>
                        <div><strong>Birthdate</strong> <p>${activePetData.Birthdate}</p></div>
                        <div><strong>Age</strong> <p>${calculatedAge}</p></div>
                    </div>
                    <div style="display: flex; justify-content: flex-end; margin-top: 40px;">
                        <button class="submit-btn" style="width: 220px;" onclick="toggleEditMode()">Edit Details</button>
                    </div>
                </div>
            </div>
        `;
    }
    document.getElementById('mainModal').style.display = 'flex';
}

document.addEventListener("DOMContentLoaded", () => {
    const serviceBtn = document.getElementById('serviceDropBtn');
    const serviceMenu = document.getElementById('serviceDropdown');
    
    if (serviceBtn && serviceMenu) {
        serviceBtn.onclick = (e) => {
            e.stopPropagation();
            serviceMenu.style.display = serviceMenu.style.display === 'block' ? 'none' : 'block';
        };
        window.onclick = () => serviceMenu.style.display = 'none';
        serviceMenu.onclick = (e) => e.stopPropagation();
    }

    // this connects the checkboxes to the filtering logic
    const serviceCheckboxes = document.querySelectorAll('.service-opt');
    serviceCheckboxes.forEach(cb => {
        cb.addEventListener('change', applyAllFilters);
    });
});
function toggleEditMode() {
    const modalBody = document.getElementById('modalBody');
    const mainCloseBtn = document.querySelector('#mainModal .close-btn');
    if (mainCloseBtn) mainCloseBtn.setAttribute('onclick', 'handleCloseEdit()');

    // calculate variables to ensure values are defined before the template renders
    const displayAge = activePetData.Birthdate ? calculateAgeString(activePetData.Birthdate) : "N/A";
    const displayOwner = activePetData.ownerName || ((activePetData.ownerFName || "") + " " + (activePetData.ownerLName || "")).trim();
    const currentImgSrc = document.getElementById('petPreview')?.src || "img-request/total-pets.png";
    modalBody.innerHTML = `
        <div class="edit-grid">
            <!-- Left Side: Circular Image Editor[cite: 23, 24] -->
            <div class="image-editor-section" style="text-align: center;">
                <label class="field-label">Pet Photo</label>
                <div class="crop-container circle-crop" id="draggableArea" onmousedown="startDrag(event)">
                    <img id="cropPreview" src="${currentImgSrc}"
                         style="transform: translate(${translateX}px, ${translateY}px) scale(${activeScale});">
                </div>
                <div class="editor-controls">
                    <input type="file" id="petImageInput" hidden accept="image/*" onchange="previewPetImage(event)">
                    <button class="action-btn view-btn" style="width: 100%; margin-bottom: 10px;" 
                            onclick="document.getElementById('petImageInput').click()">Upload New Photo</button>
                    <label style="font-size: 11px; font-weight: 700; color: var(--primary-purple);">ZOOM & POSITION</label>
                    <input type="range" id="zoomSlider" min="1" max="3" step="0.1" value="${activeScale}" 
                           style="width: 100%; accent-color: var(--primary-purple);" oninput="updateZoom(this.value)">
                    <button class="action-btn undo-btn" onclick="resetImageAdjustments()">Undo Adjustments</button>
                </div>
            </div>

            <!-- Right Side: Full Form Fields Grid[cite: 23, 24] -->
            <div class="form-fields-section">
                <div class="fields-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div class="field"><label>Pet Name</label><input type="text" id="editName" value="${activePetData.Name}"></div>
                    <div class="field"><label>Owner Name</label><input type="text" id="editOwner" value="${displayOwner}"></div>
                    <div class="field"><label>Species</label><input type="text" id="editSpecies" value="${activePetData.Species}"></div>
                    <div class="field"><label>Breed</label><input type="text" id="editBreed" value="${activePetData.Breed}"></div>
                    <div class="field"><label>Color</label><input type="text" id="editColor" value="${activePetData.Color || 'N/A'}"></div>
                    <div class="field">
                        <label>Gender</label>
                        <select id="editGender">
                            <option value="Male" ${activePetData.Gender === 'Male' ? 'selected' : ''}>Male</option>
                            <option value="Female" ${activePetData.Gender === 'Female' ? 'selected' : ''}>Female</option>
                        </select>
                    </div>
                    <div class="field"><label>Birthdate</label><input type="date" id="editBirthdate" value="${activePetData.Birthdate}" onchange="updateCalculatedAge(this.value)"></div>
                    <div class="field"><label>Age</label><input type="text" id="displayAge" value="${displayAge}" readonly></div>
                </div>
                <div class="edit-actions" style="display: flex; gap: 15px; margin-top: 40px; justify-content: flex-end;">
                    <button class="submit-btn" style="width: 180px;" onclick="confirmEditAction('save')">Save Changes</button>
                </div>
            </div>
        </div>
    `;
    
    // 2. re-attach image manipulation listeners
    window.addEventListener('mousemove', dragImage);
    window.addEventListener('mouseup', endDrag);
    calculateAgeString(activePetData.Birthdate);
}

function previewPetImage(event) {
    const reader = new FileReader();
    reader.onload = function(){
        const output = document.getElementById('cropPreview');
        if (output) {
            output.src = reader.result;
            resetImageAdjustments(); 
        }
    };
    if(event.target.files[0]) {
        reader.readAsDataURL(event.target.files[0]);
    }
}

function resizeImage(scale) {
    const img = document.getElementById('cropPreview');
    if (img) {
        img.style.transform = `scale(${scale})`;
    }
}

function startDrag(e) {
    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    document.getElementById('draggableArea').style.cursor = 'grabbing';
}

function dragImage(e) {
    if (!isDragging) return;
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    updateImageTransform();
}

function endDrag() {
    isDragging = false;
    const area = document.getElementById('draggableArea');
    if(area) area.style.cursor = 'grab';
}

function updateZoom(scale) {
    activeScale = scale;
    updateImageTransform();
}

function resetImageAdjustments() {
    translateX = 0;
    translateY = 0;
    activeScale = 1;
    document.getElementById('zoomSlider').value = 1;
    updateImageTransform();
}

function updateImageTransform() {
    const img = document.getElementById('cropPreview');
    if(img) img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${activeScale})`;
}

function confirmEditAction(actionType) {
    const modal = document.getElementById('requestActionModal');
    const title = document.getElementById('requestActionTitle');
    const msg = document.getElementById('requestActionMessage');
    const btn = document.getElementById('btnConfirmRequest');

    modal.style.display = 'flex';

    if (actionType === 'save') {
        title.innerText = "Confirm Update";
        msg.innerText = "Are you sure you want to save these changes to the pet's profile?";
        btn.style.backgroundColor = "var(--primary-purple)";
        btn.onclick = () => { location.reload(); }; 
    } else {
        title.innerText = "Discard Changes";
        msg.innerText = "You have unsaved changes. Are you sure you want to go back?";
        btn.style.backgroundColor = "#ff5e78";
        btn.onclick = () => { 
            closeModal('requestActionModal'); 
            viewPetDetails(activePetData); 
        };
    }
}

function calculateAgeString(birthdateString) {
    const birthDate = new Date(birthdateString);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
        years--;
        months += 12;
    }
    return years > 0 ? `${years}y ${months}m` : `${months}m`;
}

function handleCloseEdit() {
    if (hasUnsavedChanges()) {
        confirmEditAction('cancel'); 
    } else {
        closeModal('mainModal');
    }
}

// helper to check if any field has been modified
function hasUnsavedChanges() {
    if (currentViewType === 'appt') return false;

    const nameEl = document.getElementById('editName');
    const ownerEl = document.getElementById('editOwner');
    if (!nameEl || !ownerEl) return false;

    const originalOwner = activePetData.ownerName || ((activePetData.ownerFName || "") + " " + (activePetData.ownerLName || "")).trim();

    const currentFields = {
        Name: nameEl.value || "",
        Owner: ownerEl.value || "",
        Species: document.getElementById('editSpecies')?.value || "",
        Color: document.getElementById('editColor')?.value || "",
        Breed: document.getElementById('editBreed')?.value || "",
        Gender: document.getElementById('editGender')?.value || "",
        Birthdate: document.getElementById('editBirthdate')?.value || ""
    };

    const originalFields = {
        Name: activePetData.Name || "",
        Owner: originalOwner, 
        Species: activePetData.Species || "",
        Color: activePetData.Color || "",
        Breed: activePetData.Breed || "",
        Gender: activePetData.Gender || "",
        Birthdate: activePetData.Birthdate || ""
    };

    return Object.keys(currentFields).some(key => currentFields[key] !== originalFields[key]);
}

function confirmEditAction(actionType) {
    const modal = document.getElementById('requestActionModal');
    const title = document.getElementById('requestActionTitle');
    const msg = document.getElementById('requestActionMessage');
    const btn = document.getElementById('btnConfirmRequest');

    modal.style.display = 'flex';

    if (actionType === 'save') {
        title.innerText = "Confirm Update";
        title.style.color = "var(--primary-purple)";
        msg.innerText = "Are you sure you want to save these changes to the pet's profile?";
        btn.style.backgroundColor = "var(--primary-purple)";
        btn.onclick = () => { 
            location.reload(); 
        };
    } else {
        title.innerText = "Discard Changes";
        title.style.color = "#ff5e78"; 
        msg.innerText = "You have unsaved changes. Are you sure you want to discard them and go back?";
        btn.innerText = "Discard Changes";
        btn.style.backgroundColor = "#ff5e78";
        btn.onclick = () => { 
            closeModal('requestActionModal'); 
            closeModal('mainModal'); 
        };
    }
}

function processApproval(petId) {
    console.log(`Approving Pet ID: ${petId}`);
    // logic: backend processes PetID -> Adds to 'pet' table -> redirect to pets.html
    window.location.href = "pets.html";
}

function processDecline(petId) {
    console.log(`Declining and deleting Pet ID: ${petId}`);
    // logic: backend deletes PetID from 'reminder/requests' table
    location.reload();
}

function toggleAppointmentFilters(value) {
    const appointmentUI = document.getElementById('appointmentFilters');
    if (appointmentUI) {
        appointmentUI.style.display = (value === 'appointment') ? 'flex' : 'none';
    }
}

function toggleServiceDropdown() {
    const dropdown = document.getElementById('serviceDropdown');
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
}

window.addEventListener('click', function(e) {
    const container = document.querySelector('.custom-dropdown');
    const dropdown = document.getElementById('serviceDropdown');
    if (container && !container.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const serviceSearch = document.getElementById('serviceSearchInput');
    if (serviceSearch) {
        serviceSearch.addEventListener('keyup', () => {
        });
    }
});

function loadRequestData(dataArray) {
    const tableBody = document.getElementById('requestTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = ''; 
    if (!dataArray || !Array.isArray(dataArray) || dataArray.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="padding: 80px 0; text-align: center;">
                    <div class="empty-state-container">
                        <!-- Scale the 30cm image to a usable UI size -->
                        <img src="img-request/no-requests.png" alt="No Requests" 
                             style="width: 280px; height: 280px; object-fit: contain; margin-bottom: 25px; opacity: 0.7;">
                        <h3 style="color: var(--primary-purple); font-size: 22px; margin-bottom: 10px;">No Requests Found</h3>
                        <p style="color: var(--text-muted); font-size: 15px;">There are no registration or appointment requests at this time.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    dataArray.forEach(item => {
        const row = document.createElement('tr');
        row.style.borderBottom = "1px solid #f9f9f9";
        row.setAttribute('ownerFName', item.ownerFName || "");
        row.setAttribute('ownerLName', item.ownerLName || "");

        // determine if it is a Pet Registration or Appointment
        const typeLabel = item.type === 'pet' ? 'PET' : 'APPT';
        const labelStyle = item.type === 'pet' ? 
            'background: #f0e6ff; color: #9d72d6;' : 
            'background: #e8f5ee; color: #2d6a4f;';

        row.innerHTML = `
            <td style="padding: 15px;">
                <span style="${labelStyle} padding: 5px 12px; border-radius: 8px; font-size: 11px; font-weight: 700;">${typeLabel}</span>
            </td>
            <td style="padding: 15px;">${item.Name} (${item.Breed || item.Species})</td>
            <td style="padding: 15px;">${(item.ownerFName + ' ' + item.ownerLName).trim()}</td>
            <td style="padding: 15px;">${item.Date || 'N/A'}</td>
            <td style="padding: 15px;">
                <div style="display: flex; gap: 8px;">
                    <button class="action-btn view-btn" onclick='viewPetDetails(${JSON.stringify(item)}, "${item.type}")'>🔍</button>
                    <button class="action-btn" style="background: #e8f5ee; color: #2d6a4f;" onclick="confirmAction('approve', ${item.PetID}, '${item.Name}')">✔</button>
                    <button class="action-btn" style="background: #ffe0e6; color: #ff5e78;" onclick="confirmAction('decline', ${item.PetID}, '${item.Name}')">✖</button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function populateOwnerFilter(dataArray) {
    const ownerFilter = document.getElementById('ownerFilter');
    const uniqueOwners = [...new Set(dataArray.map(item => `${item.ownerFName} ${item.ownerLName}`.trim()))];

    ownerFilter.innerHTML = '<option value="">All Owners</option>'; // Reset to default[cite: 25]
    uniqueOwners.sort().forEach(owner => {
        const option = document.createElement('option');
        option.value = owner;
        option.textContent = owner;
        ownerFilter.appendChild(option);
    });
}