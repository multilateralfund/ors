from drf_spectacular.utils import extend_schema
from drf_spectacular.utils import inline_serializer
from django.db import transaction
from rest_framework import serializers
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
from core.api.views.utils import log_project_history


class ProjectTransferMixin:

    @action(
        methods=["POST"],
        detail=True,
        parser_classes=[parsers.MultiPartParser, parsers.FormParser],
    )
    @extend_schema(
        description="Transfer the project to a new agency.",
        request={
            "multipart/form-data": inline_serializer(
                name="ProjectTransferRequest",
                fields={
                    "files": serializers.ListField(
                        child=serializers.FileField(),
                        help_text="List of documents",
                        required=True,
                    ),
                    "metadata": serializers.CharField(
                        help_text=(
                            """
                            JSON metadata string.(map by filename):
                                {
                                    "test_document_1.xlsx": "endorsement_letter",
                                    "test_document_2.xlsx": "verification_report"
                                }
                        """
                        ),
                        required=True,
                    ),
                    "agency": serializers.IntegerField(
                        help_text="Agency ID", required=True
                    ),
                    "transfer_meeting": serializers.IntegerField(
                        required=False, help_text="Meeting ID"
                    ),
                    "transfer_decision": serializers.CharField(
                        required=False, help_text="Transfer decision"
                    ),
                    "transfer_excom_provision": serializers.CharField(
                        required=False, help_text="Executive Committee provision"
                    ),
                    "fund_transferred": serializers.DecimalField(
                        max_digits=30,
                        decimal_places=15,
                        required=False,
                        help_text="Fund transferred",
                    ),
                    "psc_transferred": serializers.DecimalField(
                        max_digits=30,
                        decimal_places=15,
                        required=False,
                        help_text="PSC transferred",
                    ),
                    "psc_received": serializers.DecimalField(
                        max_digits=30,
                        decimal_places=15,
                        required=False,
                        help_text="PSC transferred",
                    ),
                },
            )
        },
        responses={
            status.HTTP_200_OK: ProjectV2TransferSerializer,
            status.HTTP_400_BAD_REQUEST: "Bad request",
        },
    )
    def transfer(self, request, *args, **kwargs):
        with transaction.atomic():
            data = request.data.copy()
            if data.get("fund_transferred") == "null":
                data["fund_transferred"] = None
            project = self.get_object()
            serializer = ProjectV2TransferSerializer(
                project,
                data=data,
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
