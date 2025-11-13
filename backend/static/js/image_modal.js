let currentImageIndex = 0;
let images = [];

export function refreshImageModal() {
  const modal = document.getElementById("imageModal");
  const closeBtn = document.getElementById("closeModalBtn");
  const downloadBtn = document.getElementById("downloadImageBtn");
  const prevBtn = document.getElementById("prevImage");
  const nextBtn = document.getElementById("nextImage");

  if (!modal) return;

  closeBtn?.addEventListener("click", () => {
    modal.classList.remove("active");
  });

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("active");
    }
  });

  prevBtn?.addEventListener("click", () => {
    showImage(currentImageIndex - 1);
  });

  nextBtn?.addEventListener("click", () => {
    showImage(currentImageIndex + 1);
  });

  downloadBtn?.addEventListener("click", () => {
    const img = document.getElementById("modalImage");
    const link = document.createElement("a");
    link.href = img.src;
    link.download = "image.jpg";
    link.click();
  });

  document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("active")) return;
    if (e.key === "Escape") modal.classList.remove("active");
    if (e.key === "ArrowLeft") showImage(currentImageIndex - 1);
    if (e.key === "ArrowRight") showImage(currentImageIndex + 1);
  });
}

export function openImageModal(imgArray, index = 0) {
  images = imgArray;
  currentImageIndex = index;
  showImage(currentImageIndex);
  document.getElementById("imageModal").classList.add("active");
}

function showImage(index) {
if (!images || !Array.isArray(images) || images.length === 0) return;

  currentImageIndex = (index + images.length) % images.length;
  const image = images[currentImageIndex];
  const modalImg = document.getElementById("modalImage");

  if (modalImg && image) {
    modalImg.src = image.image;
  }

  document.getElementById("prevImage").style.display = images.length > 1 ? "flex" : "none";
  document.getElementById("nextImage").style.display = images.length > 1 ? "flex" : "none";
}
