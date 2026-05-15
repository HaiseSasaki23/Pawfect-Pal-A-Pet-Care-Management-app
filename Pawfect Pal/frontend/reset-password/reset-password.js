const form = document.getElementById("resetForm");

const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");

// ── Modal helpers ──
const successModal = document.getElementById("successModal");
const errorModal   = document.getElementById("errorModal");
const errorMsg     = document.getElementById("errorModalMsg");

document.getElementById("successOkBtn").addEventListener("click", () => {
    window.location.href = "../login/login.html";
});

document.getElementById("errorOkBtn").addEventListener("click", () => {
    errorModal.classList.remove("active");
});

function showSuccess() { successModal.classList.add("active"); }
function showError(msg) {
    errorMsg.textContent = msg || "Something went wrong. Please try again.";
    errorModal.classList.add("active");
}

// ── Eye toggles ──
document.getElementById("toggle-pass").addEventListener("change", function () {
    document.getElementById("newPassword").type = this.checked ? "text" : "password";
});

document.getElementById("toggle-confirm").addEventListener("change", function () {
    document.getElementById("confirmPassword").type = this.checked ? "text" : "password";
});

// ── Form submit ──
form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const newPassword     = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
        showError("Passwords do not match. Please try again.");
        return;
    }

    // Character validation
    if (newPassword.length < 8) {
        showError("Password must be at least 8 characters long.");
        return;
    }
    if (!/[a-zA-Z]/.test(newPassword)) {
        showError("Password must include at least one letter.");
        return;
    }
    if (!/[0-9]/.test(newPassword)) {
        showError("Password must include at least one number.");
        return;
    }
    if (!/[^a-zA-Z0-9]/.test(newPassword)) {
        showError("Password must include at least one symbol (e.g. !@#$%).");
        return;
    }

    try {
        const response = await fetch("http://localhost:5182/api/Auth/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, newPassword })
        });

        const data = await response.json();

        if (response.ok) {
            showSuccess();
        } else {
            if (response.status === 400) {
                showError(data.message || "Invalid or expired reset link. Please request a new one.");
            } else if (response.status === 404) {
                showError("Account not found. Please check your reset link.");
            } else if (response.status === 401) {
                showError("Your reset link has expired. Please request a new one.");
            } else {
                showError(data.message || "Reset failed. Please try again.");
            }
        }

    } catch (err) {
        console.error(err);
        showError("Cannot connect to the server. Please check your internet connection.");
    }
});