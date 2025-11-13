document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  const emailInput = document.getElementById("emailInput");
  const passwordInput = document.getElementById("passwordInput");
  const loginError = document.getElementById("loginError"); // ha van ilyen div

  if (!loginBtn || !emailInput || !passwordInput) {
    console.warn("🔧 login.js: missing elements");
    return;
  }

  loginBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    if (!email || !password) {
      showLoginError("Please fill in both fields.");
      return;
    }

    try {
      const res = await fetch("/api/v1/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        if (res.status === 401) {
          showLoginError("Invalid credentials.");
        } else {
          showLoginError("Server error.");
        }
        return;
      }

      const data = await res.json();

      
      localStorage.setItem("accessToken", data.access_token);
      localStorage.setItem("refreshToken", data.refresh_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      window.location.href = "/home/";

    } catch (err) {
      console.error("❌ Login error:", err);
      showLoginError("Network error.");
    }
  });

  function showLoginError(msg) {
    const el = loginError || document.createElement("div");
    el.textContent = msg;
    el.style.color = "#ff4444";
    el.style.marginTop = "8px";
    el.style.fontSize = "14px";
    el.style.textAlign = "center";
    if (!loginError) document.body.appendChild(el);
  }
});
