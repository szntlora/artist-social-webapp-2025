from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.utils.translation import gettext_lazy as _
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.validators import RegexValidator
from .managers import UserManager  #

# AUTH PROVIDERS
AUTH_PROVIDERS = {
    'email': 'email',
    'google': 'google',
}

username_validator = RegexValidator(
    regex=r'^[a-z0-9._]+$',
    message=_("A felhasználónév csak kisbetűket, számokat, pontot és aláhúzást tartalmazhat.")
)

class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(_('email address'), unique=True, max_length=255)
    username = models.CharField(
        _('username'),
        unique=True,
        max_length=60,
        validators=[username_validator],
        error_messages={
            'unique': _("Ez a felhasználónév már foglalt."),
        },
    )
    first_name = models.CharField(_('first name'), max_length=100)
    last_name = models.CharField(_('last name'), max_length=50)
    is_active = models.BooleanField(_('active'), default=True)
    is_staff = models.BooleanField(_('staff status'), default=False)
    is_superuser = models.BooleanField(_('superuser status'), default=False)
    is_verified = models.BooleanField(_('verified'), default=False)
    date_joined = models.DateTimeField(_('date joined'), auto_now_add=True)
    last_login = models.DateTimeField(_('last login'), auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    objects = UserManager()

    def __str__(self):
        return self.email

    @property
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

    def tokens(self):
        refresh = RefreshToken.for_user(self)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token)
        }


class OneTimePassword(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=6, unique=True)

    def __str__(self):
        return f"{self.user.first_name}-passcode"