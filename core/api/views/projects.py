import os
import openpyxl

from django.conf import settings
from django.core.exceptions import PermissionDenied
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

from core.api.filters.project import MetaProjectFilter, ProjectFilter
from core.api.permissions import IsAgency, IsCountryUser, IsSecretariat, IsViewer
from core.api.serializers.meeting import MeetingSerializer
from core.api.serializers.project import (
    ProjectCommentCreateSerializer,
    ProjectExportSerializer,
    ProjectFundCreateSerializer,
    ProjectOdsOdpCreateSerializer,
    ProjectRbmMeasureCreateSerializer,
    SubmissionAmountCreateSerializer,
)
from core.api.serializers.project_metadata import (
    ProjectClusterSerializer,
    ProjectSpecificFieldsSerializer,
    ProjectStatusSerializer,
    ProjectSubmissionStatusSerializer,
    ProjectTypeSerializer,
)
from core.api.serializers.project import (
    MetaProjectSerializer,
    ProjectDetailsSerializer,
    ProjectListSerializer,
)
from core.api.utils import workbook_pdf_response, workbook_response
from core.models.meeting import Meeting
from core.models.project import (
    MetaProject,
    Project,
    ProjectComment,
    ProjectFund,
    ProjectOdsOdp,
    ProjectRBMMeasure,
    ProjectFile,
    SubmissionAmount,
)
from core.models.project_metadata import (
    ProjectCluster,
    ProjectSpecificFields,
    ProjectStatus,
    ProjectSubmissionStatus,
    ProjectType,
)


class MetaProjectListView(generics.ListAPIView):
    """
    List meta projects
    """

    permission_classes = [IsSecretariat | IsAgency | IsCountryUser | IsViewer]
    queryset = MetaProject.objects.order_by("code", "type")
    filterset_class = MetaProjectFilter
    serializer_class = MetaProjectSerializer


class ProjectStatusListView(generics.ListAPIView):
    """
    List project status
    """

    permission_classes = [IsSecretariat | IsAgency | IsCountryUser | IsViewer]
    queryset = ProjectStatus.objects.all()
    serializer_class = ProjectStatusSerializer


class ProjectSubmissionStatusListView(generics.ListAPIView):
    """
    List project submission status
    """

    permission_classes = [IsSecretariat | IsAgency | IsCountryUser | IsViewer]
    queryset = ProjectSubmissionStatus.objects.all()
    serializer_class = ProjectSubmissionStatusSerializer


class ProjectTypeListView(generics.ListAPIView):
    """
    List project type
    """

    permission_classes = [IsSecretariat | IsAgency | IsCountryUser | IsViewer]
    serializer_class = ProjectTypeSerializer

    def get_queryset(self):
        queryset = ProjectType.objects.order_by("sort_order").all()
        cluster_id = self.request.query_params.get("cluster_id")
        if cluster_id:
            queryset = queryset.filter(
                id__in=ProjectSpecificFields.objects.filter(
                    cluster_id=cluster_id
                ).values_list("type_id", flat=True)
            )
        return queryset

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "cluster_id",
                openapi.IN_QUERY,
                description="Filter project types by cluster ID",
                type=openapi.TYPE_INTEGER,
            ),
        ]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class ProjectMeetingListView(generics.ListAPIView):
    permission_classes = [IsSecretariat | IsAgency | IsCountryUser | IsViewer]
    queryset = Meeting.objects.order_by("number").all()
    serializer_class = MeetingSerializer


class ProjectClusterListView(generics.ListAPIView):
    permission_classes = [IsSecretariat | IsAgency | IsCountryUser | IsViewer]
    queryset = ProjectCluster.objects.order_by("sort_order").all()
    serializer_class = ProjectClusterSerializer


