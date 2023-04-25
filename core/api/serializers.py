from dj_rest_auth.serializers import PasswordResetSerializer

class CustomPasswordResetSerializer(PasswordResetSerializer):
    def get_email_options(self) :
      
        return {
            'html_email_template_name': 'registration/password_reset_email.html',
        }