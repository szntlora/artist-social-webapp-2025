import { loadFeed } from "./posts.js";

export function initHashtagFilters() {
  document.addEventListener("click", (e) => {
    const tagLink = e.target.closest(".hashtag");
    if (tagLink && tagLink.dataset.tag) {
      const tag = tagLink.dataset.tag;
      loadFeed({ "tags__name": tag });

      document.getElementById("forYouBtn")?.classList.remove("active");
      document.getElementById("followingBtn")?.classList.remove("active");

      document.getElementById("feed")?.scrollIntoView({ behavior: "smooth" });
    }
  });
}

console.log("✅ tags.js loaded");
