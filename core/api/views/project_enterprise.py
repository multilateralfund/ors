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
            return [HasProjectV2ViewAccess]  # TODO: enterprise view access
        if self.action in [
            "create",
            "update",
        ]:
            return [HasProjectEnterpriseEditAccess]
        if self.action in [
            "change_status",
        ]:
            return [HasProjectEnterpriseApprovalAccess]
        return [DenyAll]

    @swagger_auto_schema(
        operation_description="""
        Creates a new Pending Enterprise.
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
        "code",
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
        A new pending Enterprise will be created if the provided enterprise data does not include an ID.
        If the provided enterprise data includes an ID, the existing enterprise with that ID will be linked
        to the new pending Project Enterprise without altering any of its data.
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

    @action(methods=["POST"], detail=True)
    @swagger_auto_schema(
        operation_description="""
        Not approve a Project Enterprise. Will be marked as 'Obsolete'.
        If the Project Enterprise is already approved, it cannot be marked as obsolete.
        If the Project Enterprise is pending, but linked to at least one Project Enterprise
        that is not obsolete, it cannot be marked as obsolete.
        """,
        request_body=openapi.Schema(type=openapi.TYPE_OBJECT, properties=None),
        responses={
            status.HTTP_200_OK: ProjectEnterpriseSerializer,
            status.HTTP_400_BAD_REQUEST: "Bad request",
        },
    )
    def not_approve(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status != EnterpriseStatus.PENDING:
            return Response(
                {"detail": "Only pending enterprises can be marked as 'obsolete'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        instance.status = EnterpriseStatus.OBSOLETE
        instance.save()

        enterprise = instance.enterprise

        # If the enterprise is pending and not linked to any other non-obsolete ProjectEnterprise,
        # mark it as obsolete too
        if enterprise.status != EnterpriseStatus.APPROVED:
            linked_active_entries = ProjectEnterprise.objects.filter(
                enterprise=enterprise
            ).exclude(status=EnterpriseStatus.OBSOLETE)
            if not linked_active_entries.exists():
                enterprise.status = EnterpriseStatus.OBSOLETE
                enterprise.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=["POST"], detail=True)
    @swagger_auto_schema(
        operation_description="""
        mark as obsolete a Project Enterprise.
        The linked enterprise will be marked as obsolete too if it is not approved and
        not linked to any other non-obsolete ProjectEnterprise.
        """,
        request_body=openapi.Schema(type=openapi.TYPE_OBJECT, properties=None),
        responses={
            status.HTTP_200_OK: ProjectEnterpriseSerializer,
            status.HTTP_400_BAD_REQUEST: "Bad request",
        },
    )
    def obsolete(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.status = EnterpriseStatus.OBSOLETE
        instance.save()
        enterprise = instance.enterprise
        if enterprise.status != EnterpriseStatus.APPROVED:
            linked_active_entries = ProjectEnterprise.objects.filter(
                enterprise=enterprise
            ).exclude(status=EnterpriseStatus.OBSOLETE)
            if not linked_active_entries.exists():
                enterprise.status = EnterpriseStatus.OBSOLETE
                enterprise.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProjectEnterpriseStatusView(APIView):
    """
    View to return a list of all Project Enterprise Status choices
    """

    def get(self, request, *args, **kwargs):
        choices = EnterpriseStatus.choices
        return Response(choices)
