from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Comment, CommentLike, CommentMention, MENTION_REGEX

User = get_user_model()


class CommentSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)
    like_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    mentions = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            'id', 'artwork', 'author', 'author_username',
            'content', 'created_at', 'updated_at', 'is_edited',
            'like_count', 'is_liked', 'mentions', 'can_edit'
        ]
        read_only_fields = ['author', 'is_edited', 'like_count', 'is_liked', 'mentions', 'can_edit']

    def get_is_liked(self, obj):
        user = self.context['request'].user
        if not user.is_authenticated:
            return False
        return obj.likes.filter(user=user).exists()
    
    def get_like_count(self, obj):
        return obj.likes.count()

    def get_mentions(self, obj):
        return list(obj.mentions.values_list('mentioned_user__username', flat=True))

    def get_can_edit(self, obj):
        user = self.context['request'].user
        return user.is_authenticated and (obj.author_id == user.id)

    def validate_content(self, value):
        return value.strip()

    def create(self, validated_data):
        request = self.context['request']
        validated_data['author'] = request.user
        comment = super().create(validated_data)
        self._sync_mentions(comment)
        return comment

    def update(self, instance, validated_data):
        instance.is_edited = True
        result = super().update(instance, validated_data)
        self._sync_mentions(instance)
        return result

    def _sync_mentions(self, comment):
        content = comment.content or ''
        usernames = set(m.group(1).lower() for m in MENTION_REGEX.finditer(content))
        users = list(User.objects.filter(username__in=usernames))
        CommentMention.objects.filter(comment=comment).delete()
        CommentMention.objects.bulk_create([
            CommentMention(comment=comment, mentioned_user=u) for u in users
        ])
