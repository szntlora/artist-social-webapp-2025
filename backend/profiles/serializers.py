from rest_framework import serializers
from .models import Profile, Follow
from django.contrib.auth import get_user_model
from datetime import timedelta
from django.utils import timezone
from .models import Profile

User = get_user_model()

class UserSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username']

class FollowSerializer(serializers.ModelSerializer):
    follower = UserSimpleSerializer(read_only=True)
    following = UserSimpleSerializer(read_only=True)

    class Meta:
        model = Follow
        fields = ['id', 'follower', 'following', 'created']
        

class CustomizeProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', required=False, allow_blank=True)
    last_name = serializers.CharField(source='user.last_name', required=False, allow_blank=True)
    username = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.SerializerMethodField()
    profile_image = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ['username', 'first_name', 'last_name', 'full_name', 'bio', 'artist_type', 'profile_image']

    def get_full_name(self, obj):
        try:
            first = obj.user.first_name if obj.user else ""
            last = obj.user.last_name if obj.user else ""
            return f"{first} {last}".strip()
        except Exception as e:
            print("❌ Error in get_full_name:", e)
            return ""


    def get_profile_image(self, obj):
        try:
            if obj.profile_image and hasattr(obj.profile_image, 'url'):
                return obj.profile_image.url
        except Exception as e:
            print("❌ Error in get_profile_image:", e)
        return None


    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user
        for attr, value in user_data.items():
            setattr(user, attr, value)
        user.save()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        return instance


class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    profile_image = serializers.ImageField(
        required=False,
        allow_null=True,
        allow_empty_file=True,
        use_url=True
    )
    artist_type = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Profile
        fields = ['id', 'username', 'first_name', 'last_name', 'bio', 'profile_image', 'artist_type']

User = get_user_model()

class UserSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username']

class FollowSerializer(serializers.ModelSerializer):
    follower = UserSimpleSerializer(read_only=True)
    following = UserSimpleSerializer(read_only=True)

    class Meta:
        model = Follow
        fields = ['id', 'follower', 'following', 'created']
        


