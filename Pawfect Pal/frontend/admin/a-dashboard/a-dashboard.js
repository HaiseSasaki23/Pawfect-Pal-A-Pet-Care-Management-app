document.addEventListener("DOMContentLoaded", function () {
    const user = requireLogin("Admin");
    if (!user) return;

    const nameEl = document.getElementById("welcomeOwnerFName");
    if (nameEl && user.firstName) nameEl.textContent = user.firstName;
    const userNameEl = document.getElementById("UserName");
    if (userNameEl && user.firstName) userNameEl.textContent = user.firstName;

    showDashboardSkeletons();
    showPetsSkeleton();

    loadDashboardSummary(user.userId, user.role);
    loadRequests(user.userId);
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

function updateStat(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.opacity = "0";
    setTimeout(() => {
        el.textContent = value ?? 0;
        el.style.opacity = "1";
    }, 120);
}

async function loadDashboardSummary(userId, role) {
    const url = role.toLowerCase() === "admin"
        ? "http://localhost:5182/api/Dashboard/admin-summary"
        : `http://localhost:5182/api/Dashboard/user-summary/${userId}`;

    try {
        const response = await fetch(url, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error("Failed to load dashboard summary.");
        const data = await response.json();

        updateStat("TotalPetsCount", data.totalPets);
        updateStat("AptCount", data.totalAppointments);
        updateStat("TotalRequestsCount", data.totalRequests ?? data.totalAppointments ?? 0);

    } catch (error) {
        console.error("Dashboard summary error:", error);
    }
}

async function loadRequests(userId) {
    try {
        const requests = await fetch(`http://localhost:5182/api/Appointment/user/${userId}`, {
                headers: getAuthHeaders()
              }).then(r => { if (!r.ok) throw new Error(`Status: ${r.status}`); return r.json(); });

        const container = document.getElementById("RequestsList");
        const empty = document.getElementById("EmptyRequests");
        const viewAll = document.getElementById("ViewAllRequests");

        if (!Array.isArray(requests) || requests.length === 0) {
            setTimeout(() => {
                container.innerHTML = "";
                empty.style.display = "flex";
                if (viewAll) viewAll.style.display = "none";
            }, 200);
            return;
        }

        empty.style.display = "none";
        if (viewAll) viewAll.style.display = "block";
        container.style.opacity = "0";
        setTimeout(() => {
        window._dashRequests = requests;
        container.innerHTML = requests.map((req, i) => {
                const id = req.appointmentId || req.petId || 0;
                return `
                <div class="request-list-item">
                    <span style="${req.type === 'pet' ? 'background:#f0e6ff; color:#9d72d6;' : 'background:#e8f5ee; color:#2d6a4f;'} padding:5px 12px; border-radius:8px; font-size:11px; font-weight:700; flex-shrink:0;">${req.type === 'pet' ? 'PET' : 'APPT'}</span>
                    <div class="apt-details-list">
                        <strong>${req.petName}</strong>
                        <span style="font-size:12px; color:var(--text-muted);">${req.ownerName || ''}</span>
                    </div>
                    <div class="request-actions">
                        <button class="dash-action-btn dash-btn-details" title="View" onclick="viewDashRequest(${i})">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                        </button>
                        <button class="dash-action-btn dash-btn-approve" title="Approve" onclick="dashConfirmAction('approve', ${id}, '${req.petName}')">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><polyline points="9 11 12 14 22 4"/></svg>
                        </button>
                        <button class="dash-action-btn dash-btn-decline" title="Decline" onclick="dashConfirmAction('decline', ${id}, '${req.petName}')">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                    </div>
                </div>`;
            }).join("");
            container.style.opacity = "1";
        }, 120);
    } catch (err) {
        console.error("Load requests error:", err);
        const container = document.getElementById("RequestsList");
        const empty = document.getElementById("EmptyRequests");
        if (container) container.innerHTML = "";
        if (empty) empty.style.display = "flex";
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
        const appointments = await fetch(`http://localhost:5182/api/Appointment/user/${userId}`, {
                headers: getAuthHeaders()
              }).then(r => { if (!r.ok) throw new Error("Failed to load appointments"); return r.json(); });

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

            const STATUS_STYLES = {
                'Pending':     { bg: '#fff7ed', color: '#d97706', dot: '#f59e0b' },
                'Checked-In':  { bg: '#eff6ff', color: '#2563eb', dot: '#3b82f6' },
                'In-Progress': { bg: '#f0fdf4', color: '#16a34a', dot: '#22c55e' },
                'Completed':   { bg: '#f5f3ff', color: '#7c3aed', dot: '#9d72d6' },
            };
            const status = apt.status || 'Pending';
            const st = STATUS_STYLES[status] || STATUS_STYLES['Pending'];

            const SERVICE_COLORS = {
                'Check-up':    { bg: '#eff6ff', color: '#2563eb' },
                'Vaccination': { bg: '#f0fdf4', color: '#16a34a' },
                'Deworming':   { bg: '#fff7ed', color: '#d97706' },
                'Grooming':    { bg: '#fdf4ff', color: '#a21caf' },
            };
            const serviceList = (apt.services || 'No service').split(',').map(s => s.trim());
            const serviceChips = serviceList.map(s => {
                const sc = SERVICE_COLORS[s] || { bg: '#f3f4f6', color: '#6b7280' };
                return `<span style="background:${sc.bg}; color:${sc.color}; font-size:10px; font-weight:700; padding:2px 8px; border-radius:6px; white-space:nowrap;">${s}</span>`;
            }).join('');

            return `
                <div class="appointment-list-item">
                    <div class="calendar-mini">
                        <div class="cal-month">${month}</div>
                        <div class="cal-day">${day}</div>
                    </div>
                    <div class="apt-details-list">
                        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                            <strong style="font-size:14px;">${apt.petName}</strong>
                            <span style="display:inline-flex; align-items:center; gap:4px; background:${st.bg}; color:${st.color}; font-size:10px; font-weight:700; padding:2px 8px; border-radius:20px;">
                                <span style="width:5px; height:5px; border-radius:50%; background:${st.dot}; display:inline-block;"></span>
                                ${status}
                            </span>
                        </div>
                        <div class="apt-time-row" style="display:flex; align-items:center; gap:4px; margin-top:2px;">
                            <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                            ${apt.appointmentTime || ""}
                        </div>
                        <div style="display:flex; gap:4px; flex-wrap:wrap; margin-top:4px;">
                            ${serviceChips}
                        </div>
                    </div>
                </div>
            `;
        }).join("");

    } catch (error) {
        console.error("Load appointments error:", error);
        const container = document.getElementById("AptList");
        const empty = document.getElementById("EmptyApt");
        if (container) container.innerHTML = "";
        if (empty) empty.style.display = "flex";
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

window.onload = function () {
    const today = new Date().toISOString().split('T')[0];
    const bookingDate = document.getElementById('bookingDate');
    if (bookingDate) bookingDate.setAttribute('min', today);
};

function showDashboardSkeletons() {
    ["TotalPetsCount", "AptCount", "TotalRequestsCount"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = `<span class="skeleton" style="display:inline-block;width:55px;height:24px;"></span>`;
    });
}

function showPetsSkeleton() {
    const container = document.getElementById("RequestsList");
    const empty = document.getElementById("EmptyRequests");
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
        document.querySelector('.dashboard-container').classList.add('page-blurred');
        document.getElementById(modals[type]).style.display = 'flex';
        document.body.classList.add('modal-open');
        if (type === 'Appointment') {
            dashOpenNewApptModal();
        }
    }
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
        const servicesChecked = document.querySelectorAll('#dashServiceDropdownList input[type=checkbox]:checked').length > 0;
        return (document.getElementById('apptUserId')?.value || "") !== "" ||
            (document.getElementById('apptPetId')?.value || "") !== "" ||
            (document.getElementById('apptDate')?.value || "") !== "" ||
            (document.getElementById('apptTime')?.value || "") !== "" ||
            (document.getElementById('apptNotes')?.value.trim() || "") !== "" ||
            servicesChecked;
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
    if (_pendingCloseType === '__petEdit__') {
        dashPetEditDirty = false;
        const modal = document.getElementById('requestActionModal');
        const modalInner = modal?.querySelector('.modal-content');
        if (modalInner) dashResetModalSize(modalInner);
        modal.style.display = 'none';
    } else if (_pendingCloseType) {
        closeActionModal(_pendingCloseType);
    }
    _pendingCloseType = null;
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
            dashResetApptForm();
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


const DASH_ALL_SERVICES = [
    { name: 'Check-up',    price: 500  },
    { name: 'Vaccination', price: 1200 },
    { name: 'Deworming',   price: 350  },
    { name: 'Grooming',    price: 1500 },
];

let dashFormDirty = false;

function dashOnFormChange() { dashFormDirty = true; }

function dashOpenNewApptModal() {
    dashFormDirty = false;
    dashResetApptForm();
    dashBuildTimeOptions();
    dashBuildServiceDropdown();
    dashLoadUsersForDropdown();
}

function dashCloseNewApptModal() {
    requestCloseModal('Appointment');
}

function dashDiscardAndClose() {
    dashFormDirty = false;
    closeActionModal('Appointment');
}

function dashResetApptForm() {
    const userSel = document.getElementById('apptUserId');
    if (userSel) userSel.value = '';
    const petSel = document.getElementById('apptPetId');
    if (petSel) petSel.innerHTML = '<option value="">Select Pet</option>';
    const dateEl = document.getElementById('apptDate');
    if (dateEl) { dateEl.value = ''; dateEl.min = new Date().toISOString().split('T')[0]; }
    const timeEl = document.getElementById('apptTime');
    if (timeEl) timeEl.value = '';
    const notesEl = document.getElementById('apptNotes');
    if (notesEl) notesEl.value = '';
    const totalEl = document.getElementById('bookingTotal');
    if (totalEl) totalEl.textContent = '₱0';
    document.querySelectorAll('#dashServiceDropdownList input[type=checkbox]').forEach(cb => cb.checked = false);
    const ddList = document.getElementById('dashServiceDropdownList');
    if (ddList) ddList.style.display = 'none';
    dashUpdateServiceDisplay();
}

function dashBuildTimeOptions() {
    const sel = document.getElementById('apptTime');
    if (!sel) return;
    sel.innerHTML = '<option value="">Select Time</option>';
    for (let h = 7; h <= 17; h++) {
        [0, 30].forEach(m => {
            if (h === 17 && m === 30) return;
            const hh   = h % 12 === 0 ? 12 : h % 12;
            const mm   = m === 0 ? '00' : '30';
            const ampm = h < 12 ? 'AM' : 'PM';
            const opt  = document.createElement('option');
            opt.value       = `${String(h).padStart(2,'0')}:${mm}`;
            opt.textContent = `${hh}:${mm} ${ampm}`;
            sel.appendChild(opt);
        });
    }
}

function dashBuildServiceDropdown() {
    const btn  = document.getElementById('dashServiceDropdownBtn');
    const list = document.getElementById('dashServiceDropdownList');
    if (!btn || !list) return;

    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    const freshBtn = document.getElementById('dashServiceDropdownBtn');

    list.innerHTML = '';
    DASH_ALL_SERVICES.forEach(svc => {
        const item = document.createElement('label');
        item.style.cssText = 'display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:8px; cursor:pointer; font-size:14px; font-weight:600; color:#4a4a4a; transition:background 0.15s; user-select:none;';
        item.onmouseover = () => { item.style.background = '#f8f0ff'; item.style.color = '#9d72d6'; };
        item.onmouseout  = () => { item.style.background = ''; item.style.color = '#4a4a4a'; };

        const cb = document.createElement('input');
        cb.type  = 'checkbox';
        cb.value = svc.name;
        cb.style.cssText = 'accent-color:#9d72d6; width:15px; height:15px; cursor:pointer; flex-shrink:0;';
        cb.addEventListener('change', () => {
            dashUpdateServiceDisplay();
            dashUpdateTotal();
            dashOnFormChange();
        });

        const nameSpan  = document.createElement('span');
        nameSpan.textContent = svc.name;
        nameSpan.style.flex  = '1';

        const priceSpan = document.createElement('span');
        priceSpan.textContent = '₱' + svc.price.toLocaleString();
        priceSpan.style.cssText = 'font-size:12px; color:#999; font-weight:600; margin-left:auto;';

        item.appendChild(cb);
        item.appendChild(nameSpan);
        item.appendChild(priceSpan);
        list.appendChild(item);
    });

    freshBtn.addEventListener('click', e => {
        e.stopPropagation();
        const isOpen = list.style.display === 'block';
        list.style.display = isOpen ? 'none' : 'block';
    });

    list.addEventListener('click', e => e.stopPropagation());
    dashUpdateServiceDisplay();
}

function dashUpdateServiceDisplay() {
    const checked = [...document.querySelectorAll('#dashServiceDropdownList input:checked')].map(cb => cb.value);
    const display = document.getElementById('dashServiceDropdownDisplay');
    if (display) display.textContent = checked.length === 0 ? 'Select Services' : checked.join(', ');
}

function dashUpdateTotal() {
    let total = 0;
    document.querySelectorAll('#dashServiceDropdownList input:checked').forEach(cb => {
        const svc = DASH_ALL_SERVICES.find(s => s.name === cb.value);
        if (svc) total += svc.price;
    });
    const el = document.getElementById('bookingTotal');
    if (el) el.textContent = `₱${total.toLocaleString()}`;
}

function dashGetSelectedServices() {
    return [...document.querySelectorAll('#dashServiceDropdownList input:checked')].map(cb => cb.value);
}

async function dashLoadUsersForDropdown() {
    const sel = document.getElementById('apptUserId');
    if (!sel) return;
    sel.innerHTML = '<option value="">Select User</option>';

    try {
        const res = await fetch('http://localhost:5182/api/User', { headers: getAuthHeaders() });
        if (!res.ok) throw new Error();
        const users = await res.json();
        users.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.userId;
            opt.textContent = `${u.userId} – ${u.firstName} ${u.lastName}`;
            sel.appendChild(opt);
        });
    } catch {
        sel.innerHTML = '<option value="">Failed to load users</option>';
    }
}

