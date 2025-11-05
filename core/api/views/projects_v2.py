import urllib

from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from django.db.models import Case, CharField, F, Q, QuerySet, Value, When
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
    HasProjectV2RemoveAssociationAccess,
    HasProjectV2ApproveAccess,
    HasProjectV2RecommendAccess,
    HasProjectV2TransferAccess,
    HasProjectV2EditPlusV3Access,
)
from core.api.serializers.project_v2 import (
    ProjectV2ProjectIncludeFileSerializer,
    ProjectV2FileSerializer,
    ProjectDetailsV2Serializer,
    ProjectListV2Serializer,
    ProjectV2CreateUpdateSerializer,
    ProjectV2EditActualFieldsSerializer,
    ProjectV2EditApprovalFieldsSerializer,
    SerializeProjectFieldHistory,
    HISTORY_DESCRIPTION_UPDATE_ACTUAL_FIELDS,
    HISTORY_DESCRIPTION_POST_EXCOM_UPDATE,
)
from core.api.swagger import FileUploadAutoSchema
from core.models.project import (
    Project,
    ProjectOdsOdp,
    ProjectFile,
)
from core.api.views.projects_mixins import (
    ProjectApproveRejectMixin,
    ProjectAssociationMixin,
    ProjectExportMixin,
    ProjectFileCreateMixin,
    ProjectListPreviousTranchesMixin,
    ProjectRecommendMixin,
    ProjectSendBackToDraftMixin,
    ProjectSubmitMixin,
    ProjectTransferMixin,
    ProjectWithdrawMixin,
)
from core.api.views.utils import log_project_history, get_available_values

# pylint: disable=C0302,R0911,R0904,R1702


def get_blanket_approval_individual_consideration(queryset: QuerySet[Project]):
    values = (
        queryset.order_by("blanket_or_individual_consideration")
        .values_list("blanket_or_individual_consideration", flat=True)
        .distinct()
    )
    list_values = []
    if "blanket" in values:
        list_values.append({"id": "blanket", "name": "Blanket Approval"})
    if "individual" in values:
        list_values.append({"id": "individual", "name": "Individual Consideration"})
    return list_values


