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
from core.models.project_metadata import ProjectCluster, ProjectType

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

        # Check I.1 summary only counts the agency's own project
        workbook = load_workbook(BytesIO(response.content))
        summary_sheet = workbook[APRSummaryTablesExportWriter.SHEET_SUMMARY]

        # B4 = Number of Approvals — should be 1 (only own project)
        assert summary_sheet.cell(4, 2).value == 1

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

        # Check I.1 summary counts both projects
        workbook = load_workbook(BytesIO(response.content))
        summary_sheet = workbook[APRSummaryTablesExportWriter.SHEET_SUMMARY]

        # B4 = Number of Approvals — should be 2 (both projects)
        assert summary_sheet.cell(4, 2).value == 2

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

        assert APRSummaryTablesExportWriter.SHEET_SUMMARY in sheet_names
        assert APRSummaryTablesExportWriter.SHEET_SUMMARY_CLUSTER in sheet_names
        assert APRSummaryTablesExportWriter.SHEET_COMPLETION_YEAR in sheet_names
        assert "Annex I (a)" in sheet_names
        assert "Annex I (b)" in sheet_names
        assert "Annex I (c)" in sheet_names
        assert "Annex I (d)" in sheet_names
        assert "Annex I (e)" in sheet_names
        assert "Annex I (f)" in sheet_names
        assert "Annex I (g)" in sheet_names

    def test_no_hidden_sheets_in_export(
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
        for sheet_name in workbook.sheetnames:
            assert workbook[sheet_name].sheet_state != "hidden"

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

        # Headers are now at row 3
        assert "Year approval" in str(sheet["A3"].value)
        assert "Number of Approvals" in str(sheet["B3"].value)
        assert "Number of completed" in str(sheet["C3"].value)
        assert "Per cent completed" in str(sheet["D3"].value)
        assert "Approved funding" in str(sheet["E3"].value)
        assert "Funds disbursed" in str(sheet["F3"].value)
        assert "Balance" in str(sheet["G3"].value)

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

        # Find the 2022 and 2023 data rows (data starts at row 4)
        year_2022_row = None
        year_2023_row = None
        col_map = APRSummaryTablesExportWriter.build_annual_column_mapping()
        for row in range(
            APRSummaryTablesExportWriter.DATA_START_ROW, sheet.max_row + 1
        ):
            year_val = sheet.cell(row, col_map["approval_year"]).value
            if year_val == 2022:
                year_2022_row = row
            elif year_val == 2023:
                year_2023_row = row

        assert year_2022_row is not None
        assert year_2023_row is not None

        # Number of approvals, number completed, approved funding
        assert sheet.cell(year_2022_row, 2).value == 1
        assert sheet.cell(year_2022_row, 3).value == 1
        assert sheet.cell(year_2022_row, 5).value == 100000

        assert sheet.cell(year_2023_row, 2).value == 2
        assert sheet.cell(year_2023_row, 3).value == 1
        assert sheet.cell(year_2023_row, 5).value == 125000
        assert sheet.cell(year_2023_row, 6).value == 100000

    def test_annual_summary_has_total_row(
        self,
        apr_agency_viewer_user,
        annual_progress_report,
        annual_agency_report,
        project_completed_status,
    ):
        project = ProjectFactory(
            agency=apr_agency_viewer_user.agency,
            date_approved=date(2023, 1, 15),
            status=project_completed_status,
            version=3,
            total_fund=100000,
        )
        AnnualProjectReportFactory(
            report=annual_agency_report,
            project=project,
            status="COM",
            funds_disbursed=80000,
        )

        self.client.force_authenticate(user=apr_agency_viewer_user)
        url = reverse("apr-summary-tables-export")
        response = self.client.get(url)

        workbook = load_workbook(BytesIO(response.content))
        sheet = workbook["Annex I (a)"]

        # Find the Total row
        total_row = None
        for row in range(
            APRSummaryTablesExportWriter.DATA_START_ROW, sheet.max_row + 1
        ):
            if sheet.cell(row, 1).value == "Total":
                total_row = row
                break

        assert total_row is not None
        # Approved
        assert sheet.cell(total_row, 2).value == 1
        # Completed
        assert sheet.cell(total_row, 3).value == 1

    def test_investment_projects_sheet_flat_layout(
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

        # Header at row 3
        assert "Item" in str(sheet.cell(3, 1).value)

        # Flat layout: Total at row 4, Region label, then Sector label
        assert sheet.cell(4, 1).value == "Total"
        # Find Region and Sector labels
        region_found = False
        sector_found = False
        for row in range(5, sheet.max_row + 1):
            val = sheet.cell(row, 1).value
            if val and "Region" in str(val):
                region_found = True
            if val and "Sector" in str(val):
                sector_found = True
        assert region_found
        assert sector_found

    def test_non_investment_projects_sheet_flat_layout(
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
        assert sheet.cell(4, 1).value == "Total"

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

        # Completed investment project - should appear on sheet (b)
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

        # Ongoing investment project - should *not* appear on sheet (b)
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

        # Completed non-investment - should *not* appear on sheet (b)
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

        # Total row (row 4) should show 1 completed investment project
        total_count = sheet_b.cell(4, 2).value
        assert total_count == 1

    def test_filename_includes_year_and_agency(
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

        content_disposition = response["Content-Disposition"]
        assert "APR_Summary_Tables_Cumulative" in content_disposition
        assert (
            apr_agency_viewer_user.agency.name.replace(" ", "_") in content_disposition
        )
        assert ".xlsx" in content_disposition

    def test_includes_all_statuses_in_summary(
        self,
        apr_agency_viewer_user,
        annual_progress_report,
        annual_agency_report,
        project_ongoing_status,
        project_completed_status,
        project_closed_status,
    ):
        AnnualProjectReportFactory(
            report=annual_agency_report,
            project=ProjectFactory(
                agency=apr_agency_viewer_user.agency,
                date_approved=date(2023, 1, 15),
                status=project_ongoing_status,
            ),
        )

        AnnualProjectReportFactory(
            report=annual_agency_report,
            project=ProjectFactory(
                agency=apr_agency_viewer_user.agency,
                date_approved=date(2023, 2, 15),
                status=project_completed_status,
            ),
        )

        AnnualProjectReportFactory(
            report=annual_agency_report,
            project=ProjectFactory(
                agency=apr_agency_viewer_user.agency,
                date_approved=date(2023, 3, 15),
                status=project_closed_status,
            ),
        )

        self.client.force_authenticate(user=apr_agency_viewer_user)
        url = reverse("apr-summary-tables-export")
        response = self.client.get(url)

        workbook = load_workbook(BytesIO(response.content))
        summary_sheet = workbook[APRSummaryTablesExportWriter.SHEET_SUMMARY]

        # B4 = Number of Approvals — should include all statuses
        num_approvals = summary_sheet.cell(4, 2).value
        assert num_approvals == 3

    # ── New sheet tests ───────────────────────────────────────────────────

    def test_summary_data_sheet_structure(
        self,
        apr_agency_viewer_user,
        annual_progress_report,
        annual_agency_report,
        project_completed_status,
    ):
        project = ProjectFactory(
            agency=apr_agency_viewer_user.agency,
            date_approved=date(2023, 1, 15),
            status=project_completed_status,
            version=3,
            total_fund=100000,
        )
        AnnualProjectReportFactory(
            report=annual_agency_report,
            project=project,
            status="COM",
            funds_disbursed=80000,
            consumption_phased_out_odp=10,
            production_phased_out_odp=5,
            consumption_phased_out_mt=100,
            production_phased_out_mt=50,
            consumption_phased_out_co2=1000,
            production_phased_out_co2=500,
        )

        self.client.force_authenticate(user=apr_agency_viewer_user)
        url = reverse("apr-summary-tables-export")
        response = self.client.get(url)

        workbook = load_workbook(BytesIO(response.content))
        sheet = workbook[APRSummaryTablesExportWriter.SHEET_SUMMARY]

        assert "Summary data" in str(sheet["A1"].value)

        # Row 4: Number of Approvals
        assert sheet.cell(4, 2).value == 1
        # Row 5: Number of completed
        assert sheet.cell(5, 2).value == 1
        # Row 7: Total funds disbursed
        assert sheet.cell(7, 2).value == 80000
        # Row 9: Total actual phase-out (ODP) = consumption + production
        assert sheet.cell(9, 2).value == 15  # 10 + 5
        # Row 11: Total actual phase-out (MT)
        assert sheet.cell(11, 2).value == 150  # 100 + 50
        # Row 13: Total actual phase-out (CO2-eq)
        assert sheet.cell(13, 2).value == 1500  # 1000 + 500

    def test_summary_by_cluster_sheet(
        self,
        apr_agency_viewer_user,
        annual_progress_report,
        annual_agency_report,
        project_completed_status,
        project_ongoing_status,
    ):
        cluster1 = ProjectCluster.objects.create(name="HPMP stage I", sort_order=1)
        cluster2 = ProjectCluster.objects.create(name="KIP stage I", sort_order=2)

        project1 = ProjectFactory(
            agency=apr_agency_viewer_user.agency,
            date_approved=date(2023, 1, 15),
            status=project_completed_status,
            cluster=cluster1,
        )
        AnnualProjectReportFactory(
            report=annual_agency_report,
            project=project1,
            status="COM",
            funds_disbursed=100000,
        )

        project2 = ProjectFactory(
            agency=apr_agency_viewer_user.agency,
            date_approved=date(2023, 2, 15),
            status=project_ongoing_status,
            cluster=cluster2,
        )
        AnnualProjectReportFactory(
            report=annual_agency_report,
            project=project2,
            funds_disbursed=50000,
        )

        self.client.force_authenticate(user=apr_agency_viewer_user)
        url = reverse("apr-summary-tables-export")
        response = self.client.get(url)

        workbook = load_workbook(BytesIO(response.content))
        sheet = workbook[APRSummaryTablesExportWriter.SHEET_SUMMARY_CLUSTER]

        assert "Summary data by cluster" in str(sheet["A1"].value)

        # Data rows start at row 5
        cluster_names = []
        for row in range(5, sheet.max_row + 1):
            val = sheet.cell(row, 1).value
            if val and val != "Total":
                cluster_names.append(val)
            elif val == "Total":
                break

        assert "HPMP stage I" in cluster_names
        assert "KIP stage I" in cluster_names

    def test_project_completion_year_sheet(
        self,
        apr_agency_viewer_user,
        annual_progress_report,
        annual_agency_report,
        project_completed_status,
    ):
        cluster = ProjectCluster.objects.create(name="HPMP stage I", sort_order=1)

        project = ProjectFactory(
            agency=apr_agency_viewer_user.agency,
            date_approved=date(2023, 1, 15),
            status=project_completed_status,
            cluster=cluster,
        )
        AnnualProjectReportFactory(
            report=annual_agency_report,
            project=project,
            status="COM",
            consumption_phased_out_odp=10,
            production_phased_out_odp=5,
            consumption_phased_out_mt=100,
            production_phased_out_mt=50,
            consumption_phased_out_co2=1000,
            production_phased_out_co2=500,
        )

        self.client.force_authenticate(user=apr_agency_viewer_user)
        report_year = annual_progress_report.year
        url = reverse("apr-summary-tables-export") + f"?year={report_year}"
        response = self.client.get(url)

        workbook = load_workbook(BytesIO(response.content))
        sheet = workbook[APRSummaryTablesExportWriter.SHEET_COMPLETION_YEAR]

        assert "Project completion" in str(sheet["A1"].value)

        # Data rows start at row 5
        found_cluster = False
        for row in range(5, sheet.max_row + 1):
            if sheet.cell(row, 1).value == "HPMP stage I":
                found_cluster = True
                assert sheet.cell(row, 2).value == 1  # num completed
                assert sheet.cell(row, 3).value == 15  # ODP: 10 + 5
                assert sheet.cell(row, 4).value == 150  # MT: 100 + 50
                assert sheet.cell(row, 5).value == 1500  # CO2: 1000 + 500
                break

        assert found_cluster
