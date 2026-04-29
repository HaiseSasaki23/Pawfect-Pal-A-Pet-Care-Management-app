window.onload = function() {
    const today = new Date()
        .toISOString()
        .split('T')[0];
    
    const bookingDate = document.getElementById('bookingDate');
    
    if (bookingDate) {
        bookingDate.setAttribute('min', today);
    }
};

/* --- modal control functions --- */

function openModal(id) {
    const modal = document.getElementById(id);
    
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    
    if (modal) {
        modal.style.display = 'none';
        
        const form = modal.querySelector('form');
        
        if (form) {
            form.reset();
            
            /* reset dynamic visual elements within the form */
            const gcashBox = document.getElementById('gcashDetails');
            
            if (gcashBox) {
                gcashBox.style.display = 'none';
            }
            
            const totalText = document.getElementById('bookingTotal');
            
            if (totalText) {
                totalText.innerText = '₱0';
            }
        }
    }
}

/* --- service calculation logic --- */
document.querySelectorAll('input[name="services"]')
    .forEach(function(checkbox) {
        checkbox.addEventListener('change', function() {
            let total = 0;
            
            const checkedServices = document.querySelectorAll('input[name="services"]:checked');
            
            checkedServices.forEach(function(checked) {
                const price = parseInt(checked.getAttribute('data-price'));
                total += price;
            });
            
            const totalDisplay = document.getElementById('bookingTotal');
            
            if (totalDisplay) {
                totalDisplay.innerText = '₱' + total.toLocaleString();
            }
        });
    });

/* --- gcash detail toggle --- */

function toggleGcashDetails() {
    const paymentSelect = document.getElementById('bookingPayment');
    const paymentValue = paymentSelect.value;
    const gcashBox = document.getElementById('gcashDetails');
    
    if (gcashBox) {
        if (paymentValue === 'GCash') {
            gcashBox.style.display = 'block';
        } else {
            gcashBox.style.display = 'none';
        }
    }
}

/* --- form submission logic --- */
document.getElementById('bookAppointmentForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // 1. collect data
    const selectedServiceElements = document.querySelectorAll('input[name="ServiceID"]:checked');
    const serviceIDs = Array.from(selectedServiceElements).map(el => parseInt(el.value));

    const datePart = document.getElementById('bookingDate').value;
    const timePart = document.getElementById('bookingTime').value;
    const fullDateTime = `${datePart} ${timePart}:00`;

    // 2. construct the payload
    const appointmentPayload = {
        appointment: {
            PetID: parseInt(document.getElementById('bookingPetName').value),
            AppointmentDate: fullDateTime,
            RequestStatus: "Pending", 
            AppStatus: "Pending",     
            Notes: document.getElementById('gcashRef').value || "",
            UserID: 1 
        },
        services: serviceIDs 
    };

    console.log("Junction-Table Ready Data:", appointmentPayload);

    // 3. THE MAGIC STEPS:
    closeModal('bookAppointmentModal'); 
    showSuccessMessage();             
});

function showSuccessMessage() {
    const successToast = document.getElementById('successToast');
    if (successToast) {
        successToast.style.display = 'flex';
    }
}

function hideSuccessMessage() {
    const successToast = document.getElementById('successToast');
    if (successToast) {
        successToast.style.display = 'none';
    }
}

/* --- Unified Filter Logic --- */
function filterAppointments() {
    const searchVal = document.getElementById('appSearch').value.toLowerCase();
    const speciesVal = document.getElementById('speciesFilter').value.toLowerCase();
    const statusVal = document.getElementById('statusSelect').value.toLowerCase();
    
    // get IDs of checked service filters from the DROPDOWN
    const checkedServiceInputs = document.querySelectorAll('.service-filter-check:checked');
    const selectedServiceIDs = Array.from(checkedServiceInputs).map(input => input.value);

    const cards = document.querySelectorAll('.appointment-card');
    
    cards.forEach(card => {
        const petName = (card.getAttribute('data-pet') || "").toLowerCase();
        const species = (card.getAttribute('data-species') || "").toLowerCase();
        const status = (card.getAttribute('data-status') || "").toLowerCase();
        
        // get service IDs from card attribute (e.g., "1,2") and turn into an array
        const cardServicesAttr = card.getAttribute('data-services') || "";
        const cardServicesArray = cardServicesAttr ? cardServicesAttr.split(',') : [];

        const matchesSearch = petName.includes(searchVal);
        const matchesSpecies = (speciesVal === 'all' || species === speciesVal);
        const matchesStatus = (statusVal === 'all' || status === statusVal);
        
        // .every() ensures the card contains EVERY SINGLE ID selected in the filter
        const matchesService = selectedServiceIDs.length === 0 || 
                               selectedServiceIDs.every(id => cardServicesArray.includes(id));

        if (matchesSearch && matchesSpecies && matchesStatus && matchesService) {
            card.style.display = "grid";
        } else {
            card.style.display = "none";
        }
    });
}

/* --- clear all filters logic --- */
function clearAllFilters() {
    // 1. reset search input
    document.getElementById('appSearch').value = "";

    // 2. reset dropdowns to 'all'
    document.getElementById('speciesFilter').value = "all";
    document.getElementById('statusSelect').value = "all";

    // 3. uncheck all service checkboxes in the filter dropdown
    const serviceChecks = document.querySelectorAll('.service-filter-check');
    serviceChecks.forEach(check => check.checked = false);

    // 4. close the service dropdown if it's open
    document.querySelector('.dropdown-check-container').classList.remove('active');

    // 5. run the filter function to show all cards again
    filterAppointments();
}

function toggleServiceDropdown() {
    const container = document.querySelector('.dropdown-check-container');
    container.classList.toggle('active');
}

/* --- close dropdown when clicking outside --- */
window.addEventListener('click', function(e) {
    const container = document.querySelector('.dropdown-check-container');
    if (container && !container.contains(e.target)) {
        container.classList.remove('active');
    }
});

window.onclick = function(event) {
    if (event.target.classList.contains('modal-overlay')) {
        closeModal('bookAppointmentModal');
        closeModal('confirmModal');
    }
};