class ProjectSpecificFieldsListView(generics.RetrieveAPIView):
    """
    Get a tree structure of project cluster types and sectors
    *and the list of required fields for each combination* *to be implemented*.
    """

    permission_classes = [IsSecretariat | IsAgency | IsCountryUser | IsViewer]
    serializer_class = ProjectSpecificFieldsSerializer

    def get_object(self):
        queryset = ProjectSpecificFields.objects.select_related(
            "cluster", "type", "sector"
        ).prefetch_related(
            "fields",
        )

        return get_object_or_404(
            queryset,
            cluster_id=self.kwargs["cluster_id"],
            type_id=self.kwargs["type_id"],
            sector_id=self.kwargs["sector_id"],
        )


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

    permission_classes = [IsSecretariat | IsAgency | IsCountryUser | IsViewer]
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
        "project_type__name",
        "substance_type",
    ]
    search_fields = ["code", "legacy_code", "meta_project__code", "title"]

    def get_queryset(self):
        user = self.request.user
        queryset = Project.objects.select_related(
            "country",
            "agency",
            "project_type",
            "status",
            "submission_status",
            "cluster",
            "meeting",
            "meeting_transf",
            "meta_project",
        ).prefetch_related(
            "coop_agencies",
            "submission_amounts",
            "subsectors__sector",
            "rbm_measures__measure",
            "ods_odp",
        )

        if "agency" in user.user_type.lower():
            # filter projects by agency if user is agency
            queryset = queryset.filter(agency=user.agency)

        if "country" in user.user_type.lower():
            # filter projects by country if user is country
            queryset = queryset.filter(country=user.country)

        return queryset

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
        deprecated=True,
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        deprecated=True,
    )
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

    @swagger_auto_schema(
        deprecated=True,
    )
    def retrieve(self, request, *args, **kwargs):
        """Retrieve project details"""
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(
        deprecated=True,
    )
    def create(self, request, *args, **kwargs):
        if "country" in request.user.user_type.lower():
            raise PermissionDenied("Country users not allowed")

        vald_perm_inst = Project(
            agency_id=request.data.get("agency_id"),
            country_id=request.data.get("country_id"),
        )
        self.check_object_permissions(request, vald_perm_inst)

        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if "country" in request.user.user_type.lower():
            raise PermissionDenied("Country users not allowed")

        return super().update(request, *args, **kwargs)


class ProjectFileView(APIView):
    """
    API endpoint for managing project files
    """

    @swagger_auto_schema(
        deprecated=True,
    )
    def get(self, request, pk):
        """Get project file"""
        project_file = get_object_or_404(ProjectFile, pk=pk)
        return serve(
            request, project_file.file.name, document_root=settings.PROTECTED_MEDIA_ROOT
        )

    @swagger_auto_schema(
        deprecated=True,
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

    permission_classes = [IsSecretariat | IsAgency]
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

    permission_classes = [IsSecretariat | IsAgency]
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

    permission_classes = [IsSecretariat | IsAgency]
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

    permission_classes = [IsSecretariat | IsAgency]
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

    permission_classes = [IsSecretariat | IsAgency]
    queryset = SubmissionAmount.objects.all()
    serializer_class = SubmissionAmountCreateSerializer


class ProjectStatisticsView(generics.ListAPIView):
    """
    API endpoint that allows project statistics to be viewed.
    """

    permission_classes = [IsSecretariat | IsAgency | IsCountryUser | IsViewer]
    filterset_class = ProjectFilter
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
    ]

    def get_queryset(self):
        user = self.request.user
        queryset = Project.objects.select_related(
            "meta_project", "sector", "cluster"
        ).all()

        if "agency" in user.user_type.lower():
            # filter projects by agency if user is agency
            queryset = queryset.filter(agency=user.agency)

        if "country" in user.user_type.lower():
            # filter projects by country if user is country
            queryset = queryset.filter(country=user.country)

        return queryset

    def get(self, request, *args, **kwargs):
        """
        Return project statistics
        """
        filtered_projects = self.filter_queryset(self.get_queryset())
        valid_code_inv_subcode_count = (
            filtered_projects.filter(code__contains="-")
            .exclude(meta_project__code__contains="-")
            .count()
        )
        valid_subcode_count = filtered_projects.exclude(code__contains="-").count()
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
