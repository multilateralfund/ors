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
    HISTORY_DESCRIPTION_ENDORSE,
    HISTORY_DESCRIPTION_RESUBMIT,
    HISTORY_DESCRIPTION_SEND_BACK,
    HISTORY_DESCRIPTION_SEND_BACK_ENDORSED,
    HISTORY_DESCRIPTION_SUBMIT,
)
from core.api.utils import log_pcr_history
from core.api.views.project_completion_report.pcr_validation import (
    get_pcr_not_approved_projects,
    get_pcr_not_approved_projects_message,
    get_pcr_submission_error_message,
    get_pcr_submission_errors,
)
from core.models.project_completion_report import PCR, PCRHistory
from core.tasks import send_pcr_notification


class PCRWorkflowMixin:
    """
    PCR workflow:
        V1 Draft -> submit -> V2 Submitted (V1 is archived)
        V2/V3 Submitted -> send_back_for_revision -> Revision (no new version)
        V2/V3 Revision -> submit -> Submitted (no new version)
        V2 Submitted -> endorse -> V3 Endorsed (V2 is archived)
        V3 Submitted -> endorse -> V3 Endorsed (no new version)
        V3 Endorsed -> send_back_for_revision -> V3 Revision (no new version)
    There are at most 3 versions: V1 and V2 archived, V3 the current one.
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

    @staticmethod
    def _not_approved_projects(pcr, action_name):
        """
        The error response if some projects of the PCR are not approved yet.
        """
        projects = get_pcr_not_approved_projects(pcr)
        if not projects:
            return None
        return Response(
            {
                "error": get_pcr_not_approved_projects_message(projects, action_name),
                "not_approved_projects": [
                    {
                        "id": project.id,
                        "code": project.code,
                        "submission_status": project.submission_status.name,
                    }
                    for project in projects
                ],
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    @extend_schema(
        description="""
        Submit the PCR to the Secretariat, locking it for the lead agency.
        A version 1 'Draft' PCR is archived (as 'Draft') and the PCR is increased to
        version 2, 'Submitted'. The submission date is set to the current date.
        A version 2 or 3 PCR in 'Revision' status (sent back by the Secretariat) is
        resubmitted without creating a new version, and the revised submission date
        is set to the current date.
        An email notification is sent to the addresses set for agency PCR submission
        notifications (Secretariat).
        All the projects of the meta project should be approved, otherwise the
        response has the `not_approved_projects`.
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
                pcr.version in (2, 3) and pcr.status == PCR.Status.REVISION
            )
            if not (is_initial_submission or is_resubmission):
                return self._invalid_transition(
                    "PCR can only be submitted if it is in 'Draft' status and version 1 "
                    "or in 'Revision' status."
                )
            not_approved_response = self._not_approved_projects(pcr, "submitted")
            if not_approved_response:
                return not_approved_response
            incomplete_response = self._incomplete_pcr(pcr, "submitted")
            if incomplete_response:
                return incomplete_response
            if is_initial_submission:
                # the archived version 1 keeps the 'Draft' status
                pcr.increase_version(request.user)
                pcr.submission_date = timezone.now().date()
                history_description = HISTORY_DESCRIPTION_SUBMIT
            else:
                pcr.revised_submission_date = timezone.now().date()
                history_description = HISTORY_DESCRIPTION_RESUBMIT
            pcr.status = PCR.Status.SUBMITTED
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
        Send the PCR back to the lead agency for revision, unlocking it.
        The PCR should be in 'Submitted' status (version 2 or 3) or in 'Endorsed'
        status (version 3). It moves to 'Revision' and the version is not changed.
        """,
        request=None,
        responses={
            status.HTTP_200_OK: PCRDetailSerializer,
            status.HTTP_400_BAD_REQUEST: "Bad request",
        },
    )
    @action(methods=["POST"], detail=True)
    def send_back_for_revision(self, request, *args, **kwargs):
        with transaction.atomic():
            pcr = self._get_locked_pcr()
            is_submitted = pcr.version in (2, 3) and pcr.status == PCR.Status.SUBMITTED
            is_endorsed = pcr.version == 3 and pcr.status == PCR.Status.ENDORSED
            if not (is_submitted or is_endorsed):
                return self._invalid_transition(
                    "PCR can only be sent back for revision if it is in 'Submitted' "
                    "or 'Endorsed' status."
                )
            pcr.status = PCR.Status.REVISION
            pcr.save()
            log_pcr_history(
                pcr,
                request.user,
                (
                    HISTORY_DESCRIPTION_SEND_BACK_ENDORSED
                    if is_endorsed
                    else HISTORY_DESCRIPTION_SEND_BACK
                ),
                lock_action=PCRHistory.LockAction.UNLOCKED,
            )

        return Response(self.get_serializer(pcr).data, status=status.HTTP_200_OK)

    @extend_schema(
        description="""
        Endorse the PCR, which can then no longer be edited (unless it is sent back
        for revision).
        The PCR should be in 'Submitted' status.
        On the first endorsement, version 2 is archived (as 'Submitted') and the PCR is
        increased to version 3. A version 3 PCR that was sent back for revision and
        resubmitted is endorsed again without creating a new version.
        The approval date is set to the current date.
        No email notification is sent, endorsed PCRs are highlighted in the PCR listing.
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
    def endorse(self, request, *args, **kwargs):
        with transaction.atomic():
            pcr = self._get_locked_pcr()
            if pcr.version not in (2, 3) or pcr.status != PCR.Status.SUBMITTED:
                return self._invalid_transition(
                    "PCR can only be endorsed if it is in 'Submitted' status."
                )
            incomplete_response = self._incomplete_pcr(pcr, "endorsed")
            if incomplete_response:
                return incomplete_response
            if pcr.version == 2:
                # the archived version 2 keeps the 'Submitted' status
                pcr.increase_version(request.user)
            pcr.status = PCR.Status.ENDORSED
            pcr.approval_date = timezone.now().date()
            pcr.save()
            log_pcr_history(pcr, request.user, HISTORY_DESCRIPTION_ENDORSE)

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
