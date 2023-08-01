from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import mixins, generics

from core.api.filters.project import ProjectFilter
from core.api.serializers.project import (
    ProjectDetailsSerializer,
    ProjectListSerializer,
    ProjectStatusSerializer,
)
from core.models.project import Project
from core.models.project import ProjectStatus


class ProjectStatusListView(generics.ListAPIView):
    """
    List project status
    """

    queryset = ProjectStatus.objects.all()
    serializer_class = ProjectStatusSerializer


# view for country programme reports
class ProjectListView(
    mixins.CreateModelMixin, mixins.ListModelMixin, generics.GenericAPIView
):
    """
    API endpoint that allows projects to be viewed.
    """

    queryset = Project.objects.select_related(
        "country", "agency", "subsector__sector", "project_type", "status", "submission"
    )
    filterset_class = ProjectFilter

    def get_serializer_class(self):
        if self.request.method == "GET":
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
    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)
