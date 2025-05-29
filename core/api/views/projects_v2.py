import os
import urllib

from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
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
    ProjectV2SubmitSerializer,
    ProjectV2RecommendSerializer,
    ProjectV2FileSerializer,
    ProjectDetailsV2Serializer,
    ProjectListV2Serializer,
    ProjectV2CreateUpdateSerializer,
)
from core.api.swagger import FileUploadAutoSchema
from core.models.project import (
    MetaProject,
    Project,
    ProjectOdsOdp,
    ProjectFile,
)
from core.models.project_metadata import ProjectSubmissionStatus
from core.models.user import User
from core.api.views.utils import log_project_history


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
        "submission_status__name",
        "status__name",
        "meta_project__code",
        "code",
        "cluster__code",
        "tranche",
        "total_fund",
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
        ]:
            return [
                IsAgencyInputter
                | IsAgencySubmitter
                | IsSecretariatV1V2EditAccess
                | IsSecretariatProductionV1V2EditAccess
            ]
        if self.action in [
            "increase_version",
            "submit",
        ]:
            return [
                IsAgencySubmitter
                | IsSecretariatV1V2EditAccess
                | IsSecretariatProductionV1V2EditAccess
            ]
        if self.action == "associate_projects":
            return [
                IsSecretariatV1V2EditAccess
                | IsSecretariatProductionV1V2EditAccess
                | IsSecretariatV3EditAccess
                | IsSecretariatProductionV3EditAccess
            ]
        if self.action in ["recommend", "withdraw", "send_back_to_draft"]:
            return [IsSecretariatV1V2EditAccess | IsSecretariatProductionV1V2EditAccess]
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
        project.increase_version(request.user)

        return Response(
            ProjectDetailsV2Serializer(project).data,
            status=status.HTTP_200_OK,
        )

    @action(methods=["POST"], detail=True)
    @swagger_auto_schema(
        operation_description="""
        Submit the project for review.
        The project is checked for validity (check version, status and if the required fields are filled).
        If the project is valid, it is marked as submitted and the version is increased, creating an
        archived version of the project.
        The related entries (ProjectOdsOdp, ProjectFund, ProjectRBMMeasure,
        ProjectProgressReport, SubmissionAmount, ProjectComment, ProjectFile)
        are also duplicated and linked to the archived project.
        An email notification is sent to the secretariat team
        to inform them about the new submission. (TO BE IMPLEMENTED)
        """,
        request_body=openapi.Schema(type=openapi.TYPE_OBJECT, properties=None),
        responses={
            status.HTTP_200_OK: ProjectDetailsV2Serializer,
            status.HTTP_400_BAD_REQUEST: "Bad request",
        },
    )
    def submit(self, request, *args, **kwargs):
        """
        Submit the project for review.
        The project is checked for validity (check version, status and if the required fields are filled).
        If the project is valid, it is marked as submitted and the version is increased, creating an
        archived version of the project.
        The related entries (ProjectOdsOdp, ProjectFund, ProjectRBMMeasure,
        ProjectProgressReport, SubmissionAmount, ProjectComment, ProjectFile)
        are also duplicated and linked to the archived project.
        An email notification is sent to the secretariat team
        to inform them about the new submission. (TO BE IMPLEMENTED)
        """
        project = self.get_object()
        serializer = ProjectV2SubmitSerializer(project, data={}, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        project.submission_status = ProjectSubmissionStatus.objects.get(
            name="Submitted"
        )
        project.save()
        project.increase_version(request.user)
        log_project_history(project, request.user, "Project submitted")
        # TODO: Implement MLFS notifications
        return Response(
            ProjectDetailsV2Serializer(project).data,
            status=status.HTTP_200_OK,
        )

    @action(methods=["POST"], detail=True)
    @swagger_auto_schema(
        operation_description="""
        Recommend the project.
        The project is checked for validity (check version, status and if the required fields are filled).
        If the project is valid, it is marked as Recommended and the version is increased, creating an
        archived version of the project.
        The related entries (ProjectOdsOdp, ProjectFund, ProjectRBMMeasure,
        ProjectProgressReport, SubmissionAmount, ProjectComment, ProjectFile)
        are also duplicated and linked to the archived project.
        """,
        request_body=openapi.Schema(type=openapi.TYPE_OBJECT, properties=None),
        responses={
            status.HTTP_200_OK: ProjectDetailsV2Serializer,
            status.HTTP_400_BAD_REQUEST: "Bad request",
        },
    )
    def recommend(self, request, *args, **kwargs):
        """
        This method is not implemented in the V2 API.
        """
        project = self.get_object()
        serializer = ProjectV2RecommendSerializer(
            project, data=request.data, partial=True
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        project.submission_status = ProjectSubmissionStatus.objects.get(
            name="Recommended"
        )
        project.save()
        project.increase_version(request.user)
        log_project_history(project, request.user, "Project recommended")
        return Response(
            ProjectDetailsV2Serializer(project).data,
            status=status.HTTP_200_OK,
        )

    @action(methods=["POST"], detail=True)
    @swagger_auto_schema(
        operation_description="""
        Withdraw the project.
        The project is checked for validity (status should be 'Submitted' and version should be 2).
        If the project is valid, it is marked as Withdrawn.
        """,
        request_body=openapi.Schema(type=openapi.TYPE_OBJECT, properties=None),
        responses={
            status.HTTP_200_OK: ProjectDetailsV2Serializer,
            status.HTTP_400_BAD_REQUEST: "Bad request",
        },
    )
    def withdraw(self, request, *args, **kwargs):
        project = self.get_object()
        if project.submission_status.name != "Submitted" or project.version != 2:
            return Response(
                {
                    "error": "Project can only be withdrawn if it is in 'Submitted' status and version 2."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        project.submission_status = ProjectSubmissionStatus.objects.get(
            name="Withdrawn"
        )
        log_project_history(project, request.user, "Project withdrawn")
        project.save()
        return Response(
            ProjectDetailsV2Serializer(project).data,
            status=status.HTTP_200_OK,
        )

    @action(methods=["POST"], detail=True)
    @swagger_auto_schema(
        operation_description="""
        Send the project back to draft.
        The project is checked for validity (status should be 'Submitted' and version should be 2).
        The status is set to 'Draft', but the version is not changed back to 1.
        """,
        request_body=openapi.Schema(type=openapi.TYPE_OBJECT, properties=None),
        responses={
            status.HTTP_200_OK: ProjectDetailsV2Serializer,
            status.HTTP_400_BAD_REQUEST: "Bad request",
        },
    )
    def send_back_to_draft(self, request, *args, **kwargs):
        project = self.get_object()
        if project.submission_status.name != "Submitted" or project.version != 2:
            return Response(
                {
                    "error": "Project can only be sent back to draft if it is in 'Submitted' status and version 2."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        project.submission_status = ProjectSubmissionStatus.objects.get(name="Draft")
        project.save()
        log_project_history(project, request.user, "Project sent back to draft")
        return Response(
            ProjectDetailsV2Serializer(project).data,
            status=status.HTTP_200_OK,
        )

    @action(methods=["POST"], detail=False)
    @swagger_auto_schema(
        operation_description="""
        Receives a list of project ids and associates them under the same meta project.
        Performs a clean-up of meta projects that have no projects associated with them.
        """,
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "project_ids": openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Items(type=openapi.TYPE_INTEGER),
                ),
            },
            required=["project_ids"],
        ),
        responses={
            status.HTTP_200_OK: ProjectDetailsV2Serializer,
            status.HTTP_400_BAD_REQUEST: "Bad request",
        },
    )
    def associate_projects(self, request, *args, **kwargs):
        project_objs = Project.objects.filter(
            id__in=request.data.get("project_ids", [])
        )

        if len(project_objs) != len(request.data.get("project_ids", [])):
            return Response(
                {"error": "Some project IDs do not exist."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get first meta project that can be found in the project_objs
        meta_project = next(
            (p.meta_project for p in project_objs if p.meta_project), None
        )
        if not meta_project:
            # Create a new meta project if none exists
            meta_project = MetaProject.objects.create()
            # TODO: we will need to select the lead agency in this case

        # Associate all projects with the meta project
        project_objs.update(meta_project=meta_project)

        # Clean up any meta projects that have no projects associated with them

        count = MetaProject.objects.filter(projects__isnull=True).count()
        MetaProject.objects.filter(projects__isnull=True).delete()
        return Response(
            {
                "message": f"""
                    Projects associated with meta project {meta_project.code}.
                    Cleaned up {count} empty meta projects.
                """,
            },
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
