from django.db.models import Count
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from notifications.models import Notification
from accounts.models import User as CustomUser
from .models import Comment, CommentLike
from .serializers import CommentSerializer
from .permissions import IsAuthorOrReadOnly
from rest_framework.views import APIView


def extract_mentions(text):
    return re.findall(r'@(\w+)', text)

class CommentViewSet(viewsets.ModelViewSet):
    """
    /api/comments/?artwork=<artwork_id>  -> Listázás (paginálható)
    POST /api/comments/ {artwork, content} -> Létrehozás
    PATCH/DELETE /api/comments/<id>/ -> saját szerkesztés/törlés
    """
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]
    queryset = Comment.objects.select_related('author', 'artwork').prefetch_related('likes', 'mentions')

    def get_queryset(self):
        queryset = Comment.objects.all().select_related('author', 'artwork')
        artwork_id = self.request.query_params.get('artwork')
        if artwork_id:
            queryset = queryset.filter(artwork__id=artwork_id)
        return queryset.order_by('-created_at')


def perform_create(self, serializer):
        comment = serializer.save(author=self.request.user)
        user = self.request.user
        artwork = comment.artwork

        # 🔔 komment értesítés
        if artwork.user != user:
            Notification.objects.create(
                recipient=artwork.user,
                sender=user,
                type='comment',
                artwork=artwork,
                comment=comment,
                message=f"{user.username} commented on your post."
            )

        # 🔔 mention értesítések
        mentioned = extract_mentions(comment.content)
        for username in mentioned:
            try:
                mentioned_user = CustomUser.objects.get(username=username)
                if mentioned_user != user:
                    Notification.objects.create(
                        recipient=mentioned_user,
                        sender=user,
                        type='mention',
                        comment=comment,
                        message=f"{user.username} mentioned you in a comment."
                    )
            except CustomUser.DoesNotExist:
                continue


        @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
        def like(self, request, pk=None):
            """
            POST /api/comments/<id>/like/
            """
            comment = self.get_object()
            like, created = CommentLike.objects.get_or_create(comment=comment, user=request.user)
            if not created:
                like.delete()
                liked = False
            else:
                liked = True
                # 🔔 értesítés, ha más kommentjét likeolta
                if comment.author != request.user:
                    Notification.objects.create(
                        recipient=comment.author,
                        sender=request.user,
                        type='like_comment',
                        comment=comment,
                        message=f"{request.user.username} liked your comment."
                    )

            return Response({
                'id': comment.id,
                'liked': liked,
                'like_count': comment.likes.count()
            }, status=status.HTTP_200_OK)
            
        
        @action(detail=False, methods=['get'])
        def count_for_artwork(self, request):
            """
            GET /api/comments/count_for_artwork/?artwork=<id>
            -> { artwork: <id>, count: N }
            """
            artwork_id = request.query_params.get('artwork')
            if not artwork_id:
                return Response({'detail': 'artwork query param required'}, status=400)
            count = Comment.objects.filter(artwork_id=artwork_id).count()
            return Response({'artwork': int(artwork_id), 'count': count})


        @action(detail=True, methods=['post'], url_path='report', permission_classes=[IsAuthenticated])
        def report(self, request, pk=None):
            comment = self.get_object()
            # pl. jelzés adminnak, log, stb.
            print(f"[REPORT] User {request.user} reported comment {comment.id}")
            return Response({"detail": "Reported"}, status=status.HTTP_200_OK)
        
class CommentLikeToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            comment = Comment.objects.get(pk=pk)
        except Comment.DoesNotExist:
            return Response({"detail": "Comment not found."}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        like, created = CommentLike.objects.get_or_create(user=user, comment=comment)

        if not created:
            like.delete()
            liked = False
        else:
            liked = True

        like_count = CommentLike.objects.filter(comment=comment).count()
        return Response({
            "liked": liked,
            "like_count": like_count
        })