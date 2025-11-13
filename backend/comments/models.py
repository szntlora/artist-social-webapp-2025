from django.conf import settings
from django.db import models
from django.utils import timezone
from django.core.validators import MinLengthValidator
import re

User = settings.AUTH_USER_MODEL

MENTION_REGEX = re.compile(r'@([a-z0-9._]{1,60})', re.IGNORECASE)

class Comment(models.Model):
    artwork = models.ForeignKey(
        'artworks.Artwork',
        related_name='comments',
        on_delete=models.CASCADE
    )
    author = models.ForeignKey(
        User,
        related_name='comments',
        on_delete=models.CASCADE
    )
    content = models.TextField(validators=[MinLengthValidator(1)])
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    is_edited = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Comment #{self.pk} on artwork {self.artwork_id}'

    @property
    def like_count(self):
        return self.likes.count()


class CommentLike(models.Model):
    comment = models.ForeignKey(
        Comment, related_name='likes', on_delete=models.CASCADE
    )
    user = models.ForeignKey(
        User, related_name='comment_likes', on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('comment', 'user')


class CommentMention(models.Model):
    comment = models.ForeignKey(
        Comment, related_name='mentions', on_delete=models.CASCADE
    )
    mentioned_user = models.ForeignKey(
        User, related_name='mentioned_in_comments', on_delete=models.CASCADE
    )
    start = models.IntegerField(null=True, blank=True)
    end = models.IntegerField(null=True, blank=True)

    class Meta:
        unique_together = ('comment', 'mentioned_user')

class CommentReport(models.Model):
    comment = models.ForeignKey(Comment, related_name='reports', on_delete=models.CASCADE)
    reporter = models.ForeignKey(User, related_name='comment_reports', on_delete=models.CASCADE)
    reason = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('comment', 'reporter')