'use strict';

// all the owner data lives here — gets populated when the page loads
let owners = [];
// tracks which owner row you clicked so the pets panel knows what to show
let selectedOwnerID = null;
// temp ID counter for new pets — replace this with the real DB auto-increment later
let nextPetID = 900;

// emoji map per species — only dog and cat for now, add more here if needed
const SPECIES_EMOJI = {
    dog: '🐶', cat: '🐱',
};

// returns the right emoji for the species, defaults to 🐾 if we don't have one
function speciesEmoji(sp) {
    return SPECIES_EMOJI[(sp || '').toLowerCase()] || '🐾';
}

// builds the owner's initials — used in the avatar strip on the pets panel
function initials(f, l) {
    return ((f || '').charAt(0) + (l || '').charAt(0)).toUpperCase() || '?';
}

// calculates the pet's age from birthdate into a nice readable string like "2 yrs 3 mos"
function calcAge(birthdateStr) {
    if (!birthdateStr) return null;
    const birth = new Date(birthdateStr);
    if (isNaN(birth)) return null;
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
        years--;
        months += 12;
    }
    if (months < 0) months += 12;
    if (years === 0) {
        return months <= 1 ? `${months} mo` : `${months} mos`;
    }
    if (months === 0) return years === 1 ? '1 yr' : `${years} yrs`;
    return `${years} yr${years !== 1 ? 's' : ''} ${months} mo${months !== 1 ? 's' : ''}`;
}

