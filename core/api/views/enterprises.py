from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter
from drf_spectacular.utils import extend_schema

from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend

from rest_framework import filters, mixins, status, viewsets, generics
from rest_framework.decorators import action
from rest_framework.response import Response

from core.api.permissions import (
    DenyAll,
    HasEnterpriseViewAccess,
    HasEnterpriseEditAccess,
)
from core.models.enterprise import (
    Enterprise,
    EnterpriseStatus,
)
from core.api.serializers.enterprise import (
    EnterpriseSerializer,
    EnterpriseStatusSerializer,
)
from core.api.filters.enterprise import EnterpriseFilter


class EnterpriseViewSet(
    viewsets.GenericViewSet,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
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
        "stage",
        "sector",
        "subsector",
        "application",
        "local_ownership",
        "export_to_non_a5",
        "date_of_revision",
        "status",
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

        if user.has_perm("core.can_view_all_agencies"):
            return queryset

        if user.has_perm("core.can_view_only_own_agency"):
            return queryset.filter(project_enterprises__agency=user.agency)

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
            "partial_update",
            "destroy",
        ]:
            return [HasEnterpriseEditAccess]
        return [DenyAll]

    @extend_schema(
        description="""
        Creates a new Enterprise.
        MLFS users can create enterprises for all agencies, while Agency users 
        can only create enterprises for their own agency.
        """,
        responses={status.HTTP_200_OK: EnterpriseSerializer(many=True)},
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @extend_schema(
        description="""
        Updates a Project Enterprise.
        MLFS users can update enterprises for all agencies, while Agency users 
        can only update enterprises for their own agency.
        """,
        responses={status.HTTP_200_OK: EnterpriseSerializer(many=True)},
    )
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        data = request.data.copy()
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save(request=request)
        return Response(serializer.data, status=status.HTTP_200_OK)


class EnterpriseStatusListView(generics.ListAPIView):
    """
    View to return a list of all
    """

    model = EnterpriseStatus
    serializer_class = EnterpriseStatusSerializer
    queryset = EnterpriseStatus.objects.all()
