from rest_framework import serializers
from .models import User
from django.contrib.auth import authenticate
from rest_framework.exceptions import AuthenticationFailed
#from django.contrib.auth import user_is_verified
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.contrib.sites.shortcuts import get_current_site
from django.utils.encoding import smart_bytes, smart_str, force_str
from django.urls import reverse
from .utils import send_normal_email
from rest_framework_simplejwt.tokens import RefreshToken, TokenError


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, max_length=68, min_length=6)
    password2 = serializers.CharField(write_only=True, max_length=68, min_length=6)
    username = serializers.CharField(max_length=60)  
    
    class Meta:
        model = User
        fields = ['email', 'username', 'first_name', 'last_name', 'password', 'password2']  
    
    def validate(self, attrs):
        password = attrs.get('password', '')
        password2 = attrs.get('password2', '')
        if password != password2:
            raise serializers.ValidationError("passwords do not match")
        attrs['username'] = attrs['username'].lower()
        return attrs
    
    def create(self, validated_data):
        validated_data.pop("password2")
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            password=validated_data['password']
        )
        return user

    

from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from .models import User

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=255, min_length=6)
    password = serializers.CharField(max_length=68, write_only=True)

    def validate(self, attrs):
        email = attrs.get('email', '').strip().lower()
        password = attrs.get('password', '')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise AuthenticationFailed("invalid credentials please try again")

        if not user.check_password(password):
            raise AuthenticationFailed("invalid credentials please try again")

        if not user.is_active:
            raise AuthenticationFailed("account disabled")
        if not user.is_verified:
            raise AuthenticationFailed("email not verified")

        tokens = user.tokens()

        return {
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "full_name": f"{user.first_name} {user.last_name}"
            },
            "access_token": tokens["access"],
            "refresh_token": tokens["refresh"],
        }

        
    
class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=255, min_length=6)
    
    class Meta:
        fields = ['email']
        
    def validate(self, attrs):
        email=attrs.get('email', '')
        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)
            uidb64 = urlsafe_base64_encode(smart_bytes(user.id))
            token = PasswordResetTokenGenerator().make_token(user)
            request=self.context.get('request')
            site_domain=get_current_site(request).domain
            relative_link=reverse('password-reset-confirm', kwargs={'uidb64': uidb64, 'token': token})
            abslink = f"http://{site_domain}{relative_link}"    
            email_body=f'Hello, Use the link below to reset your password \n {abslink}' 
            data={
                'email_body': email_body,
                'email_subject': 'Reset your password',
                'to_email': user.email
            }
            send_normal_email(data)
    
        return super().validate(attrs)
    

class SetNewPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(max_length=68, min_length=6, write_only=True)
    confirm_password = serializers.CharField(max_length=68, min_length=6, write_only=True)
    token = serializers.CharField(write_only=True)
    uidb64 = serializers.CharField(write_only=True)
    
    class Meta:
        fields = ['email', 'password', 'id', 'username', 'first_name', 'last_name', 'full_name', 'access_token', 'refresh_token', 'uidb64']
        
    def validate(self, attrs):
        try:
            token=attrs.get('token', '')
            uidb64=attrs.get('uidb64', '')
            password=attrs.get('password', '')
            confirm_password=attrs.get('confirm_password', '')
            
            user_id=force_str(urlsafe_base64_decode(uidb64))
            user=User.objects.get(id=user_id)
            if not PasswordResetTokenGenerator().check_token(user, token):
                raise AuthenticationFailed("reset link is invalid or has expired", 401)
            if password != confirm_password:
                raise AuthenticationFailed("passwords do not match")
            user.set_password(password)
            user.save()
            return user
        except Exception as e:
            return AuthenticationFailed("the reset link is invalid or has expired")
        


class LogoutUserSerializer(serializers.Serializer):
    refresh_token=serializers.CharField()
    
    default_error_messages = {
        'bad_token': ('Token is expired or invalid')
    }
    
    
    
    def validate(self, attrs):
        self.token=attrs.get('refresh_token', '') 
        return attrs
    
    def save(self, **kwargs):
        try:
            token = RefreshToken(self.token)
            token.blacklist()
        except TokenError:
            return self.fail('bad_token')
        
        
        
