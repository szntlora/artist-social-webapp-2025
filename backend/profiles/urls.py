from django.urls import path
from .views import *
from . import views

urlpatterns = [
    path('follow/status/', FollowStatusView.as_view(), name='follow-status'),
    path('follow/toggle/', ToggleFollowView.as_view(), name='follow-toggle'),
    path('followers/', FollowersListView.as_view(), name='followers-list'),
    path('following/', FollowingListView.as_view(), name='following-list'),

    path('profile/', MyProfileView.as_view(), name='my-profile'),
    path('profile/customize/', CustomizeMyProfileView.as_view(), name='profile-customize'),  # ⬅️ ÚJ
    path('profile/<str:username>/', ProfileDetailView.as_view(), name='profile-detail'),
    path('profile/<str:username>/edit/', ProfileUpdateView.as_view(), name='profile-edit'),

    path('<str:username>/', profile_page, name='profile_page'),
]



