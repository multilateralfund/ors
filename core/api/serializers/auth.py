from dj_rest_auth.serializers import PasswordResetSerializer


# pylint: disable=W0223
class CustomPasswordResetSerializer(PasswordResetSerializer):
    def get_email_options(self):
        return {
            "html_email_template_name": "registration/password_reset_email.html",
        }