// formats a date string to something readable like "May 7, 2026" (PH locale)
function fmtDate(d) {
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

// sanitizes user input before injecting into HTML — prevents XSS, don't remove this
function escHtml(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
}

// draws the owners table — pass a filtered list if searching, or the full owners array
function renderTable(list) {
    const tbody = document.getElementById('ownerTableBody');
    const empty = document.getElementById('tableEmpty');
    tbody.innerHTML = '';

    // only show the empty state if there are literally no owners at all, not just a search with no results
    if (owners.length === 0) {
        empty.style.display = 'flex';
        return;
    }
    empty.style.display = 'none';

    list.forEach(owner => {
        const tr = document.createElement('tr');
        // highlight this row if it's the currently selected owner
        if (owner.UserID === selectedOwnerID) tr.classList.add('selected');

        tr.innerHTML = `
            <td class="uid-col">#${owner.UserID}</td>
            <td>
                <div class="owner-cell">
                    <div>
                        <span class="owner-name-text">${escHtml(owner.OwnerFName)} ${escHtml(owner.OwnerLName)}</span>
                        <span class="uid-badge">${escHtml(owner.Email)}</span>
                    </div>
                </div>
            </td>
            <td>@${escHtml(owner.UserName)}</td>
            <td>${escHtml(owner.ContactNum)}</td>
            <td>
                <div class="action-btns">
                    <button class="icon-btn btn-pets" title="View Pets" onclick="selectOwner(${owner.UserID})">
                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
                        </svg>
                    </button>
                    <button class="icon-btn btn-edit" title="Edit Owner" onclick="openEditOwner(${owner.UserID})">
                        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="icon-btn btn-del" title="Delete Owner" onclick="confirmDeleteOwner(${owner.UserID})">
                        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
                            <path d="M9 6V4h6v2"/>
                        </svg>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// runs whenever the search box or sort dropdown changes — filters and re-renders the table
function applyFilters() {
    const q = (document.getElementById('searchInput').value || '').trim().toLowerCase();
    const sort = document.getElementById('sortSelect').value;

    // searches across name, username, contact number, and email all at once
    let list = owners.filter(o => {
        if (!q) return true;
        const full = `${o.OwnerFName} ${o.OwnerLName} ${o.UserName} ${o.ContactNum} ${o.Email}`.toLowerCase();
        return full.includes(q);
    });

    if (sort === 'name-asc')  list.sort((a, b) => `${a.OwnerFName}${a.OwnerLName}`.localeCompare(`${b.OwnerFName}${b.OwnerLName}`));
    if (sort === 'name-desc') list.sort((a, b) => `${b.OwnerFName}${b.OwnerLName}`.localeCompare(`${a.OwnerFName}${a.OwnerLName}`));
    if (sort === 'uid-asc')   list.sort((a, b) => a.UserID - b.UserID);
    if (sort === 'uid-desc')  list.sort((a, b) => b.UserID - a.UserID);

    renderTable(list);
}

document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('sortSelect').addEventListener('change', applyFilters);

// called when you click the pets icon on an owner row — opens the right panel and loads their pets
function selectOwner(userId) {
    selectedOwnerID = userId;
    const owner = owners.find(o => o.UserID === userId);
    if (!owner) return;

    // clear all selected rows first, then re-highlight the clicked one
    document.querySelectorAll('#ownerTableBody tr').forEach(r => r.classList.remove('selected'));
    const rows = document.querySelectorAll('#ownerTableBody tr');
    rows.forEach(r => {
        const btn = r.querySelector('.btn-pets');
        if (btn && btn.getAttribute('onclick') === `selectOwner(${userId})`) r.classList.add('selected');
    });

    // activates the split layout so both panels show side by side
    document.getElementById('splitLayout').classList.add('split-active');
    const panelPets = document.getElementById('panelPets');
    panelPets.classList.add('has-owner');
    document.getElementById('petsEmptyState').style.display = 'none';

    const content = document.getElementById('petsContent');
    content.style.display = 'flex';

    // fill the owner info strip at the top of the pets panel
    document.getElementById('ownerFocusAvatar').textContent = initials(owner.OwnerFName, owner.OwnerLName);
    document.getElementById('ownerFocusName').textContent = `${owner.OwnerFName} ${owner.OwnerLName}`;
    document.getElementById('ownerFocusMeta').textContent = `@${owner.UserName} · ${owner.ContactNum}`;
    document.getElementById('ownerFocusBadge').textContent = `${owner.pets.length} pet${owner.pets.length !== 1 ? 's' : ''}`;

    renderPets(owner);
    // reset pet filters whenever you switch to a different owner
    document.getElementById('petSearchInput').value = '';
    document.getElementById('petSpeciesFilter').value = '';
    document.getElementById('petGenderFilter').value = '';
}

// closes the right pets panel and deselects everything
function closePetsPanel() {
    selectedOwnerID = null;
    document.getElementById('splitLayout').classList.remove('split-active');
    document.getElementById('panelPets').classList.remove('has-owner');
    document.getElementById('petsEmptyState').style.display = '';
    document.getElementById('petsContent').style.display = 'none';
    document.querySelectorAll('#ownerTableBody tr').forEach(r => r.classList.remove('selected'));
}

// renders the pet cards in the right panel, respecting whatever search/filter is active
function renderPets(owner) {
    const query   = (document.getElementById('petSearchInput').value || '').toLowerCase();
    const species = document.getElementById('petSpeciesFilter').value;
    const gender  = document.getElementById('petGenderFilter').value;

    let pets = owner.pets.filter(p => {
        if (species && p.Species !== species) return false;
        if (gender  && p.Gender  !== gender)  return false;
        if (query && !`${p.Name} ${p.Breed} ${p.Species}`.toLowerCase().includes(query)) return false;
        return true;
    });

    const grid = document.getElementById('petsGrid');
    grid.innerHTML = '';

    if (pets.length === 0) {
        grid.innerHTML = `<div class="no-pets"><div class="no-pets-icon">🐾</div><p>No pets found.</p></div>`;
        return;
    }

    pets.forEach(pet => {
        const age = calcAge(pet.Birthdate);
        const avatarInner = pet.photo
            ? `<img src="${pet.photo}" alt="${escHtml(pet.Name)}">`
            : speciesEmoji(pet.Species);

        const card = document.createElement('div');
        card.className = 'pet-card';
        card.onclick = () => openPetDetail(pet, owner);
        card.innerHTML = `
            <div class="pet-avatar">${avatarInner}</div>
            <div class="pet-info">
                <h4>${escHtml(pet.Name)}</h4>
                <span class="pet-meta">${escHtml(pet.Species)} · ${escHtml(pet.Gender)}</span>
                <span class="pet-breed">${escHtml(pet.Breed)}</span>
                ${age ? `<span class="pet-age-tag">${age}</span>` : ''}
            </div>
        `;
        grid.appendChild(card);
    });
}

document.getElementById('petSearchInput').addEventListener('input', () => {
    if (selectedOwnerID === null) return;
    renderPets(owners.find(o => o.UserID === selectedOwnerID));
});
document.getElementById('petSpeciesFilter').addEventListener('change', () => {
    if (selectedOwnerID === null) return;
    renderPets(owners.find(o => o.UserID === selectedOwnerID));
});
document.getElementById('petGenderFilter').addEventListener('change', () => {
    if (selectedOwnerID === null) return;
    renderPets(owners.find(o => o.UserID === selectedOwnerID));
});

// keeps track of which pet's detail modal is currently open
let currentPet = null;
let currentPetOwner = null;

// opens the pet detail modal — shows health records, weight, last visit, etc.
function openPetDetail(pet, owner) {
    currentPet = pet;
    currentPetOwner = owner;

    const avatarInner = pet.photo
        ? `<img src="${pet.photo}" alt="${escHtml(pet.Name)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
        : speciesEmoji(pet.Species);

    const age = calcAge(pet.Birthdate);
    const hasPhoto = !!pet.photo;
    const records = pet.healthRecords || [];

    // grabs the most recent weight from health records
    const latestWeight = (() => {
        const r = [...records].reverse().find(r => r.Weight);
        return r ? `${r.Weight} kg` : '—';
    })();

    // grabs the most recent visit date — falls back to pet.LastVisit if no records
    const latestVisit = (() => {
        const r = [...records].reverse().find(r => r.DateRecorded);
        return r ? fmtDate(r.DateRecorded) : (pet.LastVisit ? fmtDate(pet.LastVisit) : '—');
    })();

    function statusBadge(status) {
        const s = (status || '').toUpperCase();
        if (s === 'COMPLETED')   return `<span style="background:#e6f9f0;color:#22a06b;padding:4px 14px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:.04em;">COMPLETED</span>`;
        if (s === 'IN PROGRESS') return `<span style="background:#fff7e6;color:#d48806;padding:4px 14px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:.04em;">IN PROGRESS</span>`;
        if (s === 'CANCELLED')   return `<span style="background:#fff0f0;color:#ff5e78;padding:4px 14px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:.04em;">CANCELLED</span>`;
        return `<span style="background:#f5f0ff;color:var(--primary-purple);padding:4px 14px;border-radius:20px;font-size:11px;font-weight:700;">${escHtml(status) || '—'}</span>`;
    }

    const rowsHtml = records.length === 0
        ? `<tr><td colspan="6" style="text-align:center;padding:32px;color:#ccc;font-size:13px;">No health records yet.</td></tr>`
        : records.map(r => {
            const weightCell = r.Weight ? `${r.Weight} kg` : '—';
            const dateCell = fmtDate(r.DateRecorded);
            const svcKey = r.serviceKey || (r.RecordType || '').toLowerCase().replace(/[^a-z]/g,'');
            const svcLabel = r.RecordType || r.Details || '—';
            const serviceCell = escHtml(svcLabel);
            return `
            <tr style="border-bottom:1px solid #f8f5ff;">
                <td style="padding:13px 16px;color:var(--text-dark);font-size:13px;white-space:nowrap;">
                    <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--primary-purple);margin-right:7px;vertical-align:middle;opacity:.5;"></span>
                    ${dateCell}
                </td>
                <td style="padding:13px 16px;color:var(--text-dark);font-size:13px;">${serviceCell}</td>
                <td style="padding:13px 16px;color:var(--text-dark);font-size:13px;">${weightCell}</td>
                <td style="padding:13px 16px;color:var(--text-dark);font-size:13px;">${escHtml(r.VaccinationStatus) || '—'}</td>
                <td style="padding:13px 16px;color:var(--text-dark);font-size:13px;">${escHtml(r.Allergies) || '—'}</td>
                <td style="padding:13px 16px;color:var(--text-dark);font-size:13px;">${escHtml(r.Notes) || '—'}</td>
                <td style="padding:13px 16px;text-align:center;">
                    <button onclick="deleteHealthRecord(${r.RecordID})" title="Delete record" style="background:none;border:none;cursor:pointer;padding:4px 8px;border-radius:8px;transition:background .15s;" onmouseover="this.style.background='#fff0f0'" onmouseout="this.style.background='none'">
                        <svg width="15" height="15" fill="none" stroke="#ff5e78" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                </td>
            </tr>`;}).join('');

    document.getElementById('petDetailBody').innerHTML = `
        <div style="display:flex;align-items:center;gap:20px;margin-bottom:28px;padding-top:4px;">
            <div style="flex:1;">
                <div style="font-size:26px;font-weight:700;color:var(--primary-purple);margin-bottom:4px;">${escHtml(pet.Name)}</div>
                <div style="font-size:14px;color:var(--text-muted);">${escHtml(pet.Breed)} · ${escHtml(pet.Gender)} · ${age || '—'}</div>
            </div>
            <div style="display:flex;gap:12px;flex-shrink:0;">
                <div style="background:#faf7ff;border-radius:14px;padding:12px 20px;display:flex;align-items:center;gap:10px;">
                    <img src="img-health/weight.png" alt="Weight" style="width:28px;height:28px;object-fit:contain;" onerror="this.style.display='none';this.nextElementSibling.style.display='inline';">
                    <span style="font-size:22px;display:none;">⚖️</span>
                    <div>
                        <div style="font-size:11px;color:var(--text-muted);font-weight:700;">Current Weight</div>
                        <div style="font-size:18px;font-weight:700;color:var(--text-dark);">${latestWeight}</div>
                    </div>
                </div>
                <div style="background:#faf7ff;border-radius:14px;padding:12px 20px;display:flex;align-items:center;gap:10px;">
                    <img src="img-health/date.png" alt="Date" style="width:28px;height:28px;object-fit:contain;" onerror="this.style.display='none';this.nextElementSibling.style.display='inline';">
                    <span style="font-size:22px;display:none;">📅</span>
                    <div>
                        <div style="font-size:11px;color:var(--text-muted);font-weight:700;">Last Visit</div>
                        <div style="font-size:18px;font-weight:700;color:var(--text-dark);">${latestVisit}</div>
                    </div>
                </div>
            </div>
        </div>
        <div style="overflow-x:auto;border-radius:14px;border:1px solid #f0eaff;">
            <table style="width:100%;border-collapse:collapse;font-size:13px;min-width:700px;">
                <thead>
                    <tr style="background:#faf7ff;">
                        <th style="padding:12px 16px;text-align:left;color:var(--primary-purple);font-weight:700;font-size:12px;border-bottom:1.5px solid #f0eaff;white-space:nowrap;">Date Recorded</th>
                        <th style="padding:12px 16px;text-align:left;color:var(--primary-purple);font-weight:700;font-size:12px;border-bottom:1.5px solid #f0eaff;white-space:nowrap;">Service Type</th>
                        <th style="padding:12px 16px;text-align:left;color:var(--primary-purple);font-weight:700;font-size:12px;border-bottom:1.5px solid #f0eaff;white-space:nowrap;">Weight</th>
                        <th style="padding:12px 16px;text-align:left;color:var(--primary-purple);font-weight:700;font-size:12px;border-bottom:1.5px solid #f0eaff;white-space:nowrap;">Vaccination Status</th>
                        <th style="padding:12px 16px;text-align:left;color:var(--primary-purple);font-weight:700;font-size:12px;border-bottom:1.5px solid #f0eaff;white-space:nowrap;">Allergies</th>
                        <th style="padding:12px 16px;text-align:left;color:var(--primary-purple);font-weight:700;font-size:12px;border-bottom:1.5px solid #f0eaff;white-space:nowrap;">Notes</th>
                        <th style="padding:12px 16px;text-align:center;color:var(--primary-purple);font-weight:700;font-size:12px;border-bottom:1.5px solid #f0eaff;white-space:nowrap;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        </div>
    `;

    document.getElementById('petDetailModal').style.display = 'flex';
}

// deletes a specific health record and updates LastVisit to the next most recent one
function deleteHealthRecord(recordId) {
    if (!currentPet || !currentPetOwner) return;

    document.getElementById('confirmTitle').textContent = 'Delete Health Record';
    document.getElementById('confirmMessage').textContent = 'Remove this health record? This cannot be undone.';

    const btn = document.getElementById('btnConfirmAction');
    btn.textContent = 'Delete Record';
    btn.style.background = '#ff5e78';
    btn.onclick = () => {
        currentPet.healthRecords = (currentPet.healthRecords || []).filter(r => r.RecordID !== recordId);

        // recalculate LastVisit from whatever records are still left
        const remaining = (currentPet.healthRecords || []).filter(r => r.DateRecorded);
        if (remaining.length > 0) {
            currentPet.LastVisit = remaining.reduce((latest, r) =>
                r.DateRecorded > latest ? r.DateRecorded : latest, remaining[0].DateRecorded);
        }
        closeModal('confirmModal');
        // refresh both the detail view and the pet cards grid
        openPetDetail(currentPet, currentPetOwner);
        renderPets(currentPetOwner);
    };
    document.getElementById('confirmModal').style.display = 'flex';
}

// stores the original form state so we can detect unsaved changes
let petFormOriginal = null;
// 'add' or 'edit' — submitPetForm checks this to know what action to take
let petFormMode = null;
let petFormOwner = null;
let petFormPetRef = null;

// shows or hides the free-text species field when "Other" is selected from the dropdown
function toggleOtherSpecies(val) {
    const otherInput = document.getElementById('fPetSpeciesOther');
    otherInput.style.display = val === 'Other' ? 'block' : 'none';
    if (val !== 'Other') otherInput.value = '';
}

function openAddPet() {
    if (selectedOwnerID === null) return;
    petFormOwner = owners.find(o => o.UserID === selectedOwnerID);
    petFormMode  = 'add';
    petFormPetRef = null;

    document.getElementById('petFormTitle').textContent = 'Add Pet';
    clearPetForm();

    document.getElementById('fPetOwnerDisplay').value = `${petFormOwner.OwnerFName} ${petFormOwner.OwnerLName}`;
    petFormOriginal = getPetFormSnapshot();

    document.getElementById('petFormModal').style.display = 'flex';
}

function openEditPet(pet, owner) {
    petFormOwner = owner;
    petFormMode  = 'edit';
    petFormPetRef = pet;

    document.getElementById('petFormTitle').textContent = 'Pet Information';

    document.getElementById('fPetId').value           = pet.PetID;
    document.getElementById('fPetName').value         = pet.Name || '';
    document.getElementById('fPetOwnerDisplay').value = `${owner.OwnerFName} ${owner.OwnerLName}`;
    document.getElementById('fPetBirthdate').value    = pet.Birthdate || '';
    document.getElementById('fPetAge').value          = calcAge(pet.Birthdate) || '';
    document.getElementById('fPetGender').value       = pet.Gender || '';
    document.getElementById('fPetBreed').value        = pet.Breed || '';
    document.getElementById('fPetColor').value        = pet.Color || '';
    document.getElementById('fPetLastVisit').value    = pet.LastVisit || '';

    // if the species isn't dog or cat, treat it as "Other" and show the text input
    const knownSpecies = ['Dog', 'Cat'];
    if (knownSpecies.includes(pet.Species)) {
        document.getElementById('fPetSpecies').value      = pet.Species;
        document.getElementById('fPetSpeciesOther').style.display = 'none';
        document.getElementById('fPetSpeciesOther').value = '';
    } else {
        document.getElementById('fPetSpecies').value      = 'Other';
        document.getElementById('fPetSpeciesOther').style.display = 'block';
        document.getElementById('fPetSpeciesOther').value = pet.Species || '';
    }

    // reset zoom/pan state before showing the photo
    pfResetZoomPan();

    // show the pet's photo if they have one, otherwise fallback to the species emoji
    if (pet.photo) {
        document.getElementById('petPhotoImg').src = pet.photo;
        document.getElementById('petPhotoImg').style.display = 'block';
        document.getElementById('petPhotoEmoji').style.display = 'none';
    } else {
        document.getElementById('petPhotoImg').style.display = 'none';
        document.getElementById('petPhotoEmoji').style.display = 'block';
        document.getElementById('petPhotoEmoji').textContent = speciesEmoji(pet.Species);
    }

    petFormOriginal = getPetFormSnapshot();
    document.getElementById('petFormModal').style.display = 'flex';
}

function clearPetForm() {
    ['fPetId','fPetName','fPetBirthdate','fPetAge','fPetBreed','fPetColor','fPetLastVisit','fPetOwnerDisplay','fPetSpeciesOther'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('fPetSpecies').value = '';
    document.getElementById('fPetGender').value  = '';
    document.getElementById('fPetPhoto').value   = '';
    document.getElementById('fPetSpeciesOther').style.display = 'none';
    document.getElementById('petPhotoImg').style.display = 'none';
    document.getElementById('petPhotoImg').src = '';
    document.getElementById('petPhotoEmoji').style.display = 'block';
    document.getElementById('petPhotoEmoji').textContent = '🐾';
    pfResetZoomPan();
}

// takes a snapshot of the current pet form values — used to detect unsaved changes
function getPetFormSnapshot() {
    return JSON.stringify({
        name:         document.getElementById('fPetName').value,
        birthdate:    document.getElementById('fPetBirthdate').value,
        species:      document.getElementById('fPetSpecies').value,
        speciesOther: document.getElementById('fPetSpeciesOther').value,
        breed:        document.getElementById('fPetBreed').value,
        color:        document.getElementById('fPetColor').value,
        gender:       document.getElementById('fPetGender').value,
        lastVisit:    document.getElementById('fPetLastVisit').value,
    });
}

function hasPetFormChanged() {
    return getPetFormSnapshot() !== petFormOriginal;
}

// if there are unsaved changes, show the "are you sure?" modal before closing
function closePetFormModal() {
    if (hasPetFormChanged()) {
        showUnsavedModal(() => {
            closeModal('petFormModal');
        });
    } else {
        closeModal('petFormModal');
    }
}

// auto-calculates age and updates the emoji preview when birthdate changes
document.getElementById('fPetBirthdate').addEventListener('change', function () {
    document.getElementById('fPetAge').value = calcAge(this.value) || '';
    // update emoji too if no photo is uploaded yet
    const sp = document.getElementById('fPetSpecies').value;
    if (!document.getElementById('petPhotoImg').src || document.getElementById('petPhotoImg').style.display === 'none') {
        document.getElementById('petPhotoEmoji').textContent = sp ? speciesEmoji(sp) : '🐾';
    }
});

// updates the emoji in the avatar preview when species is changed (only if no photo)
document.getElementById('fPetSpecies').addEventListener('change', function () {
    if (document.getElementById('petPhotoImg').style.display === 'none') {
        document.getElementById('petPhotoEmoji').textContent = speciesEmoji(this.value);
    }
});

// reads the uploaded photo and shows it in the avatar preview area
function previewPetPhoto(input) {
    if (!input.files || !input.files[0]) return;
    const reader = new FileReader();
    reader.onload = e => {
        const img = document.getElementById('petPhotoImg');
        img.src = e.target.result;
        img.style.display = 'block';
        document.getElementById('petPhotoEmoji').style.display = 'none';
        pfResetZoomPan();
    };
    reader.readAsDataURL(input.files[0]);
}

// zoom and pan state for the pet photo editor in the form
let pfZoom = 1, pfOx = 0, pfOy = 0;
let pfDragging = false, pfDragSX = 0, pfDragSY = 0, pfDragSOx = 0, pfDragSOy = 0;

// applies the current zoom and position values to the photo element
function pfApply() {
    const img = document.getElementById('petPhotoImg');
    img.style.transformOrigin = 'center center';
    img.style.transform = `translate(${pfOx}px,${pfOy}px) scale(${pfZoom})`;
}

function pfResetZoomPan() {
    pfZoom = 1; pfOx = 0; pfOy = 0;
    const slider = document.getElementById('pfZoomSlider');
    if (slider) slider.value = 100;
    pfApply();
}

function pfZoomChange(val) {
    pfZoom = val / 100;
    pfApply();
}

function pfUndoAdjustments() {
    pfResetZoomPan();
}

function pfDragStart(e) {
    const img = document.getElementById('petPhotoImg');
    if (img.style.display === 'none') return;
    pfDragging = true;
    pfDragSX = e.clientX; pfDragSY = e.clientY;
    pfDragSOx = pfOx; pfDragSOy = pfOy;
    e.preventDefault();
}
function pfTouchStart(e) {
    const img = document.getElementById('petPhotoImg');
    if (img.style.display === 'none' || e.touches.length !== 1) return;
    pfDragging = true;
    pfDragSX = e.touches[0].clientX; pfDragSY = e.touches[0].clientY;
    pfDragSOx = pfOx; pfDragSOy = pfOy;
    e.preventDefault();
}
document.addEventListener('mousemove', e => {
    if (!pfDragging) return;
    pfOx = pfDragSOx + (e.clientX - pfDragSX);
    pfOy = pfDragSOy + (e.clientY - pfDragSY);
    pfApply();
});
document.addEventListener('mouseup',  () => { pfDragging = false; });
document.addEventListener('touchmove', e => {
    if (!pfDragging || e.touches.length !== 1) return;
    pfOx = pfDragSOx + (e.touches[0].clientX - pfDragSX);
    pfOy = pfDragSOy + (e.touches[0].clientY - pfDragSY);
    pfApply();
    e.preventDefault();
}, { passive: false });
document.addEventListener('touchend', () => { pfDragging = false; });

// handles both add and edit — checks petFormMode to know which one to do
function submitPetForm() {
    const name      = document.getElementById('fPetName').value.trim();
    const birthdate = document.getElementById('fPetBirthdate').value;
    const breed     = document.getElementById('fPetBreed').value.trim();
    const color     = document.getElementById('fPetColor').value.trim();
    const gender    = document.getElementById('fPetGender').value;
    const lastVisit = document.getElementById('fPetLastVisit').value;
    const photoImg  = document.getElementById('petPhotoImg');
    const photo     = photoImg.style.display !== 'none' ? photoImg.src : null;

    // if "Other" was picked, use the typed-in value instead
    const speciesRaw = document.getElementById('fPetSpecies').value;
    const speciesOther = document.getElementById('fPetSpeciesOther').value.trim();
    const species = speciesRaw === 'Other' ? (speciesOther || 'Other') : speciesRaw;

    if (!name || !birthdate || !speciesRaw || !breed || !gender) {
        alert('Please fill in all required fields (Name, Birthday, Species, Breed, Gender).');
        return;
    }
    // extra check: make sure they actually typed something if "Other" is selected
    if (speciesRaw === 'Other' && !speciesOther) {
        alert('Please specify the species.');
        return;
    }

    if (petFormMode === 'add') {
        const newPet = {
            PetID: ++nextPetID,
            Name: name, Species: species, Breed: breed,
            Color: color, Gender: gender,
            Birthdate: birthdate, LastVisit: lastVisit || null, photo
        };
        petFormOwner.pets.push(newPet);
    } else {
        // edit mode — just patch the existing pet object in-place
        Object.assign(petFormPetRef, {
            Name: name, Species: species, Breed: breed,
            Color: color, Gender: gender,
            Birthdate: birthdate, LastVisit: lastVisit || null, photo
        });
    }

    // mark clean so the unsaved modal doesn't pop when we close
    petFormOriginal = getPetFormSnapshot();
    closeModal('petFormModal');

    const owner = owners.find(o => o.UserID === selectedOwnerID);
    if (owner) {
        document.getElementById('ownerFocusBadge').textContent = `${owner.pets.length} pet${owner.pets.length !== 1 ? 's' : ''}`;
        renderPets(owner);
    }
    applyFilters();
}

function confirmDeletePet(pet, owner) {
    document.getElementById('confirmTitle').textContent = 'Delete Pet';
    document.getElementById('confirmMessage').textContent = `Remove ${pet.Name} from ${owner.OwnerFName}'s pets? This cannot be undone.`;

    const btn = document.getElementById('btnConfirmAction');
    btn.textContent = 'Delete Pet';
    btn.style.background = '#ff5e78';
    btn.onclick = () => {
        owner.pets = owner.pets.filter(p => p.PetID !== pet.PetID);
        closeModal('confirmModal');
        const o = owners.find(x => x.UserID === selectedOwnerID);
        if (o) {
            document.getElementById('ownerFocusBadge').textContent = `${o.pets.length} pet${o.pets.length !== 1 ? 's' : ''}`;
            renderPets(o);
        }
        applyFilters();
    };
    document.getElementById('confirmModal').style.display = 'flex';
}

// snapshot for detecting unsaved changes on the owner form
let ownerFormOriginal = null;

// opens the add owner modal with a blank form
function openAddOwner() {
    document.getElementById('ownerFormTitle').textContent = 'Add New Owner';
    ['fUserId','fOwnerFName','fOwnerLName','fUserName','fContactNum','fEmail','fAddress'].forEach(id => {
        document.getElementById(id).value = '';
    });
    ownerFormOriginal = getOwnerFormSnapshot();
    document.getElementById('ownerFormModal').style.display = 'flex';
}

// opens the edit owner modal pre-filled with the selected owner's current data
function openEditOwner(userId) {
    const owner = owners.find(o => o.UserID === userId);
    if (!owner) return;

    document.getElementById('ownerFormTitle').textContent = 'Edit Owner';
    document.getElementById('fUserId').value      = owner.UserID;
    document.getElementById('fOwnerFName').value  = owner.OwnerFName;
    document.getElementById('fOwnerLName').value  = owner.OwnerLName;
    document.getElementById('fUserName').value    = owner.UserName;
    document.getElementById('fContactNum').value  = owner.ContactNum;
    document.getElementById('fEmail').value       = owner.Email;
    document.getElementById('fAddress').value     = owner.Address;

    ownerFormOriginal = getOwnerFormSnapshot();
    document.getElementById('ownerFormModal').style.display = 'flex';
}

// takes a snapshot of the owner form — same pattern as pet form, used to catch unsaved changes
function getOwnerFormSnapshot() {
    return JSON.stringify({
        fName:   document.getElementById('fOwnerFName').value,
        lName:   document.getElementById('fOwnerLName').value,
        uname:   document.getElementById('fUserName').value,
        phone:   document.getElementById('fContactNum').value,
        email:   document.getElementById('fEmail').value,
        address: document.getElementById('fAddress').value,
    });
}

function hasOwnerFormChanged() {
    return getOwnerFormSnapshot() !== ownerFormOriginal;
}

function closeOwnerFormModal() {
    if (hasOwnerFormChanged()) {
        showUnsavedModal(() => closeModal('ownerFormModal'));
    } else {
        closeModal('ownerFormModal');
    }
}

function submitOwnerForm() {
    const uid   = document.getElementById('fUserId').value;
    const fName = document.getElementById('fOwnerFName').value.trim();
    const lName = document.getElementById('fOwnerLName').value.trim();
    const uname = document.getElementById('fUserName').value.trim();
    const phone = document.getElementById('fContactNum').value.trim();
    const email = document.getElementById('fEmail').value.trim();
    const addr  = document.getElementById('fAddress').value.trim();

    if (!fName || !lName || !uname || !phone || !email || !addr) {
        alert('Please fill in all fields.');
        return;
    }

    // if uid exists, it's an edit — otherwise it's a new owner being added
    if (uid) {
        const owner = owners.find(o => o.UserID === parseInt(uid));
        if (owner) {
            owner.OwnerFName = fName; owner.OwnerLName = lName;
            owner.UserName   = uname; owner.ContactNum = phone;
            owner.Email      = email; owner.Address    = addr;
        }
        if (selectedOwnerID === parseInt(uid)) selectOwner(parseInt(uid));
    } else {
        const newId = owners.length ? Math.max(...owners.map(o => o.UserID)) + 1 : 1;
        owners.push({ UserID: newId, UserName: uname, OwnerFName: fName, OwnerLName: lName,
            ContactNum: phone, Address: addr, Email: email, pets: [] });
    }

    ownerFormOriginal = getOwnerFormSnapshot();
    closeModal('ownerFormModal');
    applyFilters();
}

function confirmDeleteOwner(userId) {
    const owner = owners.find(o => o.UserID === userId);
    if (!owner) return;

    document.getElementById('confirmTitle').textContent = 'Delete Owner';
    document.getElementById('confirmMessage').textContent =
        `Remove ${owner.OwnerFName} ${owner.OwnerLName} and all their ${owner.pets.length} pet(s)? This cannot be undone.`;

    const btn = document.getElementById('btnConfirmAction');
    btn.textContent = 'Delete Owner';
    btn.style.background = '#ff5e78';
    btn.onclick = () => {
        owners = owners.filter(o => o.UserID !== userId);
        if (selectedOwnerID === userId) closePetsPanel();
        closeModal('confirmModal');
        applyFilters();
    };
    document.getElementById('confirmModal').style.display = 'flex';
}

// stores the callback to run if the user confirms discarding their unsaved changes
let unsavedCallback = null;

// shows the "you have unsaved changes" modal — pass in what to do if they choose to discard
function showUnsavedModal(onDiscard) {
    unsavedCallback = onDiscard;
    document.getElementById('unsavedModal').style.display = 'flex';
}

document.getElementById('btnDiscardChanges').addEventListener('click', () => {
    closeModal('unsavedModal');
    if (unsavedCallback) {
        unsavedCallback();
        unsavedCallback = null;
    }
});

// shows the logout confirmation modal before actually logging out
function triggerLogout() {
    document.getElementById('confirmTitle').textContent = 'Confirm Log Out';
    document.getElementById('confirmMessage').textContent = 'Are you sure you want to log out of Pawfect Pal?';

    const btn = document.getElementById('btnConfirmAction');
    btn.textContent = 'Log Out';
    btn.style.background = '#ff5e78';
    btn.onclick = logoutNow;

    document.getElementById('confirmModal').style.display = 'flex';
}

// clears all stored session data and redirects to login
function logoutNow() {
    ['userId', 'userName', 'ownerFName', 'ownerLName', 'role'].forEach(k => localStorage.removeItem(k));
    window.location.href = '../../login/login.html';
}

// generic modal closer — just pass the ID of whatever modal you want to hide
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// clicking the dark overlay closes the modal — but pet/owner forms check for unsaved changes first
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
        if (e.target !== overlay) return;

        if (overlay.id === 'petFormModal') { closePetFormModal(); return; }
        if (overlay.id === 'ownerFormModal') { closeOwnerFormModal(); return; }

        overlay.style.display = 'none';
    });
});

