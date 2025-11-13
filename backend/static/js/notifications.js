// notifications.js
import { authFetch } from "./auth.js";
import { escapeHTML, getRelativeTime } from "./utils.js";
import { openCommentModal } from "./comments.js";


// === INIT ===
export function initNotifications() {
  const btn = document.getElementById("notificationsBtn");
  const dropdown = document.getElementById("notificationDropdown");
  const list = document.getElementById("notificationList");

  if (!btn || !dropdown || !list) {
    console.warn("⚠️ Notifications: hiányzó DOM elemek.");
    return;
  }

    const token = localStorage.getItem("accessToken");
    if (!token) {
    console.warn("🔒 No token, skipping notifications.");
    return;
    }

  // Gombra kattintás → megnyit/bezár dropdown
  btn.addEventListener("click", async (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("hidden");

    if (!dropdown.classList.contains("hidden")) {
      await fetchNotifications();
      await markAsRead();
      btn.classList.remove("has-notification", "notification-unread");
    }
  });

  // Kívülre kattintásra bezár
  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
      dropdown.classList.add("hidden");
    }
  });

  // LED frissítés induláskor és 60mp-enként
  updateNotificationLED();
  setInterval(updateNotificationLED, 60000);
}

// === Értesítések lekérése ===
async function fetchNotifications() {
  const list = document.getElementById("notificationList");
  if (!list) return;

  list.innerHTML = `<p class="loading-notifications">Loading...</p>`;

  try {
    const res = await authFetch("/api/v1/notifications/");
    if (!res.ok) throw new Error("Fetch failed");

    const data = (await res.json()).results || [];

    if (data.length === 0) {
      list.innerHTML = `<p class="empty-notifications">No notifications.</p>`;
      return;
    }

    list.innerHTML = data.slice(0, 15).map(n => {
      let linkHTML = "#";
      if (n.post_id) {
        linkHTML = `<a href="#" class="notification-link" data-post-id="${n.post_id}">`;
      } else if (n.target_user) {
        linkHTML = `<a href="/profile/${n.target_user}/" class="notification-link">`;
      }

      return `
        <div class="notification-item">
          ${linkHTML}
            <strong>@${escapeHTML(n.sender_username)}</strong>: ${escapeHTML(n.message)}
            <div class="notification-time">${getRelativeTime(n.created_at)}</div>
          </a>
        </div>
      `;
    }).join("");

  } catch (err) {
    console.error("❌ fetchNotifications error:", err);
    list.innerHTML = `<p class="error-notifications">Failed to load notifications.</p>`;
  }
} 


// === Megjelölés olvasottként ===
async function markAsRead() {
  try {
    await authFetch("/api/v1/notifications/mark_read/", { method: "POST" });
  } catch (err) {
    console.error("❌ Failed to mark notifications as read:", err);
  }
}

// === LED logika új értesítésnél ===
async function updateNotificationLED() {
  const btn = document.getElementById("notificationsBtn");
  if (!btn) return;

  try {
    const res = await authFetch("/api/v1/notifications/");
    if (!res.ok) return;

    const data = (await res.json()).results || [];
    const hasUnread = data.some(n => !n.is_read);

    if (hasUnread) {
      if (!btn.classList.contains("has-notification")) {
        btn.classList.remove("fading-out");
        btn.classList.add("has-notification");

        // Villanás animáció
        btn.animate(
          [{ transform: "scale(1)" }, { transform: "scale(1.25)" }, { transform: "scale(1)" }],
          { duration: 400, easing: "ease-out" }
        );
      }
    } else {
      if (btn.classList.contains("has-notification")) {
        btn.classList.remove("has-notification");
        btn.classList.add("fading-out");
        setTimeout(() => btn.classList.remove("fading-out"), 1500);
      }
    }
  } catch (err) {
    console.error("❌ Notification LED update error:", err);
  }
}
  
document.addEventListener("click", (e) => {
  const notifLink = e.target.closest(".notification-link");
  if (!notifLink) return;

  const postId = notifLink.dataset.postId;
  if (!postId) return; // nincs post ID → ne csináljon semmit

  e.preventDefault();

  const postCard = document.querySelector(`.post-card[data-artwork-id="${postId}"]`);
  if (postCard) {
    openCommentModal(postId);
    document.getElementById("notificationDropdown")?.classList.add("hidden");
  } else {
    console.warn("⚠️ Post not found in feed for ID:", postId);
  }
});



console.log("✅ notifications.js loaded");
