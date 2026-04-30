function getCurrentUser() {
    return {
        userId: localStorage.getItem("userId"),
        userName: localStorage.getItem("userName"),
        ownerFName: localStorage.getItem("ownerFName"),
        ownerLName: localStorage.getItem("ownerLName"),
        role: localStorage.getItem("role")
    };
}

function requireLogin(expectedRole = null) {
    const user = getCurrentUser();

    if (!user.userId || !user.role) {
        alert("You are not logged in.");
        window.location.href = "../../login/login.html";
        return null;
    }

    if (expectedRole && user.role.toLowerCase() !== expectedRole.toLowerCase()) {
        alert("Access denied.");
        window.location.href = "../../login/login.html";
        return null;
    }

    loadUserDisplay(user);
    return user;
}

function loadUserDisplay(user = getCurrentUser()) {
    const sidebarFName = document.getElementById("sidebarOwnerFName");
    const sidebarLName = document.getElementById("sidebarOwnerLName");
    const welcomeName = document.getElementById("welcomeOwnerFName");

    if (sidebarFName) sidebarFName.textContent = user.userName || "Guest";
    if (sidebarLName) sidebarLName.textContent = "";

    if (welcomeName) {
        const fullName = `${user.ownerFName || ""}`.trim();
        welcomeName.textContent = fullName || user.userName || "User";
    }
}

function initImageLoading() {
    document.querySelectorAll("img").forEach(img => {
        if (img.complete) {
            img.classList.add("loaded");
        } else {
            img.addEventListener("load", () => {
                img.classList.add("loaded");
            });
        }
    });
}

function triggerLogout() {
    const confirmMessage = document.getElementById("confirmMessage");
    const confirmBtn = document.getElementById("btnConfirmDelete");
    const modal = document.getElementById("confirmModal");

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

    modal.style.display = "flex";
}

function logoutNow() {
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("ownerFName");
    localStorage.removeItem("ownerLName");
    localStorage.removeItem("role");

    window.location.href = "../../login/login.html";
}

document.addEventListener("DOMContentLoaded", () => {
    initImageLoading();
});