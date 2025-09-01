from django.db.models import Q

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import mixins, viewsets, filters


from core.api.permissions import (
    DenyAll,
    HasProjectV2ViewAccess,
    HasProjectV2EditAccess,
    HasProjectV2SubmitAccess,
)
from core.models.project_enterprise import ProjectEnterprise
from core.api.serializers.project_enterprise import ProjectEnterpriseSerializer
from core.api.filters.project import ProjectEnterpriseFilter


class ProjectEnterpriseViewSet(
    viewsets.GenericViewSet,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
):
    filterset_class = ProjectEnterpriseFilter
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter,
    ]
    ordering_fields = [
        "code",
        "enterprise",
        "location",
        "application",
        "status",
    ]
    search_fields = ["code", "enterprise"]

    @property
    def permission_classes(self):
        if self.action in [
            "list",
            "retrieve",
        ]:
            return [HasProjectV2ViewAccess]
        if self.action in [
            "create",
            "update",
        ]:
            return [HasProjectV2EditAccess]  # TODO: update this permission
        if self.action in [
            "submit",
        ]:
            return [HasProjectV2SubmitAccess]  # TODO: update this permission
        return [DenyAll]

    def filter_permissions_queryset(self, queryset):
        """
        Filter the queryset based on the user's permissions.
        """

        user = self.request.user
        if user.is_superuser:
            return queryset

        if not user.has_perm("core.can_view_production_projects"):
            queryset = queryset.filter(project__production=False)

        if user.has_perm("core.can_view_all_agencies"):
            return queryset
        if user.has_perm("core.can_view_only_own_agency"):
            return queryset.filter(
                Q(project__agency=user.agency)
                | (
                    Q(project__meta_project__lead_agency=user.agency)
                    & Q(project__meta_project__lead_agency__isnull=False)
                )
            )

        return queryset.none()

    def get_queryset(self):
        queryset = ProjectEnterprise.objects.all()
        queryset = self.filter_permissions_queryset(queryset)
        queryset = queryset.select_related(
            "project",
            "project__country",
        )
        return queryset

    def get_serializer_class(self):
        serializer = ProjectEnterpriseSerializer
        return serializer
