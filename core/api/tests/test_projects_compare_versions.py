import pytest
from django.urls import reverse

from core.api.tests.base import BaseTest
from core.api.tests.factories import (
    MeetingFactory,
    ProjectSubmissionStatusFactory,
)


pytestmark = pytest.mark.django_db


class TestProjectsCompareVersionsExport(BaseTest):
    url = reverse("compare-versions-export")

    def test_export_without_agency(self, admin_user):
        meeting = MeetingFactory.create(number=98)
        submitted = ProjectSubmissionStatusFactory.create(name="Submitted")
        recommended = ProjectSubmissionStatusFactory.create(name="Recommended")

        self.client.force_authenticate(user=admin_user)
        response = self.client.get(
            self.url,
            {
                "meeting_id": meeting.id,
                "submission_status_left_id": submitted.id,
                "submission_status_right_id": recommended.id,
            },
        )

        assert response.status_code == 200
