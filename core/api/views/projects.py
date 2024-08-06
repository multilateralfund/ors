import os
import openpyxl

from django.conf import settings
from django.db import models
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
from core.api.export.base import configure_sheet_print
from core.api.export.projects import ProjectWriter

from core.api.filters.project import ProjectFilter
from core.api.serializers.meeting import MeetingSerializer
from core.api.serializers.project import (
    ProjectClusterSerializer,
    ProjectCommentCreateSerializer,
    ProjectExportSerializer,
    ProjectFundCreateSerializer,
    ProjectOdsOdpCreateSerializer,
    ProjectRbmMeasureCreateSerializer,
    SubmissionAmountCreateSerializer,
)
from core.api.serializers.project import (
    ProjectDetailsSerializer,
    ProjectListSerializer,
    ProjectStatusSerializer,
    ProjectTypeSerializer,
)
from core.api.utils import workbook_pdf_response, workbook_response
from core.models.meeting import Meeting
from core.models.project import (
    Project,
    ProjectCluster,
    ProjectOdsOdp,
    ProjectRBMMeasure,
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
        "meta_project",
    ).prefetch_related(
        "coop_agencies__agency",
        "submission_amounts",
        "rbm_measures__measure",
        "ods_odp",
    )
    filterset_class = ProjectFilter
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter,
    ]
    ordering_fields = [
        "title",
        "country__name",
        "agency__name",
        "sector__name",
        "subsector__name",
        "project_type__name",
        "substance_type",
    ]
    search_fields = ["code", "generated_code", "meta_project__code", "title"]

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

    def get_wb(self, method):
        queryset = self.filter_queryset(self.get_queryset())

        data = ProjectExportSerializer(queryset, many=True).data

        wb = openpyxl.Workbook(write_only=True)
        sheet = wb.create_sheet("Projects")
        configure_sheet_print(sheet, "landscape")

        ProjectWriter(
            sheet,
        ).write(data)

        name = "Projects"
        return method(name, wb)

    @action(methods=["GET"], detail=False)
    def export(self, *args, **kwargs):
        return self.get_wb(workbook_response)

    @action(methods=["GET"], detail=False)
    def print(self, *args, **kwargs):
        return self.get_wb(workbook_pdf_response)


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


class ProjectStatisticsView(generics.ListAPIView):
    """
    API endpoint that allows project statistics to be viewed.
    """

    filterset_class = ProjectFilter
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
    ]
    queryset = Project.objects.select_related("meta_project", "sector", "cluster").all()

    def get(self, request, *args, **kwargs):
        """
        Return project statistics
        """
        filtered_projects = self.filter_queryset(self.get_queryset())
        valid_code_inv_subcode_count = (
            filtered_projects.filter(generated_code__contains="-")
            .exclude(meta_project__code__contains="-")
            .count()
        )
        valid_subcode_count = filtered_projects.exclude(
            generated_code__contains="-"
        ).count()
        project_count_per_sector = (
            filtered_projects.values("sector__name")
            .filter(sector__isnull=False)
            .annotate(count=models.Count("sector__name"))
            .order_by("-count")
        )
        project_count_per_cluster = (
            filtered_projects.values("cluster__name")
            .filter(cluster__isnull=False)
            .annotate(count=models.Count("cluster__name"))
            .order_by("-count")
        )

        data = {
            "projects_total_count": Project.objects.count(),
            "projects_count": filtered_projects.count(),  # filtered projects
            "projects_code_count": valid_code_inv_subcode_count,  # valid codes invalid subcodes
            "projects_code_subcode_count": valid_subcode_count,  # valid subcodes
            "projects_count_per_sector": project_count_per_sector,
            "projects_count_per_cluster": project_count_per_cluster,
        }
        return Response(data)
