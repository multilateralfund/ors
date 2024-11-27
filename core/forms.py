import logging
from collections import defaultdict

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import PasswordResetForm
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import EmailMultiAlternatives
from django.template import loader
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

User = get_user_model()
logger = logging.getLogger(__name__)
# pylint: disable=R0913


class CountryUserPasswordResetForm(PasswordResetForm):
    def send_mail(
        self,
        subject_template_name,
        email_template_name,
        context,
        from_email,
        to_email,
        html_email_template_name=None,
    ):
        """
        Send a django.core.mail.EmailMultiAlternatives to `to_email`.
        """
        subject = loader.render_to_string(subject_template_name, context)
        # Email subject *must not* contain newlines
        subject = "".join(subject.splitlines())
        body = loader.render_to_string(email_template_name, context)

        email_message = EmailMultiAlternatives(
            subject,
            body,
            from_email,
            [to_email],
            cc=settings.COUNTRY_USERS_EMAIL_CC,
        )
        if html_email_template_name:
            html_email = loader.render_to_string(html_email_template_name, context)
            email_message.attach_alternative(html_email, "text/html")

        email_message.send()

    def save(
        self,
        domain_override=None,
        subject_template_name="registration/password_reset_subject.txt",
        email_template_name="registration/password_reset_email.html",
        use_https=False,
        token_generator=default_token_generator,
        from_email=None,
        request=None,
        html_email_template_name=None,
        extra_email_context=None,
    ):
        """
        Generate 2 one-use only links for resetting passwords
        for each of the 2 country users and send them in 1 email.
        """
        email = self.cleaned_data["email"]
        reset_dict = defaultdict(dict)
        for user in self.get_users(email):
            if user.user_type not in (
                User.UserType.COUNTRY_USER,
                User.UserType.COUNTRY_SUBMITTER,
            ):
                continue
            reset_dict["uid"][user.user_type] = urlsafe_base64_encode(
                force_bytes(user.pk)
            )
            reset_dict["token"][user.user_type] = token_generator.make_token(user)

        if not reset_dict:
            return

        context = {
            "email": email,
            "domain": domain_override,
            "site_name": domain_override,
            "uid_inputter": reset_dict["uid"][User.UserType.COUNTRY_USER],
            "uid_submitter": reset_dict["uid"][User.UserType.COUNTRY_SUBMITTER],
            "token_inputter": reset_dict["token"][User.UserType.COUNTRY_USER],
            "token_submitter": reset_dict["token"][User.UserType.COUNTRY_SUBMITTER],
            "protocol": "https" if use_https else "http",
            **(extra_email_context or {}),
        }

        self.send_mail(
            subject_template_name,
            email_template_name,
            context,
            from_email,
            email,
            html_email_template_name=html_email_template_name,
        )
