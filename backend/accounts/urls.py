from django.urls import path
from .views import RegisterUserView, VerifyUserEmail, LoginUserView, TestAuthentication, PasswordResetConfirm, PasswordResetRequestView, SetNewPassword, LogoutUserView, MyTokenObtainPairView, DeleteAccountView, UpdateEmailView, UpdatePasswordView, ExportUserDataView
from rest_framework_simplejwt.views import TokenRefreshView
from . import views


urlpatterns = [
    # API endpointok
    path('api/register/', views.RegisterUserView.as_view(), name='api-register'),
    path('api/login/', views.LoginUserView.as_view(), name='api-login'),
    path('api/verify-email/', views.VerifyUserEmail.as_view(), name='api-verify'),
    path('api/profile/', views.TestAuthentication.as_view(), name='api-profile'),
    path('api/password-reset/', views.PasswordResetRequestView.as_view(), name='api-reset-password'),
    path('api/password-reset-confirm/<uidb64>/<token>/', views.PasswordResetConfirm.as_view(), name='api-reset-password-confirm'),
    path('api/set-new-password/', views.SetNewPassword.as_view(), name='api-set-new-password'),
    path('api/logout/', views.LogoutUserView.as_view(), name='api-logout'),

    # HTML oldalak
    path("", views.open_page, name="home"),
    path("login/", views.sign_in, name="custom-login"),
    path("register/", views.register, name="register"),    path("profile/", views.profile, name="profile"),
    path("open_page/", views.open_page, name="open_page"),
    path("home/", views.home_page, name="home_page"),
    path("test-email/", views.test_email, name="test-email"),
    path("account/delete/", DeleteAccountView.as_view(), name="delete-account"),
    path("account/update-email/", UpdateEmailView.as_view(), name="update-email"),
    path("account/update-password/", UpdatePasswordView.as_view(), name="update-password"),
    path("account/export/", ExportUserDataView.as_view(), name="export-user-data"),
]


