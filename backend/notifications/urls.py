from django.urls import path
from .views import NotificationListView, mark_notifications_as_read

urlpatterns = [
    path('', NotificationListView.as_view(), name='notifications-list'),
    path('mark_read/', mark_notifications_as_read, name='notifications-mark-read'),
]
