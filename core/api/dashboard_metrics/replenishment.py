"""
Pledged contributions behind ``grant_funding_pledged``.

Mirror ``ReplenishmentDashboardView``'s ``agreed_pledges`` aggregation
(``core/api/views/replenishment.py``), which is pure ORM over
``TriennialContributionView``.

That view is gated on ``HasReplenishmentViewPermission`` while these endpoints
are gated on ``IsAuthenticated``, so serving pledge totals here widens who can
read a replenishment figure. Settle that in review before shipping it.
"""
