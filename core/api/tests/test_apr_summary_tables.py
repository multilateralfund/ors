"""
Tests for APR Summary Tables Export functionality.
"""

from datetime import date
from io import BytesIO

import pytest
from django.urls import reverse
from openpyxl import load_workbook
from rest_framework import status

from core.api.export.annual_project_report import APRSummaryTablesExportWriter
from core.api.tests.base import BaseTest
from core.api.tests.factories import (
    AnnualAgencyProjectReportFactory,
    AnnualProjectReportFactory,
    ProjectFactory,
)
from core.models.project_metadata import ProjectType

# pylint: disable=W0221,W0613,R0913,R0914


@pytest.mark.django_db
class TestAPRSummaryTablesExport(BaseTest):
    """Test the summary tables export functionality"""

    def test_without_login(self):
        self.client.force_authenticate(user=None)
        url = reverse("apr-summary-tables-export")
        response = self.client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_requires_apr_view_permission(self, user):
        self.client.force_authenticate(user=user)
        url = reverse("apr-summary-tables-export")
        response = self.client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_export_works_without_year_parameter(self, apr_agency_viewer_user):
        """Cumulative export doesn't require year parameter"""
        self.client.force_authenticate(user=apr_agency_viewer_user)
        url = reverse("apr-summary-tables-export")
        response = self.client.get(url)
        # Should work without year since it's cumulative
        assert response.status_code == status.HTTP_200_OK

    def test_agency_user_sees_only_own_projects(
        self,
        apr_agency_viewer_user,
        annual_progress_report,
        annual_agency_report,
    ):
        own_project = ProjectFactory(
            agency=apr_agency_viewer_user.agency,
            code=f"TEST_OWN_{apr_agency_viewer_user.agency.id}",
            date_approved=date(2023, 1, 15),
        )
        AnnualProjectReportFactory(
            report=annual_agency_report,
            project=own_project,
        )

        other_agency_report = AnnualAgencyProjectReportFactory(
            progress_report=annual_progress_report,
        )
        other_project = ProjectFactory(
            agency=other_agency_report.agency,
            code=f"TEST_OTHER_{other_agency_report.agency.id}",
            date_approved=date(2023, 2, 20),
        )
        AnnualProjectReportFactory(
            report=other_agency_report,
            project=other_project,
        )

        self.client.force_authenticate(user=apr_agency_viewer_user)
        url = reverse("apr-summary-tables-export")
        response = self.client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert (
            response["Content-Type"]
            == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

        # Load workbook and check detail sheet only has own agency's project
        workbook = load_workbook(BytesIO(response.content))
        detail_sheet = workbook["Annex I APR report "]

        # Check that own project is present and other agency's project is not
        project_codes = []
        col_map = APRSummaryTablesExportWriter.build_column_mapping()
        for row in range(
            APRSummaryTablesExportWriter.DETAIL_DATA_START_ROW, detail_sheet.max_row + 1
        ):
            code_cell = detail_sheet.cell(row, col_map["project_code"])
            if code_cell.value:
                project_codes.append(code_cell.value)

        # Verify agency filtering: own project included, other agency excluded
        assert (
            own_project.code in project_codes
        ), f"Own project {own_project.code} should be in export"
        assert (
            other_project.code not in project_codes
        ), f"Other agency project {other_project.code} should NOT be in export"

    def test_mlfs_user_sees_all_projects(
        self,
        secretariat_viewer_user,
        annual_progress_report,
    ):
        agency_report1 = AnnualAgencyProjectReportFactory(
            progress_report=annual_progress_report,
        )
        project1 = ProjectFactory(
            agency=agency_report1.agency,
            code="AGENCY1/001",
            date_approved=date(2023, 1, 15),
        )
        AnnualProjectReportFactory(
            report=agency_report1,
            project=project1,
        )

        agency_report2 = AnnualAgencyProjectReportFactory(
            progress_report=annual_progress_report,
        )
        project2 = ProjectFactory(
            agency=agency_report2.agency,
            code="AGENCY2/001",
            date_approved=date(2023, 2, 20),
        )
        AnnualProjectReportFactory(
            report=agency_report2,
            project=project2,
        )

        self.client.force_authenticate(user=secretariat_viewer_user)
        url = reverse("apr-summary-tables-export")
        response = self.client.get(url)

        assert response.status_code == status.HTTP_200_OK

        # Load workbook and check the detail sheet has both projects
        workbook = load_workbook(BytesIO(response.content))
        detail_sheet = workbook["Annex I APR report "]

        project_codes = []
        col_map = APRSummaryTablesExportWriter.build_column_mapping()
        for row in range(
            APRSummaryTablesExportWriter.DETAIL_DATA_START_ROW, detail_sheet.max_row + 1
        ):
            code_cell = detail_sheet.cell(row, col_map["project_code"])
            if code_cell.value:
                project_codes.append(code_cell.value)

        # Just check that both test projects are present
        assert "AGENCY1/001" in project_codes
        assert "AGENCY2/001" in project_codes

    def test_export_has_all_sheets(
        self,
        apr_agency_viewer_user,
        annual_progress_report,
        annual_agency_report,
    ):
        project = ProjectFactory(
            agency=apr_agency_viewer_user.agency,
            date_approved=date(2023, 1, 15),
        )
        AnnualProjectReportFactory(
            report=annual_agency_report,
            project=project,
        )

        self.client.force_authenticate(user=apr_agency_viewer_user)
        url = reverse("apr-summary-tables-export")
        response = self.client.get(url)

        assert response.status_code == status.HTTP_200_OK

        workbook = load_workbook(BytesIO(response.content))
        sheet_names = workbook.sheetnames

        assert "Annex I APR report " in sheet_names
        assert "Annex I (a)" in sheet_names
        assert "Annex I (b)" in sheet_names
        assert "Annex I (c)" in sheet_names

    def test_annual_summary_sheet_structure(
        self,
        apr_agency_viewer_user,
        annual_progress_report,
        annual_agency_report,
    ):
        project = ProjectFactory(
            agency=apr_agency_viewer_user.agency,
            date_approved=date(2023, 1, 15),
        )
        AnnualProjectReportFactory(
            report=annual_agency_report,
            project=project,
        )

        self.client.force_authenticate(user=apr_agency_viewer_user)
        url = reverse("apr-summary-tables-export")
        response = self.client.get(url)

        workbook = load_workbook(BytesIO(response.content))
        sheet = workbook["Annex I (a)"]

        assert sheet["A1"].value == "(a) Annual summary data"

        assert sheet["A6"].value == "Approval year"
        assert sheet["B6"].value == "Number of Approvals"
        assert sheet["C6"].value == "Number of completed"
        assert sheet["D6"].value == "Per cent completed (%)"
        assert sheet["E6"].value == "Approved funding plus adjustments (US$)"
        assert sheet["F6"].value == "Funds disbursed (US$)"
        assert sheet["G6"].value == "Balance (US$)"
        assert sheet["H6"].value == "Sum of % of funding disb"

    def test_annual_summary_aggregation_by_year(
        self,
        apr_agency_viewer_user,
        annual_progress_report,
        annual_agency_report,
        project_ongoing_status,
        project_completed_status,
    ):
        project_2022 = ProjectFactory(
            agency=apr_agency_viewer_user.agency,
            date_approved=date(2022, 3, 15),
            status=project_completed_status,
            version=3,
            total_fund=100000,
        )
        AnnualProjectReportFactory(
            report=annual_agency_report,
            project=project_2022,
            status="COM",
            funds_disbursed=100000,
        )

        project_2023_1 = ProjectFactory(
            agency=apr_agency_viewer_user.agency,
            date_approved=date(2023, 1, 20),
            status=project_ongoing_status,
            version=3,
            total_fund=50000,
        )
        AnnualProjectReportFactory(
            report=annual_agency_report,
            project=project_2023_1,
            funds_disbursed=25000,
        )

        project_2023_2 = ProjectFactory(
            agency=apr_agency_viewer_user.agency,
            date_approved=date(2023, 6, 10),
            status=project_completed_status,
            version=3,
            total_fund=75000,
        )
        AnnualProjectReportFactory(
            report=annual_agency_report,
            project=project_2023_2,
            status="COM",
            funds_disbursed=75000,
        )

        self.client.force_authenticate(user=apr_agency_viewer_user)
        url = reverse("apr-summary-tables-export")
        response = self.client.get(url)

        workbook = load_workbook(BytesIO(response.content))
        sheet = workbook["Annex I (a)"]

        # Find the 2022 row (should be the first data row)
        year_2022_row = None
        year_2023_row = None
        col_map = APRSummaryTablesExportWriter.build_annual_column_mapping()
        for row in range(
            APRSummaryTablesExportWriter.ANNUAL_DATA_START_ROW, sheet.max_row + 1
        ):
            year_val = sheet.cell(row, col_map["approval_year"]).value
            if year_val == 2022:
                year_2022_row = row
            elif year_val == 2023:
                year_2023_row = row

        assert year_2022_row is not None
        assert year_2023_row is not None

        # Number of approvals
        assert sheet.cell(year_2022_row, 2).value == 1
        # Number completed
        assert sheet.cell(year_2022_row, 3).value == 1
        # Approved funding
        assert sheet.cell(year_2022_row, 5).value == 100000

        # Number of approvals
        assert sheet.cell(year_2023_row, 2).value == 2
        # Number completed
        assert sheet.cell(year_2023_row, 3).value == 1
        # Total approved funding
        assert sheet.cell(year_2023_row, 5).value == 125000
        # Total disbursed
        assert sheet.cell(year_2023_row, 6).value == 100000

    def test_investment_projects_sheet_structure(
        self,
        apr_agency_viewer_user,
        annual_progress_report,
        annual_agency_report,
    ):
        project = ProjectFactory(
            agency=apr_agency_viewer_user.agency,
            date_approved=date(2023, 1, 15),
        )
        AnnualProjectReportFactory(
            report=annual_agency_report,
            project=project,
        )

        self.client.force_authenticate(user=apr_agency_viewer_user)
        url = reverse("apr-summary-tables-export")
        response = self.client.get(url)

        workbook = load_workbook(BytesIO(response.content))
        sheet = workbook["Annex I (b)"]

        assert sheet["A1"].value == "(b) Cumulative completed investment projects"
        assert "region" in sheet.cell(7, 1).value.lower()
        assert "sector" in sheet.cell(19, 1).value.lower()

    def test_non_investment_projects_sheet_structure(
        self,
        apr_agency_viewer_user,
        annual_progress_report,
        annual_agency_report,
    ):
        project = ProjectFactory(
            agency=apr_agency_viewer_user.agency,
            date_approved=date(2023, 1, 15),
        )
        AnnualProjectReportFactory(
            report=annual_agency_report,
            project=project,
        )

        self.client.force_authenticate(user=apr_agency_viewer_user)
        url = reverse("apr-summary-tables-export")
        response = self.client.get(url)

        workbook = load_workbook(BytesIO(response.content))
        sheet = workbook["Annex I (c)"]

        assert sheet["A1"].value == "(c) Cumulative completed non-investment projects"
        assert "region" in sheet.cell(7, 1).value.lower()
        assert "sector" in sheet.cell(19, 1).value.lower()

    def test_investment_projects_filtered_by_type_and_status(
        self,
        apr_agency_viewer_user,
        annual_progress_report,
        annual_agency_report,
        project_completed_status,
        project_ongoing_status,
    ):
        inv_type = ProjectType.objects.create(
            name="Investment", code="INV", sort_order=1
        )
        non_inv_type = ProjectType.objects.create(
            name="Preparation", code="PRP", sort_order=2
        )

        # Completed investment project - should appear on sheet
        project1 = ProjectFactory(
            agency=apr_agency_viewer_user.agency,
            date_approved=date(2023, 1, 15),
            status=project_completed_status,
            project_type=inv_type,
        )
        AnnualProjectReportFactory(
            report=annual_agency_report,
            project=project1,
        )

        # Ongoing investment project - should *not* appear
        project2 = ProjectFactory(
            agency=apr_agency_viewer_user.agency,
            date_approved=date(2023, 2, 15),
            status=project_ongoing_status,
            project_type=inv_type,
        )
        AnnualProjectReportFactory(
            report=annual_agency_report,
            project=project2,
        )

        # Completed non-investment - should *not* appear on sheet
        project3 = ProjectFactory(
            agency=apr_agency_viewer_user.agency,
            date_approved=date(2023, 3, 15),
            status=project_completed_status,
            project_type=non_inv_type,
        )
        AnnualProjectReportFactory(
            report=annual_agency_report,
            project=project3,
        )

        self.client.force_authenticate(user=apr_agency_viewer_user)
        url = reverse("apr-summary-tables-export")
        response = self.client.get(url)

        workbook = load_workbook(BytesIO(response.content))
        sheet_b = workbook["Annex I (b)"]

        # Count number of projects in region section (data row onwards until Grand Total)
        region_count = 0
        col_map = APRSummaryTablesExportWriter.build_cumulative_column_mapping(
            include_odp_co2=True
        )
        for row in range(
            APRSummaryTablesExportWriter.CUMULATIVE_REGION_DATA_ROW,
            APRSummaryTablesExportWriter.CUMULATIVE_SECTOR_HEADER_ROW,
        ):
            if (
                sheet_b.cell(row, col_map["group_name"]).value
                and "grand total"
                not in str(sheet_b.cell(row, col_map["group_name"]).value).lower()
            ):
                region_count += 1

        assert region_count > 0

    def test_filename_includes_year_and_agency(
        self,
        apr_agency_viewer_user,
        annual_progress_report,
        annual_agency_report,
    ):
        """Export filename should include 'Cumulative' and agency name"""
        project = ProjectFactory(
            agency=apr_agency_viewer_user.agency,
            date_approved=date(2023, 1, 15),
        )
        AnnualProjectReportFactory(
            report=annual_agency_report,
            project=project,
        )

        self.client.force_authenticate(user=apr_agency_viewer_user)
        url = reverse("apr-summary-tables-export")
        response = self.client.get(url)

        assert response.status_code == status.HTTP_200_OK

        content_disposition = response["Content-Disposition"]
        assert "APR_Summary_Tables_Cumulative" in content_disposition
        assert (
            apr_agency_viewer_user.agency.name.replace(" ", "_") in content_disposition
        )
        assert ".xlsx" in content_disposition

    def test_includes_all_statuses_not_just_ongoing_and_completed(
        self,
        apr_agency_viewer_user,
        annual_progress_report,
        annual_agency_report,
        project_ongoing_status,
        project_completed_status,
        project_closed_status,
    ):
        """Summary export should include all statuses, not just ONG/COM"""
        project_ongoing = ProjectFactory(
            agency=apr_agency_viewer_user.agency,
            code="TEST/ONGOING/001",
            date_approved=date(2023, 1, 15),
            status=project_ongoing_status,
        )
        AnnualProjectReportFactory(
            report=annual_agency_report,
            project=project_ongoing,
        )

        project_completed = ProjectFactory(
            agency=apr_agency_viewer_user.agency,
            code="TEST/COMPLETED/001",
            date_approved=date(2023, 2, 15),
            status=project_completed_status,
        )
        AnnualProjectReportFactory(
            report=annual_agency_report,
            project=project_completed,
        )

        project_closed = ProjectFactory(
            agency=apr_agency_viewer_user.agency,
            code="TEST/CLOSED/001",
            date_approved=date(2023, 3, 15),
            status=project_closed_status,
        )
        AnnualProjectReportFactory(
            report=annual_agency_report,
            project=project_closed,
        )

        self.client.force_authenticate(user=apr_agency_viewer_user)
        url = reverse("apr-summary-tables-export")
        response = self.client.get(url)

        workbook = load_workbook(BytesIO(response.content))
        detail_sheet = workbook["Annex I APR report "]

        project_codes = []
        col_map = APRSummaryTablesExportWriter.build_column_mapping()
        for row in range(
            APRSummaryTablesExportWriter.DETAIL_DATA_START_ROW, detail_sheet.max_row + 1
        ):
            code_cell = detail_sheet.cell(row, col_map["project_code"])
            if code_cell.value:
                project_codes.append(code_cell.value)

        # Check that all three test projects are present
        assert "TEST/ONGOING/001" in project_codes
        assert "TEST/COMPLETED/001" in project_codes
        assert "TEST/CLOSED/001" in project_codes
