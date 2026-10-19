from drf_spectacular.utils import extend_schema
from django.db.models import Count, Exists, Prefetch, Q, OuterRef
from django_filters.rest_framework import DjangoFilterBackend

from rest_framework.decorators import action
from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from core.api.filters.project import ProjectFilter, ProjectFilterBackend
from core.api.permissions import HasPCRViewAccess
from core.api.serializers.project_completion_report import (
    PCRMetaProjectSerializer,
    PCRProjectSetAdHocOrPcrDueSerializer,
)
from core.models.annual_project_report import AnnualProjectReport
from core.models.project import MetaProject, Project


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
        "meta_project__pcrs__project_components__delay_causes__delay__name",
        "meta_project__pcrs__project_components__learned_lessons__lesson__name",
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

    def get_queryset(self):
        invalid_entries = Project.objects.filter(
            meta_project_id=OuterRef("pk"),
        ).exclude(status__name__in=["Completed", "Financially completed"])
        meta_projects = MetaProject.objects.filter(~Exists(invalid_entries))

        completed_projects = Project.objects.filter(meta_project__in=meta_projects)
        projects_queryset = self.filter_project_permissions_queryset(completed_projects)
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
            for project in meta_project.projects.all():
                if serializer.validated_data.get("ad_hoc_pcr", None) is not None:
                    project.ad_hoc_pcr = serializer.validated_data.get(
                        "ad_hoc_pcr", False
                    )
                if serializer.validated_data.get("pcr_due", None) is not None:
                    project.pcr_due = serializer.validated_data.get("pcr_due", False)
                project.save()
        return Response({}, status=status.HTTP_200_OK)
