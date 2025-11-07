from constance import config
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from django.db import transaction

from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action

from core.api.serializers.project_v2 import (
    ProjectV2SubmitSerializer,
    ProjectDetailsV2Serializer,
    ProjectListV2Serializer,
    HISTORY_DESCRIPTION_SUBMIT_V1,
)
from core.models.project import Project
from core.models.project_metadata import ProjectSubmissionStatus
from core.tasks import send_project_submission_notification
from core.api.views.utils import log_project_history


class ProjectSubmitMixin:
    @action(methods=["POST"], detail=True)
    @swagger_auto_schema(
        operation_description="""
        Submit the project for review.
        The project is checked for validity (check version, status and if the required fields are filled).
        If the project is valid, it is marked as submitted and the version is increased, creating an
        archived version of the project.
        The related entries (ProjectOdsOdp, ProjectFund, ProjectRBMMeasure,
        ProjectProgressReport, SubmissionAmount, ProjectComment, ProjectFile)
        are also duplicated and linked to the archived project.
        An email notification is sent to the secretariat team
        to inform them about the new submission.
        """,
        request_body=openapi.Schema(type=openapi.TYPE_OBJECT, properties=None),
        responses={
            status.HTTP_200_OK: ProjectDetailsV2Serializer,
            status.HTTP_400_BAD_REQUEST: "Bad request",
        },
    )
    def submit(self, request, *args, **kwargs):
        """
        Submits the project and its components projects for review.
        The projects are checked for validity (check version, status and if the required fields are filled).
        Previous tranches of the projects (if they exist) are checked if at least one actual field is filled.
        If all the projects are valid, they are marked as submitted and the version is increased, creating
        archived versions of the projects.
        The related entries (ProjectOdsOdp, ProjectFund, ProjectRBMMeasure,
        ProjectProgressReport, SubmissionAmount, ProjectComment, ProjectFile)
        are also duplicated and linked to the archived project.
        An email notification is sent to the secretariat team
        to inform them about the new submission.
        """
        project = self.get_object()

        associated_projects = Project.objects.filter(
            meta_project=project.meta_project,
            submission_status=project.submission_status,
        )

        if project.component:
            # If the project is a component, include only components of the project
            associated_projects = associated_projects.filter(
                component=project.component,
            )
        else:
            # If the project is not a component, keep only the main project
            associated_projects = associated_projects.filter(id=project.id)

        associated_projects = sorted(
            associated_projects, key=lambda p: 0 if p.id == project.id else 1
        )

        has_errors = False
        data = []
        for associated_project in associated_projects:
            project_data = {}
            project_data["id"] = associated_project.id
            project_data["title"] = associated_project.title
            project_data["errors"] = {}
            serializer = ProjectV2SubmitSerializer(
                associated_project, data={}, partial=True
            )
            if not serializer.is_valid():
                has_errors = True
                project_data["errors"] = serializer.errors
            data.append(project_data)
        if has_errors:
            return Response(data, status=status.HTTP_400_BAD_REQUEST)

        submission_status = ProjectSubmissionStatus.objects.get(name="Submitted")
        with transaction.atomic():
            for associated_project in associated_projects:
                associated_project.submission_status = submission_status
                associated_project.save()
                if associated_project.version == 1:
                    # Some v2 projects may be returned to Draft and for those the
                    # version should not be increased
                    associated_project.increase_version(request.user)
                log_project_history(
                    associated_project, request.user, HISTORY_DESCRIPTION_SUBMIT_V1
                )
        # Send email notification to the secretariat team
        if config.PROJECT_SUBMISSION_NOTIFICATIONS_ENABLED:
            send_project_submission_notification.delay(
                [project.id for project in associated_projects]
            )

        return Response(
            ProjectListV2Serializer(associated_projects, many=True).data,
            status=status.HTTP_200_OK,
        )
