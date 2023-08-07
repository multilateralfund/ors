from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import mixins, generics, views, viewsets
from rest_framework.response import Response

from core.api.filters.project import ProjectFilter
from core.api.serializers.project import (
    ProjectDetailsSerializer,
    ProjectListSerializer,
    ProjectOdsOdpSerializer,
    ProjectSectorSerializer,
    ProjectStatusSerializer,
    ProjectSubSectorSerializer,
    ProjectTypeSerializer,
)
from core.models.project import (
    Project,
    ProjectOdsOdp,
    ProjectSector,
    ProjectSubSector,
    ProjectType,
)
from core.models.project import ProjectStatus


class ProjectStatusListView(generics.ListAPIView):
    """
    List project status
    """

    queryset = ProjectStatus.objects.all()
    serializer_class = ProjectStatusSerializer


class ProjectSectorListView(generics.ListAPIView):
    """
    List project sector
    """

    queryset = ProjectSector.objects.order_by("sort_order").all()
    serializer_class = ProjectSectorSerializer


class ProjectSubSectorListView(generics.ListAPIView):
    """
    List project subsector
    """

    queryset = ProjectSubSector.objects.order_by("sort_order").all()
    serializer_class = ProjectSubSectorSerializer


class ProjectTypeListView(generics.ListAPIView):
    """
    List project type
    """

    queryset = ProjectType.objects.order_by("sort_order").all()
    serializer_class = ProjectTypeSerializer


class ProjectMeetingListView(views.APIView):
    def get(self, request, *args, **kwargs):
        meetings = (
            Project.objects.filter(approval_meeting_no__isnull=False)
            .values_list("approval_meeting_no", flat=True)
            .distinct()
            .order_by("approval_meeting_no")
        )
        return Response(list(meetings))


# view for country programme reports
# pylint: disable-next=R0901
class ProjectViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """
    API endpoint that allows projects to be viewed.
    """

    queryset = Project.objects.select_related(
        "country", "agency", "subsector__sector", "project_type", "status", "submission"
    )
    filterset_class = ProjectFilter

    def get_serializer_class(self):
        if self.action == "list":
            return ProjectListSerializer
        return ProjectDetailsSerializer

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "get_submission",
                openapi.IN_QUERY,
                description="Add submission data to the response",
                type=openapi.TYPE_BOOLEAN,
            )
        ],
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


class ProjectOdsOdpViewSet(
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """
    API endpoint that allows project ods odp to be update and delete.
    """

    queryset = ProjectOdsOdp.objects.all()
    serializer_class = ProjectOdsOdpSerializer
