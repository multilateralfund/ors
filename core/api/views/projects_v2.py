import os
import urllib
import shutil

from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from django.db import transaction
from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, mixins, viewsets, filters, status
from rest_framework.response import Response
from rest_framework import parsers
from rest_framework.decorators import action
from rest_framework.views import APIView

from core.api.filters.project import ProjectFilter
from core.api.permissions import (
    IsAgencyInputter,
    IsAgencySubmitter,
    IsSecretariatViewer,
    IsSecretariatV1V2EditAccess,
    IsSecretariatV3EditAccess,
    IsSecretariatProductionV1V2EditAccess,
    IsSecretariatProductionV3EditAccess,
    IsViewer,
)
from core.api.serializers.project_v2 import (
    ProjectV2FileSerializer,
    ProjectDetailsV2Serializer,
    ProjectListV2Serializer,
    ProjectV2CreateUpdateSerializer,
)
from core.api.swagger import FileUploadAutoSchema
from core.models.project import (
    Project,
    ProjectComment,
    ProjectFund,
    ProjectRBMMeasure,
    ProjectOdsOdp,
    ProjectProgressReport,
    ProjectFile,
    SubmissionAmount,
)
from core.models.user import User
from core.models.utils import get_protected_storage


class ProjectDestructionTechnologyView(APIView):
    """
    View to return a list of all Project DestructionTechnology choices
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


class ProjectOdsOdpTypeView(APIView):
    """
    View to return a list of all Project OdsOdpType choices
    """

    def get(self, request, *args, **kwargs):
        choices = ProjectOdsOdp.ProjectOdsOdpType.choices
        return Response(choices)


# pylint: disable=R1710


class ProjectV2ViewSet(
    viewsets.GenericViewSet,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
):
    """V2 ViewSet for Project model."""

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

    @property
    def permission_classes(self):
        if self.action in ["list", "retrieve"]:
            return [
                IsViewer
                | IsAgencyInputter
                | IsAgencySubmitter
                | IsSecretariatViewer
                | IsSecretariatV1V2EditAccess
                | IsSecretariatV3EditAccess
                | IsSecretariatProductionV1V2EditAccess
                | IsSecretariatProductionV3EditAccess
            ]
        if self.action in [
            "create",
            "update",
            "partial_update",
            "destroy",
            "increase_version",
        ]:
            return [
                IsAgencyInputter
                | IsAgencySubmitter
                | IsSecretariatV1V2EditAccess
                | IsSecretariatProductionV1V2EditAccess
            ]
        return super().get_permissions()

    def filter_permissions_queryset(self, queryset):
        """
        Filter the queryset based on the user's permissions.
        """
        user = self.request.user
        if user.is_superuser:
            return queryset

        if user.user_type in [
            User.UserType.SECRETARIAT_VIEWER,
            User.UserType.SECRETARIAT_V1_V2_EDIT_ACCESS,
            User.UserType.SECRETARIAT_V3_EDIT_ACCESS,
            User.UserType.SECRETARIAT_PRODUCTION_V1_V2_EDIT_ACCESS,
            User.UserType.SECRETARIAT_PRODUCTION_V3_EDIT_ACCESS,
        ]:
            return queryset
        if user.user_type in [
            User.UserType.AGENCY_SUBMITTER,
            User.UserType.AGENCY_INPUTTER,
            User.UserType.VIEWER,
        ]:
            return queryset.filter(
                Q(agency=user.agency)
                | (
                    Q(meta_project__lead_agency=user.agency)
                    & Q(meta_project__lead_agency__isnull=False)
                )
            )

        return queryset.none()

    def get_queryset(self):
        if self.action == "retrieve":
            queryset = Project.objects.really_all()
        else:
            queryset = Project.objects.all()
        queryset = self.filter_permissions_queryset(queryset)
        queryset = queryset.select_related(
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
        return queryset

    def get_serializer_class(self):
        serializer = ProjectDetailsV2Serializer
        if self.action == "list":
            serializer = ProjectListV2Serializer
        elif self.action in ["create", "update", "partial_update"]:
            serializer = ProjectV2CreateUpdateSerializer
        return serializer

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
        request_body=ProjectV2CreateUpdateSerializer,
        responses={
            status.HTTP_201_CREATED: ProjectDetailsV2Serializer,
            status.HTTP_400_BAD_REQUEST: "Bad request",
        },
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(request=request)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )

    @action(methods=["GET"], detail=False)
    def api_schema(self, request):
        meta = self.metadata_class()
        data = meta.determine_metadata(request, self)
        return Response(data)

    def _get_new_file_path(self, original_file_name, new_project_id):
        # Generate a new file path for the duplicated file
        base_dir, file_name = os.path.split(original_file_name)
        new_file_name = f"{file_name}_{new_project_id}"
        return os.path.join(base_dir, new_file_name)

    @action(methods=["POST"], detail=True)
    @swagger_auto_schema(
        operation_description="""
            This endpoint archives the project by creating a copy of it and
            increasing the version of the original entry.
            The related entries (ProjectOdsOdp, ProjectFund, ProjectRBMMeasure,
            ProjectProgressReport, SubmissionAmount, ProjectComment, ProjectFile)
            are also duplicated and linked to the archived project.
            The file itself is also duplicated and linked to the archived project.
        """,
        request_body=openapi.Schema(type=openapi.TYPE_OBJECT, properties=None),
        responses={
            status.HTTP_200_OK: ProjectDetailsV2Serializer,
            status.HTTP_400_BAD_REQUEST: "Bad request",
        },
    )
    def increase_version(self, request, *args, **kwargs):
        project = self.get_object()
        if project.latest_project:
            return Response(
                {"error": "This project already has a latest version."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        with transaction.atomic():
            # Duplicate the project
            old_project = Project.objects.get(pk=project.pk)
            old_project.pk = None
            old_project.latest_project = project

            old_project.save()

            project.version += 1
            project.version_created_by = request.user
            project.save()

            # Duplicate the linked ProjectOdsOdp entries
            ods_odp_entries = ProjectOdsOdp.objects.filter(project=project)
            for entry in ods_odp_entries:
                entry.pk = None
                entry.project = old_project
                entry.save()

            # Duplicate the linked ProjectFund entries
            fund_entries = ProjectFund.objects.filter(project=project)
            for entry in fund_entries:
                entry.pk = None
                entry.project = old_project
                entry.save()

            # Duplicate the linked ProjectRBMMeasure entries
            rbm_entries = ProjectRBMMeasure.objects.filter(project=project)
            for entry in rbm_entries:
                entry.pk = None
                entry.project = old_project
                entry.save()

            # Duplicate the linked ProjectProgressReport entries
            progress_report_entries = ProjectProgressReport.objects.filter(
                project=project
            )
            for entry in progress_report_entries:
                entry.pk = None
                entry.project = old_project
                entry.save()

            # Duplicate the linked SubmissionAmount entries
            submission_amount_entries = SubmissionAmount.objects.filter(project=project)
            for entry in submission_amount_entries:
                entry.pk = None
                entry.project = old_project
                entry.save()

            # Duplicate the ProjectComment entries
            comment_entries = ProjectComment.objects.filter(project=project)
            for entry in comment_entries:
                entry.pk = None
                entry.project = old_project
                entry.save()

            # Duplicate the ProjectFile entries
            file_entries = ProjectFile.objects.filter(project=project)
            for entry in file_entries:
                original_file_path = entry.file.path
                new_file_path = self._get_new_file_path(entry.file.name, old_project.id)
                storage = get_protected_storage()
                with storage.open(original_file_path, "rb") as original_file:
                    with storage.open(new_file_path, "wb") as new_file:
                        shutil.copyfileobj(original_file, new_file)
                entry.pk = None
                entry.project = old_project
                entry.file.name = (
                    new_file_path  # Update the file field to point to the new file
                )
                entry.save()

        return Response(
            ProjectDetailsV2Serializer(project).data,
            status=status.HTTP_200_OK,
        )


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

    @property
    def permission_classes(self):
        if self.request.method in ["GET"]:
            return [
                IsViewer
                | IsAgencyInputter
                | IsAgencySubmitter
                | IsSecretariatViewer
                | IsSecretariatV1V2EditAccess
                | IsSecretariatV3EditAccess
                | IsSecretariatProductionV1V2EditAccess
                | IsSecretariatProductionV3EditAccess
            ]
        if self.request.method in ["POST", "DELETE"]:
            return [
                IsAgencyInputter
                | IsAgencySubmitter
                | IsSecretariatV1V2EditAccess
                | IsSecretariatProductionV1V2EditAccess
            ]

        return super().get_permissions()

    def filter_permissions_queryset(self, queryset):
        """
        Filter the queryset based on the user's permissions.
        """
        user = self.request.user
        if user.is_superuser:
            return queryset

        if user.user_type in [
            User.UserType.SECRETARIAT_VIEWER,
            User.UserType.SECRETARIAT_V1_V2_EDIT_ACCESS,
            User.UserType.SECRETARIAT_V3_EDIT_ACCESS,
            User.UserType.SECRETARIAT_PRODUCTION_V1_V2_EDIT_ACCESS,
            User.UserType.SECRETARIAT_PRODUCTION_V3_EDIT_ACCESS,
        ]:
            return queryset
        if user.user_type in [
            User.UserType.AGENCY_SUBMITTER,
            User.UserType.AGENCY_INPUTTER,
            User.UserType.VIEWER,
        ]:
            return queryset.filter(
                Q(agency=user.agency) | Q(meta_project__lead_agency=user.agency)
            )

        return queryset.none()

    def get_queryset(self):
        projects = self.filter_permissions_queryset(Project.objects.really_all())
        project = get_object_or_404(projects, pk=self.kwargs.get("project_id"))
        queryset = ProjectFile.objects.filter(project=project)
        return queryset

    def get_object(self):
        queryset = self.get_queryset()
        obj = get_object_or_404(queryset, pk=self.kwargs.get("id"))
        return obj

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
        queryset = self.get_queryset()
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
        self.get_queryset()
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
        queryset = self.get_queryset()
        file_ids = request.data.get("file_ids")
        queryset.filter(id__in=file_ids).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectFilesDownloadView(generics.RetrieveAPIView):
    queryset = ProjectFile.objects.all()
    lookup_field = "id"

    def filter_permissions_queryset(self, queryset):
        """
        Filter the queryset based on the user's permissions.
        """
        user = self.request.user
        if user.is_superuser:
            return queryset

        if user.user_type in [
            User.UserType.SECRETARIAT_VIEWER,
            User.UserType.SECRETARIAT_V1_V2_EDIT_ACCESS,
            User.UserType.SECRETARIAT_V3_EDIT_ACCESS,
            User.UserType.SECRETARIAT_PRODUCTION_V1_V2_EDIT_ACCESS,
            User.UserType.SECRETARIAT_PRODUCTION_V3_EDIT_ACCESS,
        ]:
            return queryset
        if user.user_type in [
            User.UserType.AGENCY_SUBMITTER,
            User.UserType.AGENCY_INPUTTER,
            User.UserType.VIEWER,
        ]:
            return queryset.filter(
                Q(agency=user.agency) | Q(meta_project__lead_agency=user.agency)
            )

        return queryset.none()

    def get_queryset(self):
        projects = self.filter_permissions_queryset(Project.objects.really_all())
        project = get_object_or_404(projects, pk=self.kwargs.get("project_id"))
        queryset = ProjectFile.objects.filter(project=project)
        return queryset

    def get_object(self):
        queryset = self.get_queryset()
        obj = get_object_or_404(queryset, pk=self.kwargs.get("id"))
        return obj

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
