function ensureAuthModalExists() {
    if (document.getElementById("authRequiredModal")) return;

    const modalHTML = `
        <div id="authRequiredModal" style="
            display:none;
            position:fixed;
            top:0;
            left:0;
            right:0;
            bottom:0;
            margin:0;
            background:rgba(0,0,0,0.55);
            justify-content:center;
            align-items:center;
            z-index:99999;
            pointer-events:auto;
        ">
        <div style="
            background:#fff;
            padding:28px;
            border-radius:22px;
            width:360px;
            text-align:center;
            box-shadow:0 10px 35px rgba(0,0,0,0.18);
        ">
            <h3 style="
                color:#9d72d6;
                font-size:22px;
                margin-bottom:14px;
                font-weight:700;
            ">Authentication Required</h3>

            <p style="
                color:#4a4a4a;
                margin-bottom:24px;
                line-height:1.5;
            ">You are not logged in.</p>

            <button id="authLoginBtn" style="
                width:100%;
                padding:14px 16px;
                border:none;
                border-radius:12px;
                color:#fff;
                cursor:pointer;
                background:#9d72d6;
                font-weight:700;
                font-size:15px;
            ">Login</button>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
}

function getCurrentUser() {
    return {
        userId: localStorage.getItem("userId"),
        userName: localStorage.getItem("userName"),
        ownerFName: localStorage.getItem("ownerFName"),
        ownerLName: localStorage.getItem("ownerLName"),
        role: localStorage.getItem("role")
    };
}

function showAuthRequiredModal() {
    ensureAuthModalExists();

    const modal = document.getElementById("authRequiredModal");
    const loginBtn = document.getElementById("authLoginBtn");

    loginBtn.onclick = function () {
        window.location.href = "../../login/login.html";
    };

    modal.onclick = function (e) {
        e.stopPropagation();
    };

    modal.style.display = "flex";
}

function requireLogin(expectedRole = null) {
    const user = getCurrentUser();

    if (!user.userId || !user.role) {
        showAuthRequiredModal();
        return null;
    }

    if (expectedRole && user.role.toLowerCase() !== expectedRole.toLowerCase()) {
        showAuthRequiredModal();
        return null;
    }

    loadUserDisplay(user);
    return user;
}

function showAlert(message, title = "Notice", buttonText = "OK", callback = null) {
    ensureModalExists();

    const modal = document.getElementById("confirmModal");
    const confirmMessage = document.getElementById("confirmMessage");
    const confirmBtn = document.getElementById("btnConfirmDelete");

    // works for existing page modals too
    const modalTitle =
        document.getElementById("modalTitle") ||
        modal.querySelector(".modal-header h2") ||
        modal.querySelector("h2") ||
        modal.querySelector("h3");

    if (modalTitle) modalTitle.innerText = title;
    if (confirmMessage) confirmMessage.innerText = message;

    // hide every other button except main button
    const allButtons = modal.querySelectorAll("button");
    allButtons.forEach(btn => {
        if (btn !== confirmBtn) {
            btn.style.display = "none";
        }
    });

    confirmBtn.innerText = buttonText;
    confirmBtn.style.backgroundColor = "#9d72d6";
    confirmBtn.style.width = "100%";
    confirmBtn.style.flex = "none";

    confirmBtn.onclick = function () {
        modal.style.display = "none";
        if (callback) callback();
    };

    // stronger blur/dim
    modal.style.background = "rgba(0, 0, 0, 0.45)";
    modal.style.backdropFilter = "blur(10px)";
    modal.style.webkitBackdropFilter = "blur(10px)";
    modal.style.pointerEvents = "auto";

    // prevent outside click interaction
    modal.onclick = function (e) {
        e.stopPropagation();
    };

    modal.style.display = "flex";
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

    const modalTitle =
        modal.querySelector(".modal-header h2") ||
        modal.querySelector("h2") ||
        modal.querySelector("h3");

    if (modalTitle) modalTitle.innerText = "Confirm Action";

    confirmMessage.innerText = "Are you sure you want to log out of Pawfect Pal?";
    confirmBtn.innerText = "Logout";
    confirmBtn.style.backgroundColor = "#ff5e78";

    const allButtons = modal.querySelectorAll("button");
    allButtons.forEach(btn => {
        btn.style.display = "";
    });

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