from constance import config
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from drf_spectacular.utils import extend_schema

from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action

from core.api.serializers.project_completion_report import (
    PCRDetailSerializer,
    PCRVersionSerializer,
    HISTORY_DESCRIPTION_SUBMIT_V1,
    HISTORY_DESCRIPTION_RESUBMIT_V2,
    HISTORY_DESCRIPTION_REQUEST_ADJUSTMENTS_V2,
    HISTORY_DESCRIPTION_APPROVE_V3,
)
from core.api.utils import log_pcr_history
from core.api.views.project_completion_report.pcr_validation import (
    get_pcr_submission_error_message,
    get_pcr_submission_errors,
)
from core.models.project_completion_report import PCR, PCRHistory
from core.tasks import send_pcr_notification


class PCRWorkflowMixin:
    """
    PCR workflow:
        V1 Draft -> submit -> V2 Revision (V1 is archived as 'Initial submission')
        V2 Revision -> request_adjustments -> V2 Revision (adjustments requested)
        V2 Revision (adjustments requested) -> submit -> V2 Revision (no new version)
        V2 Revision -> approve -> V3 Approved version (V2 is archived)
    """

    def _get_locked_pcr(self):
        pcr = self.get_object()
        return PCR.objects.select_for_update().get(pk=pcr.pk)

    @staticmethod
    def _invalid_transition(message):
        return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)

    @staticmethod
    def _incomplete_pcr(pcr, action_name):
        """
        The error response if the PCR does not have all the required data.
        """
        errors = get_pcr_submission_errors(pcr)
        if not errors:
            return None
        return Response(
            {
                "error": get_pcr_submission_error_message(errors, action_name),
                "errors": errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    @extend_schema(
        description="""
        Submit the PCR for MLFS review, locking it for the lead agency.
        A version 1 'Draft' PCR is archived as 'Initial submission' and the PCR is
        increased to version 2, 'Revision'.
        The submission date is set to the current date.
        A version 2 PCR that had adjustments requested is resubmitted without
        creating a new version and the revised submission date is set to the current date.
        An email notification is sent to the addresses set for agency PCR submission
        notifications (Secretariat).
        All the PCR required data should be filled, otherwise the response has the
        errors by field.
        """,
        request=None,
        responses={
            status.HTTP_200_OK: PCRDetailSerializer,
            status.HTTP_400_BAD_REQUEST: "Bad request",
        },
    )
    @action(methods=["POST"], detail=True)
    def submit(self, request, *args, **kwargs):
        with transaction.atomic():
            pcr = self._get_locked_pcr()
            is_initial_submission = pcr.version == 1 and pcr.status == PCR.Status.DRAFT
            is_resubmission = (
                pcr.version == 2
                and pcr.status == PCR.Status.REVISION_ADJUSTMENTS_REQUESTED
            )
            if not (is_initial_submission or is_resubmission):
                return self._invalid_transition(
                    "PCR can only be submitted if it is in 'Draft' status and version 1 "
                    "or in 'Revision (adjustments requested)' status and version 2."
                )
            incomplete_response = self._incomplete_pcr(pcr, "submitted")
            if incomplete_response:
                return incomplete_response
            if is_initial_submission:
                pcr.increase_version(
                    request.user, archived_status=PCR.Status.INITIAL_SUBMISSION
                )
                pcr.submission_date = timezone.now().date()
                history_description = HISTORY_DESCRIPTION_SUBMIT_V1
            else:
                pcr.revised_submission_date = timezone.now().date()
                history_description = HISTORY_DESCRIPTION_RESUBMIT_V2
            pcr.status = PCR.Status.REVISION
            pcr.save()
            log_pcr_history(
                pcr,
                request.user,
                history_description,
                lock_action=PCRHistory.LockAction.LOCKED,
            )

        if config.PCR_NOTIFICATIONS_ENABLED:
            send_pcr_notification.delay(pcr.id, is_resubmission=is_resubmission)

        return Response(self.get_serializer(pcr).data, status=status.HTTP_200_OK)

    @extend_schema(
        description="""
        Send the PCR back to the lead agency for adjustments, unlocking it.
        The PCR should be in 'Revision' status and version 2.
        The version is not changed.
        """,
        request=None,
        responses={
            status.HTTP_200_OK: PCRDetailSerializer,
            status.HTTP_400_BAD_REQUEST: "Bad request",
        },
    )
    @action(methods=["POST"], detail=True)
    def request_adjustments(self, request, *args, **kwargs):
        with transaction.atomic():
            pcr = self._get_locked_pcr()
            if pcr.version != 2 or pcr.status != PCR.Status.REVISION:
                return self._invalid_transition(
                    "Adjustments can only be requested if the PCR is in "
                    "'Revision' status and version 2."
                )
            pcr.status = PCR.Status.REVISION_ADJUSTMENTS_REQUESTED
            pcr.save()
            log_pcr_history(
                pcr,
                request.user,
                HISTORY_DESCRIPTION_REQUEST_ADJUSTMENTS_V2,
                lock_action=PCRHistory.LockAction.UNLOCKED,
            )

        return Response(self.get_serializer(pcr).data, status=status.HTTP_200_OK)

    @extend_schema(
        description="""
        Approve and finalize the PCR.
        The PCR should be in 'Revision' status and version 2.
        Version 2 is archived and the PCR is increased to version 3, 'Approved version',
        which can no longer be edited.
        The approval date is set to the current date.
        No email notification is sent, approved PCRs are highlighted in the PCR listing.
        All the PCR required data should be filled, otherwise the response has the
        errors by field.
        """,
        request=None,
        responses={
            status.HTTP_200_OK: PCRDetailSerializer,
            status.HTTP_400_BAD_REQUEST: "Bad request",
        },
    )
    @action(methods=["POST"], detail=True)
    def approve(self, request, *args, **kwargs):
        with transaction.atomic():
            pcr = self._get_locked_pcr()
            if pcr.version != 2 or pcr.status != PCR.Status.REVISION:
                return self._invalid_transition(
                    "PCR can only be approved if it is in 'Revision' status and version 2."
                )
            incomplete_response = self._incomplete_pcr(pcr, "approved")
            if incomplete_response:
                return incomplete_response
            pcr.increase_version(request.user)
            pcr.status = PCR.Status.APPROVED
            pcr.approval_date = timezone.now().date()
            pcr.save()
            log_pcr_history(pcr, request.user, HISTORY_DESCRIPTION_APPROVE_V3)

        return Response(self.get_serializer(pcr).data, status=status.HTTP_200_OK)

    @extend_schema(
        description="""
        List all the versions of a PCR, the archived ones and the current one,
        ordered by version.
        """,
        responses={status.HTTP_200_OK: PCRVersionSerializer(many=True)},
    )
    @action(methods=["GET"], detail=True, filter_backends=[], pagination_class=None)
    def versions(self, request, *args, **kwargs):
        pcr = self.get_object()
        current_pcr = pcr.latest_pcr or pcr
        versions = (
            PCR.objects.really_all()
            .filter(Q(pk=current_pcr.pk) | Q(latest_pcr=current_pcr))
            .select_related("version_created_by")
            .order_by("version")
        )
        return Response(
            PCRVersionSerializer(versions, many=True).data,
            status=status.HTTP_200_OK,
        )
