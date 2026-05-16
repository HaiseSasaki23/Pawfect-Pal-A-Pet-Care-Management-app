'use strict';

const API_BASE = "http://localhost:5182";

let owners = [];
let selectedOwnerID = null;

function getAuthHeaders() {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

const SPECIES_EMOJI = { dog: '🐶', cat: '🐱' };
function speciesEmoji(sp) {
    return SPECIES_EMOJI[(sp || '').toLowerCase()] || '🐾';
}

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
    if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) { years--; months += 12; }
    if (months < 0) months += 12;
    if (years === 0) return months <= 1 ? `${months} mo` : `${months} mos`;
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


async function fetchOwners() {
    try {
        const res = await fetch(`${API_BASE}/api/User`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error(`Failed to fetch users (${res.status})`);

        const users = await res.json();

        // API returns: userId, userName, ownerFName, ownerLName, email, role, contactNum, address
        owners = users
            .filter(u => u.role === 'User')
            .map(u => ({
                UserID:     u.userId,
                OwnerFName: u.ownerFName,
                OwnerLName: u.ownerLName,
                UserName:   u.userName,
                ContactNum: u.contactNum ?? '',
                Email:      u.email,
                Address:    u.address   ?? '',
                Role:       u.role,
                pets:       []
            }));

        await Promise.all(owners.map(o => fetchPetsForOwner(o.UserID)));

        renderTable(owners);
        applyFilters();

    } catch (err) {
        console.error('fetchOwners error:', err);
        alert('Failed to load owners. Please try again.');
    }
}

async function fetchPetsForOwner(userId) {
    try {
        const res = await fetch(`${API_BASE}/api/Pet/user/${userId}`, { headers: getAuthHeaders() });
        if (!res.ok) return;

        const pets = await res.json();
        const owner = owners.find(o => o.UserID === userId);
        if (owner) {
            owner.pets = pets.map(p => ({
                PetID:     p.petId,
                Name:      p.name,
                Species:   p.species,
                Breed:     p.breed,
                Color:     p.color     ?? '',
                Gender:    p.gender    ?? '',
                Birthdate: p.birthdate ?? null,
                LastVisit: p.lastVisit ?? null,
                photo:     p.photoUrl  ?? null
            }));
        }
    } catch (err) {
        console.error(`fetchPetsForOwner(${userId}) error:`, err);
    }
}

async function createOwner(ownerData) {
    try {
        const res = await fetch(`${API_BASE}/api/User`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                userName:   ownerData.UserName,
                ownerFName: ownerData.OwnerFName,
                ownerLName: ownerData.OwnerLName,
                email:      ownerData.Email,
                contactNum: ownerData.ContactNum,
                address:    ownerData.Address,
                password:   'default123',
                role:       'User'
            })
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Failed to create owner'); }
        await fetchOwners();
    } catch (err) {
        console.error('createOwner error:', err);
        alert(`Failed to create owner: ${err.message}`);
    }
}

