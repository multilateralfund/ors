from django.http import HttpResponseBadRequest
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema

from rest_framework.decorators import action

from core.api.export.single_project_v2.associated_projects_as_xlsx import (
    ProjectsV2AssociatedProjectsExport,
)
from core.api.views.projects_export import ProjectsV2Export
from core.api.export.single_project_v2.as_xlsx import ProjectsV2ProjectExport
from core.api.export.single_project_v2.as_docx import ProjectsV2ProjectExportDocx


class ProjectExportMixin:
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
            openapi.Parameter(
                "output_format",
                openapi.IN_QUERY,
                description="ID of the project to export. If not provided, all projects will be exported.",
                type=openapi.TYPE_STRING,
                enum=["xlsx", "docx"],
                default="xlsx",
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
                return ProjectsV2ProjectExport(project, request.user).export_xls()
            if output_format == "docx":
                return ProjectsV2ProjectExportDocx(project, request.user).export_docx()
        return ProjectsV2Export(self).export_xls()

    @swagger_auto_schema(
        operation_description="""
        V2 projects endpoint for exporting associated projects.
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
    def export_associated_projects(self, request, *args, **kwargs):
        project_id = request.query_params.get("project_id")
        if project_id:
            project = self.get_object()
            return ProjectsV2AssociatedProjectsExport(
                project, request.user
            ).export_xls()
        return HttpResponseBadRequest()