def get_meeting_number(queryset: QuerySet[Project]):

    values = (
        queryset.exclude(meeting__isnull=True)
        .order_by("meeting__number")
        .values(
            "meeting_id",
            "meeting__number",
            "meeting__title",
            "meeting__status",
            "meeting__date",
            "meeting__end_date",
        )
        .distinct()
    )
    meetings = [
        {
            "label": value["meeting__number"],
            "value": value["meeting_id"],
            "year": getattr(value["meeting__date"], "year", None),
        }
        for value in values
    ]
    return meetings


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
    ProjectApproveRejectMixin,
    ProjectAssociationMixin,
    ProjectExportMixin,
    ProjectFileCreateMixin,
    ProjectListPreviousTranchesMixin,
    ProjectRecommendMixin,
    ProjectSendBackToDraftMixin,
    ProjectSubmitMixin,
    ProjectTransferMixin,
    ProjectWithdrawMixin,
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
        "metacode",
        "filtered_code",  # Code or empty string if project is not approved
        "cluster__code",
        "tranche",
        "total_fund",
    ]

    search_fields = ["code", "legacy_code", "metacode", "title"]

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
            "field_history",
            "list_filters",
        ]:
            return [HasProjectV2ViewAccess]
        if self.action in ["create"]:
            return [HasProjectV2EditAccess]
        if self.action in [
            "update",
            "partial_update",
            "edit_actual_fields",
        ]:
            return [HasProjectV2EditPlusV3Access]
        if self.action in ["submit"]:
            return [HasProjectV2SubmitAccess]
        if self.action == "associate_projects":
            return [HasProjectV2AssociateProjectsAccess]
        if self.action == "remove_association":
            return [HasProjectV2RemoveAssociationAccess]    
        if self.action in ["recommend", "withdraw", "send_back_to_draft"]:
            return [HasProjectV2RecommendAccess]
        if self.action in ["approve", "reject", "edit_approval_fields"]:
            return [HasProjectV2ApproveAccess]
        if self.action == "transfer":
            return [HasProjectV2TransferAccess]

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

        if self.action in ["edit_actual_fields", "transfer"]:
            queryset.filter(submission_status__name="Approved").exclude(
                status__name__in=["Closed", "Transferred"]
            )
        user = self.request.user
        if user.is_superuser:
            return queryset

        if self.action in ["update", "partial_update", "submit"] or results_for_edit:
            user_has_any_edit_access = _check_if_user_has_edit_access(user)
            if not user_has_any_edit_access:
                return queryset.none()

            allowed_versions = set()
            limit_to_draft = False

            if user.has_perm("core.has_project_v2_draft_edit_access"):
                limit_to_draft = True
                allowed_versions.update([1, 2])

            if user.has_perm("core.has_project_v2_version1_version2_edit_access"):
                limit_to_draft = False
                allowed_versions.update([1, 2])

            is_post_excom_request = self.action == "update" and self.request.data.get(
                "post-excom-update", False
            )

            if user.has_perm("core.has_project_v2_version3_edit_access") or (
                is_post_excom_request
                and user.has_perm("core.has_project_v2_edit_post_excom")
            ):
                limit_to_draft = False
                allowed_versions.add(3)

            if not user.has_perm("core.has_project_v2_edit_approved_access") and not (
                is_post_excom_request
                and user.has_perm("core.has_project_v2_edit_post_excom")
            ):
                queryset = queryset.exclude(
                    submission_status__name__in=[
                        "Approved",
                        "Withdrawn",
                        "Not approved",
                    ]
                )

            queryset_filters = Q()

            if limit_to_draft:
                queryset_filters &= Q(submission_status__name="Draft")

            version_filters = Q()

            if allowed_versions and 3 in allowed_versions:
                version_filters = Q(version__in=allowed_versions) | Q(version__gte=3)

            elif allowed_versions:
                version_filters = Q(version__in=allowed_versions)

            queryset_filters &= version_filters

            queryset = queryset.filter(queryset_filters)

            if is_post_excom_request and not user.has_perm(
                "core.has_project_v2_edit_post_excom"
            ):
                return queryset.none()

        if not user.has_perm("core.can_view_production_projects"):
            queryset = queryset.filter(production=False)

        if user.has_perm("core.can_view_all_agencies"):
            return queryset
        if user.has_perm("core.can_view_only_own_agency"):
            return queryset.filter(
                Q(agency=user.agency)
                | (Q(lead_agency=user.agency) & Q(lead_agency__isnull=False))
            )

        return queryset.none()

    def get_queryset(self):
        if self.action in ["export", "retrieve"]:
            queryset = Project.objects.really_all()
        else:
            queryset = Project.objects.all()
        queryset = self.filter_permissions_queryset(queryset)
        queryset = (
            queryset.select_related(
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
            )
            .prefetch_related(
                "submission_amounts",
                "subsectors",
                "funds",
                "comments",
                "files",
                "subsectors__sector",
                "rbm_measures__measure",
                "ods_odp",
            )
            .annotate(
                filtered_code=Case(
                    When(
                        submission_status__name="Approved",
                        code__isnull=False,
                        then=F("code"),
                    ),
                    default=Value(""),
                    output_field=CharField(),
                )
            )
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
        elif self.action == "transfer":
            return
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

    @action(methods=["GET"], detail=False)
    def list_filters(self, request, *args, **kwargs):
        """
        List available filter values for projects, based on current queryset.
        The same filters as in the main list endpoint should be used here as well for the
        same results.
        """
        queryset: QuerySet[Project] = self.filter_queryset(self.get_queryset())
        result = {
            "country": get_available_values(queryset, "country"),
            "agency": get_available_values(queryset, "agency"),
            "cluster": get_available_values(queryset, "cluster"),
            "project_type": get_available_values(queryset, "project_type"),
            "sector": get_available_values(queryset, "sector"),
            "meeting": get_meeting_number(queryset),
            "submission_status": get_available_values(queryset, "submission_status"),
            "status": get_available_values(queryset, "status"),
            "blanket_approval_individual_consideration": get_blanket_approval_individual_consideration(
                queryset
            ),
        }
        return Response(result)

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
        V2 projects endpoint for updating a project. This endpoint should be used in the
        project editing workflow.
        If the field "post-excom-update" is set to true, the project is updated as a post-excom update,
        which means that the version is increased and a new archived version of the project is created.
        """,
        request_body=ProjectV2CreateUpdateSerializer,
        responses={
            status.HTTP_200_OK: ProjectDetailsV2Serializer,
            status.HTTP_400_BAD_REQUEST: "Bad request",
        },
    )
    def update(self, request, *args, **kwargs):
        post_excom_update = request.data.get("post-excom-update", False)
        if post_excom_update:
            project = self.get_object()
            project.increase_version(request.user)
            log_project_history(
                project,
                request.user,
                HISTORY_DESCRIPTION_POST_EXCOM_UPDATE,
            )
        return super().update(request, *args, **kwargs)

    @action(methods=["GET"], detail=True)
    def field_history(self, request, *args, **kwargs):
        project = self.get_object()
        return Response(
            SerializeProjectFieldHistory.serialize(project),
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

class ProjectV2FileView(
    ProjectFileCreateMixin,
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
            return [HasProjectV2EditPlusV3Access]
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
            limit_to_draft = False

            if user.has_perm("core.has_project_v2_draft_edit_access"):
                limit_to_draft = True
                allowed_versions.update([1, 2])
            if user.has_perm("core.has_project_v2_version1_version2_edit_access"):
                limit_to_draft = False
                allowed_versions.update([1, 2])
            if user.has_perm("core.has_project_v2_version3_edit_access"):
                limit_to_draft = False
                allowed_versions.add(3)

            if not user.has_perm("core.has_project_v2_edit_approved_access"):
                queryset = queryset.exclude(
                    submission_status__name__in=[
                        "Approved",
                        "Withdrawn",
                        "Not approved",
                    ]
                )

            queryset_filters = Q()

            if limit_to_draft:
                queryset_filters &= Q(submission_status__name="Draft")

            version_filters = Q()

            if allowed_versions and 3 in allowed_versions:
                version_filters = Q(version__in=allowed_versions) | Q(version__gte=3)

            elif allowed_versions:
                version_filters = Q(version__in=allowed_versions)

            queryset_filters &= version_filters

            queryset = queryset.filter(queryset_filters)

        if not user.has_perm("core.can_view_production_projects"):
            queryset = queryset.filter(production=False)

        if user.has_perm("core.can_view_all_agencies"):
            return queryset

        if user.has_perm("core.can_view_only_own_agency") and not user.has_perm(
            "core.can_view_all_agencies"
        ):
            return queryset.filter(
                Q(agency=user.agency)
                | (Q(lead_agency=user.agency) & Q(lead_agency__isnull=False))
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
        return self._file_create(
            request,
            dry_run=False,
            *args,
            **kwargs,
        )

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
            limit_to_draft = False

            if user.has_perm("core.has_project_v2_draft_edit_access"):
                limit_to_draft = True
                allowed_versions.update([1, 2])
            if user.has_perm("core.has_project_v2_version1_version2_edit_access"):
                limit_to_draft = False
                allowed_versions.update([1, 2])
            if user.has_perm("core.has_project_v2_version3_edit_access"):
                limit_to_draft = False
                allowed_versions.add(3)

            if not user.has_perm("core.has_project_v2_edit_approved_access"):
                queryset = queryset.exclude(
                    submission_status__name__in=[
                        "Approved",
                        "Withdrawn",
                        "Not approved",
                    ]
                )

            queryset_filters = Q()

            if limit_to_draft:
                queryset_filters &= Q(submission_status__name="Draft")

            version_filters = Q()

            if allowed_versions and 3 in allowed_versions:
                version_filters = Q(version__in=allowed_versions) | Q(version__gte=3)

            elif allowed_versions:
                version_filters = Q(version__in=allowed_versions)

            queryset_filters &= version_filters

            queryset = queryset.filter(queryset_filters)

        if not user.has_perm("core.can_view_production_projects"):
            queryset = queryset.filter(production=False)

        if user.has_perm("core.can_view_all_agencies"):
            return queryset

        if user.has_perm("core.can_view_only_own_agency") and not user.has_perm(
            "core.can_view_all_agencies"
        ):
            return queryset.filter(
                Q(agency=user.agency)
                | (Q(lead_agency=user.agency) & Q(lead_agency__isnull=False))
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


class ProjectFilesValidationView(ProjectFileCreateMixin, APIView):
    permission_classes = [HasProjectV2EditPlusV3Access]

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
        response = self._file_create(
            request,
            dry_run=True,
            *args,
            **kwargs,
        )
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
                | (Q(lead_agency=user.agency) & Q(lead_agency__isnull=False))
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
