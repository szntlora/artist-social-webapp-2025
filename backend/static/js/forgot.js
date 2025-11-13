document.getElementById("forgot-form").addEventListener("submit", async function(e) {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const msg = document.getElementById("responseMsg");
  msg.textContent = "Sending...";
  msg.style.color = "#777";

  try {
    const res = await fetch("/api/v1/settings/password-reset/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    console.log("📩 Response status:", res.status);
    const data = await res.json().catch(() => ({}));
    console.log("📩 Response data:", data);

    if (res.ok) {
      msg.textContent = "✅ Link sent successfully! Check your inbox.";
      msg.style.color = "#00cc44";
    } else if (res.status === 404) {
      msg.textContent = "⚠️ Email is not registered.";
      msg.style.color = "#ff5506";
    } else if (res.status === 400) {
      msg.textContent = "⚠️ Invalid email format.";
      msg.style.color = "#ff5506";
    } else {
      msg.textContent = "❌ Failed to send link.";
      msg.style.color = "#ff5506";
    }

  } catch (err) {
    console.error("❌ Network or JS error:", err);
    msg.textContent = "⚠️ Server not responding.";
    msg.style.color = "#ff5506";
  }
});
