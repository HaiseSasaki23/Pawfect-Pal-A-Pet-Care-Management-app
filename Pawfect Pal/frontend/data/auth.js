function triggerLogout() {
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmBtn = document.getElementById('btnConfirmDelete');
    const modal = document.getElementById('confirmModal');

    // fallback if modal doesn't exist
    if (!confirmMessage || !confirmBtn || !modal) {
        if (confirm("Are you sure you want to logout?")) {
            logoutNow();
        }
        return;
    }

    confirmMessage.innerText = "Are you sure you want to log out of Pawfect Pal?";
    confirmBtn.innerText = "Logout";
    confirmBtn.style.backgroundColor = "#ff5e78";

    confirmBtn.onclick = logoutNow;

    modal.style.display = 'flex';
}

function logoutNow() {
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("role");

    window.location.href = "../login/login.html";
}