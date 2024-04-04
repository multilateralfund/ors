from django.conf import settings
from django.contrib import admin
from django.contrib import messages
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import PasswordResetForm
from django.core.exceptions import ValidationError
from django.forms import ModelForm
from django.utils.translation import gettext_lazy as _

User = get_user_model()


class UserEditAdminForm(ModelForm):
    class Meta:
        model = User
        fields = "__all__"

    def clean(self):
        cleaned_data = super().clean()
        user_type = cleaned_data["user_type"]
        country = cleaned_data["country"]
        if user_type == User.UserType.COUNTRY_USER and not country:
            raise ValidationError(
                _("Country users need to be assigned to countries. Choose a country and try again.")
            )
        return cleaned_data


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    form = UserEditAdminForm

    list_display = [
        "username",
        "email",
        "first_name",
        "last_name",
        "is_staff",
        "is_active",
        "is_superuser",
        "country",
        "user_type",
    ]

    fields = (
        "email",
        "first_name",
        "last_name",
        "username",
        "is_staff",
        "is_active",
        "is_superuser",
        "country",
        "user_type",
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
        if change:
            super().save_model(request, obj, form, change)
            return

        password = User.objects.make_random_password(length=12)
        obj.set_password(password)
        super().save_model(request, obj, form, change)

        form = PasswordResetForm({"email": obj.email})
        form.is_valid()
        form.save(
            domain_override=settings.FRONTEND_HOST[0],
            use_https=settings.HAS_HTTPS,
            email_template_name="registration/create_new_user_email.txt",
            html_email_template_name="registration/create_new_user_email.html",
            extra_email_context={
                "username": obj.username,
                "password": password,
            },
        )
        self.message_user(
            request,
            f"Email sent to {obj.email} for password reset",
            level=messages.SUCCESS,
        )
