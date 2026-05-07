let appointments = [];
let apptIdCounter = 1000;

const ALL_SERVICES = ['Check-up', 'Vaccination', 'Deworming', 'Grooming'];

let activeFilters = { search: '', date: '', status: '', services: [] };

// logout handlers
function triggerLogout() {
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmBtn     = document.getElementById('btnConfirmDelete');
    const modal          = document.getElementById('confirmModal');

    if (!confirmMessage || !confirmBtn || !modal) {
        if (confirm('Are you sure you want to logout?')) logoutNow();
        return;
    }

    confirmMessage.innerText         = 'Are you sure you want to log out of Pawfect Pal?';
    confirmBtn.innerText             = 'Logout';
    confirmBtn.style.backgroundColor = '#ff5e78';
    confirmBtn.onclick               = logoutNow;
    modal.style.display              = 'flex';
}

function logoutNow() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('ownerFName');
    localStorage.removeItem('ownerLName');
    localStorage.removeItem('role');
    window.location.href = '../../login/login.html';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// tracks unsaved state for both new/edit form AND view modal edits
let formDirty      = false;
let editMode       = false;
let editApptId     = null;
let viewEditDirty  = false;
let viewEditActive = false;

function onFormChange() { formDirty = true; }
function onViewEditChange() { viewEditDirty = true; }

function openNewAppointmentModal() {
    editMode   = false;
    editApptId = null;
    formDirty  = false;
    resetAppointmentForm();
    document.querySelector('#newAppointmentModal .modal-header h2').textContent = 'New Appointment';
    document.querySelector('#newAppointmentModal .save-appt-btn').textContent   = 'Save Appointment';
    document.getElementById('newAppointmentModal').style.display = 'flex';
}

function closeNewAppointmentModal() {
    if (formDirty) {
        document.getElementById('unsavedModal').style.display = 'flex';
    } else {
        document.getElementById('newAppointmentModal').style.display = 'none';
    }
}

function discardAndClose() {
    formDirty  = false;
    editMode   = false;
    editApptId = null;
    document.getElementById('unsavedModal').style.display        = 'none';
    document.getElementById('newAppointmentModal').style.display = 'none';
    resetAppointmentForm();
}

// close view modal — prompt if edits are in progress
function closeViewModal() {
    if (viewEditActive && viewEditDirty) {
        document.getElementById('unsavedViewModal').style.display = 'flex';
    } else {
        viewEditActive = false;
        viewEditDirty  = false;
        closeModal('viewAppointmentModal');
    }
}

function discardViewAndClose() {
    viewEditActive = false;
    viewEditDirty  = false;
    document.getElementById('unsavedViewModal').style.display    = 'none';
    document.getElementById('viewAppointmentModal').style.display = 'none';
}

// pops the delete confirm modal
function confirmDeleteAppointment(apptId) {
    const appt = appointments.find(a => a.apptId === apptId);
    if (!appt) return;
    document.getElementById('deleteApptIdLabel').textContent = apptId;
    document.getElementById('btnConfirmDeleteAppt').onclick = () => deleteAppointment(apptId);
    document.getElementById('deleteConfirmModal').style.display = 'flex';
}

function deleteAppointment(apptId) {
    appointments = appointments.filter(a => a.apptId !== apptId);
    closeModal('deleteConfirmModal');
    applyFilters();
    updateSummaryCards();
}

