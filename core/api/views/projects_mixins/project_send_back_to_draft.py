from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema

from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action

from core.models import Project
from core.api.serializers.project_v2 import (
    ProjectListV2Serializer,
    HISTORY_DESCRIPTION_STATUS_CHANGE,
)
from core.models.project_metadata import (
    ProjectSubmissionStatus,
)

from core.api.views.utils import log_project_history


class ProjectSendBackToDraftMixin:
    @action(methods=["POST"], detail=True)
    @swagger_auto_schema(
        operation_description="""
        Send the project back to draft.
        The project is checked for validity (status should be 'Submitted' and version should be 2).
        The status is set to 'Draft', but the version is not changed back to 1.
        """,
        request_body=openapi.Schema(type=openapi.TYPE_OBJECT, properties=None),
        responses={
            status.HTTP_200_OK: ProjectListV2Serializer,
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
        if project.component:
            # If the project is a component, send back components of the project
            projects_to_send_back = Project.objects.filter(
                component=project.component,
                submission_status=project.submission_status,
                version=project.version,
            )
        else:
            # If the project is not a component, only send back the project
            projects_to_send_back = Project.objects.filter(id=project.id)

        draft_submission_status = ProjectSubmissionStatus.objects.get(name="Draft")
        for project_obj in projects_to_send_back:
            project_obj.submission_status = draft_submission_status
            log_project_history(
                project_obj,
                request.user,
                HISTORY_DESCRIPTION_STATUS_CHANGE.format(project_obj.submission_status),
            )
            project_obj.save()
        return Response(
            ProjectListV2Serializer(projects_to_send_back, many=True).data,
            status=status.HTTP_200_OK,
        )
