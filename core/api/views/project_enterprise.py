from django.db.models import Q

from django_filters.rest_framework import DjangoFilterBackend

from rest_framework import filters, mixins, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from core.api.permissions import (
    DenyAll,
    HasProjectV2ViewAccess,
    HasProjectEnterpriseEditAccess,
    HasProjectEnterpriseApprovalAccess,
)
from core.models.project_enterprise import ProjectEnterprise
from core.api.serializers.project_enterprise import ProjectEnterpriseSerializer
from core.api.filters.project import ProjectEnterpriseFilter


class ProjectEnterpriseViewSet(
    viewsets.GenericViewSet,
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
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
            return [HasProjectEnterpriseEditAccess]
        if self.action in [
            "approve",
        ]:
            return [HasProjectEnterpriseApprovalAccess]
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

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(request=request)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save(request=request)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProjectEnterpriseStatusView(APIView):
    """
    View to return a list of all Project Enterprise Status choices
    """

    def get(self, request, *args, **kwargs):
        choices = ProjectEnterprise.EnterpriseStatus.choices
        return Response(choices)
