from rest_framework import generics, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Artwork, ArtworkImage
from .serializers import ArtworkSerializer
from rest_framework.parsers import MultiPartParser, FormParser
from .permissions import IsOwnerOrReadOnly
from django.db.models import Count
from rest_framework.generics import ListAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from accounts.models import User as CustomUser
from classifications.models import Tag, Category
from notifications.models import Notification
from accounts.models import User as CustomUser
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q
import re 
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django.db.models import Q
from .models import Artwork 

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def report_artwork(request, pk):
    artwork = get_object_or_404(Artwork, pk=pk)
    print(f"🔔 Report: {request.user.username} reported artwork {artwork.id}")
    return Response({"message": "Report received."}, status=200)


def extract_mentions(text):
    return re.findall(r'@(\w+)', text)

class ArtworkListCreateView(generics.ListCreateAPIView):
    parser_classes = [MultiPartParser, FormParser]
    queryset = Artwork.objects.all()
    serializer_class = ArtworkSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = {
        'category': ['exact'],
        'tags__name': ['exact'],
        'user__username': ['exact'],
    }
    search_fields = [
        'description', 'user__username', 'tags__name',
        'category__name', 'user__first_name', 'user__last_name'
    ]
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_serializer_context(self):
        return {'request': self.request}

    def perform_create(self, serializer):
        artwork = serializer.save(user=self.request.user)
        user = self.request.user

        # 🔔 Mention értesítések posztban
        mentioned = extract_mentions(artwork.description)
        for username in mentioned:
            try:
                mentioned_user = CustomUser.objects.get(username=username)
                if mentioned_user != user:
                    Notification.objects.create(
                        recipient=mentioned_user,
                        sender=user,
                        type='mention',
                        artwork=artwork,
                        message=f"{user.username} mentioned you in a post."
                    )
            except CustomUser.DoesNotExist:
                continue

    # ✅ EZ a rész már az osztály szintjén van (NEM beljebb)
    def get_queryset(self):
        queryset = super().get_queryset()
        username = self.request.query_params.get("user__username")
        if username:
            queryset = queryset.filter(user__username=username)
        return (
            queryset
            .select_related('user', 'category')
            .prefetch_related('images', 'likes', 'comments')
            .order_by('-created_at')
        )

        
class ArtworkRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Artwork.objects.all()
    serializer_class = ArtworkSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    
class GlobalSearchView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = request.GET.get("q", "").strip()
        if not query:
            return Response({"results": {}})

        tag_results = list(Tag.objects.filter(name__icontains=query).values_list("name", flat=True)[:5])
        user_results = list(CustomUser.objects.filter(username__icontains=query).values_list("username", flat=True)[:5])
        category_results = list(Category.objects.filter(name__icontains=query).values_list("name", flat=True)[:5])
        artwork_results = list(Artwork.objects.filter(description__icontains=query).values_list("description", flat=True)[:5])

        return Response({
            "query": query,
            "results": {
                "tags": tag_results,
                "users": user_results,
                "categories": category_results,
                "descriptions": artwork_results,
            }
        })


class SearchSuggestions(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        q = request.query_params.get("q", "").strip().lower()
        if not q:
            return Response([])

        results = []

        users = CustomUser.objects.filter(username__icontains=q)[:5]
        tags = Tag.objects.filter(name__icontains=q)[:5]
        categories = Category.objects.filter(name__icontains=q)[:5]
        artworks = Artwork.objects.filter(description__icontains=q)[:5]

        results += [{"type": "user", "username": u.username} for u in users]
        results += [{"type": "tag", "name": t.name} for t in tags]
        results += [{"type": "category", "name": c.name, "id": c.id} for c in categories]
        results += [{"type": "desc", "text": a.description[:30]} for a in artworks]

        return Response(results)
