import os

from django.conf import settings
from django.shortcuts import get_object_or_404
from django.views.static import serve
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import mixins, generics, views, viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from core.api.filters.project import ProjectFilter
from core.api.serializers.project import ProjectCommentSerializer
from core.api.serializers.project import (
    ProjectDetailsSerializer,
    ProjectListSerializer,
    ProjectOdsOdpSerializer,
    ProjectSectorSerializer,
    ProjectStatusSerializer,
    ProjectSubSectorSerializer,
    ProjectTypeSerializer,
    ProjectFundSerializer,
)
from core.models.project import (
    Project,
    ProjectOdsOdp,
    ProjectSector,
    ProjectSubSector,
    ProjectType,
    ProjectFile,
)
from core.models.project import ProjectComment
from core.models.project import ProjectStatus, ProjectFund


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
        "country",
        "agency",
        "subsector__sector",
        "project_type",
        "status",
        "submission",
    ).prefetch_related("coop_agencies__agency")
    filterset_class = ProjectFilter
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter,
    ]
    ordering_fields = "__all__"
    search_fields = ["title"]

    def get_serializer_class(self):
        if self.action == "list":
            return ProjectListSerializer
        return ProjectDetailsSerializer

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "get_submission",
                openapi.IN_QUERY,
                description="True: Return only submissions; False: Return only projects",
                type=openapi.TYPE_BOOLEAN,
            ),
            openapi.Parameter(
                "date_received_after",
                openapi.IN_QUERY,
                description="Returns the projects with date_received equal or after this date",
                type=openapi.TYPE_STRING,
                format=openapi.FORMAT_DATE,
            ),
            openapi.Parameter(
                "date_received_before",
                openapi.IN_QUERY,
                description="Returns the projects with date_received equal or before this date",
                type=openapi.TYPE_STRING,
                format=openapi.FORMAT_DATE,
            ),
        ],
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @action(methods=["POST"], detail=True)
    def upload(self, request, *args, **kwargs):
        project = self.get_object()
        file = request.FILES["file"]
        ProjectFile.objects.create(file=file, project=project)
        return Response({}, status.HTTP_201_CREATED)


class ProjectFileView(APIView):
    """
    API endpoint for managing project files
    """

    def get(self, request, pk):
        """Get project file"""
        project_file = get_object_or_404(ProjectFile, pk=pk)
        return serve(
            request, project_file.file.name, document_root=settings.PROTECTED_MEDIA_ROOT
        )

    def delete(self, request, pk):
        """Delete project file"""
        project_file = get_object_or_404(ProjectFile, pk=pk)
        try:
            os.remove(project_file.file.path)
        except FileNotFoundError:
            pass
        project_file.delete()
        return Response({}, status.HTTP_204_NO_CONTENT)


class ProjectOdsOdpViewSet(
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """
    API endpoint that allows project ods odp to be updated and deleted.
    """

    queryset = ProjectOdsOdp.objects.all()
    serializer_class = ProjectOdsOdpSerializer


class ProjectFundViewSet(
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """
    API endpoint that allows project fund to be updated and deleted.
    """

    queryset = ProjectFund.objects.all()
    serializer_class = ProjectFundSerializer


class ProjectCommentViewSet(
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """
    API endpoint that allows comment to be updated and deleted.
    """

    queryset = ProjectComment.objects.all()
    serializer_class = ProjectCommentSerializer
