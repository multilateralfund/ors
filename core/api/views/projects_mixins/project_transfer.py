from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from django.db import transaction
from rest_framework import status
from rest_framework.response import Response
from rest_framework import parsers
from rest_framework.decorators import action


from core.api.serializers.project_v2 import (
    ProjectV2TransferSerializer,
    ProjectDetailsV2Serializer,
    HISTORY_DESCRIPTION_CREATE_TRANSFER,
    HISTORY_DESCRIPTION_TRANSFER,
)
from core.api.swagger import FileUploadAutoSchema
from core.api.views.utils import log_project_history


class ProjectTransferMixin:

    @action(
        methods=["POST"],
        detail=True,
        parser_classes=[parsers.MultiPartParser, parsers.FormParser],
    )
    @swagger_auto_schema(
        operation_description="Transfer the project to a new agency.",
        auto_schema=FileUploadAutoSchema,
        manual_parameters=[
            openapi.Parameter(
                name="files",
                in_=openapi.IN_FORM,
                type=openapi.TYPE_ARRAY,
                items=openapi.Items(type=openapi.TYPE_FILE),
                required=True,
                description="List of documents",
            ),
            openapi.Parameter(
                name="metadata",
                in_=openapi.IN_FORM,
                type=openapi.TYPE_STRING,
                required=True,
                description=(
                    """
                    JSON metadata string.(map by filename):
                        {
                            "test_document_1.xlsx": "main_submission",
                            "test_document_2.xlsx": "final_proposal"
                        }
                """
                ),
            ),
            openapi.Parameter(
                "agency",
                openapi.IN_FORM,
                description="Agency ID",
                type=openapi.TYPE_INTEGER,
                required=True,
            ),
            openapi.Parameter(
                "transfer_meeting",
                openapi.IN_FORM,
                description="Meeting ID",
                type=openapi.TYPE_INTEGER,
                required=False,
            ),
            openapi.Parameter(
                "transfer_decision",
                openapi.IN_FORM,
                description="Transfer decision",
                type=openapi.TYPE_STRING,
                required=False,
            ),
            openapi.Parameter(
                "transfer_excom_provision",
                openapi.IN_FORM,
                description="ExCom provision",
                type=openapi.TYPE_STRING,
                required=False,
            ),
            openapi.Parameter(
                "fund_transferred",
                openapi.IN_FORM,
                description="Fund transferred",
                type=openapi.TYPE_NUMBER,
                required=False,
            ),
            openapi.Parameter(
                "psc_transferred",
                openapi.IN_FORM,
                description="PSC transferred",
                type=openapi.TYPE_NUMBER,
                required=False,
            ),
        ],
        responses={
            status.HTTP_200_OK: ProjectV2TransferSerializer,
            status.HTTP_400_BAD_REQUEST: "Bad request",
        },
    )
    def transfer(self, request, *args, **kwargs):
        with transaction.atomic():
            project = self.get_object()
            serializer = ProjectV2TransferSerializer(
                project,
                data=request.data,
            )
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            new_project = serializer.save(request=request)

            response = self._file_create(
                request, project_id=new_project.id, dry_run=False, *args, **kwargs
            )
            if response.status_code != status.HTTP_201_CREATED:
                return response

        log_project_history(project, request.user, HISTORY_DESCRIPTION_TRANSFER)
        log_project_history(
            new_project, request.user, HISTORY_DESCRIPTION_CREATE_TRANSFER
        )
        return Response(
            ProjectDetailsV2Serializer(new_project).data,
            status=status.HTTP_200_OK,
        )
