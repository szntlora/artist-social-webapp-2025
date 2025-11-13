import { escapeHTML, getRelativeTime, highlightMentions, truncateText } from "./utils.js";
import { openImageModal } from "./image_modal.js";
import { authFetch } from "./auth.js";
import { openCommentModal } from "./comments.js";


export async function loadFeed(containerId, filters = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn("❌ Container not found:", containerId);
    return;
  }

    if (filters.tag) {
        filters["tags__name"] = filters.tag;
        delete filters.tag;
        }  

  container.innerHTML = "";

  try {
    const params = new URLSearchParams(filters).toString();
    const res = await authFetch(`/api/v1/artworks/?${params}`);
    if (!res.ok) throw new Error("❌ Failed to fetch feed");

    const data = await res.json();
    const artworks = Array.isArray(data) ? data : data.results || [];

    if (!Array.isArray(artworks)) {
      console.error("❌ Invalid feed format:", data);
      container.innerHTML = "<p style='color:red;'>Feed error.</p>";
      return;
    }

    artworks.forEach(artwork => {
      const highlightId = new URLSearchParams(window.location.search).get("highlight");
      const postCard = renderPostCard(artwork);
      if (postCard instanceof HTMLElement) {
        container.appendChild(postCard);
      } else {
        console.warn("⚠️ renderPostCard did not return valid DOM:", postCard);
      }
      if (highlightId && highlightId == artwork.id) {
        postCard.classList.add("highlighted-post");

        setTimeout(() => {
          postCard.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);
      }
    });

  } catch (err) {
    console.error("❌ Feed load error:", err);
    container.innerHTML = "<p style='color:red;'>Failed to load feed.</p>";
  }
}


export function renderPostCard(artwork) {
  const card = document.createElement("div");
  card.className = "post-card";

  card.dataset.artworkId = artwork.id;
  card.dataset.creatorUsername = artwork.creator.username;
  card.dataset.images = JSON.stringify(artwork.images || []);


  const mediaHTML = renderMediaGallery(artwork.images);

  card.innerHTML = `
    <div class="post-header">
      <div class="post-header-left">
        <a href="/profile/${artwork.creator_username}/" class="username-link">@${artwork.creator_username}</a>
        <span class="type">${artwork.creator?.artist_type || "artist"}</span>
      </div>
      <img src="/static/images/more.png" class="icon post-menu-toggle">
      <div class="post-menu hidden"><ul class="post-menu-options"></ul></div>
    </div>
    <hr class="divider"/>
    <div class="post-meta"><div class="post-category">${artwork.category?.name || "Unknown Category"}</div><div class="timestamp">${getRelativeTime(artwork.created_at)}</div></div>
    <div class="description">${highlightMentions(escapeHTML(artwork.description))}</div>
    ${mediaHTML}
    ${renderTags(artwork.tags)}
    <div class="post-footer">
      <button class="icon-btn like-btn">
        <img class="icon like-icon" src="/static/images/${artwork.is_liked ? "red_like" : "white_like"}.png">
        <span class="like-count">${artwork.like_count || 0}</span>
      </button>
      <button class="icon-btn comment-btn" data-artwork-id="${artwork.id}">
        <img class="icon" src="/static/images/comment.png">
        <span class="comment-count">${artwork.comment_count || 0}</span>
      </button>
    </div>
  `;

  // ☰ Menüelemek dinamikus betöltése (report / delete)
  const menuOptions = card.querySelector(".post-menu-options");
  if (menuOptions) {
    const currentUser = localStorage.getItem("user");
    const isOwner = currentUser && JSON.parse(currentUser).username === artwork.creator_username;

  const moreBtn = card.querySelector(".post-menu-toggle");
  const optionsMenu = card.querySelector(".post-menu");

  if (moreBtn && optionsMenu) {
    moreBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // Ne triggerelje a document clicket
      // Előbb zárjon be minden másik menüt
      document.querySelectorAll(".post-menu").forEach(menu => menu.classList.add("hidden"));
      // Majd nyissa ki ezt
      optionsMenu.classList.toggle("hidden");
    });
  }

    if (isOwner) {
      menuOptions.innerHTML = `
        <li class="menu-item post-delete">Delete</li>
      `;
    } else {
      menuOptions.innerHTML = `
        <li class="menu-item post-report">Report</li>
      `;
    }
  }

  
  // 📸 Modal megnyitás
  card.querySelectorAll(".clickable-img").forEach((img, index) => {
    img.addEventListener("click", () => openImageModal(artwork.images, index));
  });

  return card;
}

function renderMediaGallery(images = []) {
  if (!images.length) return "";

  if (images.length === 1) {
    return `
      <div class="post-media">
        <img src="${images[0].image}" class="post-img clickable-img" alt="Artwork image">
      </div>
    `;
  }

  if (images.length === 2 || images.length === 3) {
    return `
      <div class="post-gallery standard-layout">
        ${images.map(img => `<img src="${img.image}" class="post-img clickable-img" alt="Artwork image">`).join("")}
      </div>
    `;
  }

  if (images.length === 4) {
    return `
      <div class="post-gallery grid-layout">
        ${images.map(img => `<img src="${img.image}" class="post-img clickable-img" alt="Artwork image">`).join("")}
      </div>
    `;
  }

  const firstFour = images.slice(0, 4).map(img => `<img src="${img.image}" class="post-img clickable-img" alt="Artwork image">`).join("");
  const lastImage = images[4];
  return `
    <div class="post-gallery grid-layout">${firstFour}</div>
    <div class="full-width-img"><img src="${lastImage.image}" class="post-img large-img clickable-img" alt="Artwork image"></div>
  `;
}

function renderTags(tags = []) {
  if (!tags.length) return "";
  return `<div class="hashtags">${tags.map(tag => `<a class="hashtag" data-tag="${tag.name}">#${tag.name}</a>`).join("")}</div>`;
}

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("hashtag")) {
    const tag = e.target.textContent.replace("#", "").trim();
    const target = document.getElementById("profileFeed") ? "profileFeed" : "feed";
    loadFeed(target, { tag });
  }
});

// 🔁 Bezár minden megnyitott post-menüt ha máshová kattintasz
document.addEventListener("click", (e) => {
  const isToggleBtn = e.target.closest(".post-menu-toggle");
  const isMenu = e.target.closest(".post-menu");

  if (!isToggleBtn && !isMenu) {
    document.querySelectorAll(".post-menu").forEach(menu => {
      menu.classList.add("hidden");
    });
  }
});


console.log("✅ posts.js loaded");
