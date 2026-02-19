const API_URL = "http://localhost:5000/api/auth";

// REGISTER
const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, email, password, role })
    });

    const data = await res.json();

    if (res.ok) {
      alert("Registration successful!");
      localStorage.setItem("user", JSON.stringify(data));
      redirectUser(data.role);
    } else {
      alert(data.message);
    }
  });
}

// LOGIN
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      alert("Login successful!");
      localStorage.setItem("user", JSON.stringify(data));
      redirectUser(data.role);
    } else {
      alert(data.message);
    }
  });
}

// ROLE BASED REDIRECT
function redirectUser(role) {
  if (role === "admin") {
    window.location.href = "admin-dashboard.html";
  } else if (role === "owner") {
    window.location.href = "owner-dashboard.html";
  } else {
    window.location.href = "tenant-dashboard.html";
  }
}
