from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema

from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend

from rest_framework import filters, mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from core.api.permissions import (
    DenyAll,
    HasProjectV2ViewAccess,
    HasProjectEnterpriseEditAccess,
    HasProjectEnterpriseApprovalAccess,
)
from core.models.project_enterprise import Enterprise, ProjectEnterprise
from core.api.serializers.project_enterprise import (
    EnterpriseSerializer,
    ProjectEnterpriseSerializer,
)
from core.api.filters.project import EnterpriseFilter, ProjectEnterpriseFilter
from core.models.utils import EnterpriseStatus


class EnterpriseViewSet(
    viewsets.GenericViewSet,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
):
    filterset_class = EnterpriseFilter
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter,
    ]
    ordering_fields = [
        "code",
        "name",
        "country__name",
        "location",
        "application",
        "local_ownership",
        "export_to_non_a5",
    ]
    model = Enterprise
    search_fields = ["code", "name"]
    serializer_class = EnterpriseSerializer

    def filter_permissions_queryset(self, queryset):
        """
        Filter the queryset based on the user's permissions.
        """

        user = self.request.user
        if user.is_superuser:
            return queryset

        if not user.has_perm("core.has_project_enterprise_approval_access"):
            queryset = queryset.filter(status=EnterpriseStatus.APPROVED)

        return queryset

    def get_queryset(self):
        queryset = Enterprise.objects.all()
        queryset = self.filter_permissions_queryset(queryset)
        queryset = queryset.select_related("country")
        return queryset

    @property
    def permission_classes(self):
        if self.action in [
            "list",
            "retrieve",
        ]:
            return [HasProjectV2ViewAccess]
        return [DenyAll]


class ProjectEnterpriseViewSet(
    viewsets.GenericViewSet,
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
):
    filterset_class = ProjectEnterpriseFilter
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter,
    ]
    ordering_fields = [
        "code",
        "enterprise__name",
        "location",
        "status",
    ]
    search_fields = ["enterprise__code", "enterprise__name"]

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
            "destroy",
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

        if not user.has_perm(
            "core.has_project_enterprise_approval_access"
        ) or not user.has_perm("core.has_project_enterprise_edit_access"):
            queryset = queryset.filter(status=EnterpriseStatus.APPROVED)

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
            "enterprise",
            "enterprise__country",
            "project__country",
        )
        return queryset

    def get_serializer_class(self):
        serializer = ProjectEnterpriseSerializer
        return serializer

    @swagger_auto_schema(
        operation_description="""
        Creates a new Pending Project Enterprise.
        A new pending Enterprise will be created. If an ID is provided for the enterprise,
        the given ID will be used to link the new pending one to the existing approved enterprise.
        """,
        responses={status.HTTP_200_OK: ProjectEnterpriseSerializer(many=True)},
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(request=request)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @swagger_auto_schema(
        operation_description="""
        If the Project Enterprise is in 'Pending' status, it is updated as normal.
        The enterprise entry cannot be changed, so the fields will be applied to already linked enterprise.
        If the Project Enterprise is in 'Approved' status, a new Project Enterprise entry will be
        created in 'Pending' status, linked to the approved one. The linked enterprise will also be duplicated
        in 'Pending' status, with the updated fields.
        """,
        responses={status.HTTP_200_OK: ProjectEnterpriseSerializer(many=True)},
    )
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save(request=request)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=["POST"], detail=True)
    @swagger_auto_schema(
        operation_description="""
        Approve a pending Project Enterprise.
        Only enterprises with 'Pending' status can be approved.
        """,
        request_body=openapi.Schema(type=openapi.TYPE_OBJECT, properties=None),
        responses={
            status.HTTP_200_OK: ProjectEnterpriseSerializer,
            status.HTTP_400_BAD_REQUEST: "Bad request",
        },
    )
    def approve(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status != EnterpriseStatus.PENDING:
            return Response(
                {"detail": "Only pending enterprises can be approved."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        instance.status = EnterpriseStatus.APPROVED
        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProjectEnterpriseStatusView(APIView):
    """
    View to return a list of all Project Enterprise Status choices
    """

    def get(self, request, *args, **kwargs):
        choices = EnterpriseStatus.choices
        return Response(choices)