document.addEventListener('DOMContentLoaded', () => {
    const newApptModal = document.getElementById('newAppointmentModal');
    if (newApptModal) {
        newApptModal.addEventListener('click', e => {
            if (e.target === newApptModal) closeNewAppointmentModal();
        });
    }

    // close view modal via overlay click
    const viewModal = document.getElementById('viewAppointmentModal');
    if (viewModal) {
        viewModal.addEventListener('click', e => {
            if (e.target === viewModal) closeViewModal();
        });
    }

    buildTimeOptions();
    buildServiceDropdown('serviceDropdownBtn', 'serviceDropdownList', 'serviceDropdownDisplay', false);

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            activeFilters.search = searchInput.value.trim().toLowerCase();
            applyFilters();
        });
    }

    // hidden date input trick for the filter button
    const btnDate = document.getElementById('btnDateFilter');
    if (btnDate) {
        const datePicker = document.createElement('input');
        datePicker.type  = 'date';
        datePicker.style.cssText = 'position:absolute;opacity:0;width:1px;height:1px;top:0;left:0;pointer-events:none;';
        btnDate.style.position   = 'relative';
        btnDate.appendChild(datePicker);

        datePicker.addEventListener('change', () => {
            const val = datePicker.value;
            if (val) {
                const d = new Date(val + 'T00:00:00');
                activeFilters.date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                document.getElementById('dateFilterLabel').textContent = activeFilters.date;
            } else {
                activeFilters.date = '';
                document.getElementById('dateFilterLabel').textContent = 'Select Date';
            }
            applyFilters();
        });

        btnDate.addEventListener('click', e => {
            if (e.target !== datePicker) {
                try { datePicker.showPicker(); } catch(ex) { datePicker.click(); }
            }
        });
    }

    buildStatusDropdown();
    buildServiceFilterDropdown();

    // no past dates for new appts
    const dateInput = document.getElementById('apptDate');
    if (dateInput) {
        dateInput.min = new Date().toISOString().split('T')[0];
    }

    renderTable(appointments);
    updateSummaryCards();
});

// 7am–5pm in 30 min slots
function buildTimeOptions() {
    const sel = document.getElementById('apptTime');
    if (!sel) return;
    sel.innerHTML = '<option value="">Select Time</option>';
    for (let h = 7; h <= 17; h++) {
        [0, 30].forEach(m => {
            if (h === 17 && m === 30) return;
            const hh    = h % 12 === 0 ? 12 : h % 12;
            const mm    = m === 0 ? '00' : '30';
            const ampm  = h < 12 ? 'AM' : 'PM';
            const label = `${hh}:${mm} ${ampm}`;
            const val   = `${String(h).padStart(2,'0')}:${mm}`;
            const opt   = document.createElement('option');
            opt.value       = val;
            opt.textContent = label;
            sel.appendChild(opt);
        });
    }
}

// builds a dropdown-checkbox widget; isViewModal flag wires the dirty tracker
function buildServiceDropdown(btnId, listId, displayId, isViewModal) {
    const btn     = document.getElementById(btnId);
    const list    = document.getElementById(listId);
    const display = document.getElementById(displayId);
    if (!btn || !list || !display) return;

    list.innerHTML = '';
    ALL_SERVICES.forEach(s => {
        const item = document.createElement('label');
        item.className = 'svc-dd-item';
        item.innerHTML = `<input type="checkbox" value="${s}"><span>${s}</span>`;
        item.querySelector('input').addEventListener('change', () => {
            updateServiceDisplay(btnId, listId, displayId);
            if (isViewModal) onViewEditChange(); else onFormChange();
        });
        list.appendChild(item);
    });

    // toggle dropdown open/close
    btn.addEventListener('click', e => {
        e.stopPropagation();
        const isOpen = list.classList.contains('open');
        closeAllServiceDropdowns();
        if (!isOpen) list.classList.add('open');
    });

    document.addEventListener('click', () => list.classList.remove('open'));
    list.addEventListener('click', e => e.stopPropagation());

    updateServiceDisplay(btnId, listId, displayId);
}

// closes any open service dropdown lists on the page
function closeAllServiceDropdowns() {
    document.querySelectorAll('.svc-dd-list.open').forEach(l => l.classList.remove('open'));
}

// updates the button display text based on what's checked
function updateServiceDisplay(btnId, listId, displayId) {
    const checked = [...document.querySelectorAll(`#${listId} input:checked`)].map(cb => cb.value);
    const display = document.getElementById(displayId);
    if (!display) return;
    display.textContent = checked.length === 0 ? 'Select Services' : checked.join(', ');
}

