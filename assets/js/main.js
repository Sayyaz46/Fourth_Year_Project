async function loadComponent(id, file) {
  const res = await fetch(`components/${file}`);
  document.getElementById(id).innerHTML = await res.text();
}

document.addEventListener("DOMContentLoaded", () => {
  loadComponent("navbar", "navbar.html");
  loadComponent("hero", "hero.html");
  loadComponent("featured", "featured.html");
  loadComponent("why", "why-choose.html");
  loadComponent("footer", "footer.html");
});
document.addEventListener("DOMContentLoaded", () => {
  loadComponent("navbar", "navbar.html").then(() => {
    updateNavbar();
  });
});

function updateNavbar() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navActions = document.querySelector(".nav-actions");

  if (!navActions) return;

  if (user) {
    navActions.innerHTML = `
      <span style="font-weight:600;">${user.name}</span>
      <a href="#" class="btn-primary" onclick="logout()">Logout</a>
    `;
  }
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "login.html";
}
function logout() {
  localStorage.removeItem("user");
  window.location.href = "login.html";
}
