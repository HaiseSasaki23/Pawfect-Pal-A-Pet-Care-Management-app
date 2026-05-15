const modal = document.getElementById('mainModal');
const confirmModal = document.getElementById('confirmModal');
let requests = [];

function getAuthHeaders() {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    console.log('Token being used:', token ? 'Present (length: ' + token.length + ')' : 'MISSING');
    
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    } else {
        console.warn('No authentication token found in localStorage!');
    }
    
    return headers;
}

async function loadRequests() {
    console.log("Loading requests...");
    
    const tableBody = document.getElementById('requestTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="padding: 50px; text-align: center;">
                    <div>🔄 Loading requests...</div>
                </td>
            </tr>
        `;
    }
    
    try {
        const url = "http://localhost:5182/api/Appointment";
        console.log("Fetching from:", url);
        
        const headers = getAuthHeaders();
        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });
        
        console.log("Response status:", response.status);
        
        if (response.status === 401 || response.status === 403) {
            console.error("Authentication failed!");
            showErrorInTable("Authentication failed. Please log in again.", true);
            return;
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Data received:", data);
        
        if (!Array.isArray(data)) {
            throw new Error("Invalid data format received");
        }
        
        if (data.length > 0) {
            console.log("Available fields in appointment:", Object.keys(data[0]));
            console.log("Sample appointment data:", data[0]);
        }
        
        const pendingRequests = data.filter(a => {
            const status = a.requestStatus || a.RequestStatus;
            return status === "Pending";
        });
        
        console.log(`Found ${pendingRequests.length} pending requests`);
        
        requests = pendingRequests.map(a => {
            const firstName = a.ownerFName || a.OwnerFName || a.firstName || a.FirstName || "";
            const lastName = a.ownerLName || a.OwnerLName || a.lastName || a.LastName || "";
            const userId = a.userId || a.UserId;
            
            let ownerDisplay = "";
            if (firstName || lastName) {
                ownerDisplay = `${firstName} ${lastName}`.trim();
            } else if (userId) {
                ownerDisplay = `User #${userId}`;
            } else {
                ownerDisplay = "Pet Owner";
            }
            
            let finalFirstName = firstName;
            let finalLastName = lastName;
            if (!finalFirstName && ownerDisplay !== "Pet Owner") {
                const nameParts = ownerDisplay.split(' ');
                finalFirstName = nameParts[0] || "";
                finalLastName = nameParts.slice(1).join(' ') || "";
            }
            
            return {
                type: "appointment",
                AppointmentID: a.appointmentId || a.AppointmentId,
                PetID: a.petId || a.PetID,
                Name: a.petName || a.PetName || `Pet ${a.petId || a.PetID}`,
                ownerFName: finalFirstName,
                ownerLName: finalLastName,
                ownerDisplay: ownerDisplay, // For display purposes
                userId: userId,
                Date: new Date(a.appointmentDate || a.AppointmentDate).toLocaleDateString(),
                Services: a.services || a.Services || [],
                requestStatus: a.requestStatus || a.RequestStatus,
                Species: a.species || a.Species,
                Breed: a.breed || a.Breed,
                Color: a.color || a.Color,
                Gender: a.gender || a.Gender,
                Birthdate: a.birthdate || a.Birthdate,
                appointmentDate: a.appointmentDate || a.AppointmentDate
            };
        });
        
        console.log("Mapped requests with owner info:", requests);
        
        if (requests.length === 0) {
            showEmptyState();
        } else {
            loadRequestData(requests);
            populateOwnerFilter(requests);
        }
        
        updateRequestSummary();
        
    } catch (error) {
        console.error("Load requests error:", error);
        showErrorInTable(error.message);
    }
}