// when user changes, repopulate pet ID dropdown — only shows pets owned by the logged-in user
async function dashOnUserChange() {
    const petSel = document.getElementById('apptPetId');
    if (!petSel) return;
    petSel.innerHTML = '<option value="">Select Pet</option>';
    dashOnFormChange();

    const loggedInUserId = localStorage.getItem('userId') || document.getElementById('apptUserId')?.value;
    if (!loggedInUserId) return;

    try {
        const res = await fetch(`http://localhost:5182/api/Pet/user/${loggedInUserId}?t=${Date.now()}`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error();
        const pets = await res.json();
        if (!Array.isArray(pets) || !pets.length) {
            petSel.innerHTML = '<option value="">No pets found</option>'; return;
        }
        pets.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.petId;
            opt.textContent = `${getSpeciesEmoji(p.species)} ${p.name}`;
            petSel.appendChild(opt);
        });
    } catch {
        petSel.innerHTML = '<option value="">Failed to load pets</option>';
    }
}

function dashShowFieldsAlert(missing) {
    document.getElementById('dashAlertTitle').textContent  = 'Missing Details';
    document.getElementById('dashAlertMessage').innerHTML  =
        'Please fill in the following required fields:<br><br>' +
        missing.map(f => `• <strong>${f}</strong>`).join('<br>');
    document.getElementById('dashAlertModal').style.display = 'flex';
}

