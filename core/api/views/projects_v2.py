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
    DenyAll,
    HasProjectV2ViewAccess,
    HasProjectV2EditAccess,
    HasProjectV2SubmitAccess,
    HasProjectV2AssociateProjectsAccess,
    HasProjectV2RecommendAccess,
)
from core.api.serializers.project_v2 import (
    ProjectV2SubmitSerializer,
    ProjectV2RecommendSerializer,
    ProjectV2FileSerializer,
    ProjectDetailsV2Serializer,
    ProjectListV2Serializer,
    ProjectV2CreateUpdateSerializer,
    HISTORY_DESCRIPTION_RECOMMEND_V2,
    HISTORY_DESCRIPTION_SUBMIT_V1,
    HISTORY_DESCRIPTION_WITHDRAW_V3,
    HISTORY_DESCRIPTION_STATUS_CHANGE,
)
from core.api.swagger import FileUploadAutoSchema
from core.models.agency import Agency
from core.models.project import (
    MetaProject,
    Project,
    ProjectOdsOdp,
    ProjectFile,
)
from core.models.project_metadata import ProjectSubmissionStatus, ProjectSpecificFields
from core.api.views.utils import log_project_history

from core.api.views.projects_export import ProjectsV2Export


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
        "date_created",
        "meta_project__code",
        "code",
        "cluster__code",
        "tranche",
        "total_fund",
    ]

    search_fields = ["code", "legacy_code", "meta_project__code", "title"]

    @property
    def permission_classes(self):
        if self.action in ["list", "retrieve", "export", "list_previous_tranches"]:
            return [HasProjectV2ViewAccess]
        if self.action in [
            "create",
            "update",
            "partial_update",
        ]:
            return [HasProjectV2EditAccess]
        if self.action in [
            "validate_projects_for_submission",
            "submit",
        ]:
            return [HasProjectV2SubmitAccess]
        if self.action == "associate_projects":
            return [HasProjectV2AssociateProjectsAccess]
        if self.action in ["recommend", "withdraw", "send_back_to_draft"]:
            return [HasProjectV2RecommendAccess]

        return [DenyAll]

    def filter_permissions_queryset(self, queryset):
        """
        Filter the queryset based on the user's permissions.
        """
        user = self.request.user
        if user.is_superuser:
            return queryset

        if user.has_perm("core.can_view_all_agencies"):
            return queryset
        if user.has_perm("core.can_view_only_own_agency"):
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
            "agency",
            "cluster",
            "country",
            "project_type",
            "status",
            "submission_status",
            "sector",
            "meeting",
            "meeting_transf",
            "meta_project",
        ).prefetch_related(
            "coop_agencies",
            "submission_amounts",
            "subsectors",
            "funds",
            "comments",
            "files",
            "subsectors__sector",
            "rbm_measures__measure",
            "ods_odp",
        )
        return queryset

    def get_serializer_class(self):
        serializer = ProjectDetailsV2Serializer
        if self.action in ["list", "export"]:
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
    def export(self, *args, **kwargs):
        return ProjectsV2Export(self).export_xls()

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
        log_project_history(project, request.user, HISTORY_DESCRIPTION_SUBMIT_V1)
        # TODO: Implement MLFS notifications
        return Response(
            ProjectDetailsV2Serializer(project).data,
            status=status.HTTP_200_OK,
        )

    @action(methods=["POST"], detail=False)
    @swagger_auto_schema(
        operation_description="""
        Receives a list of project ids and checks if they are valid for submission.
        A project is valid for submission if it is in 'Draft' status and version 1.
        Also, it checks if the required fields are filled and there is at least one
        file attached to the project.
        """,
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "project_ids": openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Items(type=openapi.TYPE_INTEGER),
                ),
            },
            required=["project_ids", "lead_agency_id"],
        ),
        responses={
            status.HTTP_200_OK: ProjectDetailsV2Serializer,
            status.HTTP_400_BAD_REQUEST: "Bad request",
        },
    )
    def validate_projects_for_submission(self, request, *args, **kwargs):
        """
        Receives a list of project ids and checks if they are valid for submission.
        A project is valid for submission if it is in 'Draft' status and version 1.
        Also, it checks if the required fields are filled and there is at least one
        file attached to the project.
        """
        projects = (
            Project.objects.really_all()
            .filter(id__in=self.request.data.get("project_ids", []))
            .order_by("id")
        )
        data = []
        for project in projects:
            serializer = ProjectV2SubmitSerializer(project, data={}, partial=True)
            if not serializer.is_valid():
                data.append(
                    {
                        "id": project.id,
                        "valid": False,
                        "errors": serializer.errors,
                    }
                )
            else:
                data.append(
                    {
                        "id": project.id,
                        "valid": True,
                        "errors": {},
                    }
                )
        return Response(data, status=status.HTTP_200_OK)

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
        log_project_history(project, request.user, HISTORY_DESCRIPTION_RECOMMEND_V2)
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
        log_project_history(project, request.user, HISTORY_DESCRIPTION_WITHDRAW_V3)
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
        log_project_history(
            project,
            request.user,
            HISTORY_DESCRIPTION_STATUS_CHANGE.format(project.submission_status),
        )
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
                "lead_agency_id": openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description="ID of the lead agency for the meta project.",
                ),
            },
            required=["project_ids", "lead_agency_id"],
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

        lead_agency_id = request.data.get("lead_agency_id", None)
        if not lead_agency_id:
            return Response(
                {"error": "Lead agency is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        lead_agency = get_object_or_404(Agency, pk=lead_agency_id)

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
        meta_project.lead_agency = lead_agency
        meta_project.save()

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

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "include_validation",
                openapi.IN_QUERY,
                description="If set to true, the response will include validation information for the projects.",
                type=openapi.TYPE_BOOLEAN,
            ),
            openapi.Parameter(
                "tranche",
                openapi.IN_QUERY,
                description="The new tranche number given to the project. Used to filter previous tranches. If not provided, tranche will be used from the project.",
                type=openapi.TYPE_INTEGER,
            ),
        ],
        operation_description="List previous tranches of the project.",
    )
    @action(methods=["GET"], detail=True)
    def list_previous_tranches(self, request, *args, **kwargs):
        """
        List previous tranches of the project.
        This is used to get the previous tranche for the project.
        """
        project = self.get_object()
        if not request.query_params.get("tranche"):
            # If tranche is not provided, use the tranche from the project
            tranche = project.tranche
        else:
            tranche = request.query_params.get("tranche")
        try:
            tranche = int(tranche)
        except (ValueError, TypeError):
            previous_tranches = Project.objects.none()
        else:
            previous_tranches = (
                Project.objects.all()
                .exclude(
                    id=project.id,
                )
                .filter(
                    meta_project=project.meta_project,
                    tranche=tranche - 1,
                    submission_status__name="Approved",
                )
            )
            previous_tranches = previous_tranches.select_related(
                "agency",
                "country",
                "project_type",
                "status",
                "submission_status",
                "sector",
            ).prefetch_related(
                "coop_agencies",
                "subsectors",
                "funds",
                "comments",
                "files",
                "subsectors__sector",
            )

        if request.query_params.get("include_validation", "false").lower() == "true":
            # Include validation information for each project
            data = []
            for previous_tranche in previous_tranches:
                serializer_data = ProjectListV2Serializer(previous_tranche).data
                warnings = []
                errors = []
                specific_field = ProjectSpecificFields.objects.filter(
                    cluster=previous_tranche.cluster,
                    type=previous_tranche.project_type,
                    sector=previous_tranche.sector,
                ).first()
                errors = []
                warnings = []
                if specific_field:
                    # at least one actual field should be filled
                    one_field_filled = False
                    for field in specific_field.fields.filter(is_actual=True):
                        if getattr(previous_tranche, field.read_field_name) is not None:
                            one_field_filled = True
                        else:
                            warnings.append(
                                {
                                    "field": field.read_field_name,
                                    "message": f"{field.label} is not filled.",
                                }
                            )
                    if not one_field_filled:
                        errors.append(
                            {
                                "field": "fields",
                                "message": "At least one actual indicator should be filled.",
                            }
                        )
                serializer_data["warnings"] = warnings
                serializer_data["errors"] = errors
                data.append(serializer_data)
            return Response(data, status=status.HTTP_200_OK)
        return Response(
            ProjectListV2Serializer(previous_tranches, many=True).data,
            status=status.HTTP_200_OK,
        )


