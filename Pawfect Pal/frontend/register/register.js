const registerForm = document.getElementById("registerForm");

registerForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const userName = document.getElementById("userName").value.trim();
    const ownerFName = document.getElementById("ownerFName").value.trim();
    const ownerLName = document.getElementById("ownerLName").value.trim();
    const email = document.getElementById("email").value.trim();
    const contactNum = document.getElementById("contactNum").value.trim();
    const address = document.getElementById("address").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    if (!userName || !ownerFName || !ownerLName || !contactNum || !address || !email || !password || !confirmPassword) {
        alert("Please fill in all fields.");
        return;
    }
    
    if (!email.includes("@")) {
        alert("Please enter a valid email address.");
        return;
    }
    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    try {
        const response = await fetch("http://localhost:5182/api/Auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userName,
                ownerFName,
                ownerLName,
                contactNum,
                address,
                email,
                password
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message || "Registration successful.");
            window.location.href = "../login/login.html";
        } else {
            alert(data.message || "Registration failed.");
        }
    } catch (error) {
        console.error("Register error:", error);
        alert("Could not connect to the server.");
    }
});