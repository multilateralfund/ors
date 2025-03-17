from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    class UserType(models.TextChoices):
        AGENCY_INPUTTER = "agency_inputter", _("Agency inputter")
        AGENCY_SUBMITTER = "agency_submitter", _("Agency submitter")
        COUNTRY_USER = "country_user", _("Country user")
        COUNTRY_SUBMITTER = "country_submitter", _("Country submitter")
        SECRETARIAT = "secretariat", _("Secretariat")
        VIEWER = "viewer", _("Viewer")
        STAKEHOLDER = "stakeholder", _("Stakeholder")
        TREASURER = "treasurer", _("Treasurer")
        # Can only view CP data & download reports
        CP_VIEWER = "cp_viewer", _("Country Programme Viewer")

    country = models.ForeignKey(
        "Country", null=True, blank=True, on_delete=models.CASCADE
    )
    agency = models.ForeignKey(
        "Agency", null=True, blank=True, on_delete=models.CASCADE
    )
    user_type = models.CharField(max_length=50, choices=UserType.choices, blank=True)