async function updateOwner(userId, ownerData) {
    try {
        const res = await fetch(`${API_BASE}/api/User/${userId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                userId:     userId,
                userName:   ownerData.UserName,
                ownerFName: ownerData.OwnerFName,
                ownerLName: ownerData.OwnerLName,
                email:      ownerData.Email,
                contactNum: ownerData.ContactNum,
                address:    ownerData.Address
            })
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Failed to update owner'); }
        await fetchOwners();
        if (selectedOwnerID === userId) selectOwner(userId);
    } catch (err) {
        console.error('updateOwner error:', err);
        alert(`Failed to update owner: ${err.message}`);
    }
}

async function deleteOwner(userId) {
    try {
        const res = await fetch(`${API_BASE}/api/User/${userId}`, {
            method: 'DELETE', headers: getAuthHeaders()
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Failed to delete owner'); }
        if (selectedOwnerID === userId) closePetsPanel();
        await fetchOwners();
    } catch (err) {
        console.error('deleteOwner error:', err);
        alert(`Failed to delete owner: ${err.message}`);
    }
}

async function createPet(userId, petData) {
    try {
        const res = await fetch(`${API_BASE}/api/Pet`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                userId:    userId,
                name:      petData.Name,
                species:   petData.Species,
                breed:     petData.Breed,
                color:     petData.Color,
                gender:    petData.Gender,
                birthdate: petData.Birthdate,
                lastVisit: petData.LastVisit || null
            })
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Failed to create pet'); }
        await fetchPetsForOwner(userId);
        refreshPetsPanel(userId);
    } catch (err) {
        console.error('createPet error:', err);
        alert(`Failed to create pet: ${err.message}`);
    }
}

async function updatePet(petId, petData) {
    try {
        const res = await fetch(`${API_BASE}/api/Pet/${petId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                petId:     petId,
                name:      petData.Name,
                species:   petData.Species,
                breed:     petData.Breed,
                color:     petData.Color,
                gender:    petData.Gender,
                birthdate: petData.Birthdate,
                lastVisit: petData.LastVisit || null
            })
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Failed to update pet'); }
        const owner = owners.find(o => o.pets.some(p => p.PetID === petId));
        if (owner) { await fetchPetsForOwner(owner.UserID); refreshPetsPanel(owner.UserID); }
    } catch (err) {
        console.error('updatePet error:', err);
        alert(`Failed to update pet: ${err.message}`);
    }
}

