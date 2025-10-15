from decimal import Decimal
from django.db.models import Count, DecimalField
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


def get_available_values(queryset: QuerySet[Project], field_name: str):
    rel_name = f"{field_name}__name"

    values = (
        queryset.order_by(rel_name).values_list(f"{field_name}_id", rel_name).distinct()
    )

    return [{"name": name, "id": pk} for pk, name in values if pk is not None]


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

        meta_project_funding_expression = Coalesce(
            F("meta_project__project_funding"), Decimal(0.0)
        ) + Coalesce(F("meta_project__support_cost"), Decimal(0.0))

        result = projects.aggregate(
            projects_count=Coalesce(Count("id"), 0),
            countries_count=Coalesce(
                Count("country", distinct=True),
                0,
            ),
            amounts_in_principle=Coalesce(
                Sum(meta_project_funding_expression, distinct=True),
                Decimal("0.0"),
                output_field=DecimalField(max_digits=10, decimal_places=2),
            ),
            amounts_recommended=Coalesce(
                Sum(F("total_fund") + F("support_cost_psc")),
                0.0,
            ),
        )

        return Response(result)

    @action(methods=["GET"], detail=False)
    def filters(self, request, *args, **kwargs):
        queryset: QuerySet[Project] = self.filter_queryset(self.get_queryset())

        result = {
            "country": get_available_values(queryset, "country"),
            "cluster": get_available_values(queryset, "cluster"),
            "project_type": get_available_values(queryset, "project_type"),
            "sector": get_available_values(queryset, "sector"),
            "agency": get_available_values(queryset, "agency"),
        }

        return Response(result)
