async function loadComponent(id, file) {
    const container = document.getElementById(id);
    if (!container) return;

    try {
        const res = await fetch(`components/${file}`);
        if (res.ok) {
            container.innerHTML = await res.text();
        }
    } catch (error) {
        console.error(`Error loading ${file}:`, error);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadComponent("navbar", "navbar.html");
    await loadComponent("why", "why-choose.html");
    await loadComponent("footer", "footer.html");

    updateNavbar();
    setupAddPropertyButton();
});

function updateNavbar() {
    const user = JSON.parse(localStorage.getItem("user"));
    const navActions = document.querySelector(".nav-actions");

    if (!navActions) return;

    if (user && user.name) {
        navActions.innerHTML = `
            <span style="font-weight:600; color:#1e5bff;">${user.name}</span>
            <a href="#" class="btn btn-primary" onclick="logout()">Logout</a>
        `;
    }
}

function setupAddPropertyButton() {
    const addBtn = document.getElementById("addPropertyBtn");
    if (!addBtn) return;

    addBtn.addEventListener("click", (e) => {
        e.preventDefault();

        const user = JSON.parse(localStorage.getItem("user"));

        if (user && user.role === "owner") {
            window.location.href = "owner-dashboard.html";
        } else if (user) {
            alert("Only property owners can add listings.");
        } else {
            window.location.href = "login.html";
        }
    });
}

function logout() {
    localStorage.removeItem("user");
    window.location.href = "index.html";
}
