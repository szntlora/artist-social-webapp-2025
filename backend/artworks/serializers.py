import re
from rest_framework import serializers
from classifications.models import Tag
from .models import Artwork, ArtworkImage
from likes.models import Like
from comments.models import Comment
from classifications.models import Category
from classifications.serializers import TagSerializer, CategorySerializer

class ArtworkImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArtworkImage
        fields = ['id', 'image']

class ArtworkSerializer(serializers.ModelSerializer):
    images = ArtworkImageSerializer(many=True, read_only=True)
    like_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    tags = TagSerializer(many=True, read_only=True)
    is_liked = serializers.SerializerMethodField()
    creator = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)
    creator_username = serializers.CharField(source='user.username', read_only=True)
    creator_full_name = serializers.CharField(source='user.full_name', read_only=True)
    
    class Meta:
        model = Artwork
        fields = [
            'id', 'description', 'video', 'category', 'created_at',
            'creator', 'images', 'like_count', 'is_liked', 'comment_count', 'tags', 'creator_username', 'creator_full_name',
        ]
    def get_category(self, obj):
        if obj.category:
            return obj.category.name
        return "Unknown Category"

    def get_like_count(self, obj):
        return obj.likes.count()

    def get_comment_count(self, obj):
        return Comment.objects.filter(artwork=obj).count()

    def get_is_liked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def get_creator(self, obj):
        try:
            user = obj.user
            profile = getattr(user, "profile", None)

            profile_image = (
                profile.profile_image.url
                if profile and profile.profile_image
                else None
            )

            artist_type = (
                profile.artist_type
                if profile and profile.artist_type
                else "artist"
            )

            return {
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "profile_image": profile_image,
                "artist_type": artist_type
            }
        except Exception as e:
            # Ideiglenes debug log (opcionális)
            print(f"Creator serialization error: {e}")
            return {
                "username": "unknown",
                "first_name": "",
                "last_name": "",
                "profile_image": None,
                "artist_type": "artist"
            }


    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user if request and request.user.is_authenticated else None

        validated_data["user"] = user

        category_id = self.initial_data.get("category")
        if category_id:
            try:
                from classifications.models import Category
                validated_data["category"] = Category.objects.get(id=int(category_id))
            except Category.DoesNotExist:
                validated_data["category"] = None

        artwork = super().create(validated_data)

        for image in request.FILES.getlist("images"):
            ArtworkImage.objects.create(artwork=artwork, image=image)

        video = request.FILES.get("video")
        if video:
            artwork.video = video
            artwork.save()

        description = validated_data.get("description", "")
        hashtags = re.findall(r"#(\w+)", description)

        for tag_name in set(hashtags):
            tag_obj, _ = Tag.objects.get_or_create(name=tag_name.lower())
            artwork.tags.add(tag_obj)

        return artwork


