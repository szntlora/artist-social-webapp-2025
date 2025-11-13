from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import CommentViewSet, CommentLikeToggleView

router = DefaultRouter()
router.register(r'', CommentViewSet, basename='comment')

urlpatterns = [
    path('<int:pk>/like/', CommentLikeToggleView.as_view(), name='comment-like'),
    path('', include(router.urls)),
]
