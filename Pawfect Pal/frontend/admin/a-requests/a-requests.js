const modal = document.getElementById('mainModal');
const confirmModal = document.getElementById('confirmModal');

let requests = [];

async function loadRequests() {
    try {

        const response = await fetch(
            "http://localhost:5182/api/Appointment",
            {
                headers: getAuthHeaderOnly()
            }
        );

        if (handleUnauthorized(response)) return;

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to load requests.");
        }

        requests = data
            .filter(a => a.requestStatus === "Pending")
            .map(a => ({
                type: "appointment",

                AppointmentID: a.appointmentId,
                PetID: a.petId,

                Name: a.petName || `Pet ${a.petId}`,

                ownerFName: a.ownerFName || "",
                ownerLName: a.ownerLName || "",

                Date: new Date(a.appointmentDate)
                    .toLocaleDateString(),

                Services: a.services || [],

                requestStatus: a.requestStatus,

                appStatus: a.appStatus
            }));

        loadRequestData(requests);
        populateOwnerFilter(requests);

        updateRequestSummary();

    } catch (error) {
        console.error("Load requests error:", error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (typeof initImageLoading === "function") initImageLoading();
    
    const userNameEl = document.getElementById('UserName');
    if (userNameEl) userNameEl.textContent = localStorage.getItem("userName") || "Admin User";

    const pendingEl  = document.getElementById('pendingCount');
    const approvedEl = document.getElementById('approvedCount');
    const declineEl  = document.getElementById('declineCount');
    const totalEl    = document.getElementById('totalRequestCount');

    if (pendingEl)  pendingEl.textContent  = 0;
    if (approvedEl) approvedEl.textContent = 0;
    if (declineEl)  declineEl.textContent  = 0;
    if (totalEl)    totalEl.textContent    = 0;

    loadRequests();

    const searchInput = document.getElementById('requestSearchInput');
    const ownerFilter = document.getElementById('ownerFilter');
    const typeFilter  = document.getElementById('requestTypeFilter');

    if (searchInput) searchInput.addEventListener('keyup', applyAllFilters);
    if (ownerFilter) ownerFilter.addEventListener('change', applyAllFilters);
    if (typeFilter)  typeFilter.addEventListener('change', applyAllFilters);
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

        let matchesType = (typeVal === 'all');
        if (typeVal === 'pet') matchesType = typeText.includes('pet');
        if (typeVal === 'appointment') matchesType = typeText.includes('appt');

        const matchesSearch = searchVal === "" || petName.includes(searchVal) || fullNameLower.includes(searchVal);

        const matchesOwner = ownerDropdownVal === "" || fullName === ownerDropdownVal;

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
    
    // re-attach image manipulation listeners
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
        const unsavedModal = document.getElementById('unsavedModal');
        const discardBtn = document.getElementById('unsavedDiscardBtn');
        const continueBtn = document.getElementById('unsavedContinueBtn');

        unsavedModal.style.display = 'flex';

        discardBtn.onclick = () => {
            closeModal('unsavedModal');
            closeModal('mainModal');
        };
        continueBtn.onclick = () => {
            closeModal('unsavedModal');
        };
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
        closeModal('requestActionModal');
        const unsavedModal = document.getElementById('unsavedModal');
        const discardBtn = document.getElementById('unsavedDiscardBtn');
        const continueBtn = document.getElementById('unsavedContinueBtn');

        unsavedModal.style.display = 'flex';

        discardBtn.onclick = () => {
            closeModal('unsavedModal');
            closeModal('mainModal');
        };
        continueBtn.onclick = () => {
            closeModal('unsavedModal');
        };
    }
}

function confirmAction(actionType, petId, petName) {
    const modal = document.getElementById('requestActionModal');
    const title = document.getElementById('requestActionTitle');
    const msg = document.getElementById('requestActionMessage');
    const btn = document.getElementById('btnConfirmRequest');

    modal.style.display = 'flex';

    if (actionType === 'approve') {
        title.innerText = "Approve Request";
        title.style.color = "#2d6a4f";
        msg.innerText = `Are you sure you want to approve the request for "${petName}"?`;
        btn.style.backgroundColor = "#40916c";
        btn.innerText = "Approve";
        btn.onclick = () => { closeModal('requestActionModal'); processApproval(petId); };
    } else {
        title.innerText = "Decline Request";
        title.style.color = "#ff5e78";
        msg.innerText = `Are you sure you want to decline the request for "${petName}"? This cannot be undone.`;
        btn.style.backgroundColor = "#ff5e78";
        btn.innerText = "Decline";
        btn.onclick = () => { closeModal('requestActionModal'); processDecline(petId); };
    }
}

async function processApproval(appointmentId) {
    try {

        const response = await fetch(
            `http://localhost:5182/api/Appointment/${appointmentId}/request-status`,
            {
                method: "PATCH",

                headers: {
                    ...getAuthHeaders()
                },

                body: JSON.stringify("Confirmed")
            }
        );

        if (handleUnauthorized(response)) return;

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Approval failed.");
        }

        requests = requests.filter(
            r => r.AppointmentID !== appointmentId
        );

        loadRequestData(requests);
        populateOwnerFilter(requests);
        updateRequestSummary();

    } catch (error) {
        console.error("Approve error:", error);
        alert(error.message);
    }
}

async function processDecline(appointmentId) {
    try {

        const response = await fetch(
            `http://localhost:5182/api/Appointment/${appointmentId}/request-status`,
            {
                method: "PATCH",

                headers: {
                    ...getAuthHeaders()
                },

                body: JSON.stringify("Denied")
            }
        );

        if (handleUnauthorized(response)) return;

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Decline failed.");
        }

        requests = requests.filter(
            r => r.AppointmentID !== appointmentId
        );

        loadRequestData(requests);
        populateOwnerFilter(requests);
        updateRequestSummary();

    } catch (error) {
        console.error("Decline error:", error);
        alert(error.message);
    }
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

        // determines if it is a pet registration or appointment
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
                    <button class="action-btn-circle btn-details" onclick='viewPetDetails(${JSON.stringify(item)}, "${item.type}")' title="View Details">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                        </svg>
                    </button>
                    <button class="action-btn-circle btn-approve" onclick="confirmAction('approve', ${item.PetID}, '${item.Name}')" title="Approve">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                    </button>
                    <button class="action-btn-circle btn-decline" onclick="confirmAction('decline', ${item.PetID}, '${item.Name}')" title="Decline">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function updateRequestSummary() {

    const pending = requests.filter(
        r => r.requestStatus === "Pending"
    ).length;

    const approved = requests.filter(
        r => r.requestStatus === "Confirmed"
    ).length;

    const declined = requests.filter(
        r => r.requestStatus === "Denied"
    ).length;

    document.getElementById("pendingCount").textContent = pending;
    document.getElementById("approvedCount").textContent = approved;
    document.getElementById("declineCount").textContent = declined;
    document.getElementById("totalRequestCount").textContent = requests.length;
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