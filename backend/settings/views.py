from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from artworks.models import Artwork
from profiles.models import Profile
from artworks.serializers import ArtworkSerializer
from profiles.serializers import ProfileSerializer
from django.contrib.auth.models import User


class DeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        user = request.user
        email = user.email
        username = user.username
        user.delete()

        send_mail(
            'MuseXion Account Deleted',
            f'Your MuseXion account ({username}) has been successfully deleted.',
            'noreply@musexion.com',
            [email],
            fail_silently=True
        )

        return Response({'message': 'Account deleted.'}, status=status.HTTP_204_NO_CONTENT)


class UpdateEmailView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        new_email = request.data.get('email')

        if not new_email:
            return Response({'error': 'No new email provided.'}, status=400)

        old_email = user.email
        user.email = new_email
        user.save()

        send_mail(
            'MuseXion Email Changed',
            f'Your MuseXion account email has been changed from {old_email} to {new_email}.',
            'noreply@musexion.com',
            [new_email, old_email],
            fail_silently=True
        )

        return Response({'message': 'Email updated successfully.'})


class UpdatePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        if not user.check_password(old_password):
            return Response({'error': 'Old password is incorrect.'}, status=400)

        user.set_password(new_password)
        user.save()

        send_mail(
            'MuseXion Password Changed',
            'Your MuseXion account password has been changed.',
            'noreply@musexion.com',
            [user.email],
            fail_silently=True
        )

        return Response({'message': 'Password updated successfully.'})


class ExportUserDataView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        profile = Profile.objects.get(user=user)
        artworks = Artwork.objects.filter(user=user)

        profile_data = ProfileSerializer(profile).data
        artwork_data = ArtworkSerializer(artworks, many=True).data

        return Response({
            'user': {
                'username': user.username,
                'email': user.email,
            },
            'profile': profile_data,
            'artworks': artwork_data
        })
from rest_framework.permissions import AllowAny

class PasswordResetView(APIView):
    permission_classes = [AllowAny]   # 🔹 EZ HIÁNYZOTT

    def post(self, request):
        email = request.data.get("email")
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "Email not found"}, status=404)

        reset_link = f"http://127.0.0.1:8000/reset-password/{user.id}/"
        send_mail(
            "MuseXion Password Reset",
            f"Hello {user.username},\n\nClick to reset your password:\n{reset_link}\n\nMuseXion Team",
            "noreply@musexion.com",
            [email],
            fail_silently=False,
        )
        return Response({"message": "Reset email sent"}, status=200)
