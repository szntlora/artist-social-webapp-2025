// upload.js
import { authFetch } from "./auth.js";
import { showToast } from "./utils.js";

let selectedImages = [];
let selectedVideo = null;

export function initUpload() {
  const drawer = document.getElementById("createPostPanel");
  const trigger = document.getElementById("slideTrigger");
  const postBtn = document.getElementById("postBtn");
  const preview = document.getElementById("previewFiles");
  const imageInput = document.getElementById("postImage");
  const videoInput = document.getElementById("postVideo");
  const textArea = document.getElementById("postText");
  const categorySelect = document.getElementById("postCategory");
  const postError = document.getElementById("postError");

  if (!drawer || !trigger || !postBtn || !preview || !imageInput || !videoInput || !textArea || !categorySelect) {
    console.warn("⚠️ Missing DOM elements for post upload.");
    return;
  }

  console.log("✅ upload.js initialized");

  // Kategóriák betöltése
  loadCategories(categorySelect);

  // Slide drawer toggle
  trigger.addEventListener("click", () => {
    drawer.classList.toggle("active");
  });

  const closeBtn = document.getElementById("closeDrawerBtn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
        drawer.classList.remove("active");
    });
  }

  document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && drawer.classList.contains("active")) {
    drawer.classList.remove("active");
  }
});

  // Képek kiválasztása
  imageInput.addEventListener("change", () => {
  const newFiles = [...imageInput.files];

  // Szűrjük ki a már kiválasztottakat duplikáció elkerülésére (opcionális)
  const newUniqueFiles = newFiles.filter(file => {
    return !selectedImages.some(existing => existing.name === file.name && existing.size === file.size);
  });

  selectedImages.push(...newUniqueFiles);
  updatePreview(preview);
});


  // Videó kiválasztása
  videoInput.addEventListener("change", () => {
    selectedVideo = videoInput.files[0];
    updatePreview(preview);
  });

  // Poszt beküldése
  postBtn.addEventListener("click", async () => {
    const text = textArea.value.trim();
    const category = categorySelect.value;

    if (!text) {
      postError.textContent = "Text is required.";
      return;
    }
    if (!category) {
      postError.textContent = "Please select a category.";
      return;
    }

    postError.textContent = "";

    const formData = new FormData();
    formData.append("description", text);
    formData.append("category", category);

    selectedImages.forEach(file => formData.append("images", file));
    if (selectedVideo) {
      formData.append("video", selectedVideo);
    }

    try {
      const res = await authFetch("/api/v1/artworks/", {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("Upload failed");

      showToast("✅ Post uploaded", "success");

      // Alaphelyzetbe állítás
      textArea.value = "";
      imageInput.value = "";
      videoInput.value = "";
      selectedImages = [];
      selectedVideo = null;
      preview.innerHTML = "";
      drawer.classList.remove("active");

    // 🔄 Ha a profiloldalon vagyunk, frissítsük a post count értékét dinamikusan
    const profileFeed = document.getElementById("profileFeed");
    if (profileFeed) {
    const postCount = document.getElementById("postCount");
    if (postCount) {
        postCount.textContent = parseInt(postCount.textContent || "0") + 1;
    }

    // Újratöltés helyett új feed betöltés (ha akarod, vagy maradhat reload)
    setTimeout(() => window.location.reload(), 500);
    } else {
    // ha a home feeden vagyunk
    setTimeout(() => window.location.reload(), 500);
    }

    } catch (err) {
      console.error("❌ Upload error:", err);
      postError.textContent = "Something went wrong.";
    }
  });
}

function updatePreview(container) {
  container.innerHTML = "";

  // képek előnézete: csak fájlnév és törlés
  selectedImages.forEach((file, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "file-preview-item";

    const name = document.createElement("span");
    name.className = "file-name";
    name.textContent = file.name.length > 30 ? file.name.slice(0, 30) + "..." : file.name;

    const removeBtn = document.createElement("span");
    removeBtn.className = "remove-file";
    removeBtn.textContent = "✖";
    removeBtn.title = "Remove file";
    removeBtn.addEventListener("click", () => {
      selectedImages.splice(index, 1);
      updatePreview(container);
    });

    wrapper.appendChild(name);
    wrapper.appendChild(removeBtn);
    container.appendChild(wrapper);
  });

  // videó előnézet (ha van)
  if (selectedVideo) {
    const wrapper = document.createElement("div");
    wrapper.className = "file-preview-item";

    const name = document.createElement("span");
    name.className = "file-name";
    name.textContent = selectedVideo.name.length > 30 ? selectedVideo.name.slice(0, 30) + "..." : selectedVideo.name;

    const removeBtn = document.createElement("span");
    removeBtn.className = "remove-file";
    removeBtn.textContent = "✖";
    removeBtn.title = "Remove file";
    removeBtn.addEventListener("click", () => {
      selectedVideo = null;
      updatePreview(container);
    });

    wrapper.appendChild(name);
    wrapper.appendChild(removeBtn);
    container.appendChild(wrapper);
  }
}


async function loadCategories(selectElement) {
  try {
    const res = await authFetch("/api/v1/classifications/categories/");
    if (!res.ok) throw new Error("Not authorized or failed");

    const data = await res.json();
    const categories = data.results || data;

    selectElement.innerHTML = `<option value="">-- Choose Category --</option>`;
    categories.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.name;
      selectElement.appendChild(opt);
    });

  } catch (err) {
    console.error("❌ Failed to load categories:", err);
    selectElement.innerHTML = `<option value="">(failed to load categories)</option>`;
  }
}
