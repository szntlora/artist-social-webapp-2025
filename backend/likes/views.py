from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Like
from artworks.models import Artwork
from .serializers import LikeSerializer
from notifications.models import Notification


class LikeToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        artwork_id = request.data.get("artwork_id")
        if not artwork_id:
            return Response({"error": "artwork_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            artwork = Artwork.objects.get(id=artwork_id)
        except Artwork.DoesNotExist:
            return Response({"error": "Artwork not found"}, status=status.HTTP_404_NOT_FOUND)

        like, created = Like.objects.get_or_create(user=request.user, artwork=artwork)

        if not created:
            like.delete()
            liked = False
        else:
            liked = True

            # 🔔 értesítés, ha nem saját poszt
            if artwork.user != request.user:
                Notification.objects.create(
                    recipient=artwork.user,
                    sender=request.user,
                    type='like_post',
                    artwork=artwork,
                    message=f"{request.user.username} liked your post."
                )

        like_count = artwork.likes.count()
        return Response({"liked": liked, "like_count": like_count}, status=status.HTTP_200_OK)   


class LikeListView(generics.ListAPIView):
    queryset = Like.objects.all()
    serializer_class = LikeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

