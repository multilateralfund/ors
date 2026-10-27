from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from django.db.models import Count, Prefetch, Q, QuerySet
from django_filters.rest_framework import DjangoFilterBackend

from rest_framework.decorators import action
from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from core.api.filters.project import (
    ProjectFilter,
    ProjectFilterBackend,
    completed_meta_projects,
    project_has_cooperating_agency_q,
)
from core.api.permissions import HasPCRViewAccess
from core.api.serializers.project_completion_report import (
    PCRMetaProjectSerializer,
    PCRProjectSetAdHocOrPcrDueSerializer,
)
from core.api.views.utils import get_available_values, get_country_regions
from core.models.annual_project_report import AnnualProjectReport
from core.models.country import Country
from core.models.project import MetaProject, Project


def get_regions(queryset: QuerySet[Project]):
    countries = Country.objects.filter(
        id__in=queryset.values_list("country_id", flat=True)
    ).distinct()
    regions = get_country_regions()
    result = {}
    for country in countries:
        region = regions.get(country.id, {"id": country.id, "name": country.name})
        result[region["id"]] = region
    return sorted(result.values(), key=lambda region: region["name"])


def get_cooperating_agencies(queryset: QuerySet[Project]):
    return get_available_values(
        queryset.filter(project_has_cooperating_agency_q()), "agency"
    )


def get_subsectors(queryset: QuerySet[Project]):
    values = (
        queryset.order_by("subsectors__name")
        .values_list("subsectors__id", "subsectors__name")
        .distinct()
    )
    return [{"id": pk, "name": name} for pk, name in values if pk is not None]


def get_completed_only(queryset: QuerySet[Project]):
    is_completed = queryset.filter(meta_project__in=completed_meta_projects())
    options = []
    if is_completed.exists():
        options.append({"id": "Yes", "name": "Yes"})
    if queryset.exclude(id__in=is_completed.values("id")).exists():
        options.append({"id": "No", "name": "No"})
    return options


def get_categories(queryset: QuerySet[Project]):
    category_labels = dict(Project.Category.choices)
    values = (
        queryset.exclude(category__isnull=True)
        .exclude(category="")
        .order_by("category")
        .values_list("category", flat=True)
        .distinct()
    )
    return [
        {"id": category, "name": category_labels.get(category, category)}
        for category in values
    ]


class PCRMetaprojectsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows a listing of metaprojects (including their projects) to
    allow the creation of a project completion report (PCR) for each project in the metaproject.
    """

    permission_classes = [HasPCRViewAccess]
    filter_backends = [
        ProjectFilterBackend,
        DjangoFilterBackend,
        filters.SearchFilter,
    ]
    serializer_class = PCRMetaProjectSerializer
    search_fields = [
        "title",
        "meta_project__pcrs__delay_causes__root_causes_of_delay__name",
        "meta_project__pcrs__learned_lessons__lessons__name",
    ]

    def filter_project_permissions_queryset(self, queryset):
        """
        Filter the queryset based on the user's permissions.
        """
        user = self.request.user
        if user.is_superuser:
            return queryset

        if not user.has_perm("core.can_view_production_projects"):
            queryset = queryset.filter(production=False)

        if user.has_perm("core.can_view_all_agencies"):
            return queryset

        if user.has_perm("core.can_view_only_own_agency"):
            return queryset.filter(
                Q(agency=user.agency) | Q(lead_agency=user.agency)
            ).distinct()
        return queryset.none()

    def _get_filtered_projects_queryset(self, params):
        projects_queryset = self.filter_project_permissions_queryset(
            Project.objects.filter(submission_status__name="Approved").exclude(
                category="Individual", status__name="Transferred"
            )
        )
        project_filter = ProjectFilter(params, queryset=projects_queryset)
        filtered_projects_qs = project_filter.qs

        search_filter = filters.SearchFilter()
        # SearchFilter expects a view instance, so pass self
        return search_filter.filter_queryset(self.request, filtered_projects_qs, self)

    def _get_meta_projects_queryset(self, filtered_projects_qs):
        return (
            MetaProject.objects.annotate(
                pcr_waived_count=Count(
                    "projects",
                    filter=Q(projects__pcr_waived=True),
                )
            )
            .filter(
                is_draft=False,
                projects__in=filtered_projects_qs,
                pcr_waived_count__lt=1,
            )
            .distinct()
        )

    def get_queryset(self):
        filtered_projects_qs = self._get_filtered_projects_queryset(self.request.GET)

        prefetch = Prefetch(
            "projects",
            queryset=filtered_projects_qs.select_related(
                "agency",
                "cluster",
                "country",
                "project_type",
                "sector",
                "meeting",
                "status",
                "submission_status",
            ).prefetch_related(
                Prefetch(
                    "annual_reports",
                    queryset=AnnualProjectReport.objects.filter(
                        report__progress_report__endorsed=True
                    )
                    .select_related("report__progress_report")
                    .order_by("-report__progress_report__year"),
                    to_attr="prefetched_endorsed_aprs",
                )
            ),
            to_attr="filtered_projects",
        )

        queryset = (
            self._get_meta_projects_queryset(filtered_projects_qs)
            .select_related("lead_agency")
            .prefetch_related(prefetch)
        )
        return queryset

    def list(self, request, *args, **kwargs):
        # Get the filtered MetaProjects with prefetched filtered_project
        queryset = self.get_queryset()

        # Manually paginate if pagination is enabled
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @extend_schema(
        # not detected as a list view, so the listing filters are not added otherwise
        filters=True,
        parameters=[
            OpenApiParameter(
                name="pcr_due_union",
                location=OpenApiParameter.QUERY,
                description=(
                    "When true, the pcr_due filter is ignored and the values are "
                    "obtained from the union of the PCR due and not PCR due listings."
                ),
                type=OpenApiTypes.BOOL,
            ),
        ],
    )
    @action(methods=["GET"], detail=False)
    def list_filters(self, request, *args, **kwargs):
        """
        List available filter values for the PCR metaprojects listing. The same
        filters as in the main list endpoint should be used here as well for the
        same results.
        """
        params = request.query_params.copy()
        if params.get("pcr_due_union", "false").lower() == "true":
            # the same filter is used by the PCR due and not PCR due listings
            params["pcr_due"] = "Yes,No"
        filtered_projects_qs = self._get_filtered_projects_queryset(params)
        # only the projects shown in the listing
        queryset = filtered_projects_qs.filter(
            meta_project__in=self._get_meta_projects_queryset(filtered_projects_qs)
        )
        result = {
            "region": get_regions(queryset),
            "country": get_available_values(queryset, "country"),
            "lead_agency": get_available_values(queryset, "lead_agency"),
            "cooperating_agency": get_cooperating_agencies(queryset),
            "cluster": get_available_values(queryset, "cluster"),
            "project_type": get_available_values(queryset, "project_type"),
            "sector": get_available_values(queryset, "sector"),
            "subsector": get_subsectors(queryset),
            "category": get_categories(queryset),
            "status": get_available_values(queryset, "status"),
            "completed_only": get_completed_only(queryset),
        }
        return Response(result)

    @extend_schema(
        description="""
        Allows editing only the actual fields of the project. Available only for 'Approved' projects.
        """,
        request=PCRProjectSetAdHocOrPcrDueSerializer,
        responses={
            status.HTTP_200_OK: None,
            status.HTTP_400_BAD_REQUEST: "Bad request",
        },
    )
    @action(methods=["POST"], detail=False)
    def set_pcr_or_ad_hoc(self, request, *args, **kwargs):
        serializer = PCRProjectSetAdHocOrPcrDueSerializer(
            data=request.data, partial=True
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        for meta_project in serializer.validated_data.get("meta_projects", []):
            if serializer.validated_data.get("pcr_due", None) is not None:
                meta_project.pcr_due = serializer.validated_data.get("pcr_due", False)
                meta_project.pcr_due_date = serializer.validated_data.get(
                    "pcr_due_date", None
                )
                meta_project.save()
            if serializer.validated_data.get("ad_hoc_pcr", None) is not None:
                meta_project.ad_hoc_pcr = serializer.validated_data.get(
                    "ad_hoc_pcr", False
                )
                meta_project.save()
        return Response({}, status=status.HTTP_200_OK)
