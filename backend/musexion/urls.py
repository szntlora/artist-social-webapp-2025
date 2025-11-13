from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from accounts.views import home_page
from profiles import views
from django.contrib.auth import views as auth_views
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.urls import path
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),

    # --- JWT TOKEN ENDPOINTOK ---
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # --- API útvonalak ---
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/artworks/', include('artworks.urls')),
    path('api/v1/comments/', include('comments.urls')),
    path('api/v1/likes/', include('likes.urls')),
    path('api/v1/classifications/', include('classifications.urls')),
    path('api/v1/notifications/', include('notifications.urls')),
    path('api/v1/', include('profiles.urls')),
    path("api/v1/settings/", include("settings.urls")),


    # --- Auth oldalak ---
    path("", include("accounts.urls")),
    path('auth/', include('django.contrib.auth.urls')),
    path('login/', auth_views.LoginView.as_view(template_name='sign_in.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),

    # --- Frontend oldalak ---
    path('home/', home_page, name='home'),
    path("profile/<str:username>/", views.profile_view, name="profile"),
    path("forgot-password/", TemplateView.as_view(template_name="forgot.html"), name="forgot-password"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
