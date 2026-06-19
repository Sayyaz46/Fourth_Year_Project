const API_URL = "http://localhost:5000/api/auth";

// Handle both Login and Register
document.addEventListener("DOMContentLoaded", () => {
    // Register Form
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            handleRegister();
        });
    }

    // Login Form
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            handleLogin();
        });
    }
});

async function handleRegister() {
    const name = document.getElementById("name")?.value;
    const email = document.getElementById("email")?.value;
    const password = document.getElementById("password")?.value;
    const role = document.getElementById("role")?.value;

    if (!name || !email || !password || !role) {
        alert("Please fill all fields");
        return;
    }

    try {
        const res = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password, role })
        });

        const data = await res.json();

        if (res.ok) {
            alert("Registration successful!");
            localStorage.setItem("user", JSON.stringify(data));
            redirectUser(data.role);
        } else {
            alert(data.message || "Registration failed");
        }
    } catch (error) {
        console.error(error);
        alert("Server error. Please try again later.");
    }
}

async function handleLogin() {
    const email = document.getElementById("loginEmail")?.value;
    const password = document.getElementById("loginPassword")?.value;

    if (!email || !password) {
        alert("Please enter email and password");
        return;
    }

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            alert("Login successful!");
            localStorage.setItem("user", JSON.stringify(data));
            redirectUser(data.role);
        } else {
            alert(data.message || "Invalid credentials");
        }
    } catch (error) {
        console.error(error);
        alert("Server error. Please try again later.");
    }
}

function redirectUser(role) {
    switch (role) {
        case "admin":
            window.location.href = "admin-dashboard.html";
            break;
        case "owner":
            window.location.href = "owner-dashboard.html"; // or tenant if needed
            break;
        default:
            window.location.href = "tenant-dashboard.html";
    }
}