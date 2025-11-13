from django.db import models
from django.conf import settings
from classifications.models import Category, Tag

class Artwork(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='artworks')
    description = models.TextField(blank=True)
    # image = models.ImageField(upload_to='artworks/', null=True, blank=True)
    video = models.FileField(upload_to='artworks/videos/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='artworks')
    tags = models.ManyToManyField(Tag, blank=True, related_name='artworks')

    def __str__(self):
        return f"Artwork by {self.user} - {self.description[:30]}" if self.description else f"Artwork by {self.user}"

class ArtworkImage(models.Model):
    artwork = models.ForeignKey('Artwork', on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='artworks/')
