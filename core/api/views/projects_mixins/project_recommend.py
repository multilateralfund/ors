from constance import config
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action

from django.db import transaction
from core.models import Project


from core.api.serializers.project_v2 import (
    ProjectV2RecommendSerializer,
    ProjectListV2Serializer,
    HISTORY_DESCRIPTION_RECOMMEND_V2,
)
from core.models.project_metadata import ProjectSubmissionStatus
from core.tasks import send_project_recommended_notification
from core.api.views.utils import log_project_history


class ProjectRecommendMixin:
    @action(methods=["POST"], detail=True)
    @swagger_auto_schema(
        operation_description="""
        Recommend the project and its components projects for approval.
        The projects are checked for validity (check version, status and if the required fields are filled).
        If all the projects are valid, they are marked as Recommended and the version is increased, creating an
        archived versions of the projects.
        The related entries (ProjectOdsOdp, ProjectFund, ProjectRBMMeasure,
        ProjectProgressReport, SubmissionAmount, ProjectComment, ProjectFile)
        are also duplicated and linked to the archived project.
        An email notification is sent to the secretariat team and the creator of the projects
        to inform them about the new recommendation.
        """,
        request_body=openapi.Schema(type=openapi.TYPE_OBJECT, properties=None),
        responses={
            status.HTTP_200_OK: ProjectListV2Serializer,
            status.HTTP_400_BAD_REQUEST: "Bad request",
        },
    )
    def recommend(self, request, *args, **kwargs):
        project = self.get_object()
        if project.component:
            # If the project is a component, include components of the project
            projects_to_recommend = Project.objects.filter(
                component=project.component,
                submission_status=project.submission_status,
            )
        else:
            # If the project is not a component, keep only the project
            projects_to_recommend = Project.objects.filter(id=project.id)

        projects_to_recommend = sorted(
            projects_to_recommend, key=lambda p: 0 if p.id == project.id else 1
        )

        has_errors = False
        data = []

        for project_to_recommend in projects_to_recommend:
            project_data = {}
            project_data["id"] = project_to_recommend.id
            project_data["title"] = project_to_recommend.title
            project_data["errors"] = {}
            serializer = ProjectV2RecommendSerializer(
                project_to_recommend, data={}, partial=True
            )
            if not serializer.is_valid():
                has_errors = True
                project_data["errors"] = serializer.errors
            data.append(project_data)

        if has_errors:
            return Response(data, status=status.HTTP_400_BAD_REQUEST)

        recommended_status = ProjectSubmissionStatus.objects.get(name="Recommended")
        with transaction.atomic():
            for project_to_recommend in projects_to_recommend:
                project_to_recommend.submission_status = recommended_status
                project_to_recommend.save()
                project_to_recommend.increase_version(request.user)
                log_project_history(
                    project_to_recommend, request.user, HISTORY_DESCRIPTION_RECOMMEND_V2
                )

        # Send email notification to the secretariat team and the creators of the projects
        if config.PROJECT_RECOMMENDATION_NOTIFICATIONS_ENABLED:
            send_project_recommended_notification.delay(
                [project.id for project in projects_to_recommend]
            )

        return Response(
            ProjectListV2Serializer(projects_to_recommend, many=True).data,
            status=status.HTTP_200_OK,
        )
