const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const userName = document.getElementById("userName").value.trim();
    const password = document.getElementById("password").value.trim();

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
            body: JSON.stringify({
                userName,
                password
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message || "Login successful.");

            // save for future use
            if (data.userId) localStorage.setItem("userId", data.userId);
            if (data.userName) localStorage.setItem("userName", data.userName);
            if (data.role) localStorage.setItem("role", data.role);

            // temporary redirect
            window.location.href = "../dashboard/dashboard.html";
        } else {
            alert(data.message || "Login failed.");
        }
    } catch (error) {
        console.error("Login error:", error);
        alert("Could not connect to the server.");
    }
});