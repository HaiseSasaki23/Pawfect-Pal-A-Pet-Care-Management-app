const form = document.getElementById("resetForm");

const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");

form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const newPassword = document.getElementById("newPassword").value;

    try {
        const response = await fetch("http://localhost:5182/api/Auth/reset-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token,
                newPassword
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert("Password reset successful.");
            window.location.href = "../login/login.html";
        } else {
            alert(data.message || "Reset failed.");
        }

    } catch (err) {
        console.error(err);
        alert("Server error.");
    }
});