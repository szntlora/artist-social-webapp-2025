from rest_framework import generics, permissions, status
from .models import Profile
from .serializers import ProfileSerializer
from .permissions import IsOwnerOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import render, get_object_or_404
from django.contrib.auth import get_user_model
from django.shortcuts import render
from .models import Follow
from .serializers import FollowSerializer, UserSimpleSerializer
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET
from .serializers import CustomizeProfileSerializer
from rest_framework.permissions import IsAuthenticated
from .serializers import CustomizeProfileSerializer, ProfileSerializer
import traceback
from .models import Profile



User = get_user_model()

class ProfileDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, username):
        user = get_object_or_404(User, username=username)
        profile = user.profile
        serializer = ProfileSerializer(profile, context={"request": request})
        return Response(serializer.data)


class ProfileUpdateView(generics.RetrieveUpdateAPIView):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [IsOwnerOrReadOnly]
    lookup_field = 'username'
    
class MyProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = ProfileSerializer(request.user.profile)
        return Response(serializer.data)
    
def profile_page(request, username):
    user = get_object_or_404(User, username=username)
    return render(request, 'profile_page.html', {'profile_user': user})


def profile_view(request, username):
    user = get_object_or_404(User, username=username)
    profile = getattr(user, "profile", None)
    return render(request, "profile.html", {
        "profile_user": user,
        "profile": profile,
    })
    

class CustomizeMyProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Automatikusan létrehoz egy profil objektumot, ha még nincs
            profile, created = Profile.objects.get_or_create(user=request.user)
            serializer = CustomizeProfileSerializer(profile, context={"request": request})
            return Response(serializer.data, status=200)
        except Exception as e:
            print("❌ ERROR in CustomizeMyProfileView.get():", e)
            import traceback
            traceback.print_exc()
            return Response({"error": "Server error occurred."}, status=500)


    def patch(self, request):
        profile = request.user.profile
        serializer = CustomizeProfileSerializer(profile, data=request.data, partial=True, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            updated = CustomizeProfileSerializer(profile, context={"request": request})
            return Response(updated.data, status=200)
        return Response(serializer.errors, status=400)



from notifications.models import Notification

class ToggleFollowView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        target_username = request.data.get('username')
        if not target_username:
            return Response({'error': 'Username required.'}, status=400)

        if target_username == request.user.username:
            return Response({'error': 'You cannot follow yourself.'}, status=400)

        target_user = get_object_or_404(User, username=target_username)
        follow, created = Follow.objects.get_or_create(
            follower=request.user, following=target_user
        )

        if not created:
            follow.delete()
            return Response({'status': 'unfollowed'})
        else:
            # 🔔 új értesítés létrehozása
            Notification.objects.create(
                recipient=target_user,
                sender=request.user,
                type='follow',
                message=f"{request.user.username} started following you."
            )
            return Response({'status': 'followed'})



class FollowersListView(generics.ListAPIView):
    serializer_class = UserSimpleSerializer

    def get_queryset(self):
        username = self.request.query_params.get('username')
        user = get_object_or_404(User, username=username)
        # Azok, akik őt követik
        return User.objects.filter(following__following=user)


class FollowingListView(generics.ListAPIView):
    serializer_class = UserSimpleSerializer

    def get_queryset(self):
        username = self.request.query_params.get('username')
        user = get_object_or_404(User, username=username)
        # Azok, akiket ő követ
        return User.objects.filter(followers__follower=user)

class FollowStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        username = request.query_params.get('username')
        if not username:
            return Response({'error': 'Missing username'}, status=400)

        target_user = get_object_or_404(User, username=username)
        is_following = Follow.objects.filter(
            follower=request.user, following=target_user
        ).exists()
        return Response({'is_following': is_following}, status=200)
