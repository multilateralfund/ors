import io
from http import HTTPStatus

import openpyxl
import pytest
from django.urls import reverse

from core.api.tests.base import BaseTest
from core.api.tests.factories import AgencyFactory
from core.api.tests.factories import MeetingFactory
from core.api.tests.factories import ProjectClusterFactory
from core.api.tests.factories import ProjectFactory
from core.api.tests.factories import ProjectOdsOdpFactory

pytestmark = pytest.mark.django_db


class TestProjectApprovalSummaryExport(BaseTest):
    preview_url = reverse("projects-approval-summary-list")
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

        assert sheet["A1"].value is None
        assert sheet["B2"].value == "Summary  "

        assert sheet["C6"].value == pytest.approx(12.3)
        assert sheet["C6"].number_format == "#,##0.0;-#,##0.0;;@"
        assert sheet["D6"].value == 5
        assert sheet["D6"].number_format == "#,##0;-#,##0;;@"

        assert sheet["C24"].value == pytest.approx(12.3)
        assert sheet["C24"].number_format == "#,##0.0;-#,##0.0;;@"
        assert sheet["D24"].value == 5
        assert sheet["D24"].number_format == "#,##0;-#,##0;;@"

    def test_approved_summary_uses_only_v3_projects_for_selected_meeting(
        self,
        secretariat_approver_edit_access_user,
        project_approved_status,
        project_recommended_status,
    ):
        selected_meeting = MeetingFactory()
        other_meeting = MeetingFactory()
        agency = AgencyFactory(name="Australia", agency_type="National")
        cluster = ProjectClusterFactory(name="HPMP", code="HPMP-I")

        included_project = ProjectFactory(
            agency=agency,
            cluster=cluster,
            meeting=selected_meeting,
            submission_status=project_approved_status,
            version=3,
            total_fund=1234,
            support_cost_psc=56,
        )
        ProjectOdsOdpFactory(project=included_project, odp=12.3, co2_mt=4500)

        excluded_projects = [
            ProjectFactory(
                agency=agency,
                cluster=cluster,
                meeting=selected_meeting,
                submission_status=project_approved_status,
                version=2,
                total_fund=9999,
                support_cost_psc=999,
            ),
            ProjectFactory(
                agency=agency,
                cluster=cluster,
                meeting=other_meeting,
                submission_status=project_approved_status,
                version=3,
                total_fund=9999,
                support_cost_psc=999,
            ),
            ProjectFactory(
                agency=agency,
                cluster=cluster,
                meeting=selected_meeting,
                submission_status=project_recommended_status,
                version=3,
                total_fund=9999,
                support_cost_psc=999,
            ),
        ]
        for project in excluded_projects:
            ProjectOdsOdpFactory(project=project, odp=99.9, co2_mt=99900)

        self.client.force_authenticate(user=secretariat_approver_edit_access_user)
        params = {
            "meeting_id": selected_meeting.id,
            "submission_status": "approved",
        }

        preview_response = self.client.get(self.preview_url, params)

        assert preview_response.status_code == HTTPStatus.OK
        assert preview_response.data["projects"]["count"] == 1
        assert preview_response.data["grand_total"]["hcfc"] == pytest.approx(12.3)
        assert preview_response.data["grand_total"]["hfc"] == 5
        assert preview_response.data["grand_total"]["project_funding"] == 1234
        assert preview_response.data["grand_total"]["project_support_cost"] == 56
        assert preview_response.data["grand_total"]["total"] == 1290

        export_response = self.client.get(self.url, params)

        assert export_response.status_code == HTTPStatus.OK

        workbook = openpyxl.load_workbook(io.BytesIO(export_response.getvalue()))
        sheet = workbook.worksheets[0]

        assert sheet["E3"].value == "Funds approved (US$)"
        assert sheet["C6"].value == pytest.approx(12.3)
        assert sheet["D6"].value == 5
        assert sheet["E6"].value == 1234
        assert sheet["F6"].value == 56
        assert sheet["G6"].value == 1290

    def test_summary_counts_project_money_once_with_multiple_ods_rows(
        self,
        secretariat_approver_edit_access_user,
        project_approved_status,
    ):
        selected_meeting = MeetingFactory()
        agency = AgencyFactory(name="Australia", agency_type="National")
        cluster = ProjectClusterFactory(name="HPMP", code="HPMP-I")

        project = ProjectFactory(
            agency=agency,
            cluster=cluster,
            meeting=selected_meeting,
            submission_status=project_approved_status,
            version=3,
            total_fund=1234,
            support_cost_psc=56,
        )
        ProjectOdsOdpFactory(project=project, odp=1.2, co2_mt=1500)
        ProjectOdsOdpFactory(project=project, odp=2.3, co2_mt=2500)

        self.client.force_authenticate(user=secretariat_approver_edit_access_user)
        response = self.client.get(
            self.preview_url,
            {
                "meeting_id": selected_meeting.id,
                "submission_status": "approved",
            },
        )

        assert response.status_code == HTTPStatus.OK
        assert response.data["grand_total"]["hcfc"] == pytest.approx(3.5)
        assert response.data["grand_total"]["hfc"] == 4
        assert response.data["grand_total"]["project_funding"] == 1234
        assert response.data["grand_total"]["project_support_cost"] == 56
        assert response.data["grand_total"]["total"] == 1290

        agency_summary = response.data["summary_by_parties_and_implementing_agencies"][
            0
        ]
        assert agency_summary["hcfc"] == pytest.approx(3.5)
        assert agency_summary["hfc"] == 4
        assert agency_summary["project_funding"] == 1234
        assert agency_summary["project_support_cost"] == 56
        assert agency_summary["total"] == 1290

    def test_recommended_summary_does_not_apply_v3_filter(
        self,
        secretariat_approver_edit_access_user,
        project_recommended_status,
    ):
        selected_meeting = MeetingFactory()
        cluster = ProjectClusterFactory(name="HPMP", code="HPMP-I")

        for version in [2, 3]:
            project = ProjectFactory(
                cluster=cluster,
                meeting=selected_meeting,
                submission_status=project_recommended_status,
                version=version,
                total_fund=100,
                support_cost_psc=10,
            )
            ProjectOdsOdpFactory(project=project, odp=1, co2_mt=1000)

        self.client.force_authenticate(user=secretariat_approver_edit_access_user)
        response = self.client.get(
            self.preview_url,
            {
                "meeting_id": selected_meeting.id,
                "submission_status": "recommended",
            },
        )

        assert response.status_code == HTTPStatus.OK
        assert response.data["projects"]["count"] == 2
        assert response.data["grand_total"]["project_funding"] == 200
        assert response.data["grand_total"]["project_support_cost"] == 20
        assert response.data["grand_total"]["total"] == 220