class FileCreateMixin:
    ACCEPTED_EXTENSIONS = [
        ".pdf",
        ".doc",
        ".docx",
    ]

    def _file_create(self, request, dry_run, *args, **kwargs):
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
        if self.kwargs.get("project_id"):
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
        if dry_run:
            return Response(
                {"message": "Files are valid and ready to be uploaded."},
                status=status.HTTP_201_CREATED,
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


class ProjectV2FileView(
    FileCreateMixin,
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

    @property
    def permission_classes(self):
        if self.request.method in ["GET"]:
            return [HasProjectV2ViewAccess]
        if self.request.method in ["POST", "DELETE"]:
            return [HasProjectV2EditAccess]
        return [DenyAll]

    def filter_permissions_queryset(self, queryset):
        """
        Filter the queryset based on the user's permissions.
        """
        user = self.request.user
        if user.is_superuser:
            return queryset

        if user.has_perm("core.can_view_all_agencies"):
            return queryset

        if user.has_perm("core.can_view_only_own_agency") and not user.has_perm(
            "core.can_view_all_agencies"
        ):
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
        return self._file_create(request, dry_run=False, *args, **kwargs)

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


class ProjectFilesValidationView(FileCreateMixin, APIView):

    permission_classes = [HasProjectV2EditAccess]

    @swagger_auto_schema(
        operation_description="""
        This endpoint is used to validate the files that are being uploaded.
        It checks if the files have valid extensions.
        Returns a 200 status code if the files are valid, otherwise return a 400 status code with an error message.
        """,
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
        response = self._file_create(request, dry_run=True, *args, **kwargs)
        if response.status_code == status.HTTP_201_CREATED:
            return Response(
                {"message": "Files are valid and ready to be uploaded."},
                status=status.HTTP_200_OK,
            )
        return response


class ProjectFilesDownloadView(generics.RetrieveAPIView):
    queryset = ProjectFile.objects.all()
    lookup_field = "id"
    permission_classes = [HasProjectV2ViewAccess]

    def filter_permissions_queryset(self, queryset):
        """
        Filter the queryset based on the user's permissions.
        """
        user = self.request.user
        if user.is_superuser:
            return queryset

        if user.has_perm("core.can_view_all_agencies"):
            return queryset

        if user.has_perm("core.can_view_only_own_agency") and not user.has_perm(
            "core.can_view_all_agencies"
        ):
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
