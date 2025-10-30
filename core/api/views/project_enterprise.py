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
    HasEnterpriseViewAccess,
    HasEnterpriseEditAccess,
    HasEnterpriseApprovalAccess,
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
        "status",
    ]
    model = Enterprise
    search_fields = ["code", "name"]
    serializer_class = EnterpriseSerializer

    def filter_permissions_queryset(self, queryset):
        """
        Filter the queryset based on the user's permissions.
        """
        queryset = queryset.prefetch_related(
            "agencies", "project_enterprises", "project_enterprises__project"
        )
        user = self.request.user
        if user.is_superuser:
            return queryset

        if (
            not user.has_perm("core.has_enterprise_edit_access")
            and not user.has_perm("core.has_enterprise_approval_access")
            and not user.has_perm("core.has_project_enterprise_approval_access")
            and not user.has_perm("core.has_project_enterprise_edit_access")
        ):
            queryset = queryset.filter(status=EnterpriseStatus.APPROVED)

        if user.has_perm("core.can_view_all_agencies"):
            return queryset

        if user.has_perm("core.can_view_only_own_agency"):
            return queryset.filter(agencies=user.agency)

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
            return [HasEnterpriseViewAccess]
        if self.action in [
            "create",
            "update",
        ]:
            return [HasEnterpriseEditAccess]
        if self.action in [
            "change_status",
        ]:
            return [HasEnterpriseApprovalAccess]
        return [DenyAll]

    @swagger_auto_schema(
        operation_description="""
        Creates a new Pending Enterprise.
        If the user has the 'can_create_approved_enterprise' permission,
        the new enterprise will be created with 'Approved' status.
        """,
        responses={status.HTTP_200_OK: EnterpriseSerializer(many=True)},
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @swagger_auto_schema(
        operation_description="""
        Updates a Project Enterprise.
        The status of the enterprise cannot be changed via this endpoint.
        """,
        responses={status.HTTP_200_OK: EnterpriseSerializer(many=True)},
    )
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        data = request.data.copy()
        data.pop("status", None)  # status cannot be changed via this endpoint
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save(request=request)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        operation_description="""
        Allows the user to change the status of an enterprise.
        """,
        responses={status.HTTP_200_OK: EnterpriseSerializer(many=True)},
    )
    @action(methods=["POST"], detail=True)
    def change_status(self, request, *args, **kwargs):
        instance = self.get_object()
        new_status = request.data.get("status")
        if new_status not in dict(EnterpriseStatus.choices).keys():
            return Response(
                {"detail": "Invalid status."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_status == EnterpriseStatus.OBSOLETE:
            # All related project enterprises should be marked as obsolete too
            related_entries = ProjectEnterprise.objects.filter(
                enterprise=instance
            ).exclude(status=EnterpriseStatus.OBSOLETE)
            related_entries.update(status=EnterpriseStatus.OBSOLETE)
        instance.status = new_status
        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)


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
        "enterprise__code",
        "enterprise__name",
        "enterprise__country__name",
        "enterprise__location",
        "enterprise__application",
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
            return [HasProjectEnterpriseEditAccess]
        if self.action in [
            "create",
            "update",
            "destroy",
        ]:
            return [HasProjectEnterpriseEditAccess]
        if self.action in [
            "approve",
            "not_approve",
            "obsolete",
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
        ) and not user.has_perm("core.has_project_enterprise_edit_access"):
            queryset = queryset.filter(status=EnterpriseStatus.APPROVED)

        if not user.has_perm("core.can_view_production_projects"):
            queryset = queryset.filter(project__production=False)

        if user.has_perm("core.can_view_all_agencies"):
            return queryset
        if user.has_perm("core.can_view_only_own_agency"):
            return queryset.filter(
                Q(project__agency=user.agency)
                | (
                    Q(project__lead_agency=user.agency)
                    & Q(project__lead_agency__isnull=False)
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
        A new pending Enterprise will be created if the provided enterprise data does not include an ID.
        If the provided enterprise data includes an ID, the existing enterprise with that ID will be linked
        to the new pending Project Enterprise without altering any of its data.
        If the user has the 'has_project_enterprise_approval_access' permission, the new Project Enterprise
        and the new Enterprise (if created) will be created with 'Approved' status.
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
        The enterprise entry cannot be changed, so the fields will be applied to already linked enterprise
        and only if it is in 'Pending Approval' status.
        If the Project Enterprise is in 'Approved' status, no changes are applied and the instance is returned as is.
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

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status == EnterpriseStatus.APPROVED and not request.user.has_perm(
            "core.has_project_enterprise_approval_access"
        ):
            return Response(
                {"detail": "No access to delete approved project enterprises."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

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

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "include_obsolete",
                openapi.IN_QUERY,
                description="""
                    Include 'Obsolete' status in the response.
                    Obsolete status is used only for enterprises, not for project enterprises.
                """,
                type=openapi.TYPE_BOOLEAN,
            ),
        ],
        operation_description="List previous tranches of the project.",
    )
    def get(self, request, *args, **kwargs):
        choices = EnterpriseStatus.choices
        if not request.query_params.get("include_obsolete", "false").lower() in [
            "true",
            "1",
            "yes",
        ]:
            choices = [
                choice for choice in choices if choice[0] != EnterpriseStatus.OBSOLETE
            ]
        return Response(choices)
