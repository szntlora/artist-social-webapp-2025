document.addEventListener("DOMContentLoaded", () => {
  // === SETTINGS DRAWER ===
  const settingsBtn = document.getElementById("settingsBtn");
  const closeSettingsBtn = document.getElementById("closeSettingsBtn");
  const settingsDrawer = document.getElementById("settingsDrawer");

  if (settingsBtn && closeSettingsBtn && settingsDrawer) {
    settingsBtn.addEventListener("click", () => {
      settingsDrawer.classList.remove("hidden");
    });
    closeSettingsBtn.addEventListener("click", () => {
      settingsDrawer.classList.add("hidden");
    });
  }

  // === MENU VÁLTÁS ===
  const menuItems = document.querySelectorAll(".settings-menu li");
  const sections = document.querySelectorAll(".settings-section");

  if (menuItems.length && sections.length) {
    menuItems.forEach((item) => {
      item.addEventListener("click", () => {
        menuItems.forEach((el) => el.classList.remove("active"));
        item.classList.add("active");

        const targetId = item.getAttribute("data-section");
        sections.forEach((section) => {
          section.classList.toggle("hidden", section.id !== `section-${targetId}`);
        });
      });
    });
  }

  // === EMAIL MÓDOSÍTÁS ===
  const updateEmailBtn = document.getElementById("updateEmailBtn");
  if (updateEmailBtn) {
    updateEmailBtn.addEventListener("click", async () => {
      const newEmail = document.getElementById("newEmailInput").value.trim();
      if (!newEmail) return showMessage("Email cannot be empty.");

      try {
        const res = await fetch("/api/v1/settings/update-email/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("accessToken"),
          },
          body: JSON.stringify({ email: newEmail }),
        });
        const data = await res.json();
        showMessage(data.message || "Email updated successfully.");
      } catch (err) {
        showMessage("Error updating email.");
      }
    });
  }

  // === JELSZÓ MÓDOSÍTÁS ===
  const updatePasswordBtn = document.getElementById("updatePasswordBtn");
  if (updatePasswordBtn) {
    updatePasswordBtn.addEventListener("click", async () => {
      const oldPassword = document.getElementById("oldPasswordInput").value.trim();
      const newPassword = document.getElementById("newPasswordInput").value.trim();
      if (!oldPassword || !newPassword) return showMessage("Both passwords required.");

      try {
        const res = await fetch("/api/v1/settings/update-password/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("accessToken"),
          },
          body: JSON.stringify({
            old_password: oldPassword,
            new_password: newPassword,
          }),
        });
        const data = await res.json();
        showMessage(data.message || "Password updated.");
      } catch (err) {
        showMessage("Error updating password.");
      }
    });
  }

  // === FIÓK TÖRLÉS JELSZÓVAL ===
  const deleteAccountBtn = document.getElementById("deleteAccountBtn");
  const deleteAccountModal = document.getElementById("deleteAccountModal");
  const cancelDelete = document.getElementById("cancelDelete");
  const confirmDelete = document.getElementById("confirmDeleteAccount");

  if (deleteAccountBtn && deleteAccountModal) {
    deleteAccountBtn.addEventListener("click", () => {
      deleteAccountModal.classList.remove("hidden");
    });
  }

  if (cancelDelete && deleteAccountModal) {
    cancelDelete.addEventListener("click", () => {
      deleteAccountModal.classList.add("hidden");
    });
  }

  if (confirmDelete) {
    confirmDelete.addEventListener("click", async () => {
      const password = document
        .getElementById("confirm-delete-password")
        .value.trim();
      const errorBox = document.getElementById("delete-error");
      if (errorBox) errorBox.style.display = "none";

      try {
        const response = await fetch("/account/delete/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify({ password }),
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.clear();
          window.location.href = "/login/";
        } else {
          if (errorBox) {
            errorBox.innerText = data.message || "Deletion failed.";
            errorBox.style.display = "block";
          }
        }
      } catch (error) {
        if (errorBox) {
          errorBox.innerText = "Unexpected error. Try again.";
          errorBox.style.display = "block";
        }
      }
    });
  }

  // === ADAT EXPORT ===
  const exportDataBtn = document.getElementById("exportDataBtn");
  if (exportDataBtn) {
    exportDataBtn.addEventListener("click", async () => {
      try {
        const res = await fetch("/api/v1/settings/export-data/", {
          method: "GET",
          headers: {
            Authorization: "Bearer " + localStorage.getItem("accessToken"),
          },
        });
        if (!res.ok) throw new Error("Export failed");

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "musexion_user_data.zip";
        document.body.appendChild(a);
        a.click();
        a.remove();
        showMessage("Data downloaded.");
      } catch (err) {
        showMessage("Failed to export data.");
      }
    });
  }

  // === SEGÉD: Üzenet kiírása ===
  function showMessage(msg) {
    const msgDiv = document.getElementById("settingsMessage");
    if (!msgDiv) return;
    msgDiv.textContent = msg;
    msgDiv.style.opacity = 1;
    setTimeout(() => (msgDiv.style.opacity = 0), 4000);
  }
});
