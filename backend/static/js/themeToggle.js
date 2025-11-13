// === MuseXion Theme Toggle (globális) ===
// Teljes dark/light mód váltás localStorage mentéssel

document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const toggleBtn = document.getElementById("toggleThemeBtn");

  // 🔹 1. Betöltéskor ellenőrizzük, van-e mentett téma
  const savedTheme = localStorage.getItem("themeMode");

  if (savedTheme === "light") {
    body.classList.add("light-mode");
  } else {
    // alapértelmezett: dark
    body.classList.remove("light-mode");
    localStorage.setItem("themeMode", "dark");
  }

  // 🔹 2. Gomb esemény (pl. a Settingsben)
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const isLight = body.classList.toggle("light-mode");
      localStorage.setItem("themeMode", isLight ? "light" : "dark");
      console.log("🎨 Theme set to:", isLight ? "Light" : "Dark");
    });
  }

  // 🔹 3. Konzol log (opcionális diagnosztika)
  console.log("🌗 Current theme:", localStorage.getItem("themeMode"));
});