// stops clicks inside a modal from bubbling up and closing it accidentally
document.querySelectorAll('.modal-content').forEach(mc => {
    mc.addEventListener('click', e => e.stopPropagation());
});

// ─── lightbox for fullscreen photo viewing — handles zoom, pan, pinch-to-zoom ───
(function () {
    const MIN_SCALE = 0.2, MAX_SCALE = 10;
    let scale = 1;
    let tx = 0, ty = 0;
    let imgNW = 0, imgNH = 0;
    let dragging = false;
    let dragStartX = 0, dragStartY = 0, dragStartTx = 0, dragStartTy = 0;

    const lb  = document.getElementById('imgLightbox');
    const vp  = document.getElementById('imgLightboxViewport');
    const img = document.getElementById('imgLightboxImg');
    const lbl = document.getElementById('lbZoomLabel');

    function commit(animate) {
        if (animate) {
            img.classList.add('lb-animate');
            setTimeout(() => img.classList.remove('lb-animate'), 240);
        } else {
            img.classList.remove('lb-animate');
        }
        img.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
        lbl.textContent = Math.round(scale * 100) + '%';
    }

    function clamp() {
        var W = window.innerWidth, H = window.innerHeight;
        var margin = 80;
        tx = Math.max(margin - imgNW * scale, Math.min(W - margin, tx));
        ty = Math.max(margin - imgNH * scale, Math.min(H - margin, ty));
    }

    function fit(animate) {
        var W = window.innerWidth, H = window.innerHeight;
        if (!imgNW || !imgNH) return;
        scale = Math.min((W * 0.85) / imgNW, (H * 0.85) / imgNH);
        tx = (W - imgNW * scale) / 2;
        ty = (H - imgNH * scale) / 2;
        commit(animate);
    }

    function zoomAt(cx, cy, newScale) {
        newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
        tx = cx - (cx - tx) * (newScale / scale);
        ty = cy - (cy - ty) * (newScale / scale);
        scale = newScale;
        clamp();
    }

    window.openLightbox = function (src) {
        img.src = '';
        img.src = src;
        lb.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    img.onload = function () {
        imgNW = img.naturalWidth  || img.width  || 400;
        imgNH = img.naturalHeight || img.height || 400;
        img.style.width  = imgNW + 'px';
        img.style.height = imgNH + 'px';
        fit(false);
    };

    window.closeLightbox = function () {
        lb.classList.remove('active');
        document.body.style.overflow = '';
    };

    window.lbZoomIn  = function () { zoomAt(innerWidth / 2, innerHeight / 2, scale * 1.5); commit(true); };
    window.lbZoomOut = function () { zoomAt(innerWidth / 2, innerHeight / 2, scale / 1.5); commit(true); };
    window.lbReset   = function () { fit(true); };

    lb.addEventListener('click', function (e) {
        if (e.target === lb || e.target === vp) closeLightbox();
    });

    vp.addEventListener('mousedown', function (e) {
        if (e.button !== 0) return;
        dragging = true;
        dragStartX = e.clientX; dragStartY = e.clientY;
        dragStartTx = tx; dragStartTy = ty;
        vp.classList.add('dragging');
        e.preventDefault();
    });
    window.addEventListener('mousemove', function (e) {
        if (!dragging) return;
        tx = dragStartTx + (e.clientX - dragStartX);
        ty = dragStartTy + (e.clientY - dragStartY);
        clamp();
        commit(false);
    });
    window.addEventListener('mouseup', function () {
        dragging = false;
        vp.classList.remove('dragging');
    });

    vp.addEventListener('wheel', function (e) {
        e.preventDefault();
        var factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
        zoomAt(e.clientX, e.clientY, scale * factor);
        commit(false);
    }, { passive: false });

    var lastTouches = null;
    vp.addEventListener('touchstart', function (e) {
        e.preventDefault();
        lastTouches = Array.from(e.touches);
        if (e.touches.length === 1) {
            dragging = true;
            dragStartX  = e.touches[0].clientX;
            dragStartY  = e.touches[0].clientY;
            dragStartTx = tx;
            dragStartTy = ty;
        }
    }, { passive: false });

    vp.addEventListener('touchmove', function (e) {
        e.preventDefault();
        var cur = Array.from(e.touches);
        if (cur.length === 1 && dragging && lastTouches) {
            tx = dragStartTx + (cur[0].clientX - dragStartX);
            ty = dragStartTy + (cur[0].clientY - dragStartY);
            clamp();
            commit(false);
        } else if (cur.length === 2 && lastTouches && lastTouches.length >= 2) {
            var prev = lastTouches;
            var prevDist = Math.hypot(prev[0].clientX - prev[1].clientX, prev[0].clientY - prev[1].clientY);
            var curDist  = Math.hypot(cur[0].clientX  - cur[1].clientX,  cur[0].clientY  - cur[1].clientY);
            var midX = (cur[0].clientX + cur[1].clientX) / 2;
            var midY = (cur[0].clientY + cur[1].clientY) / 2;
            if (prevDist > 0) zoomAt(midX, midY, scale * (curDist / prevDist));
            commit(false);
        }
        lastTouches = cur;
    }, { passive: false });

    vp.addEventListener('touchend', function (e) {
        lastTouches = Array.from(e.touches);
        if (e.touches.length === 0) dragging = false;
    });

    document.addEventListener('keydown', function (e) {
        if (!lb.classList.contains('active')) return;
        if (e.key === 'Escape')              closeLightbox();
        if (e.key === '+' || e.key === '=') lbZoomIn();
        if (e.key === '-')                   lbZoomOut();
        if (e.key === '0')                   lbReset();
    });
})();

// on page load — pulls the username from localStorage and renders the (initially empty) table
document.addEventListener('DOMContentLoaded', () => {
    const uname = localStorage.getItem('userName');
    if (uname) document.getElementById('UserName').textContent = uname;
    renderTable(owners);
});

// ─── update health record modal ───────────────────────────────────────────────

// snapshot for unsaved-change detection on the health record form
let uhrFormOriginal = null;

// takes a snapshot of all the fields in the update health record form
function getUhrFormSnapshot() {
    const serviceRadio = document.querySelector('input[name="uhrServiceType"]:checked');
    return JSON.stringify({
        petId:             document.getElementById('uhrPetIdSelect').value,
        service:           serviceRadio ? serviceRadio.value : '',
        weight:            document.getElementById('uhrWeightInput').value,
        date:              document.getElementById('uhrDateInput').value,
        vaccinationStatus: document.getElementById('uhrVaccinationStatus').value,
        allergies:         document.getElementById('uhrAllergies').value,
        notes:             document.getElementById('uhrNotes').value,
    });
}

function hasUhrFormChanged() {
    return getUhrFormSnapshot() !== uhrFormOriginal;
}

// closes the health record form — prompts if there are unsaved changes
function closeUpdateHealthModal() {
    if (hasUhrFormChanged()) {
        showUnsavedModal(() => closeModal('updateHealthModal'));
    } else {
        closeModal('updateHealthModal');
    }
}

// opens the update health record modal — only shows pets belonging to the currently selected owner
function openUpdateHealthRecord() {
    if (selectedOwnerID === null) return;
    const owner = owners.find(o => o.UserID === selectedOwnerID);
    if (!owner) return;

    // populate the pet dropdown with only this owner's pets
    const sel = document.getElementById('uhrPetIdSelect');
    sel.innerHTML = '<option value="">Select Pet ID…</option>';
    (owner.pets || []).forEach(pet => {
        const opt = document.createElement('option');
        opt.value = pet.PetID;
        opt.textContent = `#${pet.PetID} — ${pet.Name}`;
        sel.appendChild(opt);
    });

    // reset everything before showing the modal
    document.getElementById('uhrPetInfoPanel').style.display = 'none';
    document.getElementById('uhrPetIdError').style.display   = 'none';

    // deselect service tiles
    document.querySelectorAll('.uhr-service-tile').forEach(t => t.classList.remove('uhr-selected'));
    document.querySelectorAll('input[name="uhrServiceType"]').forEach(r => r.checked = false);
    document.getElementById('uhrServiceError').style.display = 'none';
    document.getElementById('uhrVaccinationStatusWrap').style.display = 'none';
    document.getElementById('uhrVaccinationStatus').value = '';

    document.getElementById('uhrAllergies').value   = '';
    document.getElementById('uhrNotes').value       = '';
    document.getElementById('uhrWeightInput').value = '';
    document.getElementById('uhrDateInput').value   = '';

    uhrFormOriginal = getUhrFormSnapshot();

    document.getElementById('updateHealthModal').style.display = 'flex';
}

// handles clicking a service tile — highlights it and shows/hides the vaccination status field
function uhrSelectService(value) {
    document.querySelectorAll('.uhr-service-tile').forEach(t => t.classList.remove('uhr-selected'));
    const radio = document.getElementById('uhrSvc_' + value);
    if (radio) {
        radio.checked = true;
        radio.closest('.uhr-service-tile').classList.add('uhr-selected');
    }
    document.getElementById('uhrServiceError').style.display = 'none';
    // vaccination status field only shows up when vaccination is selected
    document.getElementById('uhrVaccinationStatusWrap').style.display =
        value === 'vaccination' ? 'block' : 'none';
}

// fills the pet info preview panel when a pet is selected from the dropdown
function uhrFillPetInfo() {
    const petId = parseInt(document.getElementById('uhrPetIdSelect').value);
    const panel = document.getElementById('uhrPetInfoPanel');
    const errEl = document.getElementById('uhrPetIdError');

    if (!petId) { panel.style.display = 'none'; errEl.style.display = 'none'; return; }

    const owner = owners.find(o => o.UserID === selectedOwnerID);
    const pet   = owner && owner.pets.find(p => p.PetID === petId);

    if (!pet) {
        panel.style.display = 'none';
        errEl.style.display = 'block';
        return;
    }

    errEl.style.display = 'none';

    // use the pet's photo if they have one, otherwise try the species PNG, then fallback to emoji
    const avatarEl = document.getElementById('uhrPetAvatar');
    if (pet.photo) {
        avatarEl.innerHTML = `<img src="${pet.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    } else {
        const speciesKey = (pet.Species || '').toLowerCase();
        avatarEl.innerHTML = `
            <img src="img-health/${speciesKey}.png" alt="${escHtml(pet.Species)}"
                 style="width:100%;height:100%;object-fit:contain;padding:6px;"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
            <div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-size:24px;">
                ${pet.Species === 'Dog' ? '🐕' : pet.Species === 'Cat' ? '🐈' : '🐾'}
            </div>`;
    }

    document.getElementById('uhrPetName').textContent = pet.Name;
    document.getElementById('uhrPetMeta').textContent =
        `${pet.Species} · ${pet.Breed} · ${pet.Gender} · ${calcAge(pet.Birthdate) || '—'}`;
    document.getElementById('uhrOwnerName').textContent =
        `${owner.OwnerFName} ${owner.OwnerLName}`;

    panel.style.display = 'block';
}

// previews an image upload inside the health record form (e.g. for proof docs or receipts)
function uhrPreviewImg(inputId, wrapId, thumbId, zoneId, placeholderId) {
    const input = document.getElementById(inputId);
    if (!input.files || !input.files[0]) return;
    const reader = new FileReader();
    reader.onload = e => {
        document.getElementById(thumbId).src = e.target.result;
        document.getElementById(wrapId).style.display = 'block';
        if (placeholderId) document.getElementById(placeholderId).style.display = 'none';
        const zone = document.getElementById(zoneId);
        if (zone) { zone.classList.add('uhr-has-image'); }
    };
    reader.readAsDataURL(input.files[0]);
}

// clears an uploaded image from the health record form and resets the drop zone
function uhrClearImg(inputId, wrapId, thumbId, zoneId, placeholderId) {
    const input = document.getElementById(inputId);
    if (input) input.value = '';
    const thumb = document.getElementById(thumbId);
    if (thumb) thumb.src = '';
    const wrap = document.getElementById(wrapId);
    if (wrap) wrap.style.display = 'none';
    if (placeholderId) {
        const ph = document.getElementById(placeholderId);
        if (ph) ph.style.display = 'flex';
    }
    const zone = document.getElementById(zoneId);
    if (zone) zone.classList.remove('uhr-has-image');
}

// validates and submits the health record form — creates a new record and attaches it to the pet
function submitUpdateHealthRecord() {
    const petId = parseInt(document.getElementById('uhrPetIdSelect').value);
    if (!petId) { alert('Please select a Pet ID.'); return; }

    const owner = owners.find(o => o.UserID === selectedOwnerID);
    const pet   = owner && owner.pets.find(p => p.PetID === petId);
    if (!pet) { alert('Pet not found.'); return; }

    // service type is required — show an error tile if nothing is selected
    const serviceRadio = document.querySelector('input[name="uhrServiceType"]:checked');
    if (!serviceRadio) {
        document.getElementById('uhrServiceError').style.display = 'block';
        return;
    }
    // possible values: checkup | deworming | vaccination | grooming
    const serviceType = serviceRadio.value;

    const vaccinationStatus = document.getElementById('uhrVaccinationStatus').value.trim();
    const allergies = document.getElementById('uhrAllergies').value.trim();
    const notes     = document.getElementById('uhrNotes').value.trim();

    // read typed weight and date from the inputs
    const weightVal = parseFloat(document.getElementById('uhrWeightInput').value);
    const dateVal   = document.getElementById('uhrDateInput').value;

    // find the highest existing RecordID so we can assign the next one
    const maxId = owners.reduce((m, o) =>
        Math.max(m, ...(o.pets || []).flatMap(p =>
            (p.healthRecords || []).map(r => r.RecordID || 0))), 0);

    // maps the internal key to what gets displayed in the records table
    const serviceLabels = { checkup: 'Check-up', deworming: 'Deworming', vaccination: 'Vaccination', grooming: 'Grooming' };

    const newRecord = {
        RecordID:           maxId + 1,
        PetID:              petId,
        RecordType:         serviceLabels[serviceType] || serviceType,
        serviceKey:         serviceType,
        Weight:             isNaN(weightVal) ? null : weightVal,
        VaccinationStatus:  vaccinationStatus || null,
        Allergies:          allergies || null,
        // defaults to today's date if none was provided
        DateRecorded:       dateVal ? dateVal.slice(0, 10) : new Date().toISOString().slice(0, 10),
        Notes:              notes,
        Status:             'Completed',
        Details:            '',
    };

    if (!pet.healthRecords) pet.healthRecords = [];
    pet.healthRecords.push(newRecord);
    // update LastVisit so the pet card shows the correct date right away
    pet.LastVisit = newRecord.DateRecorded;

    closeModal('updateHealthModal');

    // refresh the pet cards and re-open the detail modal if it was already open
    if (owner) renderPets(owner);
    if (currentPet && currentPet.PetID === petId) openPetDetail(pet, owner);
}