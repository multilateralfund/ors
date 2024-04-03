from django.conf import settings
from django.contrib import admin
from django.contrib import messages
from django.contrib.auth.forms import PasswordResetForm
from django.core.exceptions import ValidationError
from django.forms import ModelForm
from django.utils.translation import gettext_lazy as _

from core.models.user import User


class UserEditAdminForm(ModelForm):
    class Meta:
        model = User
        fields = "__all__"

    def clean(self):
        cleaned_data = super().clean()
        is_country_user = cleaned_data["is_country_user"]
        country = cleaned_data["country"]
        if is_country_user and not country:
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
        "is_country_user",
        "is_stakeholder",
        "is_agency",
        "is_secretariat",
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
        "is_country_user",
        "is_stakeholder",
        "is_agency",
        "is_secretariat",
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
