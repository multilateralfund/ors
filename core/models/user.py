from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    class UserType(models.TextChoices):
        AGENCY = "agency", _("Agency")
        COUNTRY_USER = "country_user", _("Country user")
        SECRETARIAT = "secretariat", _("Secretariat")
        STAKEHOLDER = "stakeholder", _("Stakeholder")
        TREASURER = "treasurer", _("Treasurer")

    country = models.ForeignKey(
        "Country", null=True, blank=True, on_delete=models.CASCADE
    )
    user_type = models.CharField(
        max_length=50, choices=UserType.choices, blank=True
    )
