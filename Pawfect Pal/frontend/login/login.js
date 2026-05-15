const loginForm = document.getElementById("loginForm");
const passInput = document.getElementById("password");
const toggleBtn = document.getElementById("toggle-check");
const petImg = document.getElementById("main-pet-img");
const bubble = document.getElementById("speech-bubble");
const usernameInput = document.getElementById("userName");

function updatePasswordState() {
    if (toggleBtn.checked) {
        passInput.type = "text";
        petImg.src = "login-img/peeking.png";
        bubble.innerText = "I'm watching!";
    } else {
        passInput.type = "password";
        petImg.src = "login-img/covered-eyes.png";
        bubble.innerText = "I'm not looking!";
    }
}

toggleBtn.addEventListener("change", updatePasswordState);
passInput.addEventListener("focus", updatePasswordState);

usernameInput.addEventListener("focus", () => {
    petImg.src = "login-img/sit.png";
    bubble.innerText = "Paws-itively Organized Pet Care";
});

const forgotLink = document.getElementById("forgotPasswordLink");
const forgotModal = document.getElementById("forgotModal");
const modalClose = document.getElementById("modalClose");
const sendResetBtn = document.getElementById("sendResetBtn");

forgotLink.addEventListener("click", function (e) {
    e.preventDefault();
    forgotModal.classList.add("active");
});

modalClose.addEventListener("click", function () {
    forgotModal.classList.remove("active");
});

forgotModal.addEventListener("click", function (e) {
    if (e.target === forgotModal) {
        forgotModal.classList.remove("active");
    }
});

sendResetBtn.addEventListener("click", async function () {
    const email = document.getElementById("resetEmail").value.trim();
    if (!email) {
        alert("Please enter your email address.");
        return;
    }

    try {
        const response = await fetch("http://localhost:5182/api/Auth/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (!response.ok) {
            document.getElementById("failedModalMessage").innerText = data.message || "Failed to send reset link.";
            document.getElementById("failedModal").classList.add("active");
            return;
        }

        forgotModal.classList.remove("active");
        document.getElementById("successModal").classList.add("active");
    } catch (error) {
        console.error("Reset error:", error);
        document.getElementById("failedModalMessage").innerText = "Could not connect to the server.";
        document.getElementById("failedModal").classList.add("active");
    }
});

document.getElementById("successModalClose").addEventListener("click", function () {
    document.getElementById("successModal").classList.remove("active");
});
document.getElementById("successModalOkBtn").addEventListener("click", function () {
    document.getElementById("successModal").classList.remove("active");
});
document.getElementById("successModal").addEventListener("click", function (e) {
    if (e.target === document.getElementById("successModal")) {
        document.getElementById("successModal").classList.remove("active");
    }
});

document.getElementById("failedModalClose").addEventListener("click", function () {
    document.getElementById("failedModal").classList.remove("active");
});
document.getElementById("failedModalOkBtn").addEventListener("click", function () {
    document.getElementById("failedModal").classList.remove("active");
});
document.getElementById("failedModal").addEventListener("click", function (e) {
    if (e.target === document.getElementById("failedModal")) {
        document.getElementById("failedModal").classList.remove("active");
    }
});

loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    
    const login = usernameInput.value.trim();
    const password = passInput.value.trim();

    if (!login || !password) {
        alert("Email/Username and password are required.");
        return;
    }

    try {
        const response = await fetch("http://localhost:5182/api/Auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ login, password })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Login failed.");
            return;
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("userName", data.userName);
        localStorage.setItem("ownerFName", data.ownerFName);
        localStorage.setItem("ownerLName", data.ownerLName);
        localStorage.setItem("role", data.role);

        if (data.role.toLowerCase() === "admin") {
            window.location.href = "../admin/a-dashboard/a-dashboard.html";
        } else {
            window.location.href = "../user/dashboard/dashboard.html";
        }
    } catch (error) {
        console.error("Login error:", error);
        alert("Could not connect to the server.");
    }
});