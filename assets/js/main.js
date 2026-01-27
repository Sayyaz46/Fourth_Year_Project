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