function dashShowSavedPopup(appt) {
    document.getElementById('dashSavedOwner').textContent    = appt.ownerName;
    document.getElementById('dashSavedPet').textContent      = appt.petName;
    document.getElementById('dashSavedService').textContent  = appt.serviceType;
    document.getElementById('dashSavedDateTime').textContent = `${appt.date} at ${appt.time}`;
    document.getElementById('dashApptSavedModal').style.display = 'flex';
}

async function dashSubmitNewAppointment() {
    const userId   = document.getElementById('apptUserId')?.value;
    const petId    = document.getElementById('apptPetId')?.value;
    const services = dashGetSelectedServices();
    const date     = document.getElementById('apptDate')?.value;
    const time     = document.getElementById('apptTime')?.value;
    const notes    = document.getElementById('apptNotes')?.value.trim() || '';

    const missing = [];
    if (!userId)          missing.push('User ID');
    if (!petId)           missing.push('Pet ID');
    if (!services.length) missing.push('Service Type (pick at least one)');
    if (!date)            missing.push('Appointment Date');
    if (!time)            missing.push('Time');
    if (missing.length) { dashShowFieldsAlert(missing); return; }

    const todayStr = new Date().toISOString().split('T')[0];
    if (date < todayStr) { dashShowFieldsAlert(['Appointment Date cannot be in the past.']); return; }

    const saveBtn  = document.querySelector('.dash-save-appt-btn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving...'; }

    const petSel     = document.getElementById('apptPetId');
    const petName    = petSel.options[petSel.selectedIndex].text.split('–')[1]?.trim() ?? petId;
    const userSel    = document.getElementById('apptUserId');
    const ownerName  = userSel.options[userSel.selectedIndex].text.split('–')[1]?.trim() ?? userId;
    const dateObj    = new Date(`${date}T${time}`);
    const dateLabel  = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeLabel  = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const serviceType = services.join(', ');

    if (USE_MOCK) {
        dashFormDirty = false;
        document.getElementById('bookAppointmentModal').style.display = 'none';
        document.querySelector('.dashboard-container').classList.remove('page-blurred');
        document.body.classList.remove('modal-open');
        dashResetApptForm();
        dashShowSavedPopup({ ownerName, petName, serviceType, date: dateLabel, time: timeLabel });
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save Appointment'; }
        return;
    }

    const serviceMap = { 'Check-up': 1, 'Vaccination': 2, 'Deworming': 3, 'Grooming': 4 };
    const serviceIds = services.map(s => serviceMap[s]).filter(Boolean);

    try {
        const res = await fetch('http://localhost:5182/api/Appointment', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                userId: parseInt(userId),
                petId:  parseInt(petId),
                appointmentDate: `${date}T${time}:00`,
                notes,
                serviceIds
            })
        });
        const data = await res.json();
        if (!res.ok) { dashShowFieldsAlert([data.message || 'Could not submit your appointment.']); return; }

        dashFormDirty = false;
        document.getElementById('bookAppointmentModal').style.display = 'none';
        document.querySelector('.dashboard-container').classList.remove('page-blurred');
        document.body.classList.remove('modal-open');
        dashResetApptForm();
        dashShowSavedPopup({ ownerName, petName, serviceType, date: dateLabel, time: timeLabel });

        const loggedUserId = localStorage.getItem('userId');
        loadDashboardSummary(loggedUserId, localStorage.getItem('role') || 'User');
        loadAppointments(loggedUserId);

    } catch {
        dashShowFieldsAlert(['Connection error. Please try again.']);
    } finally {
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save Appointment'; }
    }
}

