from rest_framework import mixins, viewsets, status
from rest_framework.response import Response

from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema

from core.api.permissions import (
    DenyAll,
    HasSectorsAndSubsectorsViewAccess,
    HasSectorsAndSubsectorsEditAccess,
)
from core.api.serializers.project_metadata import (
    ProjectSectorIncludingSubsectorsSerializer,
    ProjectSubSectorSerializer,
)
from core.models.project_metadata import (
    ProjectSpecificFields,
    ProjectSector,
    ProjectSubSector,
)

# please make sure to use only this endpoint for sector and subsector list
# we need to make sure that we filter out the custom sectors and subsectors


class SectorSubsectorBaseView(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """
    Base class for project
    """

    @property
    def permission_classes(self):
        if self.action in ["list"]:
            return [HasSectorsAndSubsectorsViewAccess]
        if self.action in ["create"]:
            return [HasSectorsAndSubsectorsEditAccess]
        return [DenyAll]

    def get_queryset(self):
        # filter by is_custom for list view
        queryset = super().get_queryset()
        if self.request.method == "GET":
            queryset = queryset.filter(is_custom=False)
        return queryset

    def get_existing_object(self, request):
        raise NotImplementedError

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # make sure there are no duplicates
        existing_obj = self.get_existing_object(request)
        if existing_obj:
            # return existing_obj
            serializer = self.get_serializer(existing_obj)
            headers = self.get_success_headers(serializer.data)
            return Response(
                serializer.data, status=status.HTTP_201_CREATED, headers=headers
            )

        self.perform_create(serializer)

        # set user
        instance = serializer.instance
        instance.code = f"CUST{instance.id}"
        instance.created_by = request.user
        instance.is_custom = True
        instance.save()

        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )


class ProjectSectorView(SectorSubsectorBaseView):
    """
    List project sector
    """

    queryset = ProjectSector.objects.order_by("sort_order").all()
    serializer_class = ProjectSectorIncludingSubsectorsSerializer

    def get_existing_object(self, request):
        return ProjectSector.objects.find_by_name(request.data["name"])

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.method == "GET":
            cluster_id = self.request.query_params.get("cluster_id")
            type_id = self.request.query_params.get("type_id")

            if cluster_id and type_id:
                queryset = queryset.filter(
                    id__in=ProjectSpecificFields.objects.filter(
                        cluster_id=cluster_id, type_id=type_id
                    ).values_list("sector_id", flat=True)
                ).order_by("sort_order")
        return queryset

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "cluster_id",
                openapi.IN_QUERY,
                description="Filter sector by cluster ID. Must be used with type_id.",
                type=openapi.TYPE_INTEGER,
            ),
            openapi.Parameter(
                "type_id",
                openapi.IN_QUERY,
                description="Filter sector by type ID. Must be used with cluster_id.",
                type=openapi.TYPE_INTEGER,
            ),
        ]
    )
    def list(self, request, *args, **kwargs):
        cluster_id = request.query_params.get("cluster_id")
        type_id = request.query_params.get("type_id")

        if any([cluster_id, type_id]) and not all([cluster_id, type_id]):
            return Response(
                {"error": "Both cluster_id and type_id must be provided together."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return super().list(request, *args, **kwargs)


class ProjectSubSectorView(SectorSubsectorBaseView):
    """
    List project subsector
    """

    queryset = ProjectSubSector.objects.order_by("sort_order").all()
    serializer_class = ProjectSubSectorSerializer

    def get_existing_object(self, request):
        name = request.data["name"]
        sectors_list = request.data.getlist("sectors", [])
        sector_id = sectors_list[0] if sectors_list else None

        return ProjectSubSector.objects.find_by_name_and_sector(name, sector_id)

    def get_queryset(self):
        queryset = super().get_queryset()
        try:
            sector_id = int(self.request.query_params.get("sector_id", ""))
        except (ValueError, TypeError):
            sector_id = None

        if not sector_id:
            return queryset
        return queryset.filter(sectors__id=sector_id).order_by("sort_order")

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "sector_id",
                openapi.IN_QUERY,
                description="Filter sub-sectors by sector ID",
                type=openapi.TYPE_INTEGER,
            ),
            openapi.Parameter(
                "name",
                openapi.IN_QUERY,
                description="Filter sub-sectors by name",
                type=openapi.TYPE_STRING,
            ),
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
