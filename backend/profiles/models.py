from django.db import models
from django.conf import settings

def profile_image_upload_path(instance, filename):
    return f"profile_images/{instance.user.username}/{filename}"

class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    bio = models.TextField(blank=True)
    profile_image = models.ImageField(upload_to=profile_image_upload_path, blank=True, null=True)
    artist_type = models.CharField(max_length=50, default="ARTIST")
    last_full_name_change = models.DateTimeField(null=True, blank=True)
    def __str__(self):
        return self.user.username
    
class Follow(models.Model):
    follower = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='following',
        on_delete=models.CASCADE
    )
    following = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='followers',
        on_delete=models.CASCADE
    )
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'following')

    def __str__(self):
        return f"{self.follower} → {self.following}"