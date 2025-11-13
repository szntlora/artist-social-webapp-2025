from django.db import models
from django.conf import settings
from artworks.models import Artwork
from comments.models import Comment

User = settings.AUTH_USER_MODEL

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('like_post', 'Like on Post'),
        ('like_comment', 'Like on Comment'),
        ('comment', 'New Comment'),
        ('mention', 'Mention'),
        ('follow', 'New Follower'),  
    ]

    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_notifications'
    )
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    artwork = models.ForeignKey(
        Artwork,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    comment = models.ForeignKey(
        Comment,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    message = models.TextField(blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.type} → {self.recipient}"