// close service dropdown when clicking outside
document.addEventListener('click', () => {
    const ddList = document.getElementById('dashServiceDropdownList');
    if (ddList) ddList.style.display = 'none';
});

function dashConfirmAction(actionType, id, name) {
    const modal = document.getElementById('requestActionModal');
    const title = document.getElementById('requestActionTitle');
    const msg = document.getElementById('requestActionMessage');
    const icon = document.getElementById('actionIcon');
    const btn = document.getElementById('btnConfirmRequest');

    if (actionType === 'approve') {
        title.innerText = "Approve Request";
        title.style.color = "#2d6a4f";
        icon.innerHTML = `<div style="width:70px;height:70px;border-radius:50%;background:#e8f5ee;display:flex;align-items:center;justify-content:center;margin:0 auto;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>`;
        msg.innerHTML = `You are about to <strong style="color:#2d6a4f;">approve</strong> the request for <strong>${name}</strong>.<br><br>This will process the request and notify the owner.`;
        btn.innerText = "Approve";
        btn.style.backgroundColor = "#40916c";
        btn.onclick = () => {
            modal.style.display = 'none';
            dashProcessApproval(id);
        };
    } else {
        title.innerText = "Decline Request";
        title.style.color = "#ff5e78";
        icon.innerHTML = `<div style="width:70px;height:70px;border-radius:50%;background:#fff0f3;display:flex;align-items:center;justify-content:center;margin:0 auto;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ff5e78" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </div>`;
        msg.innerHTML = `You are about to <strong style="color:#ff5e78;">decline</strong> the request for <strong>${name}</strong>.<br><br>This action will remove the request permanently.`;
        btn.innerText = "Decline";
        btn.style.backgroundColor = "#ff5e78";
        btn.onclick = () => {
            modal.style.display = 'none';
            dashProcessDecline(id);
        };
    }

    modal.style.display = 'flex';
}

