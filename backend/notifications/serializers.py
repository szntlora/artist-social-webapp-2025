# serializers.py
from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    recipient_username = serializers.CharField(source='recipient.username', read_only=True)
    post_id = serializers.SerializerMethodField()
    target_user = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id',
            'sender_username',
            'recipient_username',
            'type',
            'message',
            'artwork',
            'comment',
            'is_read',
            'created_at',
            'post_id',
            'target_user'
        ]

    def get_post_id(self, obj):
        if obj.artwork:
            return obj.artwork.id
        elif obj.comment and obj.comment.artwork:
            return obj.comment.artwork.id
        return None

    def get_target_user(self, obj):
        # Például követés értesítéshez: target a sender
        if obj.type == 'follow' and obj.sender:
            return obj.sender.username
        return None
