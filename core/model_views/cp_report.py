from django.conf import settings
from django.db import models

from core.models.base_country_programme import AbstractCPReport


class FinalReportsView(AbstractCPReport):
    """
    Final Reports database view

    This view is used to get the list of final reports for the country programme

    It is a union of the cp_report and cp_report_archive tables
    containing the final reports and the archived reports (of the current draft reports)
    """

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        related_name="final_reports_created_by",
        help_text="User who created the report",
    )
    version_created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        related_name="final_reports_version_created_by",
        help_text="User who created this archived report version",
    )
    is_archive = models.BooleanField()

    class Meta:
        managed = False
        db_table = "final_reports_view"
