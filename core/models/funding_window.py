from django.db import models

from core.models.meeting import Decision
from core.models.meeting import Meeting


class FundingWindow(models.Model):
    meeting = models.ForeignKey(
        Meeting,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        help_text="Meeting number",
    )
    decision = models.ForeignKey(
        Decision,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        help_text="Decision Number",
    )
    description = models.TextField(
        null=True, blank=True, help_text="Funding Window Description"
    )
    amount = models.DecimalField(
        max_digits=30,
        decimal_places=15,
        null=True,
        blank=True,
        help_text="Funding Window Amount (US$)",
    )
    remarks = models.TextField(null=True, blank=True, help_text="Remarks")
