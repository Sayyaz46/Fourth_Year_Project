const API_URL = "http://localhost:5000/api/auth";

// Password must contain:
// - Minimum 8 characters
// - One uppercase
// - One lowercase
// - One number
// - One special character
const passwordRegex =
/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#])[A-Za-z\d@$!%*?&.#]{8,}$/;

document.addEventListener("DOMContentLoaded", () => {

    const registerForm = document.getElementById("registerForm");

    if (registerForm) {

        const passwordInput = document.getElementById("password");

        const strength = document.createElement("div");

        strength.id = "passwordStrength";

        strength.style.marginTop = "8px";
        strength.style.fontWeight = "600";

        passwordInput.insertAdjacentElement("afterend", strength);

        passwordInput.addEventListener("input", () => {

            const value = passwordInput.value;

            if (value.length === 0) {

                strength.innerHTML = "";
                return;

            }

            if (passwordRegex.test(value)) {

                strength.innerHTML =
                    "<span style='color:green'>✔ Strong Password</span>";

            }

            else if (value.length >= 8) {

                strength.innerHTML =
                    "<span style='color:orange'>⚠ Medium Password</span>";

            }

            else {

                strength.innerHTML =
                    "<span style='color:red'>✖ Weak Password</span>";

            }

        });

        registerForm.addEventListener("submit", async (e) => {

            e.preventDefault();

            handleRegister();

        });

    }

    const loginForm = document.getElementById("loginForm");

    if (loginForm) {

        loginForm.addEventListener("submit", async (e) => {

            e.preventDefault();

            handleLogin();

        });

    }

});

async function handleRegister() {

    const name = document.getElementById("name").value.trim();

    const email = document.getElementById("email").value.trim();

    const password = document.getElementById("password").value;

    const role = document.getElementById("role").value;

    if (!name || !email || !password || !role) {

        alert("Please fill all fields.");

        return;

    }

    if (!passwordRegex.test(password)) {

        alert(
            "Password must contain:\n\n" +
            "• Minimum 8 characters\n" +
            "• One uppercase letter\n" +
            "• One lowercase letter\n" +
            "• One number\n" +
            "• One special character"
        );

        return;

    }

    try {

        const res = await fetch(`${API_URL}/register`, {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                name,
                email,
                password,
                role

            })

        });

        const data = await res.json();

        if (res.ok) {

            alert(data.message);

            window.location.href = "login.html";

        }

        else {

            alert(data.message);

        }

    }

    catch (err) {

        console.error(err);

        alert("Server Error");

    }

}

async function handleLogin() {

    const email = document.getElementById("loginEmail").value.trim();

    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {

        alert("Please enter email and password.");

        return;

    }

    try {

        const res = await fetch(`${API_URL}/login`, {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                email,
                password

            })

        });

        const data = await res.json();

        if (res.ok) {

            localStorage.setItem("user", JSON.stringify(data));

            redirectUser(data.role);

        }

        else {

            alert(data.message);

        }

    }

    catch (err) {

        console.error(err);

        alert("Server Error");

    }

}

function redirectUser(role) {

    if (role === "admin") {

        window.location.href = "admin-dashboard.html";

    }

    else if (role === "owner") {

        window.location.href = "owner-dashboard.html";

    }

    else {

        window.location.href = "tenant-dashboard.html";

    }

}