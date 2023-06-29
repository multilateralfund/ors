from django.conf import settings
from django.contrib import admin
from django.contrib import messages
from django.contrib.auth.forms import PasswordResetForm

from core.models.user import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = [
        "email",
        "first_name",
        "last_name",
        "username",
        "is_staff",
        "is_active",
    ]

    fields = (
        "email",
        "first_name",
        "last_name",
        "username",
        "is_staff",
        "is_active",
        "last_login",
        "date_joined",
    )

    search_fields = (
        "email",
        "username",
        "first_name",
        "last_name",
    )

    readonly_fields = (
        "last_login",
        "date_joined",
    )
    ordering = ("email",)

    def save_model(self, request, obj, form, change):
        if not change:
            obj.password = User.objects.make_random_password()
        super().save_model(request, obj, form, change)

        # send reset password email
        if not change:
            form = PasswordResetForm({"email": obj.email})
            form.is_valid()
            form.save(
                domain_override=settings.FRONTEND_HOST,
                use_https=settings.HAS_HTTPS,
                email_template_name="registration/create_new_user_email.html",
            )
            self.message_user(
                request,
                f"Email sent to {obj.email} for password reset",
                level=messages.SUCCESS,
            )
