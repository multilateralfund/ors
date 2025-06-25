from django.db.models import Prefetch, Q
from django_filters.rest_framework import DjangoFilterBackend

from rest_framework import mixins, viewsets, filters
from rest_framework.response import Response

from core.api.filters.project import ProjectFilter, ProjectFilterBackend
from core.api.permissions import HasProjectV2ViewAccess
from core.api.serializers.project_association import MetaProjectSerializer
from core.models.project import MetaProject, Project

# pylint: disable=R1710


class ProjectAssociationViewSet(
    viewsets.GenericViewSet,
    mixins.ListModelMixin,
):
    """ViewSet for listing project associations with meta projects.
    This viewset allows users to retrieve a list of meta projects and their associated projects.
    """

    permission_classes = [HasProjectV2ViewAccess]
    filter_backends = [
        ProjectFilterBackend,
        DjangoFilterBackend,
        filters.SearchFilter,
    ]
    ordering_fields = [
        "lead_agency__name",
        "type",
        "projects__title",
        "projects__country__name",
        "projects__agency__name",
        "projects__sector__name",
        "projects__project_type__name",
        "projects__substance_type",
        "projects__submission_status__name",
        "projects__status__name",
        "projects__meta_project__code",
        "projects__code",
        "projects__cluster__code",
        "projects__tranche",
        "projects__total_fund",
    ]
    serializer_class = MetaProjectSerializer
    search_fields = ["title"]

    def filter_project_permissions_queryset(self, queryset):
        """
        Filter the queryset based on the user's permissions.
        """
        user = self.request.user
        if user.is_superuser:
            return queryset

        if user.has_perm("core.can_view_all_agencies"):
            return queryset

        if user.has_perm("core.can_view_only_own_agency"):
            return queryset.filter(
                Q(agency=user.agency) | Q(meta_project__lead_agency=user.agency)
            ).distinct()
        return queryset.none()

    def get_queryset(self):
        projects_queryset = self.filter_project_permissions_queryset(
            Project.objects.all()
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
            ),
            to_attr="filtered_projects",
        )
        queryset = MetaProject.objects.all()
        queryset = queryset.select_related("lead_agency").prefetch_related(prefetch)
        queryset = [meta for meta in queryset if getattr(meta, "filtered_projects", [])]
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
