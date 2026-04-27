import io
from datetime import datetime
from http import HTTPStatus
from decimal import Decimal

import openpyxl
import pytest
from django.urls import reverse

from core.api.tests.base import BaseTest
from core.api.tests.factories import DecisionFactory
from core.api.tests.factories import FundingWindowFactory
from core.api.tests.factories import MeetingFactory
from core.api.tests.factories import ProjectFactory

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