function dashProcessApproval(petId) {
    console.log(`Approving Pet ID: ${petId}`);
    // logic: backend processes PetID -> Adds to 'pet' table -> redirect to pets page
    window.location.href = "../a-pets/a-pets.html";
}

function dashProcessDecline(petId) {
    console.log(`Declining and deleting Pet ID: ${petId}`);
    // logic: backend deletes PetID from 'reminder/requests' table
    location.reload();
}

function viewDashRequest(index) {
    const req = window._dashRequests && window._dashRequests[index];
    if (!req) return;
    viewPetDetails(req, req.type || 'appt');
}

function viewPetDetails(petData, type) {
    if (typeof petData === 'string') { try { petData = JSON.parse(petData); } catch(e) { return; } }
    type = type || petData.type || 'appt';

    dashActivePetData = petData;

    const modal      = document.getElementById('requestActionModal');
    const modalInner = modal.querySelector('.modal-content');
    const modalTitle = document.getElementById('requestActionTitle');
    const modalBody  = document.getElementById('requestActionMessage');
    const icon       = document.getElementById('actionIcon');
    const btn        = document.getElementById('btnConfirmRequest');

    btn.style.display = 'none';
    icon.innerHTML = '';

    if (type === 'appt') {
        modalInner.style.cssText = 'max-width:600px; min-height:450px; overflow-y:hidden; padding:30px; border-radius:24px;';
        modalTitle.innerText = "Appointment Details";
        modalTitle.style.color = "var(--primary-purple)";

        const servicesList = petData.services
            ? petData.services.split(',').map(s => s.trim())
            : ['No service listed'];

        modalBody.innerHTML = `
            <div style="text-align:center; padding:10px 0;">
                <div style="width:110px; height:110px; margin:0 auto 18px; border:4px solid var(--primary-purple); border-radius:50%; background:var(--bg-lavender); display:flex; align-items:center; justify-content:center; flex-shrink:0; overflow:hidden;">
                    <span style="font-size:46px; line-height:1;">🐾</span>
                </div>
                <h2 style="color:var(--primary-purple); font-size:22px; margin-bottom:4px;">${petData.petName}</h2>
                <p style="font-size:13px; color:var(--text-muted); margin-bottom:20px;">Owner: <strong style="color:var(--primary-purple);">${petData.ownerName || '—'}</strong></p>
                <div style="background:var(--bg-lavender); padding:24px; border-radius:20px; border:1px solid #e0d5f0; max-width:420px; margin:0 auto;">
                    <strong style="display:block; color:var(--primary-purple); text-transform:uppercase; font-size:12px; letter-spacing:1px; margin-bottom:14px;">Services Availed</strong>
                    <div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap;">
                        ${servicesList.map(s => '<span style="background:white; color:var(--primary-purple); padding:8px 18px; border-radius:10px; font-weight:700; border:1px solid #e0d5f0;">' + s + '</span>').join('')}
                    </div>
                </div>
            </div>`;

    } else {
        modalInner.style.cssText = 'max-width:1100px; width:95vw; min-height:700px; max-height:90vh; overflow-y:auto; padding:50px; border-radius:30px;';
        modalTitle.innerText = "Pet Information";
        modalTitle.style.color = "var(--primary-purple)";

        const displayOwner = petData.ownerName || ((petData.ownerFName || '') + ' ' + (petData.ownerLName || '')).trim() || '—';
        const birthdate    = petData.Birthdate || '';
        let age = 'N/A';
        if (birthdate) {
            const b = new Date(birthdate), t = new Date();
            let y = t.getFullYear() - b.getFullYear(), m = t.getMonth() - b.getMonth();
            if (m < 0 || (m === 0 && t.getDate() < b.getDate())) { y--; m += 12; }
            age = y > 0 ? y + 'y ' + m + 'm' : m + 'm';
        }

        modalBody.innerHTML = `
            <div class="edit-grid">
                <div class="image-section">
                    <div class="pet-image-container circle-crop" style="width:200px; height:200px; min-width:200px; min-height:200px; margin:0 auto; border-radius:50%; overflow:hidden; border:4px solid var(--primary-purple); background:var(--bg-lavender); display:flex; align-items:center; justify-content:center;">
                        <img id="petPreview" src="" style="width:200px; height:200px; object-fit:cover; flex-shrink:0;">
                    </div>
                </div>
                <div class="details-section">
                    <div id="detailsContent" style="display:grid; grid-template-columns:1fr 1fr; gap:25px;">
                        <div><strong>Pet Name</strong><p>${petData.Name || petData.petName}</p></div>
                        <div><strong>Owner Name</strong><p>${displayOwner}</p></div>
                        <div><strong>Species</strong><p>${petData.Species || '—'}</p></div>
                        <div><strong>Breed</strong><p>${petData.Breed || '—'}</p></div>
                        <div><strong>Color</strong><p>${petData.Color || 'N/A'}</p></div>
                        <div><strong>Gender</strong><p>${petData.Gender || '—'}</p></div>
                        <div><strong>Birthdate</strong><p>${birthdate || '—'}</p></div>
                        <div><strong>Age</strong><p>${age}</p></div>
                    </div>
                    <div style="display:flex; justify-content:flex-end; margin-top:40px;">
                        <button class="submit-btn" style="width:220px;" onclick="dashToggleEditMode()">Edit Details</button>
                    </div>
                </div>
            </div>`;
    }

    const restoreModal = () => {
        if (dashPetEditDirty) {
            _pendingCloseType = '__petEdit__';
            document.getElementById('unsavedModal').style.display = 'flex';
            document.body.classList.add('modal-unsaved');
            return;
        }
        btn.style.display = '';
        dashResetModalSize(modalInner);
    };
    modal.addEventListener('click', function once(e) { if (e.target === modal) { restoreModal(); modal.removeEventListener('click', once); } });
    modal.querySelector('.close-btn')?.addEventListener('click', restoreModal, { once: true });

    modal.style.display = 'flex';
}

