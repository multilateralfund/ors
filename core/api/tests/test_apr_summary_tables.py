"""
Tests for APR Summary Tables Export functionality.
"""

from datetime import date
from io import BytesIO

import pytest
from django.urls import reverse
from openpyxl import load_workbook
from rest_framework import status

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
        response = self.client.get(url, {"year": 2024})
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_requires_apr_view_permission(self, user):
        self.client.force_authenticate(user=user)
        url = reverse("apr-summary-tables-export")
        response = self.client.get(url, {"year": 2024})
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_requires_year_parameter(self, apr_agency_viewer_user):
        self.client.force_authenticate(user=apr_agency_viewer_user)
        url = reverse("apr-summary-tables-export")
        response = self.client.get(url)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "year" in response.data

    def test_year_must_be_valid_integer(self, apr_agency_viewer_user):
        self.client.force_authenticate(user=apr_agency_viewer_user)
        url = reverse("apr-summary-tables-export")
        response = self.client.get(url, {"year": "invalid"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "year" in response.data

    def test_agency_user_sees_only_own_projects(
        self,
        apr_agency_viewer_user,
        annual_progress_report,
        annual_agency_report,
    ):
        """Agency user should only see their own agency's APRs"""
        # Create APR for user's agency
        own_project = ProjectFactory(
            agency=apr_agency_viewer_user.agency,
            code="OWN/001",
            date_approved=date(2023, 1, 15),
        )
        AnnualProjectReportFactory(
            report=annual_agency_report,
            project=own_project,
        )

        # Create APR for different agency
        other_agency_report = AnnualAgencyProjectReportFactory(
            progress_report=annual_progress_report,
        )
        other_project = ProjectFactory(
            agency=other_agency_report.agency,
            code="OTHER/001",
            date_approved=date(2023, 2, 20),
        )
        AnnualProjectReportFactory(
            report=other_agency_report,
            project=other_project,
        )

        self.client.force_authenticate(user=apr_agency_viewer_user)
        url = reverse("apr-summary-tables-export")
        response = self.client.get(url, {"year": annual_progress_report.year})

        assert response.status_code == status.HTTP_200_OK
        assert (
            response["Content-Type"]
            == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

        # Load workbook and check detail sheet only has own agency's project
        workbook = load_workbook(BytesIO(response.content))
        detail_sheet = workbook["Annex I APR report"]

        # Check that only one project is in the detail sheet
        # Headers at row 2, data starts at row 3
        # project_code is column 3 (index 2 in excel_fields)
        project_codes = []
        for row in range(3, detail_sheet.max_row + 1):
            code_cell = detail_sheet.cell(row, 3)  # project_code is column 3
            if code_cell.value:
                project_codes.append(code_cell.value)

        assert len(project_codes) == 1
        assert "OWN/001" in project_codes
        assert "OTHER/001" not in project_codes

    def test_mlfs_user_sees_all_projects(
        self,
        secretariat_viewer_user,
        annual_progress_report,
    ):
        """MLFS user should see all agencies' APRs"""
        # Create APRs for multiple agencies
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
        response = self.client.get(url, {"year": annual_progress_report.year})

        assert response.status_code == status.HTTP_200_OK

        # Load workbook and check detail sheet has both projects
        workbook = load_workbook(BytesIO(response.content))
        detail_sheet = workbook["Annex I APR report"]

        project_codes = []
        for row in range(3, detail_sheet.max_row + 1):
            code_cell = detail_sheet.cell(row, 3)  # project_code is column 3
            if code_cell.value:
                project_codes.append(code_cell.value)

        assert len(project_codes) == 2
        assert "AGENCY1/001" in project_codes
        assert "AGENCY2/001" in project_codes

    def test_export_has_all_sheets(
        self,
        apr_agency_viewer_user,
        annual_progress_report,
        annual_agency_report,
    ):
        """Export should contain all 4 sheets"""
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
        response = self.client.get(url, {"year": annual_progress_report.year})

        assert response.status_code == status.HTTP_200_OK

        workbook = load_workbook(BytesIO(response.content))
        sheet_names = workbook.sheetnames

        assert "Annex I APR report" in sheet_names
        assert "Annex I (a)" in sheet_names
        assert "Annex I (b)" in sheet_names
        assert "Annex I (c)" in sheet_names

    def test_annual_summary_sheet_structure(
        self,
        apr_agency_viewer_user,
        annual_progress_report,
        annual_agency_report,
    ):
        """Sheet (a) should have correct headers and structure"""
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
        response = self.client.get(url, {"year": annual_progress_report.year})

        workbook = load_workbook(BytesIO(response.content))
        sheet = workbook["Annex I (a)"]

        # Check title
        assert sheet["A1"].value == "(a) Annual summary data"

        # Check headers at row 6
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
        """Sheet (a) should aggregate data by approval year"""
        # Create projects with different approval years
        # Create projects with version 3 for proper funding calculations
        project_2022 = ProjectFactory(
            agency=apr_agency_viewer_user.agency,
            date_approved=date(2022, 3, 15),
            status=project_completed_status,
            version=3,
            total_fund=100000,
        )
        _ = AnnualProjectReportFactory(
            report=annual_agency_report,
            project=project_2022,
            funds_disbursed=100000,
        )

        project_2023_1 = ProjectFactory(
            agency=apr_agency_viewer_user.agency,
            date_approved=date(2023, 1, 20),
            status=project_ongoing_status,
            version=3,
            total_fund=50000,
        )
        _ = AnnualProjectReportFactory(
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
        _ = AnnualProjectReportFactory(
            report=annual_agency_report,
            project=project_2023_2,
            funds_disbursed=75000,
        )

        self.client.force_authenticate(user=apr_agency_viewer_user)
        url = reverse("apr-summary-tables-export")
        response = self.client.get(url, {"year": annual_progress_report.year})

        workbook = load_workbook(BytesIO(response.content))
        sheet = workbook["Annex I (a)"]

        # Find 2022 row (should be first data row at row 7)
        year_2022_row = None
        year_2023_row = None
        for row in range(7, sheet.max_row + 1):
            year_val = sheet.cell(row, 1).value
            if year_val == 2022:
                year_2022_row = row
            elif year_val == 2023:
                year_2023_row = row

        assert year_2022_row is not None
        assert year_2023_row is not None

        # Check 2022 aggregation
        assert sheet.cell(year_2022_row, 2).value == 1  # Number of approvals
        assert sheet.cell(year_2022_row, 3).value == 1  # Number completed
        assert sheet.cell(year_2022_row, 5).value == 100000  # Approved funding

        # Check 2023 aggregation
        assert sheet.cell(year_2023_row, 2).value == 2  # Number of approvals
        assert sheet.cell(year_2023_row, 3).value == 1  # Number completed
        assert sheet.cell(year_2023_row, 5).value == 125000  # Total approved funding
        assert sheet.cell(year_2023_row, 6).value == 100000  # Total disbursed

    def test_investment_projects_sheet_structure(
        self,
        apr_agency_viewer_user,
        annual_progress_report,
        annual_agency_report,
    ):
        """Sheet (b) should have correct structure for investment projects"""
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
        response = self.client.get(url, {"year": annual_progress_report.year})

        workbook = load_workbook(BytesIO(response.content))
        sheet = workbook["Annex I (b)"]

        # Check title
        assert sheet["A1"].value == "(b) Cumulative completed investment projects"

        # Check Region section header at row 7
        assert "region" in sheet.cell(7, 1).value.lower()

        # Check Sector section header at row 19
        assert "sector" in sheet.cell(19, 1).value.lower()

    def test_non_investment_projects_sheet_structure(
        self,
        apr_agency_viewer_user,
        annual_progress_report,
        annual_agency_report,
    ):
        """Sheet (c) should have correct structure for non-investment projects"""
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
        response = self.client.get(url, {"year": annual_progress_report.year})

        workbook = load_workbook(BytesIO(response.content))
        sheet = workbook["Annex I (c)"]

        # Check title
        assert sheet["A1"].value == "(c) Cumulative completed non-investment projects"

        # Check Region section header at row 7
        assert "region" in sheet.cell(7, 1).value.lower()

        # Check Sector section header at row 19
        assert "sector" in sheet.cell(19, 1).value.lower()

    def test_investment_projects_filtered_by_type_and_status(
        self,
        apr_agency_viewer_user,
        annual_progress_report,
        annual_agency_report,
        project_completed_status,
        project_ongoing_status,
    ):
        """Sheet (b) should only include completed investment projects"""
        # Create investment and non-investment project types
        inv_type = ProjectType.objects.create(
            name="Investment", code="INV", sort_order=1
        )
        non_inv_type = ProjectType.objects.create(
            name="Preparation", code="PRP", sort_order=2
        )

        # Completed investment - should appear
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

        # Ongoing investment - should NOT appear
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

        # Completed non-investment - should NOT appear
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
        response = self.client.get(url, {"year": annual_progress_report.year})

        workbook = load_workbook(BytesIO(response.content))
        sheet_b = workbook["Annex I (b)"]

        # Count number of projects in region section (row 8 onwards until Grand Total)
        # Check if there's data in the region section
        region_count = 0
        for row in range(8, 19):  # Before Sector section
            if (
                sheet_b.cell(row, 1).value
                and "grand total" not in str(sheet_b.cell(row, 1).value).lower()
            ):
                region_count += 1

        # Should have at least one row for the region aggregation
        assert region_count > 0

    def test_filename_includes_year_and_agency(
        self,
        apr_agency_viewer_user,
        annual_progress_report,
        annual_agency_report,
    ):
        """Export filename should include year and agency name"""
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
        response = self.client.get(url, {"year": annual_progress_report.year})

        assert response.status_code == status.HTTP_200_OK

        content_disposition = response["Content-Disposition"]
        assert (
            f"APR_Summary_Tables_{annual_progress_report.year}" in content_disposition
        )
        assert (
            apr_agency_viewer_user.agency.name.replace(" ", "_") in content_disposition
        )
        assert ".xlsx" in content_disposition

    def test_mlfs_filename_without_agency(
        self,
        secretariat_viewer_user,
        annual_progress_report,
    ):
        """MLFS export filename should not include agency name"""
        agency_report = AnnualAgencyProjectReportFactory(
            progress_report=annual_progress_report,
        )
        project = ProjectFactory(
            agency=agency_report.agency,
            date_approved=date(2023, 1, 15),
        )
        AnnualProjectReportFactory(
            report=agency_report,
            project=project,
        )

        self.client.force_authenticate(user=secretariat_viewer_user)
        url = reverse("apr-summary-tables-export")
        response = self.client.get(url, {"year": annual_progress_report.year})

        assert response.status_code == status.HTTP_200_OK

        content_disposition = response["Content-Disposition"]
        assert (
            f"APR_Summary_Tables_{annual_progress_report.year}.xlsx"
            in content_disposition
        )

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
        # Create projects with different statuses
        project_ongoing = ProjectFactory(
            agency=apr_agency_viewer_user.agency,
            date_approved=date(2023, 1, 15),
            status=project_ongoing_status,
        )
        AnnualProjectReportFactory(
            report=annual_agency_report,
            project=project_ongoing,
        )

        project_completed = ProjectFactory(
            agency=apr_agency_viewer_user.agency,
            date_approved=date(2023, 2, 15),
            status=project_completed_status,
        )
        AnnualProjectReportFactory(
            report=annual_agency_report,
            project=project_completed,
        )

        project_closed = ProjectFactory(
            agency=apr_agency_viewer_user.agency,
            date_approved=date(2023, 3, 15),
            status=project_closed_status,
        )
        AnnualProjectReportFactory(
            report=annual_agency_report,
            project=project_closed,
        )

        self.client.force_authenticate(user=apr_agency_viewer_user)
        url = reverse("apr-summary-tables-export")
        response = self.client.get(url, {"year": annual_progress_report.year})

        workbook = load_workbook(BytesIO(response.content))
        detail_sheet = workbook["Annex I APR report"]

        # Count projects in detail sheet
        project_count = 0
        for row in range(3, detail_sheet.max_row + 1):
            if detail_sheet.cell(row, 1).value:
                project_count += 1

        # Should have all 3 projects
        assert project_count == 3

        # Check annual summary includes all 3 in approval count
        annual_sheet = workbook["Annex I (a)"]
        for row in range(7, annual_sheet.max_row + 1):
            year_val = annual_sheet.cell(row, 1).value
            if year_val == 2023:
                num_approvals = annual_sheet.cell(row, 2).value
                assert num_approvals == 3
                break