function showErrorInTable(message, isAuthError = false) {
    const tableBody = document.getElementById('requestTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="padding: 50px; text-align: center;">
                    <div style="color: #ff5e78; margin-bottom: 10px;">❌ Error: ${message}</div>
                    ${isAuthError ? 
                        '<button onclick="window.location.href=\'../login/login.html\'" style="padding: 10px 20px; background: var(--primary-purple); color: white; border: none; border-radius: 8px; cursor: pointer;">Go to Login</button>' :
                        '<button onclick="loadRequests()" style="padding: 10px 20px; background: var(--primary-purple); color: white; border: none; border-radius: 8px; cursor: pointer;">Retry</button>'
                    }
                </td>
            </tr>
        `;
    }
}

function showEmptyState() {
    const tableBody = document.getElementById('requestTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="padding: 80px 0; text-align: center;">
                    <div class="empty-state-container">
                        <img src="img-request/no-requests.png" alt="No Requests" 
                             style="width: 280px; height: 280px; object-fit: contain; margin-bottom: 25px; opacity: 0.7;">
                        <h3 style="color: var(--primary-purple); font-size: 22px; margin-bottom: 10px;">No Pending Requests</h3>
                        <p style="color: var(--text-muted); font-size: 15px;">There are no pending appointment requests at this time.</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

function loadRequestData(dataArray) {
    const tableBody = document.getElementById('requestTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    dataArray.forEach(item => {
        const row = document.createElement('tr');
        row.style.borderBottom = "1px solid #f9f9f9";
        row.setAttribute('ownerFName', item.ownerFName || "");
        row.setAttribute('ownerLName', item.ownerLName || "");
        
        const ownerFullName = item.ownerDisplay || 
            (item.ownerFName + ' ' + item.ownerLName).trim() || 
            `User ${item.userId || 'Unknown'}`;
        
        const escapedName = item.Name.replace(/'/g, "\\'");
        
        let displayDate = item.Date || 'N/A';
        if (item.appointmentDate) {
            try {
                const date = new Date(item.appointmentDate);
                displayDate = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            } catch(e) {
                displayDate = item.Date || 'N/A';
            }
        }
        
        row.innerHTML = `
            <td style="padding: 15px;">
                <span style="background: #e8f5ee; color: #2d6a4f; padding: 5px 12px; border-radius: 8px; font-size: 11px; font-weight: 700;">APPT</span>
            </td>
            <td style="padding: 15px; font-weight: 500;">
                ${item.Name}
            </td>
            <td style="padding: 15px;">
                <strong>${ownerFullName}</strong>
            </td>
            <td style="padding: 15px;">${displayDate}</td>
            <td style="padding: 15px;">
                <div style="display: flex; gap: 8px;">
                    <button class="action-btn-circle btn-details" onclick='viewPetDetails(${JSON.stringify(item)}, "appt")' title="View Details" style="cursor: pointer; background: #ede3ff; border: none; border-radius: 8px; padding: 8px;">
                        📋
                    </button>
                    <button class="action-btn-circle btn-approve" onclick="confirmAction('approve', ${item.AppointmentID}, '${escapedName}')" title="Approve" style="cursor: pointer; background: #e8f5ee; border: none; border-radius: 8px; padding: 8px;">
                        ✅
                    </button>
                    <button class="action-btn-circle btn-decline" onclick="confirmAction('decline', ${item.AppointmentID}, '${escapedName}')" title="Decline" style="cursor: pointer; background: #fff0f3; border: none; border-radius: 8px; padding: 8px;">
                        ❌
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    console.log(`Rendered ${dataArray.length} requests`);
}

function updateRequestSummary() {
    const pending = requests.length;
    const approved = 0;
    const declined = 0;
    
    const pendingEl = document.getElementById("pendingCount");
    const approvedEl = document.getElementById("approvedCount");
    const declineEl = document.getElementById("declineCount");
    const totalEl = document.getElementById("totalRequestCount");
    
    if (pendingEl) pendingEl.textContent = pending;
    if (approvedEl) approvedEl.textContent = approved;
    if (declineEl) declineEl.textContent = declined;
    if (totalEl) totalEl.textContent = requests.length;
}

function populateOwnerFilter(dataArray) {
    const ownerFilter = document.getElementById('ownerFilter');
    if (!ownerFilter) return;
    
    const uniqueOwners = [...new Set(dataArray.map(item => 
        item.ownerDisplay || (item.ownerFName + ' ' + item.ownerLName).trim() || `User ${item.userId}`
    ))];
    
    ownerFilter.innerHTML = '<option value="">All Owners</option>';
    uniqueOwners.sort().forEach(owner => {
        if (owner && owner.trim()) {
            const option = document.createElement('option');
            option.value = owner;
            option.textContent = owner;
            ownerFilter.appendChild(option);
        }
    });
}

function applyAllFilters() {
    const searchVal = (document.getElementById('requestSearchInput')?.value || "").toLowerCase().trim();
    const typeVal = document.getElementById('requestTypeFilter')?.value || "all";
    const ownerVal = (document.getElementById('ownerFilter')?.value || "").trim();
    
    const rows = document.querySelectorAll('#requestTableBody tr');
    
    rows.forEach(row => {
        const petName = row.cells[1]?.innerText.toLowerCase() || "";
        const ownerName = row.cells[2]?.innerText.toLowerCase() || "";
        
        const matchesSearch = searchVal === "" || petName.includes(searchVal) || ownerName.includes(searchVal);
        const matchesOwner = ownerVal === "" || ownerName === ownerVal.toLowerCase();
        
        row.style.display = matchesSearch && matchesOwner ? "" : "none";
    });
}

function viewPetDetails(petData, type) {
    console.log("View details:", petData);
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    if (!modalTitle || !modalBody) return;
    
    const ownerDisplay = petData.ownerDisplay || 
        (petData.ownerFName + ' ' + petData.ownerLName).trim() || 
        `User ${petData.userId || 'Unknown'}`;
    
    modalTitle.innerText = type === 'appt' ? "Appointment Details" : "Pet Information";
    modalBody.innerHTML = `
        <div style="padding: 20px;">
            <p><strong>📋 Appointment ID:</strong> ${petData.AppointmentID}</p>
            <p><strong>🐾 Pet Name:</strong> ${petData.Name}</p>
            <p><strong>👤 Owner:</strong> ${ownerDisplay}</p>
            <p><strong>📅 Date:</strong> ${petData.Date || 'N/A'}</p>
            <p><strong>🛠️ Services:</strong> ${Array.isArray(petData.Services) && petData.Services.length ? petData.Services.join(', ') : (petData.Services || 'No services listed')}</p>
            <p><strong>📊 Status:</strong> ${petData.requestStatus || 'Pending'}</p>
        </div>
    `;
    
    document.getElementById('mainModal').style.display = 'flex';
}

function confirmAction(actionType, appointmentId, petName) {
    const modal = document.getElementById('requestActionModal');
    const title = document.getElementById('requestActionTitle');
    const msg = document.getElementById('requestActionMessage');
    const btn = document.getElementById('btnConfirmRequest');
    
    if (!modal) return;
    
    modal.style.display = 'flex';
    
    if (actionType === 'approve') {
        title.innerText = "Approve Request";
        title.style.color = "#2d6a4f";
        msg.innerHTML = `Are you sure you want to approve the request for "${petName}"?`;
        btn.innerText = "Approve";
        btn.onclick = () => {
            closeModal('requestActionModal');
            processApproval(appointmentId);
        };
    } else {
        title.innerText = "Decline Request";
        title.style.color = "#ff5e78";
        msg.innerHTML = `Are you sure you want to decline the request for "${petName}"?`;
        btn.innerText = "Decline";
        btn.onclick = () => {
            closeModal('requestActionModal');
            processDecline(appointmentId);
        };
    }
}

async function processApproval(appointmentId) {
    try {
        const response = await fetch(`http://localhost:5182/api/Appointment/${appointmentId}/request-status`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: "Confirmed" })
        });
        
        if (!response.ok) throw new Error("Approval failed");
        
        const result = await response.json();
        console.log("Approval result:", result);
        
        alert("✅ Request approved successfully!");
        loadRequests();
        
    } catch (error) {
        console.error("Approve error:", error);
        alert("❌ Failed to approve request: " + error.message);
    }
}

