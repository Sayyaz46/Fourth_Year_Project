// Utility to load components
async function loadComponent(id, file) {
    const container = document.getElementById(id);
    if (!container) return;

    try {
        const res = await fetch(`components/${file}`);
        if (!res.ok) throw new Error(`Failed to load ${file}`);
        container.innerHTML = await res.text();
    } catch (error) {
        console.error(`Error loading ${file}:`, error);
    }
}

// Main initialization
document.addEventListener("DOMContentLoaded", async () => {
    // Load common components
    await Promise.all([
        loadComponent("navbar", "navbar.html"),
        loadComponent("hero", "hero.html"),
        loadComponent("featured", "featured.html"),
        loadComponent("why", "why-choose.html"),
        loadComponent("footer", "footer.html")
    ]);

    // Update navbar after it's loaded
    updateNavbar();
});

// Navbar user state management
function updateNavbar() {
    const user = JSON.parse(localStorage.getItem("user"));
    const navActions = document.querySelector(".nav-actions");

    if (!navActions) return;

    if (user && user.name) {
        navActions.innerHTML = `
            <span style="font-weight:600; color:#1e5bff;">${user.name}</span>
            <a href="#" class="btn btn-primary" onclick="logout()">Logout</a>
        `;
    } else {
        navActions.innerHTML = `
            <a href="add-property.html" class="btn btn-outline">+ Add Property</a>
            <a href="login.html" class="btn btn-primary">Login / Register</a>
        `;
    }
}

function logout() {
    localStorage.removeItem("user");
    window.location.href = "login.html";
}