// returns checked services from a given list
function getSelectedServicesFrom(listId) {
    return [...document.querySelectorAll(`#${listId} input[type=checkbox]:checked`)].map(cb => cb.value);
}

// ticks specific services in a given list
function setServicesIn(listId, servicesArr) {
    document.querySelectorAll(`#${listId} input[type=checkbox]`).forEach(cb => {
        cb.checked = servicesArr.includes(cb.value);
    });
}

// clears all checkboxes in a given list
function clearServicesIn(listId) {
    document.querySelectorAll(`#${listId} input[type=checkbox]`).forEach(cb => cb.checked = false);
}

function buildStatusDropdown() {
    const btn = document.getElementById('btnStatusFilter');
    if (!btn) return;

    const statuses = ['All Status', 'Pending', 'Checked-In', 'In-Progress', 'Completed'];
    const dd = document.createElement('div');
    dd.id = 'statusDropdown';
    dd.className = 'filter-dropdown';
    dd.style.display = 'none';

    statuses.forEach(s => {
        const item = document.createElement('div');
        item.className   = 'filter-dropdown-item';
        item.textContent = s;
        item.addEventListener('click', e => {
            e.stopPropagation();
            activeFilters.status = s === 'All Status' ? '' : s;
            document.getElementById('statusFilterLabel').textContent = s;
            dd.style.display = 'none';
            applyFilters();
        });
        dd.appendChild(item);
    });

    btn.style.position = 'relative';
    btn.appendChild(dd);

    btn.addEventListener('click', e => {
        if (e.target.closest('#statusDropdown')) return;
        dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', e => {
        if (!btn.contains(e.target)) dd.style.display = 'none';
    });
}

// service filter — multi-checkbox; ALL selected services must be present on the appointment
function buildServiceFilterDropdown() {
    const btn = document.getElementById('btnServiceFilter');
    const dd  = document.getElementById('serviceFilterDropdown');
    if (!btn || !dd) return;

    dd.innerHTML = '';
    dd.style.padding = '6px 0';

    // "All Services" clear option
    const clearItem = document.createElement('div');
    clearItem.className   = 'filter-dropdown-item svc-filter-clear';
    clearItem.textContent = 'All Services';
    clearItem.style.cssText = 'font-weight:700; border-bottom:1px solid #ede9fe; margin-bottom:4px; padding-bottom:8px;';
    clearItem.addEventListener('click', e => {
        e.stopPropagation();
        dd.querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked = false);
        activeFilters.services = [];
        document.getElementById('serviceFilterLabel').textContent = 'All Services';
        applyFilters();
    });
    dd.appendChild(clearItem);

    ALL_SERVICES.forEach(s => {
        const label = document.createElement('label');
        label.className = 'filter-dropdown-item';
        label.style.cssText = 'display:flex; align-items:center; gap:8px; cursor:pointer; user-select:none;';
        const cb = document.createElement('input');
        cb.type  = 'checkbox';
        cb.value = s;
        cb.style.cssText = 'accent-color:var(--primary-purple); width:15px; height:15px; cursor:pointer; flex-shrink:0;';
        cb.addEventListener('change', e => {
            e.stopPropagation();
            const checked = [...dd.querySelectorAll('input[type=checkbox]:checked')].map(i => i.value);
            activeFilters.services = checked;
            document.getElementById('serviceFilterLabel').textContent =
                checked.length === 0 ? 'All Services' :
                checked.length === 1 ? checked[0] :
                `${checked.length} Services`;
            applyFilters();
        });
        const span = document.createElement('span');
        span.textContent = s;
        label.appendChild(cb);
        label.appendChild(span);
        dd.appendChild(label);
    });

    btn.addEventListener('click', e => {
        e.stopPropagation();
        const isOpen = dd.style.display !== 'none';
        dd.style.display = isOpen ? 'none' : 'block';
    });

    dd.addEventListener('click', e => e.stopPropagation());
    document.addEventListener('click', () => dd.style.display = 'none');
}

