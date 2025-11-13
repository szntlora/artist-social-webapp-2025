from django.shortcuts import render
from rest_framework.generics import GenericAPIView
from .serializers import UserRegisterSerializer, LoginSerializer, PasswordResetRequestSerializer, SetNewPasswordSerializer, LogoutUserSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from .utils import send_code_to_user
from .models import OneTimePassword, User
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import smart_str, DjangoUnicodeDecodeError
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.core.mail import send_mail
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from artworks.models import Artwork
from profiles.models import Profile
from artworks.serializers import ArtworkSerializer
from profiles.serializers import ProfileSerializer
from comments.models import Comment
from likes.models import Like
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt


class RegisterUserView(GenericAPIView):
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid(raise_exception=True):
            user = serializer.save()  
            email = serializer.validated_data.get("email")  
            try:
                send_code_to_user(email)
            except Exception as e:
                print(">>> send_code_to_user error:", e)
            return Response({
                'data': serializer.data,
                'message': f"hi {serializer.validated_data.get('first_name')} thanks for signing up."
                           f"A passcode has been sent to your email"
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)  
    
class VerifyUserEmail(GenericAPIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        otpcode = str(request.data.get('otp', '')).strip()
        email = request.data.get('email', '').strip().lower()

        if not email:
            return Response({'message': 'Email is required.'}, status=400)

        try:
            user = User.objects.get(email=email)
            otp_obj = OneTimePassword.objects.filter(user=user, code=otpcode).first()

            if not otp_obj:
                return Response({'message': 'Invalid or expired OTP'}, status=404)

            if not user.is_verified:
                user.is_verified = True
                user.is_active = True  # csak akkor aktiváljuk, ha verifikálta
                user.save()
                return Response({'message': 'Email successfully verified'}, status=200)

            return Response({'message': 'User already verified'}, status=400)

        except User.DoesNotExist:
            return Response({'message': 'User not found'}, status=404)
        except Exception as e:
            print("❌ OTP ellenőrzési hiba:", e)
            return Response({'message': 'Unexpected error occurred'}, status=500)


class LoginUserView(GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)

    
class TestAuthentication(GenericAPIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        data={
            'msg': 'it works'
        }
        return Response(data, status=status.HTTP_200_OK)
    
    

class PasswordResetRequestView(GenericAPIView):
    serializer_class = PasswordResetRequestSerializer
    def post(self, request):
        serializer = self.serializer_class(data=request.data, context={'request':request})
        serializer.is_valid(raise_exception=True)
        return Response({'message': 'password reset link has been sent to your email'}, status=status.HTTP_200_OK)
    
    

class PasswordResetConfirm(GenericAPIView):
    def get(self, request, uidb64, token):
        try:
            user_id=smart_str(urlsafe_base64_decode(uidb64))
            user=User.objects.get(id=user_id)
            if not PasswordResetTokenGenerator().check_token(user, token):
                return Response({'message': 'token is invalid or has expired, please request a new one'}, status=status.HTTP_401_UNAUTHORIZED)
            return Response({'success': True, 'message': 'credentials valid', 'uidb64': uidb64, 'token': token}, status=status.HTTP_200_OK)
        
        except DjangoUnicodeDecodeError:
            return Response({'message': 'token is invalid or has expired, please request a new one'}, status=status.HTTP_401_UNAUTHORIZED)
        


class SetNewPassword(GenericAPIView):
    serializer_class = SetNewPasswordSerializer
    def patch(self, request):
        serializer=self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({'message': 'password reset successful'}, status=status.HTTP_200_OK)
    
    
class LogoutUserView(GenericAPIView):
    serializer_class = LogoutUserSerializer
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer=self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
def open_page(request):
    return render(request, "open_page.html")

def sign_in(request):
    return render(request, "sign_in.html")

def register(request):
    return render(request, "registration.html")

def home_page(request):
    return render(request, "home_page.html")

def profile(request):
    return render(request, "profile.html")

def market(request):
    return render(request, "market.html")



from django.core.mail import send_mail
from django.http import HttpResponse


def test_email(request):
    try:
        send_mail(
            "Teszt MuseXion",
            "Ez egy próba e-mail a Django-ból Gmail SMTP-n keresztül.",
            None,   # DEFAULT_FROM_EMAIL-t használja
            ["szntlora@gmail.com"],  # ide küldjük
            fail_silently=False,
        )
        return HttpResponse("✅ Email sikeresen elküldve!")
    except Exception as e:
        return HttpResponse(f"❌ Hiba: {str(e)}")

class DeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        password = request.data.get("password")

        if not password:
            return Response({"message": "Password is required."}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        email = user.email
        username = user.username

        if not user.check_password(password):
            return Response({"message": "Incorrect password."}, status=status.HTTP_403_FORBIDDEN)

        # 🔥 Kapcsolódó adatok törlése – helyes mezőnevekkel
        Profile.objects.filter(user=user).delete()
        Artwork.objects.filter(user=user).delete()
        Comment.objects.filter(author=user).delete()   # ✅ author a helyes mező
        Like.objects.filter(user=user).delete()        # ⚠️ csak ha a Like modellben tényleg user a mező

        # 🔐 Fiók törlése
        user.delete()

        # 📧 Email küldés
        try:
            send_mail(
                subject='MuseXion Account Deleted',
                message=f'Your MuseXion account ({username}) has been permanently deleted from the MuseXion platform.',
                from_email='noreply@musexion.com',
                recipient_list=[email],
                fail_silently=True
            )
        except Exception as e:
            print("⚠️ Failed to send deletion email:", e)

        return Response({"message": "Account successfully deleted."}, status=status.HTTP_204_NO_CONTENT)


def open_page(request):
    return render(request, 'open_page.html')

class UpdateEmailView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        new_email = request.data.get('email')

        if not new_email:
            return Response({'error': 'No new email provided.'}, status=400)

        # Ha az email már másnál van használatban:
        if User.objects.filter(email=new_email).exclude(pk=user.pk).exists():
            return Response({'error': 'This email is already in use.'}, status=400)

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


from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Extra infókat is visszaadhatsz a tokenben:
        token['username'] = user.username
        token['email'] = user.email
        return token

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