async function processDecline(appointmentId) {
    try {
        const response = await fetch(`http://localhost:5182/api/Appointment/${appointmentId}/request-status`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: "Denied" })
        });
        
        if (!response.ok) throw new Error("Decline failed");
        
        const result = await response.json();
        console.log("Decline result:", result);
        
        alert("❌ Request declined successfully!");
        loadRequests(); // Refresh the list
        
    } catch (error) {
        console.error("Decline error:", error);
        alert("Failed to decline request: " + error.message);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

function toggleAppointmentFilters(value) {
    const appointmentUI = document.getElementById('appointmentFilters');
    if (appointmentUI) {
        appointmentUI.style.display = value === 'appointment' ? 'flex' : 'none';
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("Page loaded, initializing...");
    
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) {
        console.warn("No token found! User may not be logged in");
        showErrorInTable("Please log in to view requests", true);
        return;
    }
    
    const userNameEl = document.getElementById('UserName');
    if (userNameEl) {
        userNameEl.textContent = localStorage.getItem("userName") || "Admin User";
    }
    
    loadRequests();
    
    const searchInput = document.getElementById('requestSearchInput');
    const ownerFilter = document.getElementById('ownerFilter');
    const typeFilter = document.getElementById('requestTypeFilter');
    
    if (searchInput) searchInput.addEventListener('keyup', applyAllFilters);
    if (ownerFilter) ownerFilter.addEventListener('change', applyAllFilters);
    if (typeFilter) typeFilter.addEventListener('change', applyAllFilters);
});