function applyFilters() {
    let data = [...appointments];
    if (activeFilters.search) {
        data = data.filter(r =>
            r.ownerName.toLowerCase().includes(activeFilters.search) ||
            r.petName.toLowerCase().includes(activeFilters.search)
        );
    }
    if (activeFilters.date) data = data.filter(r => r.date === activeFilters.date);
    if (activeFilters.status) data = data.filter(r => r.status === activeFilters.status);
    if (activeFilters.services && activeFilters.services.length > 0) {
        data = data.filter(r => {
            const rowServices = r.services || r.serviceType.split(', ');
            return activeFilters.services.every(s => rowServices.includes(s));
        });
    }
    renderTable(data);
}


// repopulate pets when user changes — real data comes from backend
function onUserChange() {
    const userId = document.getElementById('apptUserId').value;
    const petSel = document.getElementById('apptPetId');
    petSel.innerHTML = '<option value="">Select Pet</option>';
    // TODO: fetch pets by userId from API
    onFormChange();
}

function resetAppointmentForm() {
    const userSel = document.getElementById('apptUserId');
    if (userSel) userSel.value = '';
    const dateEl = document.getElementById('apptDate');
    if (dateEl) dateEl.value = '';
    const timeEl = document.getElementById('apptTime');
    if (timeEl) timeEl.value = '';
    const notesEl = document.getElementById('apptNotes');
    if (notesEl) notesEl.value = '';
    const petSel = document.getElementById('apptPetId');
    if (petSel) petSel.innerHTML = '<option value="">Select Pet</option>';
    clearServicesIn('serviceDropdownList');
    updateServiceDisplay('serviceDropdownBtn', 'serviceDropdownList', 'serviceDropdownDisplay');
}

function submitNewAppointment() {
    const userId   = document.getElementById('apptUserId').value;
    const petId    = document.getElementById('apptPetId').value;
    const services = getSelectedServicesFrom('serviceDropdownList');
    const date     = document.getElementById('apptDate').value;
    const time     = document.getElementById('apptTime').value;
    const notes    = document.getElementById('apptNotes').value.trim();

    const missing = [];
    if (!userId)          missing.push('User ID');
    if (!petId)           missing.push('Pet ID');
    if (!services.length) missing.push('Service Type (pick at least one)');
    if (!date)            missing.push('Appointment Date');
    if (!time)            missing.push('Time');

    if (missing.length) { showFieldsAlert(missing); return; }

    if (!editMode) {
        const todayStr = new Date().toISOString().split('T')[0];
        if (date < todayStr) { showFieldsAlert(['Appointment Date cannot be in the past.']); return; }
    }

    const petSel      = document.getElementById('apptPetId');
    const petName     = petSel.options[petSel.selectedIndex].text.split('–')[1]?.trim() ?? petId;
    const userSel     = document.getElementById('apptUserId');
    const ownerName   = userSel.options[userSel.selectedIndex].text.split('–')[1]?.trim() ?? userId;
    const dateObj     = new Date(date + 'T' + time);
    const dateLabel   = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeLabel   = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const serviceType = services.join(', ');

    if (editMode && editApptId !== null) {
        const idx = appointments.findIndex(a => a.apptId === editApptId);
        if (idx !== -1) {
            appointments[idx] = { ...appointments[idx], userId, petId, ownerName, petName, services, serviceType, date: dateLabel, time: timeLabel, notes };
        }
        showSavedPopup(appointments.find(a => a.apptId === editApptId));
    } else {
        apptIdCounter++;
        const apptId  = 'APT-' + apptIdCounter;
        const newAppt = { apptId, userId, petId, ownerName, petName, services, serviceType, date: dateLabel, time: timeLabel, status: 'Pending', notes };
        appointments.unshift(newAppt);
        showSavedPopup(newAppt);
    }

    formDirty  = false;
    editMode   = false;
    editApptId = null;
    document.getElementById('newAppointmentModal').style.display = 'none';
    resetAppointmentForm();
    applyFilters();
    updateSummaryCards();
}

