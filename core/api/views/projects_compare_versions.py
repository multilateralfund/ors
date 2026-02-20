from collections import defaultdict
from typing import TypedDict

from django.db.models import QuerySet
from django.http import JsonResponse
from rest_framework import mixins
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.api.export.single_project_v2.compare_versions_as_xlsx import (
    CompareVersionsProjectExport,
)
from core.api.filters.projects_compare_versions import ProjectsCompareVersionsFilter
from core.api.permissions import HasProjectV2ViewAccess
from core.models import Agency
from core.models import Project
from core.models import ProjectSubmissionStatus


def get_available_values(queryset: QuerySet[Project], field_name: str):
    rel_name = f"{field_name}__name"

    values = (
        queryset.order_by(rel_name)
        .values_list(
            f"{field_name}_id",
            rel_name,
        )
        .distinct()
    )

    return [
        {
            "name": name,
            "id": pk,
        }
        for pk, name in values
        if pk is not None
    ]


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


class ProjectsCompareVersionsViewset(
    viewsets.GenericViewSet,
    mixins.ListModelMixin,
):
    """ViewSet for version comparison details."""

    filterset_class = ProjectsCompareVersionsFilter
    queryset = Project.objects.really_all()
    permission_classes = (HasProjectV2ViewAccess,)

    def get_candidates(self, queryset):
        left = int(self.request.query_params["submission_status_left_id"])
        right = int(self.request.query_params["submission_status_right_id"])

        queryset = queryset.filter(submission_status__in=[left, right])

        candidates = defaultdict(list)

        for p in queryset:
            final_id = p.final_version.id
            current = candidates[final_id]
            if p.submission_status.id not in [p.submission_status.id for p in current]:
                current.append(p)

        def sort_by_status(p):
            if p.submission_status.id == left:
                return -1
            return 0

        candidates = [
            sorted(
                v,
                key=sort_by_status,
            )
            for _, v in candidates.items()
            if len(v) > 1
        ]

        return candidates

    def list(self, request, *args, **kwargs):
        queryset: QuerySet[Project] = self.filter_queryset(self.get_queryset())
        return JsonResponse(
            {
                "total_projects": queryset.count(),
            }
        )

    @action(methods=["GET"], detail=False)
    def filters(self, request, *args, **kwargs):
        queryset: QuerySet[Project] = self.filter_queryset(self.get_queryset())

        result = {
            "submission_status": get_available_values(
                queryset,
                "submission_status",
            ),
            "agency": get_available_values(
                queryset,
                "agency",
            ),
        }

        return Response(result)

    def build_filename(self, candidate_count: int) -> str:
        meeting = self.request.query_params.get("meeting_id")

        agency = self.request.query_params.get("agency_id")
        agency = Agency.objects.get(id=agency)

        left = int(self.request.query_params["submission_status_left_id"])
        left = ProjectSubmissionStatus.objects.get(id=left)

        right = int(self.request.query_params["submission_status_right_id"])
        right = ProjectSubmissionStatus.objects.get(id=right)

        encoded_filters = f"{meeting}-{agency}-{left.name}-{right.name}"
        plural_count = "project" if candidate_count == 1 else "projects"
        return f"Compare versions {encoded_filters} - {candidate_count} {plural_count}"

    @action(methods=["GET"], detail=False)
    def export(self, request, *args, **kwargs):
        queryset: QuerySet[Project] = self.filter_queryset(self.get_queryset())
        candidates = self.get_candidates(queryset)

        exporter = CompareVersionsProjectExport(
            user=request.user,
            candidates=candidates,
        )
        return exporter.export(self.build_filename(len(candidates)))