function dashResetModalSize(el) {
    el.style.cssText = '';
}

let dashActiveScale = 1, dashTranslateX = 0, dashTranslateY = 0, dashIsDragging = false, dashStartX = 0, dashStartY = 0;
let dashActivePetData = null;
let dashPetEditDirty = false;

function dashToggleEditMode() {
    const modalBody  = document.getElementById('requestActionMessage');
    const modalInner = document.getElementById('requestActionModal').querySelector('.modal-content');
    modalInner.style.cssText = 'max-width:1100px; width:95vw; min-height:700px; max-height:90vh; overflow-y:auto; padding:50px; border-radius:30px;';

    const petData      = dashActivePetData;
    const displayOwner = petData.ownerName || ((petData.ownerFName || '') + ' ' + (petData.ownerLName || '')).trim();
    const birthdate    = petData.Birthdate || '';
    let age = 'N/A';
    if (birthdate) {
        const b = new Date(birthdate), t = new Date();
        let y = t.getFullYear() - b.getFullYear(), m = t.getMonth() - b.getMonth();
        if (m < 0 || (m === 0 && t.getDate() < b.getDate())) { y--; m += 12; }
        age = y > 0 ? y + 'y ' + m + 'm' : m + 'm';
    }
    const currentImgSrc = document.getElementById('petPreview')?.src || '';

    modalBody.innerHTML = `
        <div class="edit-grid">
            <div class="image-editor-section" style="text-align:center;">
                <label class="field-label">Pet Photo</label>
                <div class="crop-container circle-crop" id="draggableArea" onmousedown="dashStartDrag(event)" style="width:200px; height:200px; min-width:200px; min-height:200px; border-radius:50%; overflow:hidden; margin:0 auto; cursor:grab;">
                    <img id="cropPreview" src="${currentImgSrc}"
                         style="transform: translate(${dashTranslateX}px, ${dashTranslateY}px) scale(${dashActiveScale});">
                </div>
                <div class="editor-controls">
                    <input type="file" id="petImageInput" hidden accept="image/*" onchange="dashPreviewPetImage(event)">
                    <button class="action-btn view-btn" style="width:100%; margin-bottom:10px;" onclick="document.getElementById('petImageInput').click()">Upload New Photo</button>
                    <label style="font-size:11px; font-weight:700; color:var(--primary-purple);">ZOOM & POSITION</label>
                    <input type="range" id="zoomSlider" min="1" max="3" step="0.1" value="${dashActiveScale}"
                           style="width:100%; accent-color:var(--primary-purple);" oninput="dashUpdateZoom(this.value)">
                    <button class="action-btn undo-btn" onclick="dashResetImageAdjustments()">Undo Adjustments</button>
                </div>
            </div>
            <div class="form-fields-section">
                <div class="fields-container" style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
                    <div class="field"><label>Pet Name</label><input type="text" id="editName" value="${petData.Name || petData.petName || ''}"></div>
                    <div class="field"><label>Owner Name</label><input type="text" id="editOwner" value="${displayOwner}"></div>
                    <div class="field"><label>Species</label><input type="text" id="editSpecies" value="${petData.Species || ''}"></div>
                    <div class="field"><label>Breed</label><input type="text" id="editBreed" value="${petData.Breed || ''}"></div>
                    <div class="field"><label>Color</label><input type="text" id="editColor" value="${petData.Color || ''}"></div>
                    <div class="field">
                        <label>Gender</label>
                        <select id="editGender">
                            <option value="Male" ${petData.Gender === 'Male' ? 'selected' : ''}>Male</option>
                            <option value="Female" ${petData.Gender === 'Female' ? 'selected' : ''}>Female</option>
                        </select>
                    </div>
                    <div class="field"><label>Birthdate</label><input type="date" id="editBirthdate" value="${birthdate}"></div>
                    <div class="field"><label>Age</label><input type="text" id="displayAge" value="${age}" readonly></div>
                </div>
                <div style="display:flex; gap:15px; margin-top:40px; justify-content:flex-end;">
                    <button class="submit-btn" style="width:180px;" onclick="dashConfirmEditAction('save')">Save Changes</button>
                </div>
            </div>
        </div>`;

    // track unsaved changes in the pet edit form
    dashPetEditDirty = false;
    modalBody.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('change', () => { dashPetEditDirty = true; });
        el.addEventListener('input',  () => { dashPetEditDirty = true; });
    });

    window.addEventListener('mousemove', dashDragImage);
    window.addEventListener('mouseup', dashEndDrag);
}

