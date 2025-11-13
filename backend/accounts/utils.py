#for verification 

import random
from django.core.mail import EmailMessage
from.models import User, OneTimePassword
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

def generateOtp():
    otp = ""
    for i in range(6):
        otp += str(random.randint(1, 9))
    return otp


def send_code_to_user(email):
    Subject = "One time passcode for Email verification"
    otp_code = generateOtp()
    print("🔢 Generated OTP:", otp_code)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        print("❌ No user with email:", email)
        return

    # ⛔ Korábbi OTP-k törlése ehhez a userhez
    OneTimePassword.objects.filter(user=user).delete()

    # 🔐 Új OTP mentése
    OneTimePassword.objects.create(user=user, code=otp_code)

    # 📧 Email küldés
    email_body = (
        f"Hi {user.first_name},\n\n"
        f"Thank you for signing up on MuseXion!\n"
        f"To verify your email address, please enter the following 6-digit code:\n\n"
        f"🔐 {otp_code} 🔐\n\n"
        f"If you didn’t create an account, you can safely ignore this message.\n\n"
        f"Best regards,\n"
        f"The MuseXion Team"
    )

    from_email = settings.DEFAULT_FROM_EMAIL
    try:
        d_email = EmailMessage(subject=Subject, body=email_body, from_email=from_email, to=[email])
        d_email.send(fail_silently=False)
        print("✅ OTP email elküldve:", email)
    except Exception as e:
        print("❌ Email küldési hiba:", e)

    
    

def send_normal_email(data):
    email=EmailMessage(
        subject=data['email_subject'], 
        body=data['email_body'], 
        from_email=settings.DEFAULT_FROM_EMAIL, 
        to=[data['to_email']]
    )
    email.send()
    
    

    