function showFieldsAlert(missing) {
    document.getElementById('alertTitle').textContent = 'Missing Details';
    document.getElementById('alertMessage').innerHTML =
        `Please fill in the following required fields:<br><br>` +
        missing.map(f => `• <strong>${f}</strong>`).join('<br>');
    document.getElementById('alertModal').style.display = 'flex';
}

function showSavedPopup(appt) {
    document.getElementById('savedApptId').textContent   = appt.apptId;
    document.getElementById('savedOwner').textContent    = appt.ownerName;
    document.getElementById('savedPet').textContent      = appt.petName;
    document.getElementById('savedService').textContent  = appt.serviceType;
    document.getElementById('savedDateTime').textContent = `${appt.date} at ${appt.time}`;
    document.getElementById('apptSavedModal').style.display = 'flex';
}

function viewAppointment(apptId) {
    const appt = appointments.find(a => a.apptId === apptId);
    if (!appt) return;

    if (appt.status === 'Completed') { showCompletedPopup(appt); return; }

    viewEditActive = false;
    viewEditDirty  = false;

    document.getElementById('viewApptId').textContent   = appt.apptId;
    document.getElementById('viewUserId').textContent   = appt.userId;
    document.getElementById('viewPetId').textContent    = appt.petId;
    document.getElementById('viewOwner').textContent    = appt.ownerName;
    document.getElementById('viewPet').textContent      = appt.petName;
    document.getElementById('viewDateTime').textContent = `${appt.date} at ${appt.time}`;
    document.getElementById('viewNotes').textContent    = appt.notes || '—';

    // render service area as badges (read-only)
    renderViewServices(appt.services || appt.serviceType.split(', '), false, apptId);

    const statusSel = document.getElementById('viewStatusSelect');
    statusSel.value               = appt.status;
    statusSel.dataset.apptId      = appt.apptId;
    statusSel.disabled            = true;
    statusSel.style.pointerEvents = 'none';
    statusSel.style.background    = '#f5f3ff';
    statusSel.style.cursor        = 'default';

    const editBtn = document.getElementById('viewEditBtn');
    editBtn.textContent = 'Edit Details';
    editBtn.style.background = '#ede9fe';
    editBtn.style.color = 'var(--primary-purple)';
    editBtn.onclick = () => enableViewEdit(apptId);

    document.getElementById('viewAppointmentModal').style.display = 'flex';
}

// shows service badges (read) OR dropdown checkbox widget (edit)
function renderViewServices(selectedServices, editable, apptId) {
    const container = document.getElementById('viewServiceContainer');
    if (!container) return;

    if (!editable) {
        container.innerHTML = selectedServices.map(s =>
            `<span class="service-badge ${getServiceClass(s)}">${s}</span>`
        ).join(' ');
    } else {
        // inject the dropdown widget for the view modal
        container.innerHTML = `
            <div class="svc-dd-wrapper">
                <button type="button" class="svc-dd-btn" id="viewSvcBtn">
                    <span id="viewSvcDisplay">${selectedServices.join(', ') || 'Select Services'}</span>
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
                </button>
                <div class="svc-dd-list" id="viewSvcList"></div>
            </div>
        `;
        buildServiceDropdown('viewSvcBtn', 'viewSvcList', 'viewSvcDisplay', true);
        setServicesIn('viewSvcList', selectedServices);
        updateServiceDisplay('viewSvcBtn', 'viewSvcList', 'viewSvcDisplay');
    }
}

// maps service name to badge class
function getServiceClass(service) {
    const map = { 'Check-up': 'service-checkup', 'Vaccination': 'service-vaccination', 'Deworming': 'service-deworming', 'Grooming': 'service-grooming' };
    return map[service] ?? '';
}

