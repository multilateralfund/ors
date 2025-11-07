from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema

from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action

from core.api.serializers.project_v2 import (
    ProjectDetailsV2Serializer,
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
