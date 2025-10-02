import os

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

from core.api.filters.meta_project import MetaProjectMyaFilter
from core.api.filters.project import MetaProjectFilter, ProjectFilter
from core.api.permissions import HasMetaProjectsEditAccess

from core.api.permissions import (
    HasMetaProjectsViewAccess,
    HasProjectMetaInfoViewAccess,
    HasProjectStatisticsViewAccess,
    HasProjectViewAccess,
    HasProjectEditAccess,
    DenyAll,
)
from core.api.serializers import CountrySerializer
from core.api.serializers.agency import AgencySerializer
from core.api.serializers.project import (
    ProjectCommentCreateSerializer,
    ProjectFundCreateSerializer,
    ProjectOdsOdpCreateSerializer,
    ProjectRbmMeasureCreateSerializer,
    SubmissionAmountCreateSerializer,
)
from core.api.serializers.project_metadata import (
    ProjectClusterSerializer,
    ProjectField,
    ProjectSpecificFieldsSerializer,
    ProjectStatusSerializer,
    ProjectSubmissionStatusSerializer,
    ProjectTypeSerializer,
)
from core.api.serializers.project import (
    ProjectDetailsSerializer,
    ProjectListSerializer,
)
from core.api.serializers.meta_project import MetaProjecMyaSerializer
from core.api.serializers.meta_project import MetaProjecMyaDetailsSerializer
from core.api.serializers.meta_project import MetaProjectFieldSerializer
from core.api.serializers.project_association import MetaProjectSerializer
from core.api.views.projects_export import ProjectsExport
from core.models import Agency
from core.models import Country
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

    permission_classes = [HasMetaProjectsViewAccess]
    queryset = MetaProject.objects.order_by("code", "type")
    filterset_class = MetaProjectFilter
    serializer_class = MetaProjectSerializer


class MetaProjectCountryListView(generics.ListAPIView):
    """
    List meta project countries
    """

    permission_classes = [HasMetaProjectsViewAccess]
    serializer_class = CountrySerializer

    def get_queryset(self):
        meta_projects = MetaProject.objects.filter(
            type=MetaProject.MetaProjectType.MYA,
            projects__submission_status__name="Approved",
        ).distinct()

        return Country.objects.filter(
            project__meta_project__in=meta_projects
        ).distinct()


class MetaProjectClusterListView(generics.ListAPIView):
    """
    List meta project clusters
    """

    permission_classes = [HasMetaProjectsViewAccess]
    serializer_class = ProjectClusterSerializer

    def get_queryset(self):
        meta_projects = MetaProject.objects.filter(
            type=MetaProject.MetaProjectType.MYA,
            projects__submission_status__name="Approved",
        ).distinct()

        return ProjectCluster.objects.filter(
            project__meta_project__in=meta_projects
        ).distinct()


class MetaProjectLeadAgencyListView(generics.ListAPIView):
    """
    List meta project lead agencies
    """

    permission_classes = [HasMetaProjectsViewAccess]
    serializer_class = AgencySerializer

    def get_queryset(self):
        meta_projects = MetaProject.objects.filter(
            type=MetaProject.MetaProjectType.MYA,
            projects__submission_status__name="Approved",
        ).distinct()

        return Agency.objects.filter(metaproject__in=meta_projects).distinct()


class MetaProjectMyaListView(generics.ListAPIView):
    """
    List meta projects available for MYA update.
    """

    permission_classes = [HasMetaProjectsViewAccess]
    serializer_class = MetaProjecMyaSerializer
    filterset_class = MetaProjectMyaFilter

    def get_queryset(self):
        result = (
            MetaProject.objects.filter(
                type=MetaProject.MetaProjectType.MYA,
                projects__submission_status__name="Approved",
            )
            # Maybe exclude if ALL sub-projects Completed OR Transfered.
            # .filter(
            #     Exists(
            #         Project.objects.filter(metaproject=OuterRef("pk")).exclude(
            #             status__name=["Completed", "Transferred"]
            #         )
            #     )
            # )
            .distinct()
        )
        return result


class MetaProjectMyaDetailsViewSet(
    viewsets.GenericViewSet,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
):
    serializer_class = MetaProjecMyaDetailsSerializer
    queryset = MetaProject.objects.all()

    @property
    def permission_classes(self):
        if self.action in ["retrieve"]:
            return [HasMetaProjectsViewAccess]

        return [HasMetaProjectsEditAccess]

    def update(self, request, *args, **kwargs):
        mp = self.get_object()

        serializer = MetaProjectFieldSerializer(mp, data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()

        return Response(
            MetaProjectFieldSerializer(mp).data,
            status=status.HTTP_200_OK,
        )


class ProjectStatusListView(generics.ListAPIView):
    """
    List project status
    """

    permission_classes = [HasProjectMetaInfoViewAccess]
    queryset = ProjectStatus.objects.all()
    serializer_class = ProjectStatusSerializer


class ProjectSubmissionStatusListView(generics.ListAPIView):
    """
    List project submission status
    """

    permission_classes = [HasProjectMetaInfoViewAccess]
    queryset = ProjectSubmissionStatus.objects.all()
    serializer_class = ProjectSubmissionStatusSerializer


class ProjectTypeListView(generics.ListAPIView):
    """
    List project type
    """

    permission_classes = [HasProjectMetaInfoViewAccess]
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

        include_obsoletes = (
            self.request.query_params.get("include_obsoletes", "false").lower()
            == "true"
        )
        if not include_obsoletes:
            queryset = queryset.filter(obsolete=False)
        return queryset

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "cluster_id",
                openapi.IN_QUERY,
                description="Filter project types by cluster ID",
                type=openapi.TYPE_INTEGER,
            ),
            openapi.Parameter(
                "include_obsoletes",
                openapi.IN_QUERY,
                description="Include obsolete types. By default, only non-obsolete types are returned.",
                type=openapi.TYPE_BOOLEAN,
            ),
        ]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class ProjectClusterListView(generics.ListAPIView):
    permission_classes = [HasProjectMetaInfoViewAccess]
    serializer_class = ProjectClusterSerializer

    def get_queryset(self):
        queryset = ProjectCluster.objects.all()
        include_obsoletes = (
            self.request.query_params.get("include_obsoletes", "false").lower()
            == "true"
        )
        if not include_obsoletes:
            queryset = queryset.filter(obsolete=False)
        return queryset.order_by("sort_order")

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "include_obsoletes",
                openapi.IN_QUERY,
                description="Include obsolete clusters. By default, only non-obsolete clusters are returned.",
                type=openapi.TYPE_BOOLEAN,
            ),
        ]
    )
    def get(self, request, *args, **kwargs):
        """
        List project clusters
        """
        return super().get(request, *args, **kwargs)


