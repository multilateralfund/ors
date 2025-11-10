import urllib

from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema

from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import generics, viewsets, mixins, parsers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from core.api.permissions import (
    DenyAll,
    HasProjectV2ViewAccess,
    HasProjectV2EditAccess,
    HasProjectV2SubmitAccess,
    HasProjectV2EditPlusV3Access,
)
from core.api.serializers.project_v2 import (
    ProjectV2ProjectIncludeFileSerializer,
    ProjectV2FileSerializer,
)

from core.api.swagger import FileUploadAutoSchema
from core.models.project import (
    Project,
    ProjectFile,
)
from core.api.views.projects_mixins import ProjectFileCreateMixin


# pylint: disable=R1710


class ProjectFileV2ViewSet(
    ProjectFileCreateMixin,
    viewsets.GenericViewSet,
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
):
    queryset = ProjectFile.objects.all()
    serializer_class = ProjectV2FileSerializer
    lookup_field = "id"

    @property
    def permission_classes(self):
        if self.action in [
            "download",
            "include_previous_versions",
            "list",
            "retrieve",
        ]:
            return [HasProjectV2ViewAccess]
        if self.action in ["create", "delete"]:
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

        if self.action in ["create", "delete"] or results_for_edit:
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
        if self.action == "include_previous_versions":
            return ProjectV2ProjectIncludeFileSerializer
        if self.action != "create":
            return ProjectV2FileSerializer
        return

    def get_parser_classes(self):
        if self.action == "create":
            return [
                parsers.FormParser,
            ]
        return [parsers.JSONParser]

    def list(self, request, *args, **kwargs):
        project_id = self.kwargs.get("project_id")
        if not project_id:
            return Response(
                {
                    "detail": "project_id is required in the URL path (e.g. /projects/<project_id>/files/)."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # get_queryset will validate the project exists and apply permission filters
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
            ),
            openapi.Parameter(
                name="metadata",
                in_=openapi.IN_FORM,
                type=openapi.TYPE_STRING,
                required=True,
                description=(
                    """
                    JSON metadata string.(map by filename):
                        {
                            "test_document_1.xlsx": "main_submission",
                            "test_document_2.xlsx": "final_proposal"
                        }
                """
                ),
            ),
        ],
    )
    def create(self, request, *args, **kwargs):
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
    @action(methods=["DELETE"], detail=False)
    def delete(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        file_ids = request.data.get("file_ids")
        queryset.filter(id__in=file_ids).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(methods=["GET"], detail=True)
    def download(self, request, *args, **kwargs):
        obj = self.get_object()
        response = HttpResponse(
            obj.file.read(), content_type="application/octet-stream"
        )
        file_name = urllib.parse.quote(obj.filename)
        response["Content-Disposition"] = (
            f"attachment; filename*=UTF-8''{file_name}; filename=\"{file_name}\""
        )
        return response

    @action(methods=["GET"], detail=False)
    def include_previous_versions(self, request, *args, **kwargs):
        """
        API endpoint returns a the list of files, grouped by project and version.
        Includes given project and its previous versions.
        """

        projects = self.filter_permissions_queryset(Project.objects.really_all())
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
        serializer = self.get_serializer(projects, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


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

    def get_parser_classes(self):
        if self.request.method == "POST":
            return [
                parsers.FormParser,
            ]
        return [parsers.JSONParser]

    @swagger_auto_schema(
        deprecated=True,
    )
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
        deprecated=True,
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
        deprecated=True,
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

    @swagger_auto_schema(
        deprecated=True,
    )
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
            ),
            openapi.Parameter(
                name="metadata",
                in_=openapi.IN_FORM,
                type=openapi.TYPE_STRING,
                required=True,
                description=(
                    """
                    JSON metadata string.(map by filename):
                        {
                            "test_document_1.xlsx": "main_submission",
                            "test_document_2.xlsx": "final_proposal"
                        }
                """
                ),
            ),
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

    @swagger_auto_schema(
        deprecated=True,
    )
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


class FileTypeView(APIView):
    """
    View to return a list of all ProjectFile FileTypes choices
    """

    def get(self, request, *args, **kwargs):
        choices = ProjectFile.FileType.choices
        return Response(choices)
