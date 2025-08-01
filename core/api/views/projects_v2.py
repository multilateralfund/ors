import os
import urllib

from constance import config
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
    DenyAll,
    HasProjectV2ViewAccess,
    HasProjectV2EditAccess,
    HasProjectV2SubmitAccess,
    HasProjectV2AssociateProjectsAccess,
    HasProjectV2ApproveAccess,
    HasProjectV2RecommendAccess,
)
from core.api.serializers.project_v2 import (
    ProjectV2SubmitSerializer,
    ProjectV2RecommendSerializer,
    ProjectV2ProjectIncludeFileSerializer,
    ProjectV2FileSerializer,
    ProjectDetailsV2Serializer,
    ProjectListV2Serializer,
    ProjectV2CreateUpdateSerializer,
    ProjectV2EditActualFieldsSerializer,
    ProjectV2EditApprovalFieldsSerializer,
    HISTORY_DESCRIPTION_UPDATE_ACTUAL_FIELDS,
    HISTORY_DESCRIPTION_RECOMMEND_V2,
    HISTORY_DESCRIPTION_REJECT_V3,
    HISTORY_DESCRIPTION_APPROVE_V3,
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
from core.models.project_metadata import (
    ProjectStatus,
    ProjectSubmissionStatus,
    ProjectSpecificFields,
)
from core.tasks import send_project_submission_notification
from core.api.views.utils import log_project_history

from core.api.views.projects_export import ProjectsV2Export
from core.api.views.project_v2_export import ProjectsV2ProjectExport
from core.api.views.project_v2_export import ProjectsV2ProjectExportDocx

# pylint: disable=C0302,R0911,R0904,R1702


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

    def get_serializer_context(self):
        context = super().get_serializer_context()
        # get the queryset for edit permissions to set editable on serializer
        projects_edit_queryset = self.filter_permissions_queryset(
            Project.objects.really_all(), results_for_edit=True
        )
        context["edit_queryset_ids"] = set(
            projects_edit_queryset.values_list("id", flat=True)
        )
        return context

    @property
    def permission_classes(self):
        if self.action in [
            "list",
            "retrieve",
            "export",
            "list_previous_tranches",
            "list_associated_projects",
        ]:
            return [HasProjectV2ViewAccess]
        if self.action in [
            "create",
            "update",
            "partial_update",
            "edit_actual_fields",
        ]:
            return [HasProjectV2EditAccess]
        if self.action in [
            "submit",
        ]:
            return [HasProjectV2SubmitAccess]
        if self.action == "associate_projects":
            return [HasProjectV2AssociateProjectsAccess]
        if self.action in ["recommend", "withdraw", "send_back_to_draft"]:
            return [HasProjectV2RecommendAccess]
        if self.action in ["approve", "reject", "edit_approval_fields"]:
            return [HasProjectV2ApproveAccess]

        return [DenyAll]

    def filter_permissions_queryset(self, queryset, results_for_edit=False):
        """
        Filter the queryset based on the user's permissions.
        """

        def _check_if_user_has_edit_access(user):
            return (
                HasProjectV2EditAccess().has_permission(self.request, self)
                or HasProjectV2SubmitAccess().has_permission(self.request, self)
                or user.has_perm("core.has_project_v2_version3_edit_access")
            )

        user = self.request.user
        if user.is_superuser:
            return queryset

        if self.action in ["edit_actual_fields"]:
            queryset.filter(submission_status__name="Approved")
        if self.action in ["update", "partial_update", "submit"] or results_for_edit:
            user_has_any_edit_access = _check_if_user_has_edit_access(user)
            if not user_has_any_edit_access:
                return queryset.none()
            allowed_versions = set()
            queryset_filters = {}
            if user.has_perm("core.has_project_v2_draft_edit_access"):
                queryset_filters["submission_status__name"] = "Draft"
                allowed_versions.update([1, 2])
            if user.has_perm("core.has_project_v2_version1_version2_edit_access"):
                queryset_filters.pop("submission_status__name", None)
                allowed_versions.update([1, 2])
            if user.has_perm("core.has_project_v2_version3_edit_access"):

                queryset_filters.pop("submission_status__name", None)
                allowed_versions.add(3)
            if not user.has_perm("core.has_project_v2_edit_approved_access"):
                queryset = queryset.exclude(
                    submission_status__name__in=[
                        "Approved",
                        "Withdrawn",
                        "Not approved",
                    ]
                )

            if allowed_versions:
                queryset_filters["version__in"] = list(allowed_versions)
            queryset = queryset.filter(**queryset_filters)

        if not user.has_perm("core.can_view_production_projects"):
            queryset = queryset.filter(production=False)

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

    def get_object(self):
        if self.action == "export":
            project_id = self.request.query_params.get("project_id")
            return get_object_or_404(self.get_queryset(), id=project_id)
        return super().get_object()

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
        project, warnings = serializer.save(request=request)
        response_data = ProjectDetailsV2Serializer(project).data
        headers = self.get_success_headers(response_data)
        response_data["warnings"] = warnings
        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)

    @swagger_auto_schema(
        operation_description="""
        V2 projects endpoint for exporting projects.
        """,
        manual_parameters=[
            openapi.Parameter(
                "project_id",
                openapi.IN_QUERY,
                description="ID of the project to export. If not provided, all projects will be exported.",
                type=openapi.TYPE_INTEGER,
            ),
        ],
    )
    @action(methods=["GET"], detail=False)
    def export(self, request, *args, **kwargs):
        project_id = request.query_params.get("project_id")
        output_format = request.query_params.get("output_format", "xlsx")

        if project_id:
            project = self.get_object()
            if output_format == "xlsx":
                return ProjectsV2ProjectExport(project).export_xls()
            if output_format == "docx":
                return ProjectsV2ProjectExportDocx(project, request.user).export_docx()
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
        Submits the project and its components projects for review.
        The projects are checked for validity (check version, status and if the required fields are filled).
        Previous tranches of the projects (if they exist) are checked if at least one actual field is filled.
        If all the projects are valid, they are marked as submitted and the version is increased, creating
        archived versions of the projects.
        The related entries (ProjectOdsOdp, ProjectFund, ProjectRBMMeasure,
        ProjectProgressReport, SubmissionAmount, ProjectComment, ProjectFile)
        are also duplicated and linked to the archived project.
        An email notification is sent to the secretariat team
        to inform them about the new submission. (TO BE IMPLEMENTED)
        """
        project = self.get_object()

        associated_projects = Project.objects.filter(
            meta_project=project.meta_project,
            submission_status=project.submission_status,
        )

        if project.component:
            # If the project is a component, include only components of the project
            associated_projects = associated_projects.filter(
                component=project.component,
            )
        else:
            # If the project is not a component, keep only the main project
            associated_projects = associated_projects.filter(id=project.id)

        associated_projects = sorted(
            associated_projects, key=lambda p: 0 if p.id == project.id else 1
        )

        has_errors = False
        data = []
        for associated_project in associated_projects:
            project_data = {}
            project_data["id"] = associated_project.id
            project_data["title"] = associated_project.title
            project_data["errors"] = {}
            serializer = ProjectV2SubmitSerializer(
                associated_project, data={}, partial=True
            )
            if not serializer.is_valid():
                has_errors = True
                project_data["errors"] = serializer.errors
            data.append(project_data)
        if has_errors:
            return Response(data, status=status.HTTP_400_BAD_REQUEST)

        submission_status = ProjectSubmissionStatus.objects.get(name="Submitted")
        with transaction.atomic():
            for associated_project in associated_projects:
                associated_project.submission_status = submission_status
                associated_project.save()
                if associated_project.version == 1:
                    # Some v2 projects may be returned to Draft and for those the
                    # version should not be increased
                    associated_project.increase_version(request.user)
                log_project_history(
                    associated_project, request.user, HISTORY_DESCRIPTION_SUBMIT_V1
                )
        # Send email notification to the secretariat team
        if config.SEND_MAIL:
            send_project_submission_notification.delay(
                [project.id for project in associated_projects]
            )

        return Response(
            ProjectListV2Serializer(associated_projects, many=True).data,
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
        Reject the project.
        The project is checked for validity (status should be 'Recommended' and version should be 3).
        If the project is valid, it is marked as Not approved.
        """,
        request_body=openapi.Schema(type=openapi.TYPE_OBJECT, properties=None),
        responses={
            status.HTTP_200_OK: ProjectDetailsV2Serializer,
            status.HTTP_400_BAD_REQUEST: "Bad request",
        },
    )
    def reject(self, request, *args, **kwargs):
        project = self.get_object()
        if project.submission_status.name != "Recommended" or project.version != 3:
            return Response(
                {
                    "error": """Project's submission status can be set as 'Not approved' only """
                    """if the project is in 'Recommended' status and version 3."""
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        project.submission_status = ProjectSubmissionStatus.objects.get(
            name="Not approved"
        )
        log_project_history(project, request.user, HISTORY_DESCRIPTION_REJECT_V3)
        project.save()
        return Response(
            ProjectDetailsV2Serializer(project).data,
            status=status.HTTP_200_OK,
        )

    @action(methods=["POST"], detail=True)
    @swagger_auto_schema(
        operation_description="""
        Approve the project.
        The project is checked for validity (status should be 'Recommended' and version should be 3).
        The project is checked if the mandatory approval fields are filled.
        If the project is valid, it is marked as Approved.
        """,
        request_body=openapi.Schema(type=openapi.TYPE_OBJECT, properties=None),
        responses={
            status.HTTP_200_OK: ProjectDetailsV2Serializer,
            status.HTTP_400_BAD_REQUEST: "Bad request",
        },
    )
    def approve(self, request, *args, **kwargs):
        project = self.get_object()
        context = self.get_serializer_context()
        context["enforce_validation"] = True
        serializer = ProjectV2EditApprovalFieldsSerializer(
            project, data=request.data, partial=True, context=context
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        if project.submission_status.name != "Recommended" or project.version != 3:
            return Response(
                {
                    "error": """Project can be approved only """
                    """if the project is in 'Recommended' status and version 3."""
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        project.submission_status = ProjectSubmissionStatus.objects.get(name="Approved")
        project.status = ProjectStatus.objects.get(code="ONG")
        log_project_history(project, request.user, HISTORY_DESCRIPTION_APPROVE_V3)
        project.save()
        return Response(
            ProjectDetailsV2Serializer(project).data,
            status=status.HTTP_200_OK,
        )

    @action(methods=["PUT"], detail=True)
    @swagger_auto_schema(
        operation_description="""
        Allows editing only the actual fields of the project. Available only for 'Approved' projects.
        """,
        request_body=ProjectV2EditActualFieldsSerializer,
        responses={
            status.HTTP_200_OK: ProjectDetailsV2Serializer,
            status.HTTP_400_BAD_REQUEST: "Bad request",
        },
    )
    def edit_actual_fields(self, request, *args, **kwargs):
        project = self.get_object()
        serializer = ProjectV2EditActualFieldsSerializer(
            project, data=request.data, partial=True
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        log_project_history(
            project, request.user, HISTORY_DESCRIPTION_UPDATE_ACTUAL_FIELDS
        )

        return Response(
            ProjectDetailsV2Serializer(project).data,
            status=status.HTTP_200_OK,
        )

    @action(methods=["PUT"], detail=True)
    @swagger_auto_schema(
        operation_description="""
        Allows editing only the approval fields of the project.
        """,
        request_body=ProjectV2EditApprovalFieldsSerializer,
        responses={
            status.HTTP_200_OK: ProjectDetailsV2Serializer,
            status.HTTP_400_BAD_REQUEST: "Bad request",
        },
    )
    def edit_approval_fields(self, request, *args, **kwargs):
        project = self.get_object()
        serializer = ProjectV2EditApprovalFieldsSerializer(
            project,
            data=request.data,
            partial=True,
            context=self.get_serializer_context(),
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        log_project_history(
            project, request.user, HISTORY_DESCRIPTION_UPDATE_ACTUAL_FIELDS
        )
        project.refresh_from_db()
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
        projects = self.filter_permissions_queryset(Project.objects.all())
        project_objs = projects.filter(id__in=request.data.get("project_ids", []))

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
                description="""
                    The new tranche number given to the project.
                    Used to filter previous tranches.
                    If not provided, tranche will be used from the project.
                """,
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

        context = self.get_serializer_context()
        if request.query_params.get("include_validation", "false").lower() == "true":
            # Include validation information for each project
            data = []
            for previous_tranche in previous_tranches:
                serializer_data = ProjectListV2Serializer(
                    previous_tranche, context=context
                ).data
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
                    fields = specific_field.fields.filter(is_actual=True)
                    if fields.exists():
                        one_field_filled = False
                        for field in fields:
                            if (
                                getattr(previous_tranche, field.read_field_name)
                                is not None
                            ):
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
            ProjectListV2Serializer(previous_tranches, many=True, context=context).data,
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
                "include_project",
                openapi.IN_QUERY,
                description="If set to true, the response will include the project details.",
                type=openapi.TYPE_BOOLEAN,
            ),
            openapi.Parameter(
                "included_entries",
                openapi.IN_QUERY,
                description=(
                    "Filter associated projects by 'component' status.\n"
                    "* 'all' (default): all associated projects; components and non-components;\n"
                    "* 'only_components': only component projects;\n"
                    "* 'exclude_components': exclude component projects.\n"
                ),
                type=openapi.TYPE_STRING,
                enum=["all", "only_components", "exclude_components"],
            ),
            openapi.Parameter(
                "filter_by_project_status",
                openapi.IN_QUERY,
                description="""
                    If set to true, the response will include only projects with
                    the same submission status as the current project.
                """,
                type=openapi.TYPE_BOOLEAN,
            ),
        ],
        operation_description="""
            List all projects associated with the meta project, with the
            option to retrieve components, non-components or all.
            This endpoint can be used to get all projects associated with the meta project.
        """,
    )
    @action(methods=["GET"], detail=True)
    def list_associated_projects(self, request, *args, **kwargs):
        """
        List all projects associated with the meta project, with the
        option to retrieve components, non-components or all.
        This endpoint can be used to get all projects associated with the meta project.
        """
        project = self.get_object()
        if not project.meta_project:
            return Project.objects.none()
        associated_projects = Project.objects.filter(
            meta_project=project.meta_project,
        )
        if (
            request.query_params.get("filter_by_project_status", "false").lower()
            == "true"
        ):
            associated_projects = associated_projects.filter(
                submission_status=project.submission_status
            )
        included_entries = request.query_params.get("included_entries", "all").lower()
        if included_entries == "only_components":
            if not project.component:
                # If the project is not a component, return an empty queryset
                associated_projects = Project.objects.filter(id=project.id)
            else:
                associated_projects = associated_projects.filter(
                    component=project.component
                )
        elif included_entries == "exclude_components":
            if project.component:
                associated_projects = associated_projects.exclude(
                    component=project.component
                )

        if not request.query_params.get("include_project", "false").lower() == "true":
            associated_projects = associated_projects.exclude(
                id=project.id,
            )
        else:
            # If include_project is true, set project as the first item in the list
            associated_projects = sorted(
                associated_projects, key=lambda p: 0 if p.id == project.id else 1
            )
        context = self.get_serializer_context()
        if request.query_params.get("include_validation", "false").lower() == "true":
            # Include validation information for each project
            data = []
            for associated_project in associated_projects:
                project_data = ProjectListV2Serializer(
                    associated_project, context=context
                ).data
                serializer = ProjectV2SubmitSerializer(
                    associated_project, data={}, partial=True
                )
                if not serializer.is_valid():
                    project_data["errors"] = serializer.errors
                else:
                    project_data["errors"] = {}
                data.append(project_data)

            return Response(data, status=status.HTTP_200_OK)
        return Response(
            ProjectListV2Serializer(
                associated_projects, many=True, context=context
            ).data,
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

    def get_serializer_context(self):
        context = super().get_serializer_context()
        # get the queryset for edit permissions to set editable on serializer
        projects_edit_queryset = self.filter_permissions_queryset(
            Project.objects.really_all(), results_for_edit=True
        )

        edit_queryset = ProjectFile.objects.filter(project__in=projects_edit_queryset)
        context["edit_queryset_ids"] = set(edit_queryset.values_list("id", flat=True))
        return context

    def filter_permissions_queryset(self, queryset, results_for_edit=False):
        """
        Filter the queryset based on the user's permissions.
        """

        def _check_if_user_has_edit_access(user):
            return (
                HasProjectV2EditAccess().has_permission(self.request, self)
                or HasProjectV2SubmitAccess().has_permission(self.request, self)
                or user.has_perm("core.has_project_v2_version3_edit_access")
            )

        user = self.request.user
        if user.is_superuser:
            return queryset

        if self.request.method in ["POST", "DELETE"] or results_for_edit:
            user_has_any_edit_access = _check_if_user_has_edit_access(user)
            if not user_has_any_edit_access:
                return queryset.none()
            allowed_versions = set()
            queryset_filters = {}

            if user.has_perm("core.has_project_v2_draft_edit_access"):
                queryset_filters["submission_status__name"] = "Draft"
                allowed_versions.update([1, 2])
            if user.has_perm("core.has_project_v2_version1_version2_edit_access"):
                queryset_filters.pop("submission_status__name", None)
                allowed_versions.update([1, 2])
            if user.has_perm("core.has_project_v2_version3_edit_access"):
                queryset_filters.pop("submission_status__name", None)
                allowed_versions.add(3)

            if not user.has_perm("core.has_project_v2_edit_approved_access"):
                queryset = queryset.exclude(
                    submission_status__name__in=[
                        "Approved",
                        "Withdrawn",
                        "Not approved",
                    ]
                )

            if allowed_versions:
                queryset_filters["version__in"] = list(allowed_versions)
            queryset = queryset.filter(**queryset_filters)

        if not user.has_perm("core.can_view_production_projects"):
            queryset = queryset.filter(production=False)

        if user.has_perm("core.can_view_all_agencies"):
            return queryset

        if user.has_perm("core.can_view_only_own_agency") and not user.has_perm(
            "core.can_view_all_agencies"
        ):
            return queryset.filter(
                Q(agency=user.agency)
                | (
                    Q(meta_project__lead_agency=user.agency)
                    & Q(meta_project__lead_agency__isnull=False)
                )
            )
        return queryset.none()

    def get_queryset(self, results_for_edit=False):
        projects = self.filter_permissions_queryset(
            Project.objects.really_all(), results_for_edit=results_for_edit
        )
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


class ProjectV2FileIncludePreviousVersionsView(
    mixins.ListModelMixin,
    generics.GenericAPIView,
):
    """
    API endpoint returns a the list of files, grouped by project and version.
    Includes given project and its previous versions.
    """

    queryset = Project.objects.really_all()
    serializer_class = ProjectV2ProjectIncludeFileSerializer
    permission_classes = [HasProjectV2ViewAccess]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        # get the queryset for edit permissions to set editable on serializer
        projects_edit_queryset = self.filter_permissions_queryset(
            Project.objects.really_all(), results_for_edit=True
        )

        edit_queryset = ProjectFile.objects.filter(project__in=projects_edit_queryset)
        context["edit_queryset_ids"] = set(edit_queryset.values_list("id", flat=True))
        return context

    def filter_permissions_queryset(self, queryset, results_for_edit=False):
        """
        Filter the queryset based on the user's permissions.
        """

        def _check_if_user_has_edit_access(user):
            return (
                HasProjectV2EditAccess().has_permission(self.request, self)
                or HasProjectV2SubmitAccess().has_permission(self.request, self)
                or user.has_perm("core.has_project_v2_version3_edit_access")
            )

        user = self.request.user
        if user.is_superuser:
            return queryset

        if results_for_edit:
            user_has_any_edit_access = _check_if_user_has_edit_access(user)
            if not user_has_any_edit_access:
                return queryset.none()
            allowed_versions = set()
            queryset_filters = {}

            if user.has_perm("core.has_project_v2_draft_edit_access"):
                queryset_filters["submission_status__name"] = "Draft"
                allowed_versions.update([1, 2])
            if user.has_perm("core.has_project_v2_version1_version2_edit_access"):
                queryset_filters.pop("submission_status__name", None)
                allowed_versions.update([1, 2])
            if user.has_perm("core.has_project_v2_version3_edit_access"):
                queryset_filters.pop("submission_status__name", None)
                allowed_versions.add(3)

            if not user.has_perm("core.has_project_v2_edit_approved_access"):
                queryset = queryset.exclude(
                    submission_status__name__in=[
                        "Approved",
                        "Withdrawn",
                        "Not approved",
                    ]
                )

            if allowed_versions:
                queryset_filters["version__in"] = list(allowed_versions)
            queryset = queryset.filter(**queryset_filters)

        if not user.has_perm("core.can_view_production_projects"):
            queryset = queryset.filter(production=False)

        if user.has_perm("core.can_view_all_agencies"):
            return queryset

        if user.has_perm("core.can_view_only_own_agency") and not user.has_perm(
            "core.can_view_all_agencies"
        ):
            return queryset.filter(
                Q(agency=user.agency)
                | (
                    Q(meta_project__lead_agency=user.agency)
                    & Q(meta_project__lead_agency__isnull=False)
                )
            )
        return queryset.none()

    def get_queryset(self, results_for_edit=False):
        projects = self.filter_permissions_queryset(
            Project.objects.really_all(), results_for_edit=results_for_edit
        )
        project = get_object_or_404(projects, pk=self.kwargs.get("project_id"))

        if project.latest_project:
            projects = projects.filter(
                latest_project=project.latest_project, version__lte=project.version
            )
        else:
            projects = projects.filter(
                Q(latest_project=project) | Q(id=project.id)
            ).order_by("-version")

        projects.prefetch_related(
            "files",
        )
        return projects

    def get(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


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

        if not user.has_perm("core.can_view_production_projects"):
            queryset = queryset.filter(production=False)

        if user.has_perm("core.can_view_all_agencies"):
            return queryset

        if user.has_perm("core.can_view_only_own_agency") and not user.has_perm(
            "core.can_view_all_agencies"
        ):
            return queryset.filter(
                Q(agency=user.agency)
                | (
                    Q(meta_project__lead_agency=user.agency)
                    & Q(meta_project__lead_agency__isnull=False)
                )
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
