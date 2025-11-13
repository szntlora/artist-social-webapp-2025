import { authFetch } from "./auth.js";
import { openCommentModal } from "./comments.js";
import { customConfirm, showToast } from "./utils.js";
import { openImageModal } from "./image_modal.js";

console.log("✅ interactions.js loaded");

// 🔁 Event delegation minden poszt interakcióra
export function setupGlobalPostInteractions() {
  document.addEventListener("click", async (e) => {
    const postCard = e.target.closest(".post-card");
    if (!postCard) return;

    const artworkId = Number(postCard.dataset.artworkId);
    if (!artworkId) return;

    console.log("🔎 artworkId", artworkId, typeof artworkId); // 👉 ide helyeztük át


    if (e.target.closest(".like-btn")) {
      try {
        const res = await authFetch("/api/v1/likes/toggle/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ artwork_id: Number(artworkId) })
        });
        if (res.ok) {
          const data = await res.json();
          const icon = postCard.querySelector(".like-btn img");
          const count = postCard.querySelector(".like-btn .like-count");
          if (icon) icon.src = `/static/images/${data.liked ? "red_like" : "white_like"}.png`;
          if (count) count.textContent = data.like_count ?? 0;
        }
      } catch (err) {
        console.error("❌ Like error:", err);
      }
    }

    // 💬 KOMMENT
    if (e.target.closest(".comment-btn")) {
      openCommentModal(artworkId);
    }

    // 🗑️ DELETE
    if (e.target.closest(".post-delete")) {
      const confirmed = await customConfirm("🗑️ Delete this post?");
      if (!confirmed) return;
      try {
        const res = await authFetch(`/api/v1/artworks/${artworkId}/`, { method: "DELETE" });
        if (res.ok) {
          postCard.remove();
          showToast("✅ Post deleted", "success");
        } else {
          showToast("❌ Failed to delete", "error");
        }
      } catch (err) {
        console.error("❌ Delete error:", err);
        showToast("❌ Failed to delete", "error");
      }
    }

    // 🚩 REPORT
    if (e.target.closest(".post-report")) {
      const confirmed = await customConfirm("🚩 Report this post?");
      if (!confirmed) return;
      try {
        const res = await authFetch(`/api/v1/artworks/${artworkId}/report/`, { method: "POST" });
        if (res.ok) {
          showToast("🚨 Post reported", "info");
        } else {
          showToast("❌ Failed to report", "error");
        }
      } catch (err) {
        console.error("❌ Report error:", err);
        showToast("❌ Failed to report", "error");
      }
    }

    // ☰ HAMBURGER MENÜ
    if (e.target.closest(".post-menu-toggle")) {
      const menu = postCard.querySelector(".post-menu");
      if (menu) {
        document.querySelectorAll(".post-menu").forEach(m => m.classList.add("hidden"));
        menu.classList.toggle("hidden");
      }
    }

    // 🖼️ KÉPGALÉRIA – MODAL MEGNYITÁS
    if (e.target.classList.contains("clickable-img")) {
      try {
        const images = JSON.parse(postCard?.dataset.images || "[]");
        const allImages = Array.from(postCard.querySelectorAll(".clickable-img"));
        const index = allImages.indexOf(e.target);
        if (images.length) openImageModal(images, index);
      } catch (err) {
        console.error("❌ Image modal error:", err);
      }
    }
  });
}
