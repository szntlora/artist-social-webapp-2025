from django.urls import path
from .views import LikeToggleView, LikeListView

urlpatterns = [
    path('', LikeListView.as_view(), name='like-list'),
    path('toggle/', LikeToggleView.as_view(), name='like-toggle'),
]
