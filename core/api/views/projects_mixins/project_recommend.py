from constance import config
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action


from core.api.serializers.project_v2 import (
    ProjectV2RecommendSerializer,
    ProjectDetailsV2Serializer,
    HISTORY_DESCRIPTION_RECOMMEND_V2,
)
from core.models.project_metadata import ProjectSubmissionStatus
from core.tasks import send_project_recomended_notification
from core.api.views.utils import log_project_history


class ProjectRecommendMixin:
    @action(methods=["POST"], detail=True)
    @swagger_auto_schema(
        operation_description="""
        Recommend the project.
        The project is checked for validity (check version, status and if the required fields are filled).
        If the project is valid, it is marked as Recommended and the version is increased, creating an
        archived version of the project.
        The related entries (ProjectOdsOdp, ProjectFund, ProjectRBMMeasure,
        ProjectProgressReport, SubmissionAmount, ProjectComment, ProjectFile)
        are also duplicated and linked to the archived project.
        """,
        request_body=openapi.Schema(type=openapi.TYPE_OBJECT, properties=None),
        responses={
            status.HTTP_200_OK: ProjectDetailsV2Serializer,
            status.HTTP_400_BAD_REQUEST: "Bad request",
        },
    )
    def recommend(self, request, *args, **kwargs):
        project = self.get_object()
        serializer = ProjectV2RecommendSerializer(
            project, data=request.data, partial=True
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        project.submission_status = ProjectSubmissionStatus.objects.get(
            name="Recommended"
        )
        project.save()
        project.increase_version(request.user)
        log_project_history(project, request.user, HISTORY_DESCRIPTION_RECOMMEND_V2)
        # Send email notification to the secretariat team and the creator of the project
        if config.PROJECT_RECOMMENDATION_NOTIFICATIONS_ENABLED:
            send_project_recomended_notification.delay(project.id)
        return Response(
            ProjectDetailsV2Serializer(project).data,
            status=status.HTTP_200_OK,
        )
