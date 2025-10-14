from django.db.models import Count
from django.db.models import F
from django.db.models import QuerySet
from django.db.models import Sum
from django.db.models.functions import Coalesce
from rest_framework import mixins
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.api.filters.summary_of_projects import SummaryOfProjectsFilter
from core.api.permissions import HasProjectV2ApproveAccess
from core.models import Project


class SummaryOfProjectsViewSet(
    viewsets.GenericViewSet,
    mixins.ListModelMixin,
):
    """ViewSet for summary of projects."""

    filterset_class = SummaryOfProjectsFilter
    queryset = Project.objects.really_all()
    permission_classes = (HasProjectV2ApproveAccess,)

    def list(self, request, *args, **kwargs):
        projects: QuerySet[Project] = self.filter_queryset(self.get_queryset())

        result = projects.aggregate(
            projects_count=Coalesce(Count("id"), 0),
            countries_count=Coalesce(Count("country", distinct=True), 0),
            amounts_recommended=Coalesce(
                Sum(F("total_fund") + F("support_cost_psc")), 0.0
            ),
        )

        return Response(result)

    @action(methods=["GET"], detail=False)
    def filters(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        return Response()