function dashPreviewPetImage(event) {
    const reader = new FileReader();
    reader.onload = function() {
        const img = document.getElementById('cropPreview');
        if (img) { img.src = reader.result; dashResetImageAdjustments(); }
        dashPetEditDirty = true;
    };
    if (event.target.files[0]) reader.readAsDataURL(event.target.files[0]);
}

function dashStartDrag(e) {
    dashIsDragging = true;
    dashStartX = e.clientX - dashTranslateX;
    dashStartY = e.clientY - dashTranslateY;
    document.getElementById('draggableArea').style.cursor = 'grabbing';
}

function dashDragImage(e) {
    if (!dashIsDragging) return;
    dashTranslateX = e.clientX - dashStartX;
    dashTranslateY = e.clientY - dashStartY;
    dashUpdateImageTransform();
}

function dashEndDrag() {
    dashIsDragging = false;
    const area = document.getElementById('draggableArea');
    if (area) area.style.cursor = 'grab';
}

function dashUpdateZoom(scale) {
    dashActiveScale = scale;
    dashUpdateImageTransform();
}

function dashResetImageAdjustments() {
    dashTranslateX = 0; dashTranslateY = 0; dashActiveScale = 1;
    const slider = document.getElementById('zoomSlider');
    if (slider) slider.value = 1;
    dashUpdateImageTransform();
}

function dashUpdateImageTransform() {
    const img = document.getElementById('cropPreview');
    if (img) img.style.transform = `translate(${dashTranslateX}px, ${dashTranslateY}px) scale(${dashActiveScale})`;
}

function dashConfirmEditAction(actionType) {
    if (actionType === 'save') {
        const confirmModal = document.getElementById('petSaveConfirmModal');
        const confirmBtn   = document.getElementById('petSaveConfirmBtn');
        confirmBtn.onclick = () => {
            dashPetEditDirty = false;
            confirmModal.style.display = 'none';
            location.reload();
        };
        confirmModal.style.display = 'flex';
    }
}

function dashOpenBookingConfirm() {
    const confirmModal = document.getElementById('bookingConfirmModal');
    const confirmBtn   = document.getElementById('bookingConfirmBtn');
    confirmBtn.onclick = () => {
        confirmModal.style.display = 'none';
        dashSubmitNewAppointment();
    };
    confirmModal.style.display = 'flex';
}