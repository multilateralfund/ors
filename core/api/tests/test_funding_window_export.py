import io
from datetime import datetime
from http import HTTPStatus
from decimal import Decimal

import openpyxl
import pytest
from django.contrib.auth.models import Permission
from django.urls import reverse

from core.api.tests.base import BaseTest
from core.api.tests.factories import DecisionFactory
from core.api.tests.factories import FundingWindowFactory
from core.api.tests.factories import MeetingFactory
from core.api.tests.factories import ProjectFactory
from core.api.tests.factories import UserFactory

from core.api.views import funding_window_export

pytestmark = pytest.mark.django_db


class TestFundingWindowExport(BaseTest):
    url = reverse("funding-window-export")

    def test_export(self, secretariat_viewer_user, project_approved_status):
        meeting_number = 95
        decision_number = "95/3"
        meeting = MeetingFactory.create(number=meeting_number)
        decision = DecisionFactory.create(meeting=meeting, number=decision_number)
        funding_window = FundingWindowFactory.create(
            meeting=meeting,
            decision=decision,
            description="First funding window",
            amount=Decimal("500.00"),
            remarks="First remarks",
        )
        FundingWindowFactory.create(
            meeting=None,
            decision=None,
            description="Second funding window",
            amount=Decimal("50.00"),
            remarks="Second remarks",
        )

        ProjectFactory.create(
            funding_window=funding_window,
            submission_status=project_approved_status,
            version=3,
            total_fund=Decimal("120.50"),
            support_cost_psc=Decimal("12.25"),
        )
        ProjectFactory.create(
            funding_window=funding_window,
            submission_status=project_approved_status,
            version=2,
            total_fund=Decimal("999.99"),
            support_cost_psc=Decimal("99.99"),
        )

        self.client.force_authenticate(user=secretariat_viewer_user)
        response = self.client.get(self.url)

        assert response.status_code == HTTPStatus.OK
        timestamp = datetime.today().strftime("%Y.%m")
        assert response.filename == f"{timestamp} Funding windows.xlsx"

        wb = openpyxl.load_workbook(io.BytesIO(response.getvalue()))
        sheet = wb["Funding windows"]

        for column, header in enumerate(funding_window_export.HEADERS, start=1):
            assert sheet.cell(1, column).value == header["headerName"]

        assert sheet["A2"].value == meeting_number
        assert sheet["B2"].value == decision_number
        assert sheet["C2"].value == "First funding window"
        assert sheet["D2"].value == pytest.approx(500.0)
        assert sheet["E2"].value == pytest.approx(132.75)
        assert sheet["F2"].value == pytest.approx(367.25)
        assert sheet["G2"].value == "First remarks"

        assert sheet["A3"].value is None
        assert sheet["B3"].value is None
        assert sheet["C3"].value == "Second funding window"
        assert sheet["D3"].value == pytest.approx(50.0)
        assert sheet["E3"].value == 0
        assert sheet["F3"].value == pytest.approx(50.0)
        assert sheet["G3"].value == "Second remarks"


class TestFundingWindowPermissions(BaseTest):
    url = reverse("funding-window-export").replace("export/", "")

    @staticmethod
    def _view_only_user():
        user = UserFactory.create(username="funding_window_viewer")
        permission = Permission.objects.get(
            codename="has_project_v2_funding_window_view_access"
        )
        user.user_permissions.add(permission)
        return user

    @staticmethod
    def _payload():
        meeting = MeetingFactory.create()
        decision = DecisionFactory.create(meeting=meeting)
        return {
            "meeting_id": meeting.id,
            "decision_id": decision.id,
            "description": "Funding window",
            "amount": "100.00",
            "remarks": "Remarks",
        }

    def test_agency_submitter_cannot_view_funding_window(self, agency_user):
        self.client.force_authenticate(user=agency_user)

        list_response = self.client.get(self.url)
        export_response = self.client.get(reverse("funding-window-export"))

        assert list_response.status_code == HTTPStatus.FORBIDDEN
        assert export_response.status_code == HTTPStatus.FORBIDDEN

    def test_view_permission_can_view_but_not_manage(self):
        funding_window = FundingWindowFactory.create()
        detail_url = f"{self.url}{funding_window.id}/"
        user = self._view_only_user()

        self.client.force_authenticate(user=user)

        list_response = self.client.get(self.url)
        detail_response = self.client.get(detail_url)
        create_response = self.client.post(self.url, self._payload(), format="json")
        update_response = self.client.put(
            detail_url,
            self._payload(),
            format="json",
        )

        assert list_response.status_code == HTTPStatus.OK
        assert detail_response.status_code == HTTPStatus.OK
        assert create_response.status_code == HTTPStatus.FORBIDDEN
        assert update_response.status_code == HTTPStatus.FORBIDDEN

    def test_secretariat_viewer_can_view_but_not_manage(self, secretariat_viewer_user):
        funding_window = FundingWindowFactory.create()
        detail_url = f"{self.url}{funding_window.id}/"

        self.client.force_authenticate(user=secretariat_viewer_user)

        list_response = self.client.get(self.url)
        detail_response = self.client.get(detail_url)
        create_response = self.client.post(self.url, self._payload(), format="json")
        update_response = self.client.put(
            detail_url,
            self._payload(),
            format="json",
        )

        assert list_response.status_code == HTTPStatus.OK
        assert detail_response.status_code == HTTPStatus.OK
        assert create_response.status_code == HTTPStatus.FORBIDDEN
        assert update_response.status_code == HTTPStatus.FORBIDDEN