function enableViewEdit(apptId) {
    const appt = appointments.find(a => a.apptId === apptId);
    if (!appt) return;

    viewEditActive = true;
    viewEditDirty  = false;

    const statusSel = document.getElementById('viewStatusSelect');
    statusSel.disabled            = false;
    statusSel.style.pointerEvents = 'auto';
    statusSel.style.background    = 'white';
    statusSel.style.cursor        = 'pointer';
    statusSel.addEventListener('change', onViewEditChange, { once: false });

    // swap badges to editable dropdown
    renderViewServices(appt.services || appt.serviceType.split(', '), true, apptId);

    const editBtn = document.getElementById('viewEditBtn');
    editBtn.textContent = 'Save Changes';
    editBtn.style.background = 'var(--primary-purple)';
    editBtn.style.color = 'white';
    editBtn.onmouseover = () => editBtn.style.background = 'var(--primary-hover)';
    editBtn.onmouseout  = () => editBtn.style.background = 'var(--primary-purple)';
    editBtn.onclick = () => saveViewChanges(apptId);
}

// saves status + services from view modal, then locks back up
function saveViewChanges(apptId) {
    const statusSel       = document.getElementById('viewStatusSelect');
    const newStatus       = statusSel.value;
    const appt            = appointments.find(a => a.apptId === apptId);
    if (!appt) return;

    const checkedServices = getSelectedServicesFrom('viewSvcList');
    if (!checkedServices.length) { showFieldsAlert(['Service Type (pick at least one)']); return; }

    appt.status      = newStatus;
    appt.services    = checkedServices;
    appt.serviceType = checkedServices.join(', ');

    viewEditActive = false;
    viewEditDirty  = false;

    applyFilters();
    updateSummaryCards();

    if (newStatus === 'Completed') {
        closeModal('viewAppointmentModal');
        showCompletedPopup(appt);
        return;
    }

    // lock everything back to read mode
    statusSel.disabled            = true;
    statusSel.style.pointerEvents = 'none';
    statusSel.style.background    = '#f5f3ff';
    statusSel.style.cursor        = 'default';
    renderViewServices(appt.services, false, apptId);

    const editBtn = document.getElementById('viewEditBtn');
    editBtn.textContent = 'Edit Details';
    editBtn.style.background = '#ede9fe';
    editBtn.style.color = 'var(--primary-purple)';
    editBtn.onmouseover = () => editBtn.style.background = '#ddd6fe';
    editBtn.onmouseout  = () => editBtn.style.background = '#ede9fe';
    editBtn.onclick = () => enableViewEdit(apptId);
}

function onViewStatusChange() { /* handled in saveViewChanges */ }

function openEditMode(apptId) {
    const appt = appointments.find(a => a.apptId === apptId);
    if (!appt) return;

    editMode   = true;
    editApptId = apptId;
    formDirty  = false;

    document.querySelector('#newAppointmentModal .modal-header h2').textContent = 'Edit Appointment';
    document.querySelector('#newAppointmentModal .save-appt-btn').textContent   = 'Save Changes';

    const userSel = document.getElementById('apptUserId');
    if (userSel) userSel.value = appt.userId;

    const petSel = document.getElementById('apptPetId');
    petSel.innerHTML = '<option value="">Select Pet</option>';
    // TODO: repopulate pets from API for this user; for now restore the saved pet
    const opt = document.createElement('option');
    opt.value = appt.petId;
    opt.textContent = `${appt.petId} – ${appt.petName}`;
    petSel.appendChild(opt);
    petSel.value = appt.petId;

    // restore previously checked services
    setServicesIn('serviceDropdownList', appt.services || appt.serviceType.split(', '));
    updateServiceDisplay('serviceDropdownBtn', 'serviceDropdownList', 'serviceDropdownDisplay');

    const d  = new Date(appt.date + ' ' + appt.time);
    const yy = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2,'0');
    const dy = String(d.getDate()).padStart(2,'0');
    document.getElementById('apptDate').value = `${yy}-${mo}-${dy}`;

    const timeParts = appt.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (timeParts) {
        let h    = parseInt(timeParts[1]);
        const mn = timeParts[2];
        const ap = timeParts[3].toUpperCase();
        if (ap === 'PM' && h !== 12) h += 12;
        if (ap === 'AM' && h === 12) h = 0;
        document.getElementById('apptTime').value = `${String(h).padStart(2,'0')}:${mn}`;
    }

    document.getElementById('apptNotes').value = appt.notes || '';
    document.getElementById('newAppointmentModal').style.display = 'flex';
}

