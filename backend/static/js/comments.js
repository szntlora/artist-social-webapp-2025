import { authFetch } from "./auth.js";
import { highlightMentions, showToast, customConfirm } from "./utils.js";
import { setupGlobalPostInteractions } from "./interactions.js";


const modal = document.getElementById("commentModal");
const commentsList = document.getElementById("commentsList");
const submitComment = document.getElementById("submitComment");
const newCommentText = document.getElementById("newCommentText");

let commentsInitialized = false;

if (modal && commentsList && submitComment && newCommentText) {
  initComments();
}

export function initComments() {
  if (commentsInitialized) return;
  commentsInitialized = true;

  modal.querySelector(".close-btn")?.addEventListener("click", () => modal.classList.add("hidden"));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      modal.classList.add("hidden");
    }
  });

  newCommentText?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitComment.click();
    }
  });

  submitComment?.addEventListener("click", async () => {
    const artworkId = modal.dataset.currentArtworkId;
    const content = newCommentText.value.trim();
    if (!content) return;

    const res = await authFetch(`/api/v1/comments/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artwork: artworkId, content })
    });

    if (!res.ok) {
      commentsList.innerHTML = `<p style="color:red;">Failed to post comment.</p>`;
      return;
    }

    newCommentText.value = "";
    await loadComments(artworkId);
  });
}

export async function openCommentModal(artworkId) {
  const postCard = document.querySelector(`.post-card[data-artwork-id="${artworkId}"]`);
  if (!postCard) return;

  modal.dataset.currentArtworkId = artworkId;
  modal.classList.remove("hidden");

  const commentInfo = document.getElementById("commentArtworkInfo");
  if (!commentInfo) return;

  // ✅ POSZT-KÁRTYA MÁSOLÁS A MODALBA
  const clone = postCard.cloneNode(true);
  clone.classList.add("modal-post-card");
  commentInfo.innerHTML = "";  // Törli a régit
  commentInfo.appendChild(clone);

  // ✅ Globális interakciók újraaktiválása a friss posztkártyára
  setTimeout(() => {
    setupGlobalPostInteractions();
  }, 100);

  // ✅ Kommentek betöltése
  await loadComments(artworkId);
}


async function loadComments(artworkId) {
  commentsList.innerHTML = "Loading comments...";

  try {
    const res = await authFetch(`/api/v1/comments/?artwork=${artworkId}`);
    if (!res.ok) throw new Error("Failed to load comments");
    const data = await res.json();
    const comments = Array.isArray(data) ? data : data.results || [];

    commentsList.innerHTML = comments.length
      ? comments.map(c => `
        <div class="comment-item" data-comment-id="${c.id}">
          <p><a href="/profile/${c.author_username}/" class="comment-author-link">@${c.author_username}</a>${c.is_edited ? ' <em>(edited)</em>' : ''}: ${highlightMentions(c.content)}</p>
          <div class="comment-actions">
            <button class="comment-like icon-btn" title="Like">
              <img src="/static/images/${c.is_liked ? 'red_like' : 'white_like'}.png" class="comment-like-icon">
              <span class="like-count">${c.like_count}</span>
            </button>
            ${c.can_edit
              ? `<button class="comment-delete icon-btn" title="Delete"><img src="/static/images/kuka.png" class="comment-icon"></button>`
              : `<button class="comment-report icon-btn" title="Report"><img src="/static/images/flag.png" class="comment-icon"></button>`}
          </div>
        </div>
      `).join("")
      : `<p style="color:gray;text-align:center;">No comments yet.</p>`;

    const countEl = document.querySelector(`.comment-btn[data-artwork-id="${artworkId}"] .comment-count`);
    if (countEl) countEl.textContent = comments.length;

  } catch (err) {
    console.error("❌ loadComments error:", err);
    commentsList.innerHTML = `<p style='color:red;'>Failed to load comments.</p>`;
  }
}

document.addEventListener("click", async (e) => {
  const likeBtn = e.target.closest(".comment-like");
  const deleteBtn = e.target.closest(".comment-delete");
  const reportBtn = e.target.closest(".comment-report");
  const commentItem = e.target.closest(".comment-item");
  const commentId = commentItem?.dataset.commentId;
  const artworkId = modal.dataset.currentArtworkId;

  if (!commentId) return;

  if (likeBtn) {
    try {
      const res = await authFetch(`/api/v1/comments/${commentId}/like/`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to like comment");
      const data = await res.json();
      const icon = likeBtn.querySelector("img.comment-like-icon");
      const count = likeBtn.querySelector(".like-count");
      icon.src = `/static/images/${data.liked ? "red_like" : "white_like"}.png`;
      count.textContent = data.like_count ?? 0;
    } catch (err) {
      console.error("❌ Comment like error:", err);
    }
  }

  if (deleteBtn) {
    const confirmed = await customConfirm("🗑️ Delete this comment?");
    if (!confirmed) return;
    const res = await authFetch(`/api/v1/comments/${commentId}/`, { method: "DELETE" });
    if (res.ok) {
      commentItem.remove();
      const countEl = document.querySelector(`.comment-btn[data-artwork-id="${artworkId}"] .comment-count`);
      if (countEl) countEl.textContent = Math.max(0, parseInt(countEl.textContent || 1) - 1);
      showToast("✅ Comment deleted", "success");
    } else {
      showToast("⚠️ Failed to delete comment", "error");
    }
  }

  if (reportBtn) {
    const confirmed = await customConfirm("🚩 Report this comment?");
    if (!confirmed) return;
    const res = await authFetch(`/api/v1/comments/${commentId}/report/`, { method: "POST" });
    if (res.ok) {
      showToast("🚨 Comment reported to admin", "info");
    } else {
      showToast("⚠️ Failed to report comment", "error");
    }
  }
});

function addPostOptionsListeners() {
  document.querySelectorAll(".post-options-btn").forEach(btn => {
    btn.removeEventListener("click", handleOptionsClick); // Ne duplikálódjon
    btn.addEventListener("click", handleOptionsClick);
  });

  function handleOptionsClick(e) {
    e.stopPropagation();
    const btn = e.currentTarget;
    const menu = btn.nextElementSibling;

    // Zárja az összes többi nyitott menüt
    document.querySelectorAll(".post-options-menu").forEach(m => {
      if (m !== menu) m.classList.add("hidden");
    });

    // Megjeleníti vagy elrejti az aktuális menüt
    menu.classList.toggle("hidden");
  }
}


console.log("✅ comments.js loaded");
