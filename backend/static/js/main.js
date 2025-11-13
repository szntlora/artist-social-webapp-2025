import { authFetch } from "./auth.js";
import { loadFeed } from "./posts.js";
import { initComments } from "./comments.js";
import { initUpload } from "./upload.js";
import { refreshImageModal, openImageModal } from "./image_modal.js";
import { initHashtagFilters } from "./tags.js";
import { initNotifications } from "./notifications.js";
import { setupGlobalPostInteractions } from "./interactions.js";
import {
  escapeHTML,
  highlightMentions,
  getRelativeTime,
  showToast,
  customConfirm
} from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {
  const logoBtn = document.getElementById("logoBtn");
  if (logoBtn) {
    logoBtn.addEventListener("click", () => {
      window.location.href = "/home/";
    });
  }
});


// ✅ DOMContentLoaded fő
document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const nameSpan = document.getElementById("userFirstName");
  const profileBtn = document.getElementById("profileBtn");
  const profilePic = document.getElementById("userProfilePic");

  if (user) {
    if (nameSpan) {
      const name = user.first_name?.trim() || user.username || "Profile";
      nameSpan.textContent = name;
    }
    if (profilePic && user.profile_image) {
      profilePic.src = user.profile_image;
    }
    if (profileBtn) {
      profileBtn.addEventListener("click", () => {
        if (user.username) {
          window.location.href = `/profile/${user.username}/`;
        } else {
          alert("❌ Felhasználónév nem található.");
        }
      });
    }
  }

  loadFeed("feed");
  initComments();
  initUpload();
  initHashtagFilters();
  initNotifications();
  initSidebarButtons();
  refreshImageModal();
  setupGlobalPostInteractions();
});

// 🔍 Kereső élő ajánlás
const searchInput = document.querySelector(".search");
const suggestionBox = document.getElementById("searchSuggestions");
let selectedIndex = -1;

searchInput?.addEventListener("input", async (e) => {
  const query = e.target.value.trim();
  selectedIndex = -1;

  if (!query) {
    suggestionBox?.classList.add("hidden");
    suggestionBox.innerHTML = "";
    return;
  }

  try {
    const res = await authFetch(`/api/v1/artworks/search-suggestions/?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Fetch failed");

    const results = await res.json();

    if (results.length === 0) {
      suggestionBox.innerHTML = "<p class='no-result'>No matches.</p>";
    } else {
      suggestionBox.innerHTML = results.map(item => {
        let label = "", data = "";
        if (item.type === "user") {
          label = `@${item.username}`;
          data = `/profile/${item.username}/`;
        } else if (item.type === "tag") {
          label = `#${item.name}`;
          data = `tag:${item.name}`;
        } else if (item.type === "category") {
          label = item.name;
          data = `category_id:${item.id}`;
        } else if (item.type === "desc") {
          label = `“${item.text}”`;
          data = `desc:${item.text}`;
        }
        return `<div class="suggestion" data-action="${data}">${label}</div>`;
      }).join("");

      suggestionBox.querySelectorAll(".suggestion").forEach(el => {
        el.addEventListener("click", () => {
          const action = el.dataset.action;
          deactivateSidebarButtons();

          if (action.startsWith("/profile/")) {
            window.location.href = action;
          } else if (action.startsWith("tag:")) {
            const tag = action.split(":")[1];
            loadFeed("feed", { "tags__name": tag });
          } else if (action.startsWith("category_id:")) {
            const id = action.split(":")[1];
            if (id !== "undefined") {
              loadFeed("feed", { category: id });
            }
          } else if (action.startsWith("desc:")) {
            const desc = action.split(":")[1];
            loadFeed("feed", { search: desc });
          }
        });
      });
    }

    suggestionBox.classList.remove("hidden");

  } catch (err) {
    console.error("Search error:", err);
    suggestionBox.classList.add("hidden");
  }
});

searchInput?.addEventListener("keydown", (e) => {
  const suggestions = suggestionBox?.querySelectorAll(".suggestion");
  if (!suggestions || suggestions.length === 0) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    selectedIndex = (selectedIndex + 1) % suggestions.length;
    updateActiveSuggestion(suggestions);
  }

  if (e.key === "ArrowUp") {
    e.preventDefault();
    selectedIndex = (selectedIndex - 1 + suggestions.length) % suggestions.length;
    updateActiveSuggestion(suggestions);
  }

  if (e.key === "Enter") {
    e.preventDefault();
    if (selectedIndex >= 0) {
      suggestions[selectedIndex].click();
    } else {
      const term = searchInput.value.trim();
      if (term) {
        loadFeed("feed", { search: term });
        deactivateSidebarButtons();
        suggestionBox?.classList.add("hidden");
      } else {
        suggestionBox.innerHTML = "<p class='no-result'>Please type something.</p>";
      }
    }
  }
});

function updateActiveSuggestion(suggestions) {
  suggestions.forEach((el, i) => {
    el.classList.toggle("active", i === selectedIndex);
  });
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search") && !e.target.closest("#searchSuggestions")) {
    suggestionBox?.classList.add("hidden");
  }
});

function initSidebarButtons() {
  const forYouBtn = document.getElementById("forYouBtn");
  const followingBtn = document.getElementById("followingBtn");

  forYouBtn?.addEventListener("click", () => {
    loadFeed("feed", { ordering: "latest" });
    forYouBtn.classList.add("active");
    followingBtn?.classList.remove("active");
  });

  followingBtn?.addEventListener("click", () => {
    loadFeed("feed", { following: true });
    followingBtn.classList.add("active");
    forYouBtn?.classList.remove("active");
  });
}

function deactivateSidebarButtons() {
  document.getElementById("forYouBtn")?.classList.remove("active");
  document.getElementById("followingBtn")?.classList.remove("active");
}

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "/login/";
});


console.log("✅ main.js loaded");
