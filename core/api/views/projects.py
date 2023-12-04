import os

from django.conf import settings
from django.shortcuts import get_object_or_404
from django.views.static import serve
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import mixins, generics, viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from core.api.filters.project import ProjectFilter
from core.api.serializers.meeting import MeetingSerializer
from core.api.serializers.project import (
    ProjectClusterSerializer,
    ProjectCommentCreateSerializer,
    ProjectFundCreateSerializer,
    ProjectOdsOdpCreateSerializer,
    ProjectRbmMeasureCreateSerializer,
    SubmissionAmountCreateSerializer,
)
from core.api.serializers.project import (
    ProjectDetailsSerializer,
    ProjectListSerializer,
    ProjectSectorSerializer,
    ProjectStatusSerializer,
    ProjectSubSectorSerializer,
    ProjectTypeSerializer,
)
from core.models.meeting import Meeting
from core.models.project import (
    Project,
    ProjectCluster,
    ProjectOdsOdp,
    ProjectRBMMeasure,
    ProjectSector,
    ProjectSubSector,
    ProjectType,
    ProjectFile,
    SubmissionAmount,
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


class ProjectMeetingListView(generics.ListAPIView):
    queryset = Meeting.objects.order_by("number").all()
    serializer_class = MeetingSerializer


class ProjectClusterListView(generics.ListAPIView):
    queryset = ProjectCluster.objects.order_by("sort_order").all()
    serializer_class = ProjectClusterSerializer


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
        "cluster",
        "approval_meeting",
        "meeting_transf",
    ).prefetch_related(
        "coop_agencies__agency", "submission_amounts", "rbm_measures__measure"
    )
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
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """
    API endpoint that allows project ods odp CreateUpdateDdelete
    """

    queryset = ProjectOdsOdp.objects.select_related("ods_substance", "ods_blend").all()
    serializer_class = ProjectOdsOdpCreateSerializer


class ProjectFundViewSet(
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """
    API endpoint that allows project fund CreateUpdateDdelete
    """

    queryset = ProjectFund.objects.select_related("meeting").all()
    serializer_class = ProjectFundCreateSerializer


class ProjectCommentViewSet(
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """
    API endpoint that allows comment CreateUpdateDdelete
    """

    queryset = ProjectComment.objects.select_related("meeting_of_report").all()
    serializer_class = ProjectCommentCreateSerializer


class ProjectRbmMeasureViewSet(
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """
    API endpoint that allows project rbm measure CreateUpdateDdelete
    """

    queryset = ProjectRBMMeasure.objects.select_related("measure").all()
    serializer_class = ProjectRbmMeasureCreateSerializer


class ProjectSubmissionAmountViewSet(
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """
    API endpoint that allows project submission amount CreateUpdateDdelete
    """

    queryset = SubmissionAmount.objects.all()
    serializer_class = SubmissionAmountCreateSerializer
