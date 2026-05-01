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

loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const userName = usernameInput.value.trim();
    const password = passInput.value.trim();

    if (!userName || !password) {
        alert("Username and password are required.");
        return;
    }

    try {
        const response = await fetch("http://localhost:5182/api/Auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ userName, password })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Login failed.");
            return;
        }

        localStorage.setItem("userId", data.userId);
        localStorage.setItem("userName", data.userName);
        localStorage.setItem("ownerFName", data.ownerFName);
        localStorage.setItem("ownerLName", data.ownerLName);
        localStorage.setItem("role", data.role);

        if (data.role.toLowerCase() === "admin") {
            window.location.href = "../admin/dashboard/dashboard.html";
        } else {
            window.location.href = "../user/dashboard/dashboard.html";
        }
    } catch (error) {
        console.error("Login error:", error);
        alert("Could not connect to the server.");
    }
});