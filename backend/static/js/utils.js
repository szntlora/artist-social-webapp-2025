export function escapeHTML(str) {
  if (typeof str !== "string") str = String(str ?? "");
  return str.replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));
}

export function highlightMentions(text) {
  if (!text) return "";
  const safe = escapeHTML(text);
  return safe.replace(/@([a-zA-Z0-9_]+)/g, (_, u) =>
    `<a href="/profile/${u}/" class="mention-link">@${u}</a>`
  );
}

export function getRelativeTime(dateString) {
  const now = new Date();
  const past = new Date(dateString);
  const diff = Math.floor((now - past) / 1000);
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

export function showToast(msg, type = "info") {
  const c = document.getElementById("toastContainer");
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.innerHTML = msg;
  c.appendChild(t);
  setTimeout(() => t.classList.add("visible"), 50);
  setTimeout(() => {
    t.classList.remove("visible");
    setTimeout(() => t.remove(), 400);
  }, 3000);
}

export function customConfirm(message) {
  return new Promise(resolve => {
    const modal = document.getElementById("confirmModal");
    const msg = document.getElementById("confirmMessage");
    const yesBtn = document.getElementById("confirmYes");
    const noBtn = document.getElementById("confirmNo");

    msg.textContent = message;
    modal.classList.remove("hidden");

    const cleanup = () => {
      modal.classList.add("hidden");
      yesBtn.removeEventListener("click", onYes);
      noBtn.removeEventListener("click", onNo);
    };

    const onYes = () => { cleanup(); resolve(true); };
    const onNo = () => { cleanup(); resolve(false); };

    yesBtn.addEventListener("click", onYes);
    noBtn.addEventListener("click", onNo);
  });
}

export function truncateText(text, maxLength = 22) {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength - 3).trim() + "..." : text;
}


console.log("✅ utils.js loaded");
