import io
from http import HTTPStatus

import openpyxl
import pytest
from django.urls import reverse

from core.api.tests.base import BaseTest
from core.api.tests.factories import AgencyFactory
from core.api.tests.factories import ProjectClusterFactory
from core.api.tests.factories import ProjectFactory
from core.api.tests.factories import ProjectOdsOdpFactory

pytestmark = pytest.mark.django_db


class TestProjectApprovalSummaryExport(BaseTest):
    url = reverse("projects-approval-summary-export")

    def test_export_enforces_hcfc_and_hfc_number_formats(
        self,
        secretariat_approver_edit_access_user,
        project_approved_status,
    ):
        agency = AgencyFactory(name="Australia", agency_type="National")
        cluster = ProjectClusterFactory(name="HPMP", code="HPMP-I")
        project = ProjectFactory(
            agency=agency,
            cluster=cluster,
            submission_status=project_approved_status,
            total_fund=1234,
            support_cost_psc=56,
        )
        ProjectOdsOdpFactory(project=project, odp=12.3, co2_mt=4500)

        self.client.force_authenticate(user=secretariat_approver_edit_access_user)
        response = self.client.get(self.url)

        assert response.status_code == HTTPStatus.OK

        workbook = openpyxl.load_workbook(io.BytesIO(response.getvalue()))
        sheet = workbook.worksheets[0]

        assert sheet["C5"].value == pytest.approx(12.3)
        assert sheet["C5"].number_format == "#,##0.0;-#,##0.0;;@"
        assert sheet["D5"].value == 5
        assert sheet["D5"].number_format == "#,##0;-#,##0;;@"

        assert sheet["C23"].value == pytest.approx(12.3)
        assert sheet["C23"].number_format == "#,##0.0;-#,##0.0;;@"
        assert sheet["D23"].value == 5
        assert sheet["D23"].number_format == "#,##0;-#,##0;;@"
