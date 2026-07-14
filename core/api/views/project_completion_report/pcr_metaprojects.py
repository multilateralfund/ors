from django.db.models import Prefetch, Q
from django_filters.rest_framework import DjangoFilterBackend

from rest_framework import viewsets, filters
from rest_framework.response import Response

from core.api.filters.project import ProjectFilter, ProjectFilterBackend
from core.api.permissions import HasProjectV2ViewAccess
from core.api.serializers.project_completion_report import PCRMetaProjectSerializer
from core.models.annual_project_report import AnnualProjectReport
from core.models.project import MetaProject, Project


class PCRMetaprojectsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows a listing of metaprojects (including their projects) to
    allow the creation of a project completion report (PCR) for each project in the metaproject.
    """

    permission_classes = [HasProjectV2ViewAccess]
    filter_backends = [
        ProjectFilterBackend,
        DjangoFilterBackend,
        filters.SearchFilter,
    ]
    serializer_class = PCRMetaProjectSerializer
    search_fields = ["title"]

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

    def get_queryset(self):
        projects_queryset = self.filter_project_permissions_queryset(
            Project.objects.filter(submission_status__name="Approved")
        )
        project_filter = ProjectFilter(self.request.GET, queryset=projects_queryset)
        filtered_projects_qs = project_filter.qs

        search_filter = filters.SearchFilter()
        # SearchFilter expects a view instance, so pass self
        filtered_projects_qs = search_filter.filter_queryset(
            self.request, filtered_projects_qs, self
        )

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
            MetaProject.objects.filter(
                is_draft=False, projects__in=filtered_projects_qs
            )
            .distinct()
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
