import logging

from django.db import transaction

from core.models.meeting import Decision, Meeting

logger = logging.getLogger(__name__)


@transaction.atomic
def import_decisions():
    meetings = Meeting.objects.all()
    for meeting in meetings:
        Decision.objects.get_or_create(
            number=meeting.number,
            defaults={
                "meeting_id": meeting.id,
                "description": "Test",
            },
        )

    logger.info("✔ Decisions imported (only for testing)")
