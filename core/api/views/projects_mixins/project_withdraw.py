from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema

from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action

from core.api.serializers.project_v2 import (
    ProjectDetailsV2Serializer,
    HISTORY_DESCRIPTION_WITHDRAW_V3,
)
from core.models.project_metadata import ProjectSubmissionStatus
from core.api.views.utils import log_project_history


class ProjectWithdrawMixin:
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
        project.component = None
        project.save()
        return Response(
            ProjectDetailsV2Serializer(project).data,
            status=status.HTTP_200_OK,
        )
