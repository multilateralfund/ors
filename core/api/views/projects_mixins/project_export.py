from django.http import HttpResponseBadRequest
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import action

from core.api.export.projects_v2_dump import ProjectsV2Dump
from core.api.export.single_project_v2.as_docx import ProjectsV2ProjectExportDocx
from core.api.export.single_project_v2.as_xlsx import ProjectsV2ProjectExport
from core.api.export.single_project_v2.associated_projects_as_xlsx import (
    ProjectsV2AssociatedProjectsExport,
)
from core.api.views.projects_export import ProjectsV2Export
from core.models import Project


class ProjectExportMixin:
    @extend_schema(
        description="""
        V2 projects endpoint for exporting projects.
        """,
        parameters=[
            OpenApiParameter(
                name="project_id",
                location=OpenApiParameter.QUERY,
                description="ID of the project to export. If not provided, all projects will be exported.",
                type=OpenApiTypes.INT,
            ),
            OpenApiParameter(
                name="output_format",
                location=OpenApiParameter.QUERY,
                description="ID of the project to export. If not provided, all projects will be exported.",
                type=OpenApiTypes.STR,
                enum=["xlsx", "docx"],
                default="xlsx",
            ),
            OpenApiParameter(
                name="category",
                location=OpenApiParameter.QUERY,
                type=OpenApiTypes.STR,
                many=True,
                enum=Project.Category.values,
            ),
            OpenApiParameter(
                name="really_all",
                location=OpenApiParameter.QUERY,
                description="Queries ALL projects.",
                type=OpenApiTypes.BOOL,
            ),
        ],
    )
    @action(methods=["GET"], detail=False)
    def export(self, request, *args, **kwargs):
        project_id = request.query_params.get("project_id")
        output_format = request.query_params.get("output_format", "xlsx")
        really_all = request.query_params.get("really_all", "false") == "true"
        if project_id:
            project = self.get_object()
            if output_format == "xlsx":
                return ProjectsV2ProjectExport(project, request.user).export_xls()
            if output_format == "docx":
                return ProjectsV2ProjectExportDocx(project, request.user).export_docx()
        if really_all:
            return ProjectsV2Dump(self).export()
        return ProjectsV2Export(self).export_xls()

    @extend_schema(
        description="""
        V2 projects endpoint for exporting associated projects.
        """,
        parameters=[
            OpenApiParameter(
                name="project_id",
                location=OpenApiParameter.QUERY,
                description="ID of the project to export. If not provided, all projects will be exported.",
                type=OpenApiTypes.INT,
            ),
        ],
    )
    @action(methods=["GET"], detail=False)
    def export_associated_projects(self, request, *args, **kwargs):
        project_id = request.query_params.get("project_id")
        if project_id:
            project = self.get_object()
            return ProjectsV2AssociatedProjectsExport(
                project, request.user
            ).export_xls()
        return HttpResponseBadRequest()
