from django.contrib.auth.models import AbstractUser, PermissionsMixin

from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser, PermissionsMixin):
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

        # Project
        SECRETARIAT_VIEWER = "secretariat_viewer", _("Secretariat Viewer")
        SECRETARIAT_RECOMMENDER_EDIT_ACCESS = (
            "secretariat_recommender_edit_access",
            _("Secretariat Recommender Edit Access"),
        )
        SECRETARIAT_APPROVER_EDIT_ACCESS = (
            "secretariat_approver_edit_access_user",
            _("Secretariat Approver Edit Access"),
        )
        SECRETARIAT_PRODUCTION_RECOMMENDER_EDIT_ACCESS = (
            "secretariat_production_recommender_edit_access",
            _("Secretariat Production Recommender Edit Access"),
        )
        SECRETARIAT_PRODUCTION_APPROVER_EDIT_ACCESS = (
            "secretariat_production_approver_edit_access",
            _("Secretariat Production Approver Edit Access"),
        )

        # Business profile
        BP_VIEWER = "bp_viewer", _("Business Plan Viewer")
        BP_EDITOR = "bp_editor", _("Business Plan Editor")

    country = models.ForeignKey(
        "Country", null=True, blank=True, on_delete=models.CASCADE
    )
    agency = models.ForeignKey(
        "Agency", null=True, blank=True, on_delete=models.CASCADE
    )
    user_type = models.CharField(max_length=50, choices=UserType.choices, blank=True)

    is_external_service = models.BooleanField(
        default=False,
        help_text="User is an external service that consumes our API - e.g. ekimetrics",
    )