async function deletePet(petId, userId) {
    try {
        const res = await fetch(`${API_BASE}/api/Pet/${petId}`, {
            method: 'DELETE', headers: getAuthHeaders()
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Failed to delete pet'); }
        await fetchPetsForOwner(userId);
        refreshPetsPanel(userId);
    } catch (err) {
        console.error('deletePet error:', err);
        alert(`Failed to delete pet: ${err.message}`);
    }
}


function renderTable(list) {
    const tbody = document.getElementById('ownerTableBody');
    const empty = document.getElementById('tableEmpty');
    tbody.innerHTML = '';

    if (owners.length === 0) { empty.style.display = 'flex'; return; }
    empty.style.display = 'none';

    list.forEach(owner => {
        const tr = document.createElement('tr');
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

function applyFilters() {
    const q    = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
    const sort = document.getElementById('sortSelect')?.value || '';

    let list = owners.filter(o => {
        if (!q) return true;
        return `${o.OwnerFName} ${o.OwnerLName} ${o.UserName} ${o.ContactNum} ${o.Email}`.toLowerCase().includes(q);
    });

    if (sort === 'name-asc')  list.sort((a, b) => `${a.OwnerFName}${a.OwnerLName}`.localeCompare(`${b.OwnerFName}${b.OwnerLName}`));
    if (sort === 'name-desc') list.sort((a, b) => `${b.OwnerFName}${b.OwnerLName}`.localeCompare(`${a.OwnerFName}${a.OwnerLName}`));
    if (sort === 'uid-asc')   list.sort((a, b) => a.UserID - b.UserID);
    if (sort === 'uid-desc')  list.sort((a, b) => b.UserID - a.UserID);

    renderTable(list);
}

function selectOwner(userId) {
    selectedOwnerID = userId;
    const owner = owners.find(o => o.UserID === userId);
    if (!owner) return;

    document.querySelectorAll('#ownerTableBody tr').forEach(r => r.classList.remove('selected'));
    document.querySelectorAll('#ownerTableBody tr').forEach(r => {
        const btn = r.querySelector('.btn-pets');
        if (btn && btn.getAttribute('onclick') === `selectOwner(${userId})`) r.classList.add('selected');
    });

    document.getElementById('splitLayout').classList.add('split-active');
    document.getElementById('panelPets').classList.add('has-owner');
    document.getElementById('petsEmptyState').style.display = 'none';
    document.getElementById('petsContent').style.display = 'flex';

    document.getElementById('ownerFocusAvatar').textContent = initials(owner.OwnerFName, owner.OwnerLName);
    document.getElementById('ownerFocusName').textContent   = `${owner.OwnerFName} ${owner.OwnerLName}`;
    document.getElementById('ownerFocusMeta').textContent   = `@${owner.UserName} · ${owner.ContactNum}`;
    document.getElementById('ownerFocusBadge').textContent  = `${owner.pets.length} pet${owner.pets.length !== 1 ? 's' : ''}`;

    renderPets(owner);
    document.getElementById('petSearchInput').value  = '';
    document.getElementById('petSpeciesFilter').value = '';
    document.getElementById('petGenderFilter').value  = '';
}

function closePetsPanel() {
    selectedOwnerID = null;
    document.getElementById('splitLayout').classList.remove('split-active');
    document.getElementById('panelPets').classList.remove('has-owner');
    document.getElementById('petsEmptyState').style.display = '';
    document.getElementById('petsContent').style.display = 'none';
    document.querySelectorAll('#ownerTableBody tr').forEach(r => r.classList.remove('selected'));
}

function refreshPetsPanel(userId) {
    const owner = owners.find(o => o.UserID === userId);
    if (!owner || selectedOwnerID !== userId) return;
    const badge = document.getElementById('ownerFocusBadge');
    if (badge) badge.textContent = `${owner.pets.length} pet${owner.pets.length !== 1 ? 's' : ''}`;
    renderPets(owner);
}


function renderPets(owner) {
    const query   = (document.getElementById('petSearchInput')?.value  || '').toLowerCase();
    const species = document.getElementById('petSpeciesFilter')?.value || '';
    const gender  = document.getElementById('petGenderFilter')?.value  || '';

    let pets = (owner?.pets || []).filter(p => {
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
        const avatarInner = pet.photo ? `<img src="${pet.photo}" alt="${escHtml(pet.Name)}">` : speciesEmoji(pet.Species);

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


let currentPet = null;
let currentPetOwner = null;

function openPetDetail(pet, owner) {
    currentPet = pet;
    currentPetOwner = owner;

    const avatarInner = pet.photo ? `<img src="${pet.photo}" alt="${escHtml(pet.Name)}">` : speciesEmoji(pet.Species);
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
            <div class="detail-item"><div class="label">Age</div><div class="value">${age || '—'}</div></div>
            <div class="detail-item"><div class="label">Gender</div><div class="value">${escHtml(pet.Gender) || '—'}</div></div>
            <div class="detail-item"><div class="label">Breed</div><div class="value">${escHtml(pet.Breed) || '—'}</div></div>
            <div class="detail-item"><div class="label">Color</div><div class="value">${escHtml(pet.Color) || '—'}</div></div>
            <div class="detail-item"><div class="label">Birthday</div><div class="value">${fmtDate(pet.Birthdate)}</div></div>
            <div class="detail-item"><div class="label">Last Visit</div><div class="value">${fmtDate(pet.LastVisit)}</div></div>
        </div>
    `;

    document.getElementById('petDetailEditBtn').onclick = () => { closeModal('petDetailModal'); openEditPet(pet, owner); };
    document.getElementById('petDetailDelBtn').onclick  = () => { closeModal('petDetailModal'); confirmDeletePet(pet, owner); };
    document.getElementById('petDetailModal').style.display = 'flex';
}


let petFormOriginal = null;
let petFormMode     = null;
let petFormOwner    = null;
let petFormPetRef   = null;

function toggleOtherSpecies(val) {
    const otherInput = document.getElementById('fPetSpeciesOther');
    otherInput.style.display = val === 'Other' ? 'block' : 'none';
    if (val !== 'Other') otherInput.value = '';
}

function openAddPet() {
    if (selectedOwnerID === null) return;
    petFormOwner  = owners.find(o => o.UserID === selectedOwnerID);
    petFormMode   = 'add';
    petFormPetRef = null;

    document.getElementById('petFormTitle').textContent = 'Add Pet';
    clearPetForm();
    document.getElementById('fPetOwnerDisplay').value = `${petFormOwner.OwnerFName} ${petFormOwner.OwnerLName}`;
    petFormOriginal = getPetFormSnapshot();
    document.getElementById('petFormModal').style.display = 'flex';
}

function openEditPet(pet, owner) {
    petFormOwner  = owner;
    petFormMode   = 'edit';
    petFormPetRef = pet;

    document.getElementById('petFormTitle').textContent   = 'Pet Information';
    document.getElementById('fPetId').value               = pet.PetID;
    document.getElementById('fPetName').value             = pet.Name      || '';
    document.getElementById('fPetOwnerDisplay').value     = `${owner.OwnerFName} ${owner.OwnerLName}`;
    document.getElementById('fPetBirthdate').value        = pet.Birthdate || '';
    document.getElementById('fPetAge').value              = calcAge(pet.Birthdate) || '';
    document.getElementById('fPetGender').value           = pet.Gender    || '';
    document.getElementById('fPetBreed').value            = pet.Breed     || '';
    document.getElementById('fPetColor').value            = pet.Color     || '';
    document.getElementById('fPetLastVisit').value        = pet.LastVisit || '';

    const knownSpecies = ['Dog', 'Cat'];
    if (knownSpecies.includes(pet.Species)) {
        document.getElementById('fPetSpecies').value               = pet.Species;
        document.getElementById('fPetSpeciesOther').style.display  = 'none';
        document.getElementById('fPetSpeciesOther').value          = '';
    } else {
        document.getElementById('fPetSpecies').value               = 'Other';
        document.getElementById('fPetSpeciesOther').style.display  = 'block';
        document.getElementById('fPetSpeciesOther').value          = pet.Species || '';
    }

    pfResetZoomPan();

    if (pet.photo) {
        document.getElementById('petPhotoImg').src             = pet.photo;
        document.getElementById('petPhotoImg').style.display   = 'block';
        document.getElementById('petPhotoEmoji').style.display = 'none';
    } else {
        document.getElementById('petPhotoImg').style.display   = 'none';
        document.getElementById('petPhotoEmoji').style.display = 'block';
        document.getElementById('petPhotoEmoji').textContent   = speciesEmoji(pet.Species);
    }

    petFormOriginal = getPetFormSnapshot();
    document.getElementById('petFormModal').style.display = 'flex';
}

function clearPetForm() {
    ['fPetId','fPetName','fPetBirthdate','fPetAge','fPetBreed','fPetColor','fPetLastVisit','fPetOwnerDisplay','fPetSpeciesOther']
        .forEach(id => { document.getElementById(id).value = ''; });
    document.getElementById('fPetSpecies').value          = '';
    document.getElementById('fPetGender').value           = '';
    document.getElementById('fPetPhoto').value            = '';
    document.getElementById('fPetSpeciesOther').style.display  = 'none';
    document.getElementById('petPhotoImg').style.display       = 'none';
    document.getElementById('petPhotoImg').src                 = '';
    document.getElementById('petPhotoEmoji').style.display     = 'block';
    document.getElementById('petPhotoEmoji').textContent       = '🐾';
    pfResetZoomPan();
}

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

function hasPetFormChanged() { return getPetFormSnapshot() !== petFormOriginal; }

function closePetFormModal() {
    if (hasPetFormChanged()) { showUnsavedModal(() => closeModal('petFormModal')); }
    else { closeModal('petFormModal'); }
}

document.getElementById('fPetBirthdate').addEventListener('change', function () {
    document.getElementById('fPetAge').value = calcAge(this.value) || '';
});
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

async function submitPetForm() {
    const name         = document.getElementById('fPetName').value.trim();
    const birthdate    = document.getElementById('fPetBirthdate').value;
    const breed        = document.getElementById('fPetBreed').value.trim();
    const color        = document.getElementById('fPetColor').value.trim();
    const gender       = document.getElementById('fPetGender').value;
    const lastVisit    = document.getElementById('fPetLastVisit').value;
    const speciesRaw   = document.getElementById('fPetSpecies').value;
    const speciesOther = document.getElementById('fPetSpeciesOther').value.trim();
    const species      = speciesRaw === 'Other' ? (speciesOther || 'Other') : speciesRaw;

    if (!name || !birthdate || !speciesRaw || !breed || !gender) {
        alert('Please fill in all required fields (Name, Birthday, Species, Breed, Gender).');
        return;
    }
    if (speciesRaw === 'Other' && !speciesOther) { alert('Please specify the species.'); return; }

    const petData = { Name: name, Species: species, Breed: breed, Color: color, Gender: gender, Birthdate: birthdate, LastVisit: lastVisit || null };

    if (petFormMode === 'add') {
        await createPet(petFormOwner.UserID, petData);
    } else {
        await updatePet(petFormPetRef.PetID, petData);
    }

    petFormOriginal = getPetFormSnapshot();
    closeModal('petFormModal');
    applyFilters();
}


let ownerFormOriginal = null;

function openAddOwner() {
    document.getElementById('ownerFormTitle').textContent = 'Add New Owner';
    ['fUserId','fOwnerFName','fOwnerLName','fUserName','fContactNum','fEmail','fAddress']
        .forEach(id => { document.getElementById(id).value = ''; });
    ownerFormOriginal = getOwnerFormSnapshot();
    document.getElementById('ownerFormModal').style.display = 'flex';
}

function openEditOwner(userId) {
    const owner = owners.find(o => o.UserID === userId);
    if (!owner) return;
    document.getElementById('ownerFormTitle').textContent = 'Edit Owner';
    document.getElementById('fUserId').value     = owner.UserID;
    document.getElementById('fOwnerFName').value = owner.OwnerFName;
    document.getElementById('fOwnerLName').value = owner.OwnerLName;
    document.getElementById('fUserName').value   = owner.UserName;
    document.getElementById('fContactNum').value = owner.ContactNum;
    document.getElementById('fEmail').value      = owner.Email;
    document.getElementById('fAddress').value    = owner.Address;
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

function hasOwnerFormChanged() { return getOwnerFormSnapshot() !== ownerFormOriginal; }

function closeOwnerFormModal() {
    if (hasOwnerFormChanged()) { showUnsavedModal(() => closeModal('ownerFormModal')); }
    else { closeModal('ownerFormModal'); }
}

async function submitOwnerForm() {
    const uid   = document.getElementById('fUserId').value;
    const fName = document.getElementById('fOwnerFName').value.trim();
    const lName = document.getElementById('fOwnerLName').value.trim();
    const uname = document.getElementById('fUserName').value.trim();
    const phone = document.getElementById('fContactNum').value.trim();
    const email = document.getElementById('fEmail').value.trim();
    const addr  = document.getElementById('fAddress').value.trim();

    if (!fName || !lName || !uname || !phone || !email || !addr) { alert('Please fill in all fields.'); return; }

    const ownerData = { OwnerFName: fName, OwnerLName: lName, UserName: uname, ContactNum: phone, Email: email, Address: addr };

    if (uid) { await updateOwner(parseInt(uid), ownerData); }
    else     { await createOwner(ownerData); }

    ownerFormOriginal = getOwnerFormSnapshot();
    closeModal('ownerFormModal');
}

function confirmDeleteOwner(userId) {
    const owner = owners.find(o => o.UserID === userId);
    if (!owner) return;
    document.getElementById('confirmTitle').textContent   = 'Delete Owner';
    document.getElementById('confirmMessage').textContent =
        `Remove ${owner.OwnerFName} ${owner.OwnerLName} and all their ${owner.pets.length} pet(s)? This cannot be undone.`;
    const btn = document.getElementById('btnConfirmAction');
    btn.textContent      = 'Delete Owner';
    btn.style.background = '#ff5e78';
    btn.onclick = async () => { await deleteOwner(userId); closeModal('confirmModal'); applyFilters(); };
    document.getElementById('confirmModal').style.display = 'flex';
}

function confirmDeletePet(pet, owner) {
    document.getElementById('confirmTitle').textContent   = 'Delete Pet';
    document.getElementById('confirmMessage').textContent = `Remove ${pet.Name} from ${owner.OwnerFName}'s pets? This cannot be undone.`;
    const btn = document.getElementById('btnConfirmAction');
    btn.textContent      = 'Delete Pet';
    btn.style.background = '#ff5e78';
    btn.onclick = async () => {
        await deletePet(pet.PetID, owner.UserID);
        closeModal('confirmModal');
    };
    document.getElementById('confirmModal').style.display = 'flex';
}


let unsavedCallback = null;

function showUnsavedModal(onDiscard) {
    unsavedCallback = onDiscard;
    document.getElementById('unsavedModal').style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

document.getElementById('btnDiscardChanges').addEventListener('click', () => {
    closeModal('unsavedModal');
    if (unsavedCallback) { unsavedCallback(); unsavedCallback = null; }
});

document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
        if (e.target !== overlay) return;
        if (overlay.id === 'petFormModal')   { closePetFormModal();   return; }
        if (overlay.id === 'ownerFormModal') { closeOwnerFormModal(); return; }
        overlay.style.display = 'none';
    });
});
document.querySelectorAll('.modal-content').forEach(mc => mc.addEventListener('click', e => e.stopPropagation()));


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
function pfZoomChange(val) { pfZoom = val / 100; pfApply(); }
function pfUndoAdjustments() { pfResetZoomPan(); }
function pfDragStart(e) {
    const img = document.getElementById('petPhotoImg');
    if (img.style.display === 'none') return;
    pfDragging = true; pfDragSX = e.clientX; pfDragSY = e.clientY; pfDragSOx = pfOx; pfDragSOy = pfOy; e.preventDefault();
}
function pfTouchStart(e) {
    const img = document.getElementById('petPhotoImg');
    if (img.style.display === 'none' || e.touches.length !== 1) return;
    pfDragging = true; pfDragSX = e.touches[0].clientX; pfDragSY = e.touches[0].clientY; pfDragSOx = pfOx; pfDragSOy = pfOy; e.preventDefault();
}
document.addEventListener('mousemove', e => { if (!pfDragging) return; pfOx = pfDragSOx + (e.clientX - pfDragSX); pfOy = pfDragSOy + (e.clientY - pfDragSY); pfApply(); });
document.addEventListener('mouseup',  () => { pfDragging = false; });
document.addEventListener('touchmove', e => {
    if (!pfDragging || e.touches.length !== 1) return;
    pfOx = pfDragSOx + (e.touches[0].clientX - pfDragSX); pfOy = pfDragSOy + (e.touches[0].clientY - pfDragSY); pfApply(); e.preventDefault();
}, { passive: false });
document.addEventListener('touchend', () => { pfDragging = false; });


(function () {
    const MIN_SCALE = 0.2, MAX_SCALE = 10;
    let scale = 1, tx = 0, ty = 0, imgNW = 0, imgNH = 0;
    let dragging = false, dragStartX = 0, dragStartY = 0, dragStartTx = 0, dragStartTy = 0;

    const lb  = document.getElementById('imgLightbox');
    const vp  = document.getElementById('imgLightboxViewport');
    const img = document.getElementById('imgLightboxImg');
    const lbl = document.getElementById('lbZoomLabel');

    function commit(animate) {
        if (animate) { img.classList.add('lb-animate'); setTimeout(() => img.classList.remove('lb-animate'), 240); }
        else img.classList.remove('lb-animate');
        img.style.transform = `translate(${tx}px,${ty}px) scale(${scale})`;
        lbl.textContent = Math.round(scale * 100) + '%';
    }
    function clamp() {
        const W = window.innerWidth, H = window.innerHeight, m = 80;
        tx = Math.max(m - imgNW * scale, Math.min(W - m, tx));
        ty = Math.max(m - imgNH * scale, Math.min(H - m, ty));
    }
    function fit(animate) {
        const W = window.innerWidth, H = window.innerHeight;
        if (!imgNW || !imgNH) return;
        scale = Math.min((W * 0.85) / imgNW, (H * 0.85) / imgNH);
        tx = (W - imgNW * scale) / 2; ty = (H - imgNH * scale) / 2;
        commit(animate);
    }
    function zoomAt(cx, cy, newScale) {
        newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
        tx = cx - (cx - tx) * (newScale / scale); ty = cy - (cy - ty) * (newScale / scale);
        scale = newScale; clamp();
    }

    window.openLightbox = src => { img.src = ''; img.src = src; lb.classList.add('active'); document.body.style.overflow = 'hidden'; };
    img.onload = function () { imgNW = img.naturalWidth || 400; imgNH = img.naturalHeight || 400; img.style.width = imgNW + 'px'; img.style.height = imgNH + 'px'; fit(false); };
    window.closeLightbox = () => { lb.classList.remove('active'); document.body.style.overflow = ''; };
    window.lbZoomIn  = () => { zoomAt(innerWidth / 2, innerHeight / 2, scale * 1.5); commit(true); };
    window.lbZoomOut = () => { zoomAt(innerWidth / 2, innerHeight / 2, scale / 1.5); commit(true); };
    window.lbReset   = () => fit(true);

    lb.addEventListener('click', e => { if (e.target === lb || e.target === vp) closeLightbox(); });
    vp.addEventListener('mousedown', e => { if (e.button !== 0) return; dragging = true; dragStartX = e.clientX; dragStartY = e.clientY; dragStartTx = tx; dragStartTy = ty; vp.classList.add('dragging'); e.preventDefault(); });
    window.addEventListener('mousemove', e => { if (!dragging) return; tx = dragStartTx + (e.clientX - dragStartX); ty = dragStartTy + (e.clientY - dragStartY); clamp(); commit(false); });
    window.addEventListener('mouseup', () => { dragging = false; vp.classList.remove('dragging'); });
    vp.addEventListener('wheel', e => { e.preventDefault(); zoomAt(e.clientX, e.clientY, scale * (e.deltaY < 0 ? 1.12 : 1 / 1.12)); commit(false); }, { passive: false });
    document.addEventListener('keydown', e => {
        if (!lb.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === '+' || e.key === '=') lbZoomIn();
        if (e.key === '-') lbZoomOut();
        if (e.key === '0') lbReset();
    });
})();

document.addEventListener('DOMContentLoaded', () => {
    const uname = localStorage.getItem('userName');
    if (uname) { const el = document.getElementById('UserName'); if (el) el.textContent = uname; }

    fetchOwners();

    document.getElementById('searchInput')?.addEventListener('input', applyFilters);
    document.getElementById('sortSelect')?.addEventListener('change', applyFilters);
    document.getElementById('petSearchInput')?.addEventListener('input', () => {
        if (selectedOwnerID === null) return;
        renderPets(owners.find(o => o.UserID === selectedOwnerID));
    });
    document.getElementById('petSpeciesFilter')?.addEventListener('change', () => {
        if (selectedOwnerID === null) return;
        renderPets(owners.find(o => o.UserID === selectedOwnerID));
    });
    document.getElementById('petGenderFilter')?.addEventListener('change', () => {
        if (selectedOwnerID === null) return;
        renderPets(owners.find(o => o.UserID === selectedOwnerID));
    });
});