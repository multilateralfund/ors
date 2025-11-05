from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema

from django.db.models import Q
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action


from core.api.serializers.project_v2 import (
    ProjectV2SubmitSerializer,
    ProjectDetailsV2Serializer,
    ProjectListV2Serializer,
)
from core.models.agency import Agency
from core.models.project import (
    MetaProject,
    Project,
)


class ProjectAssociationMixin:

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
        all_meta_projects = [x.meta_project for x in project_objs if x.meta_project]

        meta_project = all_meta_projects[0] if all_meta_projects else None

        if not meta_project:
            # Create a new meta project if none exists
            meta_project = MetaProject.objects.create()

        # Associate all projects with the meta project
        project_objs.update(meta_project=meta_project)
        for project in project_objs:
            project.lead_agency = lead_agency
            project.save()

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

    @action(methods=["POST"], detail=True)
    @swagger_auto_schema(
        operation_description="""
        Receives a project id and removes it from its meta project association.
        If the meta project has no more associated projects after removal,
        it will be deleted.
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
        
        meta_project = project.meta_project
        project.meta_project = None
        project.save()

        if not meta_project.projects.exists():
            meta_project.delete()

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
        project_filters = Q()
        if project.meta_project:
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

