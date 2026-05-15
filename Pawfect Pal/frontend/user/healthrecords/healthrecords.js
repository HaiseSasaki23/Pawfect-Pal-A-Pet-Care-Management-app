const API_BASE_URL = "http://localhost:5182";

document.addEventListener("DOMContentLoaded", async function () {

    const user = requireLogin("User");

    if (!user) return;

    await loadHealthRecords();
});

async function loadHealthRecords() {

    try {

        const userId = localStorage.getItem("userId");

        const response = await fetch(
            `${API_BASE_URL}/api/HealthRecord/user/${userId}`,
            {
                headers: getAuthHeaders()
            }
        );

        if (handleUnauthorized(response)) return;

        if (!response.ok) {
            throw new Error("Failed to load health records.");
        }

        const records = await response.json();

        renderHealthRecords(records);

    } catch (error) {

        console.error(
            "Health record error:",
            error
        );
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const user = requireLogin("User");
    if (!user) return;

    loadHealthRecords();
});

/* global gui elements */
const modal = document.getElementById('mainModal');
const confirmModal = document.getElementById('confirmModal');

document.addEventListener('DOMContentLoaded', () => {
    // 1. Define elements
    const searchInput = document.getElementById('petSearch');
    const speciesFilter = document.getElementById('statusFilter'); 
    const cards = document.querySelectorAll('.health-card');
    const emptyState = document.getElementById('emptyState');

    // 2. The combined Filter and Search function
    function filterRecords() {
        const searchTerm = searchInput.value.toLowerCase();
        const filterValue = speciesFilter.value.toLowerCase();
        let visibleCount = 0;

        cards.forEach(card => {
            // Check if the card has actual content before counting it
            const petName = card.querySelector('.pet-name').textContent.trim().toLowerCase();
            const petSpecies = (card.getAttribute('data-species') || "").toLowerCase();

            // If the card is empty (no name), we treat it as hidden
            if (petName === "") {
                card.style.display = 'none';
                return;
            }

            const matchesSearch = petName.includes(searchTerm);
            const matchesFilter = (filterValue === 'all' || petSpecies === filterValue);

            if (matchesSearch && matchesFilter) {
                card.style.display = 'flex';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        // Toggle Empty State image if no results found
        if (emptyState) {
            emptyState.style.display = (visibleCount === 0) ? 'flex' : 'none';
        }
    }

    // 3. Add Listeners
    if (searchInput) searchInput.addEventListener('input', filterRecords);
    if (speciesFilter) speciesFilter.addEventListener('change', filterRecords);

    // 4. RUN IMMEDIATELY on load to check for empty state
    filterRecords();
});

async function openFullHistory(petId) {

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/HealthRecord/pet/${petId}`,
            {
                headers: getAuthHeaders()
            }
        );

        if (handleUnauthorized(response)) return;

        if (!response.ok) {
            throw new Error(
                "Failed to load full history."
            );
        }

        const records = await response.json();

        if (!records.length) return;

        const latest = records[0];

        document.getElementById(
            "historyPetName"
        ).textContent =
            latest.petName || "Unknown";

        document.getElementById(
            "historyPetBreed"
        ).textContent =
            `${latest.breed || "Unknown Breed"} • ${calculateAge(latest.birthDate)}`;

        document.getElementById(
            "historyWeight"
        ).textContent =
            `${latest.weight || "--"} kg`;

        document.getElementById(
            "historyLastVisit"
        ).textContent =
            latest.dateRecorded
                ? new Date(
                    latest.dateRecorded
                ).toLocaleDateString()
                : "--";

        const tableBody =
            document.getElementById(
                "historyTableBody"
            );

        tableBody.innerHTML = "";

        records.forEach(record => {

            const row =
                document.createElement("tr");

            row.innerHTML = `

                <td>
                    ${
                        record.dateRecorded
                        ? new Date(
                            record.dateRecorded
                        ).toLocaleDateString()
                        : "--"
                    }
                </td>

                <td>
                    Health Check
                </td>

                <td>

                    Weight:
                    ${record.weight || "--"} kg

                    <br>

                    Vaccination:
                    ${record.vaccinationStatus || "--"}

                    <br>

                    Allergies:
                    ${record.allergies || "None"}

                </td>

                <td>

                    <span class="status-pill completed">

                        Active

                    </span>

                </td>

                <td>
                    ${record.notes || "None"}
                </td>
            `;

            tableBody.appendChild(row);
        });

        document.getElementById(
            "mainModal"
        ).style.display = "flex";

    } catch (error) {

        console.error(
            "Full history error:",
            error
        );
    }
}

function closeModal(modalId) { 
    document.getElementById(modalId).style.display = 'none'; 
}

function calculateAge(birthDate) {

    if (!birthDate)
        return "--";

    const today = new Date();
    const birth = new Date(birthDate);

    let years =
        today.getFullYear() -
        birth.getFullYear();

    let months =
        today.getMonth() -
        birth.getMonth();

    if (
        today.getDate() <
        birth.getDate()
    ) {
        months--;
    }

    if (months < 0) {
        years--;
        months += 12;
    }

    // Less than 1 year old
    if (years <= 0) {

        if (months <= 0)
            return "Less than 1 month old";

        return `${months} month${months > 1 ? "s" : ""} old`;
    }

    // 1 year and above
    return `${years} year${years > 1 ? "s" : ""} old`;
}

function renderHealthRecords(records) {

    const container =
        document.getElementById(
            "healthRecordsContainer"
        );

    if (!container) return;

    container.innerHTML = "";

    if (!records.length) {

        document.getElementById(
            "emptyState"
        ).style.display = "flex";

        return;
    }

    document.getElementById(
        "emptyState"
    ).style.display = "none";

    records.forEach(record => {

        const card =
            document.createElement("div");

        card.className = "health-card";

        card.setAttribute(
            "data-species",
            record.species || ""
        );

        card.innerHTML = `

            <div class="card-pet-info">

                <div class="avatar-container">

                    <img
                        src="../assets/default-pet.png"
                        alt="Pet"
                        class="pet-img"
                    >

                </div>

                <div class="pet-text">

                    <h3 class="pet-name">
                        ${record.petName || "Unknown"}
                    </h3>

                    <p class="pet-breed">
                        ${record.species || "Unknown"} •
                        ${record.breed || "Unknown Breed"} •
                        ${calculateAge(record.birthDate)}
                    </p>

                    <div class="mini-stats">

                        <div class="stat-item">

                            <span class="stat-label">
                                WEIGHT
                            </span>

                            <span class="stat-val">
                                ${record.weight || "--"} kg
                            </span>

                        </div>

                        <div class="stat-item">

                            <span class="stat-label">
                                LAST VISIT
                            </span>

                            <span class="stat-val">

                                ${
                                    record.dateRecorded
                                    ? new Date(
                                        record.dateRecorded
                                    ).toLocaleDateString()
                                    : "--"
                                }

                            </span>

                        </div>

                    </div>

                </div>

            </div>

            <div class="card-health-data">

                <div class="data-row">

                    <div class="data-label">

                        <img
                            src="user-health/vaccine.png"
                            class="label-icon"
                        >

                        <span>
                            Vaccination Status
                        </span>

                    </div>

                    <div class="status-pill completed">

                        ${record.vaccinationStatus || "--"}

                    </div>

                </div>

                <div class="data-row">

                    <div class="data-label">

                        <img
                            src="user-health/allergies.png"
                            class="label-icon"
                        >

                        <span>
                            Allergies
                        </span>

                    </div>

                    <div class="data-val">

                        ${record.allergies || "None"}

                    </div>

                </div>

                <div class="data-row">

                    <div class="data-label">

                        <img
                            src="user-health/date.png"
                            class="label-icon"
                        >

                        <span>
                            Date Recorded
                        </span>

                    </div>

                    <div class="data-val">

                        ${
                            record.dateRecorded
                            ? new Date(
                                record.dateRecorded
                            ).toLocaleDateString()
                            : "--"
                        }

                    </div>

                </div>

                <div class="data-row">

                    <div class="data-label">

                        <img
                            src="user-health/notes.png"
                            class="label-icon"
                        >

                        <span>
                            Notes
                        </span>

                    </div>

                    <div class="data-val">

                        ${record.notes || "None"}

                    </div>

                </div>

            </div>

            <div class="card-actions">

                <button
                    class="view-history-btn"
                    onclick="openFullHistory(${record.petId})">

                    <span>
                        View Full History
                    </span>

                    <span class="arrow">
                        ›
                    </span>

                </button>

            </div>
        `;
        container.appendChild(card);
    });
}