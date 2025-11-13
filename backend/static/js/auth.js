export async function authFetch(url, options = {}) {
  let access = localStorage.getItem("accessToken");
  const refresh = localStorage.getItem("refreshToken");

  if (!options.headers) {
    options.headers = {};
  }

  if (access) {
    options.headers["Authorization"] = `Bearer ${access}`;
  }

  let res = await fetch(url, options);

  if (res.status === 401 && refresh) {
    try {
      const r = await fetch("/api/token/refresh/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });

      if (r.ok) {
        const data = await r.json();
        localStorage.setItem("accessToken", data.access);
        options.headers["Authorization"] = `Bearer ${data.access}`;
        res = await fetch(url, options);
      } else {
        localStorage.clear();
        window.location.href = "/login/";
      }
    } catch (err) {
      console.error("Token refresh error:", err);
      localStorage.clear();
      window.location.href = "/login/";
    }
  }

  return res;
}

// 🔴 Egységes logout (törlés ugyanazokkal a kulcsokkal)
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      window.location.href = "/login/";
    });
  }
});

console.log("✅ auth.js loaded");
