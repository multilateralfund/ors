"""
Pledged contributions behind ``grant_funding_pledged``.

``ReplenishmentDashboardView`` charts this same sum grouped by triennium. This
is the ungrouped total: add up that chart's bars, and you get this figure.
"""

from decimal import Decimal

from django.db.models import Sum

from core.models.replenishment import TriennialContributionStatus


def pledged_total() -> Decimal | None:
    """Every triennium's agreed contributions, added up.
    ``None`` when there are no contribution records.
    """
    if not TriennialContributionStatus.objects.exists():
        return None
    return TriennialContributionStatus.objects.aggregate(
        total=Sum("agreed_contributions")
    )["total"]
