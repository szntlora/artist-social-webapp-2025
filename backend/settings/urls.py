from django.urls import path
from .views import (
    DeleteAccountView,
    UpdateEmailView,
    UpdatePasswordView,
    ExportUserDataView,
    PasswordResetView,
)

urlpatterns = [
    path("delete/", DeleteAccountView.as_view(), name="delete-account"),
    path("update-email/", UpdateEmailView.as_view(), name="update-email"),
    path("update-password/", UpdatePasswordView.as_view(), name="update-password"),
    path("export/", ExportUserDataView.as_view(), name="export-user-data"),
    path("password-reset/", PasswordResetView.as_view(), name="password-reset"),  # 🔹 csak egyszer
]
