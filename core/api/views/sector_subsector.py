from rest_framework import mixins, viewsets, status
from rest_framework.response import Response

from core.api.permissions import IsAgency, IsSecretariat, IsViewer
from core.api.serializers.project_metadata import (
    ProjectSectorSerializer,
    ProjectSubSectorSerializer,
)
from core.models.project_metadata import ProjectSector, ProjectSubSector

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

    permission_classes = [IsSecretariat | IsAgency | IsViewer]

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
    serializer_class = ProjectSectorSerializer

    def get_existing_object(self, request):
        return ProjectSector.objects.find_by_name(request.data["name"])


class ProjectSubSectorView(SectorSubsectorBaseView):
    """
    List project subsector
    """

    queryset = ProjectSubSector.objects.order_by("sort_order").all()
    serializer_class = ProjectSubSectorSerializer

    def get_existing_object(self, request):
        name = request.data["name"]
        sector_id = request.data["sector_id"]

        return ProjectSubSector.objects.find_by_name_and_sector(name, sector_id)