class ProjectSpecificFieldsListView(generics.RetrieveAPIView):
    """
    Get a tree structure of project cluster types and sectors
    *and the list of required fields for each combination* *to be implemented*.
    """

    permission_classes = [HasProjectMetaInfoViewAccess]
    serializer_class = ProjectSpecificFieldsSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        project_id = self.request.query_params.get("project_id")
        if project_id is not None:
            projects_queryset = Project.objects.really_all()
            project = get_object_or_404(projects_queryset, pk=project_id)
            context["project_submission_status_name"] = project.submission_status.name
        return context

    def get_object(self):
        project_id = self.request.query_params.get("project_id", None)
        include_actuals = (
            self.request.query_params.get("include_actuals", "false").lower() == "true"
        )
        if project_id:
            projects_queryset = Project.objects.really_all()
            project = get_object_or_404(projects_queryset, pk=project_id)
            if (
                project.submission_status
                and project.submission_status.name != "Approved"
            ):
                include_actuals = False
            else:
                include_actuals = True
        if not include_actuals:
            queryset = ProjectSpecificFields.objects.select_related(
                "cluster", "type", "sector"
            ).prefetch_related(
                models.Prefetch(
                    "fields",
                    queryset=ProjectField.objects.filter(is_actual=False).order_by(
                        "sort_order"
                    ),
                )
            )
        else:
            queryset = ProjectSpecificFields.objects.select_related(
                "cluster", "type", "sector"
            ).prefetch_related(
                models.Prefetch(
                    "fields",
                    queryset=ProjectField.objects.order_by("sort_order"),
                )
            )
        return get_object_or_404(
            queryset,
            cluster_id=self.kwargs["cluster_id"],
            type_id=self.kwargs["type_id"],
            sector_id=self.kwargs["sector_id"],
        )

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "project_id",
                openapi.IN_QUERY,
                description="""
                    Giving the project ID allows filtering the fields
                    (projects not approved don't return actual fields).
                """,
                type=openapi.TYPE_INTEGER,
            ),
            openapi.Parameter(
                "include_actuals",
                openapi.IN_QUERY,
                description="Include actual fields in the response. Is ignored if project_id is provided.",
                type=openapi.TYPE_BOOLEAN,
            ),
        ]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


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
        if self.action in ["list", "retrieve", "export", "print"]:
            return [HasProjectViewAccess]
        if self.action in [
            "create",
            "update",
            "partial_update",
            "upload",
        ]:
            return [HasProjectEditAccess]
        return [DenyAll]

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
        if user.has_perm("core.can_view_only_own_agency") and not (
            user.has_perm("core.can_view_all_agencies")
            or user.has_perm("core.can_view_all_agencies_old_project_implementation")
        ):
            # filter projects by agency if user can view only own agency
            queryset = queryset.filter(agency=user.agency)

        if user.has_perm("core.can_view_only_own_country") and not user.has_perm(
            "core.can_view_all_countries"
        ):
            # filter projects by country if user can view only own country
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

    @action(methods=["GET"], detail=False)
    def export(self, *args, **kwargs):
        return ProjectsExport(self).export_xls()

    @action(methods=["GET"], detail=False)
    def print(self, *args, **kwargs):
        return ProjectsExport(self).export_pdf()

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
        vald_perm_inst = Project(
            agency_id=request.data.get("agency_id"),
            country_id=request.data.get("country_id"),
        )
        # TODO: FIX check_objs_permissions
        self.check_object_permissions(request, vald_perm_inst)

        return super().create(request, *args, **kwargs)


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

    permission_classes = [HasProjectEditAccess]
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

    permission_classes = [HasProjectEditAccess]
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

    permission_classes = [HasProjectEditAccess]
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

    permission_classes = [HasProjectEditAccess]
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

    permission_classes = [HasProjectEditAccess]
    queryset = SubmissionAmount.objects.all()
    serializer_class = SubmissionAmountCreateSerializer


class ProjectStatisticsView(generics.ListAPIView):
    """
    API endpoint that allows project statistics to be viewed.
    """

    permission_classes = [HasProjectStatisticsViewAccess]
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

        if user.has_perm("core.can_view_only_own_agency") and not (
            user.has_perm("core.can_view_all_agencies")
            or user.has_perm("core.can_view_all_agencies_old_project_implementation")
        ):
            queryset = queryset.filter(agency=user.agency)
        if user.has_perm("core.can_view_only_own_country") and not user.has_perm(
            "core.can_view_all_countries"
        ):
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
