'use strict';

let owners = [];
let selectedOwnerID = null;
// just a temp id counter until we hook up the real db
let nextPetID = 900;

/* ── species emoji map, only what we support for now ── */
const SPECIES_EMOJI = {
    dog: '🐶', cat: '🐱',
};
// fallback paw for anything else
function speciesEmoji(sp) {
    return SPECIES_EMOJI[(sp || '').toLowerCase()] || '🐾';
}

// not used visually anymore but keeping it around just in case
function initials(f, l) {
    return ((f || '').charAt(0) + (l || '').charAt(0)).toUpperCase() || '?';
}

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

function fmtDate(d) {
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function escHtml(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
}

function renderTable(list) {
    const tbody = document.getElementById('ownerTableBody');
    const empty = document.getElementById('tableEmpty');
    tbody.innerHTML = '';

    // only show the empty state when owners is truly empty, not on a search miss
    if (owners.length === 0) {
        empty.style.display = 'flex';
        return;
    }
    empty.style.display = 'none';

    list.forEach(owner => {
        const tr = document.createElement('tr');
        // highlights the row if this owner is currently selected :D
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

// filters and re-renders the owner table based on search and sort state
function applyFilters() {
    const q = (document.getElementById('searchInput').value || '').trim().toLowerCase();
    const sort = document.getElementById('sortSelect').value;

    // search across name, username, contact, and email
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

function selectOwner(userId) {
    selectedOwnerID = userId;
    const owner = owners.find(o => o.UserID === userId);
    if (!owner) return;

    // highlights the selected row and clear others
    document.querySelectorAll('#ownerTableBody tr').forEach(r => r.classList.remove('selected'));
    const rows = document.querySelectorAll('#ownerTableBody tr');
    rows.forEach(r => {
        const btn = r.querySelector('.btn-pets');
        if (btn && btn.getAttribute('onclick') === `selectOwner(${userId})`) r.classList.add('selected');
    });

    // activates two-column layout yiz
    document.getElementById('splitLayout').classList.add('split-active');
    const panelPets = document.getElementById('panelPets');
    panelPets.classList.add('has-owner');
    document.getElementById('petsEmptyState').style.display = 'none';

    const content = document.getElementById('petsContent');
    content.style.display = 'flex';

    // fills the owner strip at the top of the pets panel
    document.getElementById('ownerFocusAvatar').textContent = initials(owner.OwnerFName, owner.OwnerLName);
    document.getElementById('ownerFocusName').textContent = `${owner.OwnerFName} ${owner.OwnerLName}`;
    document.getElementById('ownerFocusMeta').textContent = `@${owner.UserName} · ${owner.ContactNum}`;
    document.getElementById('ownerFocusBadge').textContent = `${owner.pets.length} pet${owner.pets.length !== 1 ? 's' : ''}`;

    renderPets(owner);
    // resets pet filters whenever a new owner is selected
    document.getElementById('petSearchInput').value = '';
    document.getElementById('petSpeciesFilter').value = '';
    document.getElementById('petGenderFilter').value = '';
}

// collapses the right panel and deselect the owner
function closePetsPanel() {
    selectedOwnerID = null;
    document.getElementById('splitLayout').classList.remove('split-active');
    document.getElementById('panelPets').classList.remove('has-owner');
    document.getElementById('petsEmptyState').style.display = '';
    document.getElementById('petsContent').style.display = 'none';
    document.querySelectorAll('#ownerTableBody tr').forEach(r => r.classList.remove('selected'));
}

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

let currentPet = null;
let currentPetOwner = null;

function openPetDetail(pet, owner) {
    currentPet = pet;
    currentPetOwner = owner;

    const avatarInner = pet.photo
        ? `<img src="${pet.photo}" alt="${escHtml(pet.Name)}">`
        : speciesEmoji(pet.Species);

    const age = calcAge(pet.Birthdate);
    const hasPhoto = !!pet.photo;

    document.getElementById('petDetailBody').innerHTML = `
        <div class="pet-detail-header">
            <div class="pet-detail-avatar${hasPhoto ? ' has-photo' : ''}" ${hasPhoto ? `onclick="openLightbox('${pet.photo}')" title="Click to zoom"` : ''}>${avatarInner}</div>
            <div>
                <div class="pet-detail-name">${escHtml(pet.Name)}</div>
                <div class="pet-detail-sub">${escHtml(pet.Species)} · owned by ${escHtml(owner.OwnerFName)} ${escHtml(owner.OwnerLName)}</div>
                <div class="pet-detail-id">Pet ID #${pet.PetID}</div>
            </div>
        </div>
        <div class="detail-grid">
            <div class="detail-item">
                <div class="label">Age</div>
                <div class="value">${age || '—'}</div>
            </div>
            <div class="detail-item">
                <div class="label">Gender</div>
                <div class="value">${escHtml(pet.Gender) || '—'}</div>
            </div>
            <div class="detail-item">
                <div class="label">Breed</div>
                <div class="value">${escHtml(pet.Breed) || '—'}</div>
            </div>
            <div class="detail-item">
                <div class="label">Color</div>
                <div class="value">${escHtml(pet.Color) || '—'}</div>
            </div>
            <div class="detail-item">
                <div class="label">Birthday</div>
                <div class="value">${fmtDate(pet.Birthdate)}</div>
            </div>
            <div class="detail-item">
                <div class="label">Last Visit</div>
                <div class="value">${fmtDate(pet.LastVisit)}</div>
            </div>
        </div>
    `;

    document.getElementById('petDetailEditBtn').onclick = () => {
        closeModal('petDetailModal');
        openEditPet(pet, owner);
    };
    document.getElementById('petDetailDelBtn').onclick = () => {
        closeModal('petDetailModal');
        confirmDeletePet(pet, owner);
    };

    document.getElementById('petDetailModal').style.display = 'flex';
}

// snapshot for unsaved-change detection
let petFormOriginal = null;
// 'add' or 'edit' so submitPetForm knows what to do
let petFormMode = null;
let petFormOwner = null;
let petFormPetRef = null;

// shows or hides the free-text species input when "other" is selected
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
    // pre-fill owner name since it's read-only anyways
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

    // if species isn't dog or cat, treat it as other and show the text input 
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

    // reset zoom/pan before showing
    pfResetZoomPan();

    // show photo or fall back to species emoji
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

// includes otherSpecies in the snapshot so unsaved check catches it too
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

function closePetFormModal() {
    if (hasPetFormChanged()) {
        showUnsavedModal(() => {
            closeModal('petFormModal');
        });
    } else {
        closeModal('petFormModal');
    }
}

// auto-calc age when birthdate changes
document.getElementById('fPetBirthdate').addEventListener('change', function () {
    document.getElementById('fPetAge').value = calcAge(this.value) || '';
    // also update the emoji preview if no photo is set
    const sp = document.getElementById('fPetSpecies').value;
    if (!document.getElementById('petPhotoImg').src || document.getElementById('petPhotoImg').style.display === 'none') {
        document.getElementById('petPhotoEmoji').textContent = sp ? speciesEmoji(sp) : '🐾';
    }
});

// updates emoji when species changes (only if no photo uploaded yet)
document.getElementById('fPetSpecies').addEventListener('change', function () {
    if (document.getElementById('petPhotoImg').style.display === 'none') {
        document.getElementById('petPhotoEmoji').textContent = speciesEmoji(this.value);
    }
});

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

let pfZoom = 1, pfOx = 0, pfOy = 0;
let pfDragging = false, pfDragSX = 0, pfDragSY = 0, pfDragSOx = 0, pfDragSOy = 0;

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

function submitPetForm() {
    const name      = document.getElementById('fPetName').value.trim();
    const birthdate = document.getElementById('fPetBirthdate').value;
    const breed     = document.getElementById('fPetBreed').value.trim();
    const color     = document.getElementById('fPetColor').value.trim();
    const gender    = document.getElementById('fPetGender').value;
    const lastVisit = document.getElementById('fPetLastVisit').value;
    const photoImg  = document.getElementById('petPhotoImg');
    const photo     = photoImg.style.display !== 'none' ? photoImg.src : null;

    // if other was picked, use the typed value instead
    const speciesRaw = document.getElementById('fPetSpecies').value;
    const speciesOther = document.getElementById('fPetSpeciesOther').value.trim();
    const species = speciesRaw === 'Other' ? (speciesOther || 'Other') : speciesRaw;

    if (!name || !birthdate || !speciesRaw || !breed || !gender) {
        alert('Please fill in all required fields (Name, Birthday, Species, Breed, Gender).');
        return;
    }
    // make sure they actually typed something when other is selected
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
        /* edit */
        Object.assign(petFormPetRef, {
            Name: name, Species: species, Breed: breed,
            Color: color, Gender: gender,
            Birthdate: birthdate, LastVisit: lastVisit || null, photo
        });
    }

    petFormOriginal = getPetFormSnapshot(); // mark clean so no unsaved prompt
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

let ownerFormOriginal = null;

function openAddOwner() {
    document.getElementById('ownerFormTitle').textContent = 'Add New Owner';
    ['fUserId','fOwnerFName','fOwnerLName','fUserName','fContactNum','fEmail','fAddress'].forEach(id => {
        document.getElementById(id).value = '';
    });
    ownerFormOriginal = getOwnerFormSnapshot();
    document.getElementById('ownerFormModal').style.display = 'flex';
}

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

let unsavedCallback = null;

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

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
        if (e.target !== overlay) return;

        if (overlay.id === 'petFormModal') { closePetFormModal(); return; }
        if (overlay.id === 'ownerFormModal') { closeOwnerFormModal(); return; }

        overlay.style.display = 'none';
    });
});

document.querySelectorAll('.modal-content').forEach(mc => {
    mc.addEventListener('click', e => e.stopPropagation());
});

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

document.addEventListener('DOMContentLoaded', () => {
    const uname = localStorage.getItem('userName');
    if (uname) document.getElementById('UserName').textContent = uname;
    renderTable(owners);
});
