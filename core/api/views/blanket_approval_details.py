import base64
import json
from decimal import Decimal

import openpyxl
from django.conf import settings
from django.db.models import Count
from django.db.models import DecimalField
from django.db.models import F
from django.db.models import QuerySet
from django.db.models import Sum
from django.db.models.functions import Coalesce
from django.http import JsonResponse
from rest_framework import mixins
from rest_framework import status
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.api.filters.blanket_approval_details import BlanketApprovalDetailsFilter
from core.api.permissions import HasProjectV2ViewAccess
from core.api.utils import workbook_response
from core.models import Project


def get_available_values(queryset: QuerySet[Project], field_name: str):
    rel_name = f"{field_name}__name"

    values = (
        queryset.order_by(rel_name).values_list(f"{field_name}_id", rel_name).distinct()
    )

    return [{"name": name, "id": pk} for pk, name in values if pk is not None]


class BlanketApprovalDetailsViewset(
    viewsets.GenericViewSet,
    mixins.ListModelMixin,
):
    """ViewSet for blanket approval details."""

    filterset_class = BlanketApprovalDetailsFilter
    queryset = Project.objects.all()
    permission_classes = (HasProjectV2ViewAccess,)

    def _extract_data(self, projects: QuerySet[Project]):
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

        return result

    def list(self, request, *args, **kwargs):
        params: dict | None = self._get_params(request)
        queryset: QuerySet[Project] = self.get_queryset()

        per_country = {}
        total_projects = 0

        for query in params:
            project_filter = self.filterset_class(query, queryset)
            filtered_projects: QuerySet[Project] = project_filter.qs
            total_projects += filtered_projects.count()

            country_id = query["country_id"]
            project_type_id = query["project_type_id"]
            cluster_id = query["cluster_id"]
            key = f"{project_type_id}, {cluster_id}"

            if country_id not in per_country:
                per_country[country_id] = {"country_name": ""}

            if key not in per_country[country_id]:
                per_country[country_id][key] = {
                    "cluster_name": None,
                    "project_type_name": None,
                    "projects": [],
                }

            result = per_country[country_id][key]
            result["projects"].extend(
                filtered_projects.values(
                    project_id=F("id"),
                    project_title=F("title"),
                    project_description=F("description"),
                    agency_name=F("agency__name"),
                    country_name=F("country__name"),
                    cluster_name=F("cluster__name"),
                    project_type_name=F("project_type__name"),
                    hcfc=Coalesce(F("ods_odp__odp"), 0.0),
                    hfc=Coalesce(F("ods_odp__co2_mt"), 0.0),
                    project_funding=Coalesce(F("total_fund"), 0.0),
                    project_support_cost=Coalesce(F("support_cost_psc"), 0.0),
                    total=Coalesce(Sum(F("total_fund") + F("support_cost_psc")), 0.0),
                )
            )

            if not per_country[country_id]["country_name"] and result["projects"]:
                per_country[country_id]["country_name"] = result["projects"][0][
                    "country_name"
                ]

            for name in ("project_type_name", "cluster_name"):
                if not result[name] and result["projects"]:
                    result[name] = result["projects"][0][name]

        result = []

        for country_data in per_country.values():
            country_name = country_data.get("country_name")
            country_data = [v for k, v in country_data.items() if k != "country_name"]
            country_total = {
                "hcfc": 0.0,
                "hfc": 0.0,
                "project_funding": 0.0,
                "project_support_cost": 0.0,
                "total": 0.0,
            }

            for clusters in country_data:
                for project in clusters["projects"]:
                    for key in country_total:
                        country_total[key] += project[key]

            result.append(
                {
                    "country_name": country_name,
                    "country_data": country_data,
                    "country_total": country_total,
                }
            )

        return JsonResponse({"total_projects": total_projects, "result": result})

    @action(methods=["GET"], detail=False)
    def filters(self, request, *args, **kwargs):
        queryset: QuerySet[Project] = self.filter_queryset(self.get_queryset())

        result = {
            "country": get_available_values(queryset, "country"),
            "cluster": get_available_values(queryset, "cluster"),
            "project_type": get_available_values(queryset, "project_type"),
        }

        return Response(result)

    def _export_debug(self, params: dict):
        queryset: QuerySet[Project] = self.get_queryset()
        result = []

        for query in params:
            project_filter = self.filterset_class(query["params"], queryset)
            filtered_projects = project_filter.qs
            data = self._extract_data(filtered_projects)
            data["text"] = query["text"]
            result.append(
                {
                    "params": query["params"],
                    "result": data,
                }
            )

        return JsonResponse({"DEBUG": result})

    def _export_wb(self, params: dict):
        queryset: QuerySet[Project] = self.get_queryset()
        wb = openpyxl.Workbook()
        sheet = wb.active
        sheet.title = "Blanket app. details"
        return workbook_response("Blanket approval details", wb)

    def _get_params(self, request):
        params: str = request.query_params.get("row_data")
        if params:
            return json.loads(base64.b64decode(params).decode())
        return None

    @action(methods=["GET"], detail=False)
    def export(self, request, *args, **kwargs):

        params: dict | None = self._get_params(request)
        is_debug_request = settings.DEBUG and request.query_params.get("debug")

        if params:
            if is_debug_request:
                return self._export_debug(params)

            return self._export_wb(params)

        return Response(
            {"error": "row_data is required"}, status=status.HTTP_400_BAD_REQUEST
        )
