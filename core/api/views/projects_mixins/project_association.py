from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema

from django.db.models import Q

from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action


from core.api.serializers.project_association import AssociateProjectSerializer
from core.api.serializers.project_v2 import (
    ProjectV2RecommendSerializer,
    ProjectV2SubmitSerializer,
    ProjectDetailsV2Serializer,
    ProjectListV2Serializer,
    HISTORY_ASSOCIATION_MADE,
)
from core.api.views.utils import log_project_history
from core.models.project import (
    MetaProject,
    Project,
)
from core.utils import get_project_sub_code


class ProjectAssociationMixin:

    @action(methods=["POST"], detail=False)
    @swagger_auto_schema(
        operation_description="""
        Receives a list of project ids and associates them under the same meta project.
        """,
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "projects_to_associate": openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Items(type=openapi.TYPE_INTEGER),
                    description="""
                        List of project IDs to associate under the same meta project.
                        If any of the projects have a meta project, it will be used for the association.
                        If none of the projects have a meta project, a new meta project will be created.
                        If multiple projects have different meta projects, the value given in the
                        meta_project_id field will be used to associate all projects to that meta project.
                    """,
                ),
                "meta_project_id": openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description="""
                        ID of the meta project to associate the projects to.
                        If not provided, and none of the projects have a meta project,
                        a new meta project will be created.
                    """,
                ),
                "lead_agency_id": openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description="""
                        ID of the lead agency to be used in the projects.
                        TBD: should this be updated in the lead agency of the metaproject as well?
                        Right now the field is not used anymore.
                    """,
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
        data = AssociateProjectSerializer(data=request.data)
        if not data.is_valid():
            return Response(data.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = data.validated_data
        meta_project = validated_data.get("meta_project", None)
        if not meta_project:
            project_category = validated_data["projects"].first().category
            country = validated_data["projects"].first().country
            metacode = validated_data["projects"].first().metacode
            meta_project = MetaProject.objects.create(
                umbrella_code=metacode,
                country=country,
                cluster=validated_data["projects"].first().cluster,
                type=project_category,
            )
        else:
            metacode = meta_project.umbrella_code

        for project in validated_data["projects"]:
            old_project_code = project.code
            old_project_metacode = project.metacode
            project.metacode = metacode
            project.code = get_project_sub_code(
                project.country,
                project.cluster,
                project.agency,
                project.project_type,
                project.sector,
                project.meeting,
                project.transfer_meeting,
                project.serial_number,
                project.metacode,
            )
            project.meta_project = meta_project
            project.lead_agency = validated_data["lead_agency"]
            project.save()
            log_project_history(
                project,
                request.user,
                HISTORY_ASSOCIATION_MADE.format(
                    meta_project.umbrella_code,
                    old_project_code,
                    project.code,
                    old_project_metacode,
                    project.metacode,
                ),
            )

        return Response(
            {
                "id": meta_project.id,
                "umbrella_code": meta_project.umbrella_code,
            },
            status=status.HTTP_200_OK,
        )

    @action(methods=["POST"], detail=True)
    @swagger_auto_schema(
        operation_description="""
        Receives a project id and removes it from its meta project association.
        """,
        request_body=openapi.Schema(type=openapi.TYPE_OBJECT, properties=None),
        responses={
            status.HTTP_200_OK: ProjectDetailsV2Serializer,
            status.HTTP_400_BAD_REQUEST: "Bad request",
        },
    )
    def remove_association(self, request, *args, **kwargs):
        project = self.get_object()

        if not project.meta_project:
            return Response(
                {"error": "Project is not associated with any meta project."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        project.meta_project = None
        project.save()

        return Response(
            ProjectDetailsV2Serializer(project).data,
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
                    "* 'only_project': only the current project."
                ),
                type=openapi.TYPE_STRING,
                enum=["all", "only_components", "exclude_components", "only_project"],
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
        project_filters = Q()
        if project.meta_project:
            if project.component:
                # If the project has a component, some of the components might not
                # be approved, thus they would not have the meta project set.
                project_filters &= Q(
                    Q(meta_project=project.meta_project)
                    | Q(component=project.component)
                )
            else:
                project_filters &= Q(meta_project=project.meta_project)
        elif project.component is not None:
            project_filters &= Q(component=project.component)
        else:
            project_filters &= Q(id=project.id)

        associated_projects = Project.objects.filter(project_filters)
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
                # If the project is not a component, return only itself
                associated_projects = Project.objects.filter(id=project.id)
            else:
                associated_projects = associated_projects.filter(
                    component=project.component
                )
        elif included_entries == "exclude_components" and project.component:
            associated_projects = associated_projects.exclude(
                component=project.component
            )
        elif included_entries == "only_project":
            associated_projects = Project.objects.filter(id=project.id)

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
            if project.submission_status.name == "Draft":
                # Use submit serializer
                validation_serializer_class = ProjectV2SubmitSerializer
            else:
                # Use recommended serializer
                validation_serializer_class = ProjectV2RecommendSerializer
            data = []
            for associated_project in associated_projects:
                project_data = ProjectListV2Serializer(
                    associated_project, context=context
                ).data
                serializer = validation_serializer_class(
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
