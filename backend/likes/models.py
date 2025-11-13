from django.db import models
from django.conf import settings
from artworks.models import Artwork

class Like(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    artwork = models.ForeignKey(Artwork, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'artwork')  

    def __str__(self):
        return f"{self.user.email} liked {self.artwork.title}"
# Create your models here.
