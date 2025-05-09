import os
import urllib

from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, mixins, viewsets, filters, status
from rest_framework.response import Response
from rest_framework import parsers
from rest_framework.decorators import action
from rest_framework.views import APIView

from core.api.filters.project import ProjectFilter
from core.api.permissions import IsAgency, IsCountryUser, IsSecretariat, IsViewer
from core.api.serializers.project_v2 import (
    ProjectV2FileSerializer,
    ProjectDetailsV2Serializer,
    ProjectListV2Serializer,
    ProjectV2CreateSerializer,
)
from core.api.swagger import FileUploadAutoSchema
from core.models.project import (
    Project,
    ProjectFile,
)


class ProjectDestructionTehnologyView(APIView):
    """
    View to return a list of all Project DestructionTehnology choices
    """

    def get(self, request, *args, **kwargs):
        choices = Project.DestructionTechnology.choices
        return Response(choices)


class ProjectProductionControlTypeView(APIView):
    """
    View to return a list of all Project ProductionControlType choices
    """

    def get(self, request, *args, **kwargs):
        choices = Project.ProductionControlType.choices
        return Response(choices)


# pylint: disable=R1710


class ProjectV2ViewSet(
    viewsets.GenericViewSet,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
):
    """V2 ViewSet for Project model."""

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
            return ProjectListV2Serializer
        if self.action == "create":
            return ProjectV2CreateSerializer
        return ProjectDetailsV2Serializer

    @swagger_auto_schema(
        manual_parameters=[
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
        operation_description="V2 listing endpoint that allow listing, filtering and ordering the projects.",
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_description="V2 retrieve endpoint that allows retrieving a project.",
    )
    def retrieve(self, request, *args, **kwargs):
        """Retrieve project details"""
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_description="""
        V2 projects endpoint for creating a project. This endpoint should be used in the first step of the
        project creation workflow.
        """,
        request_body=ProjectV2CreateSerializer,
        responses={
            status.HTTP_201_CREATED: ProjectDetailsV2Serializer,
            status.HTTP_400_BAD_REQUEST: "Bad request",
        },
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @action(methods=["GET"], detail=False)
    def api_schema(self, request):
        meta = self.metadata_class()
        data = meta.determine_metadata(request, self)
        return Response(data)


class ProjectV2FileView(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.DestroyModelMixin,
    generics.GenericAPIView,
):
    """
    API endpoint that allows uploading project files.
    """

    queryset = ProjectFile.objects.all()
    serializer_class = ProjectV2FileSerializer

    ACCEPTED_EXTENSIONS = [
        ".pdf",
        ".doc",
        ".docx",
    ]

    def get_serializer_class(self):
        # don't use the serializer here as it will be used for auto-generating the schema
        # and it conflicts with the url parameters
        if self.request.method != "POST":
            return ProjectV2FileSerializer
        return

    def get_parser_classes(self):
        if self.request.method == "POST":
            return [
                parsers.FormParser,
            ]
        return [parsers.JSONParser]

    def get(self, request, *args, **kwargs):
        project = get_object_or_404(Project, id=self.kwargs.get("project_id"))
        queryset = ProjectFile.objects.filter(project=project)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def _file_create(self, request, *args, **kwargs):
        files = request.FILES
        if not files:
            return Response(
                {"file": "File not provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        filenames = []
        for file in files.getlist("files"):
            filenames.append(file.name)
            extension = os.path.splitext(file.name)[-1]
            if extension not in self.ACCEPTED_EXTENSIONS:
                return Response(
                    {"file": f"File extension {extension} is not valid"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        existing_file = ProjectFile.objects.filter(
            project_id=self.kwargs.get("project_id"),
            filename__in=filenames,
        ).values_list("filename", flat=True)

        if existing_file:
            return Response(
                {
                    "files": "Some files already exist: "
                    + str(", ".join(existing_file)),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        project_files = []
        for file in files.getlist("files"):
            project_files.append(
                ProjectFile(
                    project_id=self.kwargs.get("project_id"),
                    filename=file.name,
                    file=file,
                )
            )
        ProjectFile.objects.bulk_create(project_files)
        return Response({}, status=status.HTTP_201_CREATED)

    @swagger_auto_schema(
        operation_description="Upload multiple files...",
        auto_schema=FileUploadAutoSchema,
        manual_parameters=[
            openapi.Parameter(
                name="files",
                in_=openapi.IN_FORM,
                type=openapi.TYPE_ARRAY,
                items=openapi.Items(type=openapi.TYPE_FILE),
                required=True,
                description="List of documents",
            )
        ],
    )
    def post(self, request, *args, **kwargs):
        return self._file_create(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_description="Receives a list of files ids and deletes them.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "file_ids": openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Items(type=openapi.TYPE_INTEGER),
                ),
            },
            required=["file_ids"],
        ),
    )
    def delete(self, request, *args, **kwargs):
        project = get_object_or_404(Project, id=self.kwargs.get("project_id"))
        file_ids = request.data.get("file_ids")
        queryset = ProjectFile.objects.filter(project=project)
        queryset.filter(id__in=file_ids).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectFilesDownloadView(generics.RetrieveAPIView):
    queryset = ProjectFile.objects.all()
    lookup_field = "id"

    def get(self, request, *args, **kwargs):
        obj = self.get_object()
        response = HttpResponse(
            obj.file.read(), content_type="application/octet-stream"
        )
        file_name = urllib.parse.quote(obj.filename)
        response["Content-Disposition"] = (
            f"attachment; filename*=UTF-8''{file_name}; filename=\"{file_name}\""
        )
        return response
