from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema

from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action

from core.api.serializers.project_v2 import (
    ProjectDetailsV2Serializer,
    ProjectV2EditApprovalFieldsSerializer,
    HISTORY_DESCRIPTION_REJECT_V3,
    HISTORY_DESCRIPTION_APPROVE_V3,
)
from core.models.project_metadata import (
    ProjectStatus,
    ProjectSubmissionStatus,
)
from core.api.views.utils import log_project_history
from core.utils import post_approval_changes


class ProjectApproveRejectMixin:

    @action(methods=["POST"], detail=True)
    @swagger_auto_schema(
        operation_description="""
        Reject the project.
        The project is checked for validity (status should be 'Recommended' and version should be 3).
        If the project is valid, it is marked as Not approved.
        """,
        request_body=openapi.Schema(type=openapi.TYPE_OBJECT, properties=None),
        responses={
            status.HTTP_200_OK: ProjectDetailsV2Serializer,
            status.HTTP_400_BAD_REQUEST: "Bad request",
        },
    )
    def reject(self, request, *args, **kwargs):
        project = self.get_object()
        if project.submission_status.name != "Recommended" or project.version != 3:
            return Response(
                {
                    "error": """Project's submission status can be set as 'Not approved' only """
                    """if the project is in 'Recommended' status and version 3."""
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        project.submission_status = ProjectSubmissionStatus.objects.get(
            name="Not approved"
        )
        log_project_history(project, request.user, HISTORY_DESCRIPTION_REJECT_V3)
        project.save()
        return Response(
            ProjectDetailsV2Serializer(project).data,
            status=status.HTTP_200_OK,
        )

    @action(methods=["POST"], detail=True)
    @swagger_auto_schema(
        operation_description="""
        Approve the project.
        The project is checked for validity (status should be 'Recommended' and version should be 3).
        The project is checked if the mandatory approval fields are filled.
        If the project is valid, it is marked as Approved.
        """,
        request_body=openapi.Schema(type=openapi.TYPE_OBJECT, properties=None),
        responses={
            status.HTTP_200_OK: ProjectDetailsV2Serializer,
            status.HTTP_400_BAD_REQUEST: "Bad request",
        },
    )
    def approve(self, request, *args, **kwargs):
        project = self.get_object()
        context = self.get_serializer_context()
        context["enforce_validation"] = True
        serializer = ProjectV2EditApprovalFieldsSerializer(
            project, data=request.data, partial=True, context=context
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        if project.submission_status.name != "Recommended" or project.version != 3:
            return Response(
                {
                    "error": """Project can be approved only """
                    """if the project is in 'Recommended' status and version 3."""
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        project.submission_status = ProjectSubmissionStatus.objects.get(name="Approved")
        project.status = ProjectStatus.objects.get(code="ONG")
        log_project_history(project, request.user, HISTORY_DESCRIPTION_APPROVE_V3)
        project.save()
        post_approval_changes(project)
        data = ProjectDetailsV2Serializer(project).data
        return Response(
            data,
            status=status.HTTP_200_OK,
        )
