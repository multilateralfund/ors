import pathlib
from copy import copy
from typing import Iterable
from typing import TypedDict

import openpyxl
from django.conf import settings
from django.db.models import F
from django.db.models import QuerySet
from django.db.models.functions import Coalesce
from django.http import JsonResponse
from rest_framework import mixins
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


class ProjectData(TypedDict):
    project_id: int
    project_title: str
    project_description: str
    agency_name: str
    country_pk: int
    country_name: str
    cluster_pk: int
    cluster_name: str
    project_type_pk: int
    project_type_name: str
    hcfc: float
    hfc: float
    project_funding: float
    project_support_cost: float
    total: float


class CountryData(TypedDict):
    cluster_id: int
    cluster_name: str
    project_type_id: int
    project_type_name: str
    projects: list[ProjectData]


class CountryTotal(TypedDict):
    hcfc: float
    hfc: float
    project_funding: float
    project_support_cost: float
    total: float


class CountryEntry(TypedDict):
    country_id: int
    country_name: str
    country_data: CountryData
    country_total: CountryTotal


class BlanketApprovalDetailsViewset(
    viewsets.GenericViewSet,
    mixins.ListModelMixin,
):
    """ViewSet for blanket approval details."""

    filterset_class = BlanketApprovalDetailsFilter
    queryset = Project.objects.really_all().filter(
        submission_status__name__in=[
            "Recommended",
            "Approved",
        ]
    )
    permission_classes = (HasProjectV2ViewAccess,)

    _template_path = (
        pathlib.Path(__file__).parent.parent
        / "export"
        / "templates"
        / "blanket_approval_details_template.xlsx"
    )

    def _extract_data(self):
        queryset: QuerySet[Project] = self.filter_queryset(self.get_queryset())

        per_country = {}
        total_projects = 0

        filtered_projects: Iterable[ProjectData] = queryset.values(  # type: ignore[assignment]
            project_id=F("id"),
            project_title=F("title"),
            project_description=F("description"),
            agency_name=F("agency__name"),
            country_pk=F("country"),
            country_name=F("country__name"),
            cluster_pk=F("cluster"),
            cluster_name=F("cluster__name"),
            project_type_pk=F("project_type"),
            project_type_name=F("project_type__name"),
            hcfc=Coalesce(F("ods_odp__odp"), 0.0),
            hfc=Coalesce(F("ods_odp__co2_mt"), 0.0),
            project_funding=Coalesce(F("total_fund"), 0.0),
            project_support_cost=Coalesce(F("support_cost_psc"), 0.0),
            total=Coalesce(F("total_fund") + F("support_cost_psc"), 0.0),
        )

        for project in filtered_projects:
            key = f"{project['project_type_pk']}, {project['cluster_pk']}"

            per_country.setdefault(
                project["country_pk"],
                {
                    "country_name": project["country_name"],
                    "country_id": project["country_pk"],
                },
            )
            per_country[project["country_pk"]].setdefault(
                key,
                {
                    "cluster_id": project["cluster_pk"],
                    "cluster_name": project["cluster_name"],
                    "project_type_id": project["project_type_pk"],
                    "project_type_name": project["project_type_name"],
                    "projects": [],
                },
            )

            result = per_country[project["country_pk"]][key]
            result["projects"].append(project)
            total_projects += 1

        result = []

        for country_data in per_country.values():
            country_id = country_data.pop("country_id")
            country_name = country_data.pop("country_name")
            country_total = {
                "hcfc": 0.0,
                "hfc": 0.0,
                "project_funding": 0.0,
                "project_support_cost": 0.0,
                "total": 0.0,
            }

            country_data = list(country_data.values())
            for clusters in country_data:
                for project in clusters["projects"]:
                    for key in country_total:
                        country_total[key] += project[key]

            result.append(
                {
                    "country_id": country_id,
                    "country_name": country_name,
                    "country_data": country_data,
                    "country_total": country_total,
                }
            )

        return total_projects, result

    def list(self, request, *args, **kwargs):
        total_projects, result = self._extract_data()
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

    def _export_debug(self):
        result = []

        data = self._extract_data()
        result.append(
            {
                "result": data,
            }
        )

        return JsonResponse({"DEBUG": result})

    def _export_wb(self):
        wb = openpyxl.open(self._template_path)
        sheet = wb.active
        _, data = self._extract_data()
        data: list[CountryEntry] = data

        i = 3
        row_country_name = sheet[i + 1]
        row_country_cluster = sheet[i + 2]
        row_country_type = sheet[i + 3]
        row_project_title = sheet[i + 4]
        row_project_description = sheet[i + 5]
        row_country_total = sheet[i + 7]

        def add_row(row, styles_from):
            cells = []

            for idx, val in enumerate(row):
                src_cell = styles_from[idx]
                cell = copy(src_cell)
                for attr in ["font", "number_format", "alignment"]:
                    setattr(cell, attr, copy(getattr(src_cell, attr)))
                cell.value = val
                cells.append(cell)

            sheet.append(cells)

        for country in data:
            add_row([country["country_name"]], row_country_name)
            for country_data in country["country_data"]:
                add_row([country_data["cluster_name"]], row_country_cluster)
                add_row([country_data["project_type_name"]], row_country_type)
                for project in country_data["projects"]:
                    add_row(
                        [
                            project["project_title"],
                            project["agency_name"],
                            project["hcfc"],
                            project["hfc"],
                            project["project_funding"],
                            project["project_support_cost"],
                            project["total"],
                        ],
                        row_project_title,
                    )
                    add_row([project["project_description"]], row_project_description)
            country_total: CountryTotal = country["country_total"]
            add_row(
                [
                    None,
                    f"Total for {country['country_name']}",
                    country_total["hcfc"],
                    country_total["hfc"],
                    country_total["project_funding"],
                    country_total["project_support_cost"],
                    country_total["total"],
                ],
                row_country_total,
            )

        sheet.delete_rows(4, 7)

        return workbook_response("Blanket approval details", wb)

    @action(methods=["GET"], detail=False)
    def export(self, request, *args, **kwargs):
        is_debug_request = settings.DEBUG and request.query_params.get("debug")

        if is_debug_request:
            return self._export_debug()

        return self._export_wb()
