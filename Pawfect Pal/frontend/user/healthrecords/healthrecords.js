document.addEventListener("DOMContentLoaded", function () {
    const user = requireLogin("User");
    if (!user) return;

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

function openFullHistory() {
    const modal = document.getElementById('mainModal');
    // If you need to change data dynamically later, you'd do it here.
    // For now, we just show the modal.
    modal.style.display = 'flex';
}

function closeModal(modalId) { 
    document.getElementById(modalId).style.display = 'none'; 
}

function triggerLogout() {
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmBtn = document.getElementById('btnConfirmDelete');

    confirmMessage.innerText = "Are you sure you want to log out of Pawfect Pal?";
    confirmBtn.innerText = "Logout";
    confirmBtn.style.backgroundColor = "#ff5e78";

    confirmBtn.onclick = function() {
        window.location.href = "login.html"; 
    };

    confirmModal.style.display = 'flex';
}