function showCompletedPopup(appt) {
    document.getElementById('completedApptId').textContent   = appt.apptId;
    document.getElementById('completedOwner').textContent    = appt.ownerName;
    document.getElementById('completedPet').textContent      = appt.petName;
    document.getElementById('completedService').textContent  = appt.serviceType;
    document.getElementById('completedDateTime').textContent = `${appt.date} at ${appt.time}`;
    document.getElementById('completedNotes').textContent    = appt.notes || '—';
    document.getElementById('completedModal').style.display  = 'flex';
}

function updateSummaryCards() {
    const today  = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const counts = document.querySelectorAll('.card-count');
    if (counts.length < 4) return;
    counts[0].textContent = appointments.length;
    counts[1].textContent = appointments.filter(a => a.status === 'Checked-In').length;
    counts[2].textContent = appointments.filter(a => a.status === 'In-Progress').length;
    counts[3].textContent = appointments.filter(a => a.status === 'Completed' && a.date === today).length;
}

const SERVICE_CLASSES = {
    'Check-up':    'service-checkup',
    'Vaccination': 'service-vaccination',
    'Deworming':   'service-deworming',
    'Grooming':    'service-grooming',
};

const STATUS_CLASSES = {
    'Checked-In':  'status-checkedin',
    'In-Progress': 'status-inprogress',
    'Completed':   'status-completed',
    'Pending':     'status-pending',
};

function renderTable(data) {
    const tbody = document.getElementById('appointmentTableBody');
    if (!tbody) return;

    if (data.length === 0) {
        const empty = appointments.length === 0
            ? `<tr><td colspan="7" style="text-align:center; padding:40px 20px;">
                   <img src="img-appointment/no-appointment.png" alt="No Appointments"
                        style="width:180px; height:auto; object-fit:contain; opacity:0.85; display:block; margin:0 auto 14px;">
                   <div style="color:var(--text-muted); font-size:15px; font-weight:600;">No appointments yet.</div>
               </td></tr>`
            : `<tr><td colspan="7" style="text-align:center; padding:40px 20px; color:var(--text-muted); font-size:14px; font-weight:600;">No appointments match your filters.</td></tr>`;
        tbody.innerHTML = empty;
        return;
    }

    tbody.innerHTML = data.map(row => {
        // multiple service badges side by side
        const serviceBadges = (row.services || row.serviceType.split(', ')).map(s =>
            `<span class="service-badge ${SERVICE_CLASSES[s] ?? ''}">${s}</span>`
        ).join(' ');

        return `
        <tr>
            <td>${row.apptId}</td>
            <td>${row.ownerName}</td>
            <td>${row.petName}</td>
            <td style="max-width:220px; white-space:normal;">${serviceBadges}</td>
            <td>
                <div class="datetime">
                    <span class="date">
                        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                        ${row.date}
                    </span>
                    <span class="time">
                        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                        ${row.time}
                    </span>
                </div>
            </td>
            <td><span class="status-badge ${STATUS_CLASSES[row.status] ?? ''}">${row.status}</span></td>
            <td style="white-space:nowrap;">
                <button class="action-eye" title="View" onclick="viewAppointment('${row.apptId}')">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
                <button class="action-eye" title="Delete" onclick="confirmDeleteAppointment('${row.apptId}')" style="background:#fff0f2; margin-left:6px;">
                    <svg width="16" height="16" fill="none" stroke="#ff5e78" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>
            </td>
        </tr>`;
    }).join('');
}

function initImageLoading() {}