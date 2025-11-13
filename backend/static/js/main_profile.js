import { authFetch } from "./auth.js";
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
import { loadFeed } from "./posts.js";

let profileUsername = "";

async function refreshFollowerCount() {
  try {
    const res = await authFetch(`/api/v1/followers/?username=${profileUsername}`);
    const followerEl = document.getElementById("followerCount");

    if (!res.ok || !followerEl) return;

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const raw = await res.json();
      const followers = Array.isArray(raw) ? raw : raw.results || [];
      followerEl.textContent = followers.length;
    } else {
      console.warn("⚠️ Follower count response is not JSON");
      followerEl.textContent = "0";
    }
  } catch (e) {
    console.warn("❌ Could not refresh follower count", e);
    const followerEl = document.getElementById("followerCount");
    if (followerEl) followerEl.textContent = "0";
  }
}

async function refreshFollowingCount() {
  try {
    const res = await authFetch(`/api/v1/following/?username=${profileUsername}`);
    const followingEl = document.getElementById("followingCount");

    if (!res.ok || !followingEl) return;

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const raw = await res.json();
      const following = Array.isArray(raw) ? raw : raw.results || [];
      followingEl.textContent = following.length;
    } else {
      console.warn("⚠️ Following count response is not JSON");
      followingEl.textContent = "0";
    }
  } catch (e) {
    console.warn("❌ Could not refresh following count", e);
    const followingEl = document.getElementById("followingCount");
    if (followingEl) followingEl.textContent = "0";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const pathParts = window.location.pathname.split("/");
    profileUsername = pathParts[pathParts.length - 2] || pathParts[pathParts.length - 1];
    const currentUser = JSON.parse(localStorage.getItem("user"))?.username;

    // 🔹 Logo → vissza home-ra
    document.getElementById("logoBtn")?.addEventListener("click", () => window.location.href = "/home/");
    document.getElementById("homeBtn")?.addEventListener("click", () => window.location.href = "/home/");

    // 🔹 Saját profil: posztolás, customize stb.
    if (profileUsername === currentUser) {
      document.getElementById("ownProfileSection")?.classList.remove("hidden");
      document.getElementById("followBtn").style.display = "none";
      initUpload();
    } else {
      document.getElementById("ownProfileSection")?.remove();
    }

    // 🔹 Profil oldali profilkép kattintás: reset feed
    const profilePic = document.getElementById("userProfilePic");
    profilePic?.addEventListener("click", async () => {
      const feedContainer = document.getElementById("profileFeed");
      const searchInput = document.getElementById("profileSearch");
      const suggestionsBox = document.getElementById("searchSuggestions");

      if (searchInput) searchInput.value = "";
      if (suggestionsBox) {
        suggestionsBox.innerHTML = "";
        suggestionsBox.classList.add("hidden");
      }

      feedContainer.innerHTML = "<p style='color:gray;'>Loading profile...</p>";
      await loadFeed("profileFeed", { user__username: profileUsername });
    });

    // 🔹 Bal panel profil adatok betöltése
    async function loadProfileSidebar(username) {
      try {
        const res = await authFetch(`/api/v1/profile/${username}/`);
        if (!res.ok) throw new Error("Profile fetch failed");

        const data = await res.json();

        const nameEl = document.getElementById("userFirstName");
        if (nameEl) nameEl.textContent = data.first_name || data.username || "Profile";

        const fullNameEl = document.getElementById("userFullName");
        if (fullNameEl) fullNameEl.textContent = `${data.first_name || ""} ${data.last_name || ""}`.trim();

        const artistTypeEl = document.querySelector(".profile-artist-type");
        if (artistTypeEl) {
          const cleanType = (data.artist_type || "ARTIST").trim();
          artistTypeEl.textContent = cleanType.length ? cleanType : "ARTIST";
        }

        const bioEl = document.getElementById("userBio");
        if (bioEl) bioEl.textContent = data.bio || "";

        const profilePicEl = document.getElementById("userProfilePic");
        if (profilePicEl && data.profile_image) {
          profilePicEl.src = data.profile_image;
        }

      } catch (e) {
        console.error("❌ Failed to load profile sidebar data", e);
      }
    }

    await loadProfileSidebar(profileUsername);

    // 🔹 Feed betöltése az adott userhez
    await loadFeed("profileFeed", { user__username: profileUsername });

    // 🔹 Posztok számláló
    const postCount = document.getElementById("postCount");
    if (postCount) {
      try {
        const res = await authFetch(`/api/v1/artworks/?user__username=${profileUsername}`);
        const data = await res.json();
        const artworks = Array.isArray(data) ? data : data.results || [];
        postCount.textContent = artworks.length;
      } catch (e) {
        console.warn("⚠️ Could not count posts", e);
      }
    }

   // 🔹 Follow logika
  const followBtn = document.getElementById("followBtn");
  const followerCountEl = document.getElementById("followerCount");
  const followingCountEl = document.getElementById("followingCount");


  if (profileUsername !== currentUser && followBtn && followerCountEl) {
    let following = false;

    // 1️⃣ Lekérjük a státuszt 
    try {
      const res = await authFetch(`/api/v1/follow/status/?username=${profileUsername}`);
      const contentType = res.headers.get("content-type");

      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        following = !!data.is_following;
      }
    } catch (e) {
      console.warn("Follow status fetch failed", e);
    }

    // 2️⃣ Lekérjük a followers számát
    try {
      const res = await authFetch(`/api/v1/followers/?username=${profileUsername}`);
      const contentType = res.headers.get("content-type");

      if (res.ok && contentType && contentType.includes("application/json")) {
        const raw = await res.json();
        const followers = Array.isArray(raw) ? raw : raw.results || [];
        followerCountEl.textContent = followers.length;
      }
    } catch (e) {
      console.warn("Fallback follower count failed", e);
    }


    // 3️⃣ Gomb kinézete
    function updateFollowBtn() {
      if (following) {
        followBtn.textContent = "Unfollow";
        followBtn.classList.add("unfollow");
      } else {
        followBtn.textContent = "Follow";
        followBtn.classList.remove("unfollow");
      }
    }
    updateFollowBtn();

    // 4️⃣ Kattintás → toggle
    
    followBtn.addEventListener("click", async () => {
      try {
        const res = await authFetch("/api/v1/follow/toggle/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: profileUsername })
        });

        if (!res.ok) return;
        following = !following;

        const current = parseInt(followerCountEl.textContent) || 0;
        followerCountEl.textContent = following ? current + 1 : Math.max(0, current - 1);

        updateFollowBtn();
      } catch (e) {
        console.error("Follow toggle failed", e);
      }
    });

  } else if (followBtn) {
    followBtn.style.display = "none"; // saját profil esetén elrejti
  }




    // 🔹 Follower/following panel
    function openFollowPanel(type) {
      const panel = document.getElementById("followPanel");
      const list = document.getElementById("followList");
      const title = document.getElementById("followPanelTitle");

      if (!["followers", "following"].includes(type)) return;

      title.textContent = type === "followers" ? "Followers" : "Following";
      panel.classList.remove("hidden");
      list.innerHTML = "";

      authFetch(`/api/v1/${type}/?username=${profileUsername}`)
        .then(res => res.json())
        .then(data => {
          if (!data.length) {
            list.innerHTML =
              type === "followers"
                ? "<p class='follow-user-item' style='color:gray;'>no followers yet</p>"
                : "<p class='follow-user-item' style='color:gray;'>not following anyone yet</p>";
            return;
          }

          const countTarget = document.getElementById(type === "followers" ? "followerCount" : "followingCount");
          if (countTarget) countTarget.textContent = data.length;

          list.innerHTML = data
            .map(u => `<p class="follow-user-item"><a href="/profile/${u.username}/">@${u.username}</a></p>`)
            .join("");
        })
        .catch(() => {
          list.innerHTML = "<p style='color:red;'>Failed to load list.</p>";
        });
    }

    document.getElementById("followerCount")?.addEventListener("click", () => openFollowPanel("followers"));
    document.getElementById("followingCount")?.addEventListener("click", () => openFollowPanel("following"));
    document.querySelector(".close-popup")?.addEventListener("click", () => {
      document.getElementById("followPanel").classList.add("hidden");
    });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") document.getElementById("followPanel").classList.add("hidden");
    });

    // 🔹 Customize profil modal
    const customizeBtn = document.getElementById("customizeBtn");
    const customizeModal = document.getElementById("customizeModal");
    const closeCustomize = document.getElementById("closeCustomize");
    const czFirstName = document.getElementById("czFirstName");
    const czLastName = document.getElementById("czLastName");
    const czArtistType = document.getElementById("czArtistType");
    const czBio = document.getElementById("czBio");
    const czSave = document.getElementById("czSave");
    const czCancel = document.getElementById("czCancel");
    const czError = document.getElementById("czError");
    const profilePreview = document.getElementById("profilePreview");
    const uploadTrigger = document.getElementById("uploadTrigger");
    const czProfileImage = document.getElementById("czProfileImage");

    if (customizeBtn && profileUsername === currentUser) {
      customizeBtn.classList.remove("hidden");
    }

    uploadTrigger?.addEventListener("click", () => czProfileImage.click());

    czProfileImage?.addEventListener("change", () => {
      const file = czProfileImage.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = e => (profilePreview.src = e.target.result);
        reader.readAsDataURL(file);
      }
    });

  customizeBtn?.addEventListener("click", async () => {
    czError.textContent = "";
    try {
      const res = await authFetch("/api/v1/profile/customize/");
      const contentType = res.headers.get("content-type") || "";

      if (!res.ok || !contentType.includes("application/json")) {
        throw new Error("Invalid response");
      }

      const data = await res.json();
      const u = JSON.parse(localStorage.getItem("user")) || {};
      const full = data.full_name || "";
      czFirstName.value = u.first_name || full.split(" ")[0] || "";
      czLastName.value = u.last_name || full.split(" ").slice(1).join(" ") || "";
      czArtistType.value = data.artist_type || "";
      czBio.value = data.bio || "";
      profilePreview.src = data.profile_image || "/static/images/default-avatar.png";
      customizeModal.classList.remove("hidden");
    } catch (e) {
      console.error("❌ Failed to load profile:", e);
      czError.textContent = "Could not load your profile. Please try again.";
    }
  });


    closeCustomize?.addEventListener("click", () => customizeModal.classList.add("hidden"));
    czCancel?.addEventListener("click", () => customizeModal.classList.add("hidden"));
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") customizeModal.classList.add("hidden");
    });

    czSave?.addEventListener("click", async () => {
      czError.textContent = "";

      const formData = new FormData();
      formData.append("first_name", czFirstName.value.trim());
      formData.append("last_name", czLastName.value.trim());
      formData.append("artist_type", czArtistType.value.trim());
      formData.append("bio", czBio.value.trim());
      if (czProfileImage.files[0]) {
        formData.append("profile_image", czProfileImage.files[0]);
      }

      const res = await authFetch("/api/v1/profile/customize/", {
        method: "PATCH",
        body: formData
      });

      const contentType = res.headers.get("content-type") || "";
      if (!res.ok || !contentType.includes("application/json")) {
        throw new Error("Invalid response");
      }

      const data = await res.json();  // csak ha biztosan JSON

        document.getElementById("userFullName").textContent = `${czFirstName.value} ${czLastName.value}`.trim();
        document.getElementById("userBio").textContent = czBio.value;
        document.querySelector(".profile-artist-type").textContent = czArtistType.value || "ARTIST";

        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        if (czFirstName.value) stored.first_name = czFirstName.value;
        if (czLastName.value) stored.last_name = czLastName.value;
        if (czArtistType.value) stored.artist_type = czArtistType.value;
        localStorage.setItem("user", JSON.stringify(stored));

        const firstNameDisplay = document.getElementById("userFirstName");
        if (firstNameDisplay) {
          firstNameDisplay.textContent = czFirstName.value || currentUser;
        }

        customizeModal.classList.add("hidden");
        showToast("Profile updated.");
    });

  } catch (err) {
    console.error("❌ DOMContentLoaded error:", err);
  } finally {
    await refreshFollowerCount();
    await refreshFollowingCount();
    setTimeout(() => {
      initComments();
      setupGlobalPostInteractions();
      initHashtagFilters();
      initNotifications();
      refreshImageModal();
    }, 700);
  }
});

