from datetime import datetime
from io import BytesIO
from openpyxl import load_workbook

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status

from core.api.export.annual_project_report import APRExportWriter
from core.api.tests.base import BaseTest
from core.models import (
    AnnualAgencyProjectReport,
    AnnualProjectReport,
    AnnualProjectReportFile,
)
from core.api.tests.factories import (
    AgencyFactory,
    AnnualProjectReportFactory,
    AnnualAgencyProjectReportFactory,
    AnnualProjectReportFileFactory,
    ProjectFactory,
)

# pylint: disable=W0221,W0613,C0302


@pytest.mark.django_db
class TestAPRWorkspaceView(BaseTest):
    def test_without_login(self, apr_year):
        self.client.force_authenticate(user=None)
        url = reverse("apr-workspace", kwargs={"year": apr_year})
        response = self.client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_get_workspace_creates_agency_report(
        self, agency_viewer_user, apr_year, agency
    ):
        """
        An agency report is created (if not existing) upon accessing the workspace view.
        Test that this is happening.
        """

        self.client.force_authenticate(user=agency_viewer_user)

        url = reverse("apr-workspace", kwargs={"year": apr_year})
        response = self.client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["agency_id"] == agency.id
        assert response.data["progress_report_year"] == apr_year
        assert (
            response.data["status"] == AnnualAgencyProjectReport.SubmissionStatus.DRAFT
        )

        # Check that a database record was created
        assert AnnualAgencyProjectReport.objects.filter(
            agency=agency, progress_report__year=apr_year
        ).exists()

    def test_get_workspace_creates_project_reports(
        self, agency_viewer_user, apr_year, multiple_projects_for_apr
    ):
        """
        Project reports are created (if not existing) upon accessing the workspace view.
        Test that this is happening.
        """
        self.client.force_authenticate(user=agency_viewer_user)

        url = reverse("apr-workspace", kwargs={"year": apr_year})
        response = self.client.get(url)

        assert response.status_code == status.HTTP_200_OK

        # Call should return 5 project reports (3 ongoing, 2 completed)
        assert response.data["total_projects"] == len(multiple_projects_for_apr)
        assert len(response.data["project_reports"]) == 5

    def test_get_workspace_requires_apr_view_permission(self, user, apr_year):
        self.client.force_authenticate(user=user)

        url = reverse("apr-workspace", kwargs={"year": apr_year})
        response = self.client.get(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_get_workspace_filters_by_status(
        self, agency_viewer_user, apr_year, multiple_projects_for_apr
    ):
        self.client.force_authenticate(user=agency_viewer_user)

        # Only filter by completed projects
        url = reverse("apr-workspace", kwargs={"year": apr_year})
        response = self.client.get(url, {"status": "COM"})

        assert response.status_code == status.HTTP_200_OK
        # Response should also include ONG projects, even if not selected
        assert response.data["total_projects"] == 5

    def test_get_workspace_idempotent(
        self, agency_viewer_user, apr_year, multiple_projects_for_apr
    ):
        """Test that multiple calls to workspace don't create duplicates."""
        self.client.force_authenticate(user=agency_viewer_user)
        url = reverse("apr-workspace", kwargs={"year": apr_year})

        # Call twice
        response1 = self.client.get(url)
        response2 = self.client.get(url)

        assert response1.status_code == status.HTTP_200_OK
        assert response2.status_code == status.HTTP_200_OK

        # both calls should return the same report, with no extra project report created
        assert response1.data["id"] == response2.data["id"]
        assert response1.data["total_projects"] == response2.data["total_projects"]
        assert (
            AnnualProjectReport.objects.filter(
                report__progress_report__year=apr_year
            ).count()
            == 5
        )


@pytest.mark.django_db
class TestAPRAgencyReportDetailView(BaseTest):
    def test_without_login(self, annual_agency_report):
        self.client.force_authenticate(user=None)
        url = reverse(
            "apr-detail",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )
        response = self.client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_get_agency_report_detail(
        self,
        agency_viewer_user,
        annual_agency_report,
        annual_project_report,
    ):
        self.client.force_authenticate(user=agency_viewer_user)

        url = reverse(
            "apr-detail",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )
        response = self.client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == annual_agency_report.id
        assert response.data["agency_id"] == annual_agency_report.agency.id
        assert len(response.data["project_reports"]) == 1
        assert response.data["project_reports"][0]["id"] == annual_project_report.id

    def test_get_agency_report_nested_data(
        self, agency_viewer_user, annual_agency_report, annual_project_report
    ):
        self.client.force_authenticate(user=agency_viewer_user)

        AnnualProjectReportFileFactory(report=annual_agency_report)

        url = reverse(
            "apr-detail",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )
        response = self.client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "project_reports" in response.data
        assert "files" in response.data
        assert len(response.data["files"]) == 1

    def test_get_agency_report_permission(self, user, annual_agency_report):
        self.client.force_authenticate(user=user)

        url = reverse(
            "apr-detail",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )
        response = self.client.get(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_get_agency_report_only_own_agency(
        self, agency_viewer_user, annual_progress_report
    ):
        # Create report for a different agency to check it can't be changed
        other_agency = AgencyFactory()
        other_report = AnnualAgencyProjectReportFactory(
            progress_report=annual_progress_report, agency=other_agency
        )

        self.client.force_authenticate(user=agency_viewer_user)

        url = reverse(
            "apr-detail",
            kwargs={
                "year": other_report.progress_report.year,
                "agency_id": other_report.agency.id,
            },
        )
        response = self.client.get(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_get_agency_report_superuser_can_access_all(
        self, admin_user, annual_agency_report
    ):
        self.client.force_authenticate(user=admin_user)

        url = reverse(
            "apr-detail",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )
        response = self.client.get(url)

        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestAPRBulkUpdateView(BaseTest):
    def test_without_login(self, annual_agency_report):
        self.client.force_authenticate(user=None)
        url = reverse(
            "apr-update",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )
        response = self.client.post(url, {}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_bulk_update_project_reports(
        self,
        agency_inputter_user,
        annual_agency_report,
        multiple_projects_for_apr,
    ):
        for project in multiple_projects_for_apr[:3]:
            AnnualProjectReportFactory(report=annual_agency_report, project=project)

        self.client.force_authenticate(user=agency_inputter_user)

        update_data = {
            "project_reports": [
                {
                    "project_code": multiple_projects_for_apr[0].code,
                    "funds_disbursed": 50000.0,
                    "date_first_disbursement": "2024-01-15",
                },
                {
                    "project_code": multiple_projects_for_apr[1].code,
                    "consumption_phased_out_odp": 25.5,
                    "last_year_remarks": "On track",
                },
            ]
        }

        url = reverse(
            "apr-update",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )
        response = self.client.post(url, update_data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["updated_count"] == 2
        assert response.data["error_count"] == 0

    def test_bulk_update_requires_edit_permission(
        self, agency_viewer_user, annual_agency_report
    ):
        self.client.force_authenticate(user=agency_viewer_user)

        url = reverse(
            "apr-update",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )
        response = self.client.post(url, {"project_reports": []}, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_bulk_update_submitted_reports(
        self,
        agency_inputter_user,
        mlfs_admin_user,
        annual_agency_report,
        annual_project_report,
    ):
        annual_agency_report.status = annual_agency_report.SubmissionStatus.SUBMITTED
        annual_agency_report.save()

        update_data = {
            "project_reports": [
                {
                    "project_code": annual_project_report.project.code,
                    "funds_disbursed": 50000.0,
                }
            ]
        }
        url = reverse(
            "apr-update",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )

        # Agency users should not be able to update, but mlfs ones should
        self.client.force_authenticate(user=agency_inputter_user)
        response = self.client.post(url, update_data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        self.client.force_authenticate(user=mlfs_admin_user)
        response = self.client.post(url, update_data, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["updated_count"] == 1

    def test_bulk_update_unlocked_reports(
        self,
        agency_inputter_user,
        annual_agency_report,
        annual_project_report,
    ):
        annual_agency_report.status = annual_agency_report.SubmissionStatus.SUBMITTED
        annual_agency_report.is_unlocked = True
        annual_agency_report.save()

        self.client.force_authenticate(user=agency_inputter_user)

        update_data = {
            "project_reports": [
                {
                    "project_code": annual_project_report.project.code,
                    "funds_disbursed": 50000.0,
                }
            ]
        }
        url = reverse(
            "apr-update",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )
        response = self.client.post(url, update_data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["updated_count"] == 1

    def test_bulk_update_endorsed_reports(
        self,
        agency_inputter_user,
        mlfs_admin_user,
        annual_agency_report,
        annual_project_report,
    ):
        annual_agency_report.progress_report.endorsed = True
        annual_agency_report.progress_report.save()

        update_data = {
            "project_reports": [
                {
                    "project_code": annual_project_report.project.code,
                    "funds_disbursed": 50000.0,
                }
            ]
        }
        url = reverse(
            "apr-update",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )

        self.client.force_authenticate(user=agency_inputter_user)
        response = self.client.post(url, update_data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        self.client.force_authenticate(user=mlfs_admin_user)
        response = self.client.post(url, update_data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_bulk_update_duplicate_codes(
        self,
        agency_inputter_user,
        annual_agency_report,
        annual_project_report,
    ):
        self.client.force_authenticate(user=agency_inputter_user)

        update_data = {
            "project_reports": [
                {
                    "project_code": annual_project_report.project.code,
                    "funds_disbursed": 50000.0,
                },
                {
                    "project_code": annual_project_report.project.code,
                    "funds_committed": 30000.0,
                },
            ]
        }

        url = reverse(
            "apr-update",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )
        response = self.client.post(url, update_data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Duplicate project codes" in str(response.data)

    def test_bulk_update_invalid_project_code(
        self,
        agency_inputter_user,
        annual_agency_report,
        annual_project_report,
    ):
        self.client.force_authenticate(user=agency_inputter_user)

        update_data = {
            "project_reports": [
                {
                    "project_code": "INVALID/CODE/99/XXX/99",
                    "funds_disbursed": 50000.0,
                },
                {
                    "project_code": annual_project_report.project.code,
                    "funds_disbursed": 30000.0,
                },
            ]
        }

        url = reverse(
            "apr-update",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )
        response = self.client.post(url, update_data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["updated_count"] == 1
        assert response.data["error_count"] == 1
        assert "errors" in response.data

    def test_bulk_update_partial_fields(
        self,
        agency_inputter_user,
        annual_agency_report,
        annual_project_report,
    ):
        self.client.force_authenticate(user=agency_inputter_user)

        # First update
        update_data = {
            "project_reports": [
                {
                    "project_code": annual_project_report.project.code,
                    "funds_disbursed": 50000.0,
                }
            ]
        }

        url = reverse(
            "apr-update",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )
        response = self.client.post(url, update_data, format="json")
        assert response.status_code == status.HTTP_200_OK

        # Second update, but affecting a different field
        del update_data["project_reports"][0]["funds_disbursed"]
        update_data["project_reports"][0]["consumption_phased_out_odp"] = 25.5

        response = self.client.post(url, update_data, format="json")
        assert response.status_code == status.HTTP_200_OK

        # Check that both fields are set
        annual_project_report.refresh_from_db()
        assert annual_project_report.funds_disbursed == 50000.0
        assert annual_project_report.consumption_phased_out_odp == 25.5


@pytest.mark.django_db
class TestAPRFileUploadView(BaseTest):
    def test_without_login(self, annual_agency_report):
        self.client.force_authenticate(user=None)
        test_file = SimpleUploadedFile(
            "test_report.pdf", b"file_content", content_type="application/pdf"
        )
        data = {
            "file": test_file,
            "file_name": "Annual Progress Report 2024",
            "file_type": AnnualProjectReportFile.FileType.ANNUAL_PROGRESS_FINANCIAL_REPORT,
        }

        url = reverse(
            "apr-upload",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )
        response = self.client.post(url, data, format="multipart")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_upload_file(self, agency_inputter_user, annual_agency_report):
        self.client.force_authenticate(user=agency_inputter_user)

        test_file = SimpleUploadedFile(
            "test_report.pdf", b"file_content", content_type="application/pdf"
        )
        data = {
            "file": test_file,
            "file_name": "Annual Progress Report 2024",
            "file_type": AnnualProjectReportFile.FileType.ANNUAL_PROGRESS_FINANCIAL_REPORT,
        }

        url = reverse(
            "apr-upload",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )
        response = self.client.post(url, data, format="multipart")

        assert response.status_code == status.HTTP_201_CREATED
        assert "file" in response.data
        assert response.data["message"] == "File uploaded successfully."

        assert AnnualProjectReportFile.objects.filter(
            report=annual_agency_report
        ).exists()

    def test_upload_file_permissions(self, agency_viewer_user, annual_agency_report):
        self.client.force_authenticate(user=agency_viewer_user)

        url = reverse(
            "apr-upload",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )
        response = self.client.post(url, {}, format="multipart")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_upload_submitted_report(self, agency_inputter_user, annual_agency_report):
        annual_agency_report.status = annual_agency_report.SubmissionStatus.SUBMITTED
        annual_agency_report.save()

        self.client.force_authenticate(user=agency_inputter_user)

        test_file = SimpleUploadedFile(
            "test.pdf", b"content", content_type="application/pdf"
        )

        url = reverse(
            "apr-upload",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )
        response = self.client.post(url, {"file": test_file}, format="multipart")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_upload_file_replaces_existing_annual_report(
        self, agency_inputter_user, annual_agency_report
    ):
        # First add "existing" file to the annual agency report
        old_file = AnnualProjectReportFileFactory(
            report=annual_agency_report,
            file_type=AnnualProjectReportFile.FileType.ANNUAL_PROGRESS_FINANCIAL_REPORT,
        )

        self.client.force_authenticate(user=agency_inputter_user)

        # Then upload new file to check that it overwrites the old one
        new_file = SimpleUploadedFile(
            "new_report.pdf", b"new_content", content_type="application/pdf"
        )
        data = {
            "file": new_file,
            "file_name": "Updated Report",
            "file_type": AnnualProjectReportFile.FileType.ANNUAL_PROGRESS_FINANCIAL_REPORT,
        }
        url = reverse(
            "apr-upload",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )
        response = self.client.post(url, data, format="multipart")

        assert response.status_code == status.HTTP_201_CREATED

        # Check that only one file exists and the old one was deleted
        assert (
            AnnualProjectReportFile.objects.filter(
                report=annual_agency_report,
                file_type=AnnualProjectReportFile.FileType.ANNUAL_PROGRESS_FINANCIAL_REPORT,
            ).count()
            == 1
        )
        assert not AnnualProjectReportFile.objects.filter(id=old_file.id).exists()

    def test_upload_unlocked_report(self, agency_inputter_user, annual_agency_report):
        annual_agency_report.status = annual_agency_report.SubmissionStatus.SUBMITTED
        annual_agency_report.is_unlocked = True
        annual_agency_report.save()

        self.client.force_authenticate(user=agency_inputter_user)

        test_file = SimpleUploadedFile(
            "test.pdf", b"content", content_type="application/pdf"
        )
        data = {
            "file": test_file,
            "file_name": "Test Report",
            "file_type": AnnualProjectReportFile.FileType.ANNUAL_PROGRESS_FINANCIAL_REPORT,
        }
        url = reverse(
            "apr-upload",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )
        response = self.client.post(url, data, format="multipart")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["message"] == "File uploaded successfully."


@pytest.mark.django_db
class TestAPRGlobalListView(BaseTest):
    def test_without_login(self, apr_year):
        self.client.force_authenticate(user=None)
        url = reverse("apr-mlfs-list", kwargs={"year": apr_year})
        response = self.client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_agency_user_cannot_access(self, agency_viewer_user, apr_year):
        self.client.force_authenticate(user=agency_viewer_user)
        url = reverse("apr-mlfs-list", kwargs={"year": apr_year})
        response = self.client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_mlfs_viewer_can_access_reports(
        self, secretariat_viewer_user, apr_year, annual_progress_report
    ):
        agency1 = AgencyFactory()
        agency2 = AgencyFactory()

        AnnualAgencyProjectReportFactory(
            progress_report=annual_progress_report,
            agency=agency1,
            status=AnnualAgencyProjectReport.SubmissionStatus.SUBMITTED,
        )
        AnnualAgencyProjectReportFactory(
            progress_report=annual_progress_report,
            agency=agency2,
            status=AnnualAgencyProjectReport.SubmissionStatus.DRAFT,
        )

        self.client.force_authenticate(user=secretariat_viewer_user)
        url = reverse("apr-mlfs-list", kwargs={"year": apr_year})
        response = self.client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert (
            response.data[0]["status"]
            == AnnualAgencyProjectReport.SubmissionStatus.SUBMITTED
        )

    def test_mlfs_full_access_can_access_reports(
        self, mlfs_admin_user, apr_year, annual_progress_report
    ):
        agency1 = AgencyFactory()
        agency2 = AgencyFactory()

        AnnualAgencyProjectReportFactory(
            progress_report=annual_progress_report,
            agency=agency1,
            status=AnnualAgencyProjectReport.SubmissionStatus.SUBMITTED,
        )
        AnnualAgencyProjectReportFactory(
            progress_report=annual_progress_report,
            agency=agency2,
            status=AnnualAgencyProjectReport.SubmissionStatus.DRAFT,
        )

        self.client.force_authenticate(user=mlfs_admin_user)
        url = reverse("apr-mlfs-list", kwargs={"year": apr_year})
        response = self.client.get(url)

        assert response.status_code == status.HTTP_200_OK
        # For now, MLFS "full access" users can even access draft reports
        assert len(response.data) == 2

    def test_filter_by_agency(self, mlfs_admin_user, apr_year, annual_progress_report):
        agency1 = AgencyFactory()
        agency2 = AgencyFactory()

        AnnualAgencyProjectReportFactory(
            progress_report=annual_progress_report,
            agency=agency1,
            status=AnnualAgencyProjectReport.SubmissionStatus.SUBMITTED,
        )
        AnnualAgencyProjectReportFactory(
            progress_report=annual_progress_report,
            agency=agency2,
            status=AnnualAgencyProjectReport.SubmissionStatus.SUBMITTED,
        )

        self.client.force_authenticate(user=mlfs_admin_user)
        url = reverse("apr-mlfs-list", kwargs={"year": apr_year})
        response = self.client.get(url, {"agency": agency1.id})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["agency_id"] == agency1.id

    def test_filter_by_status(self, mlfs_admin_user, apr_year, annual_progress_report):
        agency1 = AgencyFactory()
        agency2 = AgencyFactory()

        AnnualAgencyProjectReportFactory(
            progress_report=annual_progress_report,
            agency=agency1,
            status=AnnualAgencyProjectReport.SubmissionStatus.SUBMITTED,
        )
        AnnualAgencyProjectReportFactory(
            progress_report=annual_progress_report,
            agency=agency2,
            status=AnnualAgencyProjectReport.SubmissionStatus.DRAFT,
        )

        self.client.force_authenticate(user=mlfs_admin_user)
        url = reverse("apr-mlfs-list", kwargs={"year": apr_year})
        response = self.client.get(
            url, {"status": AnnualAgencyProjectReport.SubmissionStatus.DRAFT}
        )

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert (
            response.data[0]["status"]
            == AnnualAgencyProjectReport.SubmissionStatus.DRAFT
        )

    def test_filter_by_country(
        self, mlfs_admin_user, apr_year, annual_progress_report, country_ro
    ):
        agency = AgencyFactory()
        annual_agency_report = AnnualAgencyProjectReportFactory(
            progress_report=annual_progress_report,
            agency=agency,
            status=AnnualAgencyProjectReport.SubmissionStatus.SUBMITTED,
        )
        project = ProjectFactory(country=country_ro, agency=agency)
        AnnualProjectReportFactory(
            report=annual_agency_report,
            project=project,
        )

        self.client.force_authenticate(user=mlfs_admin_user)
        url = reverse("apr-mlfs-list", kwargs={"year": apr_year})
        response = self.client.get(url, {"country": country_ro.id})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_unlocked_flag(self, mlfs_admin_user, apr_year, annual_progress_report):
        agency = AgencyFactory()
        AnnualAgencyProjectReportFactory(
            progress_report=annual_progress_report,
            agency=agency,
            status=AnnualAgencyProjectReport.SubmissionStatus.SUBMITTED,
            is_unlocked=True,
        )

        self.client.force_authenticate(user=mlfs_admin_user)
        url = reverse("apr-mlfs-list", kwargs={"year": apr_year})
        response = self.client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data[0]["is_unlocked"] is True


@pytest.mark.django_db
class TestAPRToggleLockView(BaseTest):
    def test_without_login(self, annual_agency_report):
        self.client.force_authenticate(user=None)
        url = reverse(
            "apr-toggle-lock",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )
        response = self.client.post(url, {"is_unlocked": True}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_agency_user_cannot_toggle_lock(
        self, agency_inputter_user, annual_agency_report
    ):
        annual_agency_report.status = (
            AnnualAgencyProjectReport.SubmissionStatus.SUBMITTED
        )
        annual_agency_report.save()

        self.client.force_authenticate(user=agency_inputter_user)
        url = reverse(
            "apr-toggle-lock",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )
        response = self.client.post(url, {"is_unlocked": True}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_mlfs_viewer_cannot_toggle_lock(
        self, secretariat_viewer_user, annual_agency_report
    ):
        annual_agency_report.status = (
            AnnualAgencyProjectReport.SubmissionStatus.SUBMITTED
        )
        annual_agency_report.save()

        self.client.force_authenticate(user=secretariat_viewer_user)
        url = reverse(
            "apr-toggle-lock",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )
        response = self.client.post(url, {"is_unlocked": True}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_mlfs_full_access_can_unlock(self, mlfs_admin_user, annual_agency_report):
        annual_agency_report.status = (
            AnnualAgencyProjectReport.SubmissionStatus.SUBMITTED
        )
        annual_agency_report.is_unlocked = False
        annual_agency_report.save()

        self.client.force_authenticate(user=mlfs_admin_user)
        url = reverse(
            "apr-toggle-lock",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )
        response = self.client.post(url, {"is_unlocked": True}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_unlocked"] is True
        assert "unlocked successfully" in response.data["message"]

        # Verify database was updated
        annual_agency_report.refresh_from_db()
        assert annual_agency_report.is_unlocked is True

    def test_mlfs_full_access_can_lock(self, mlfs_admin_user, annual_agency_report):
        annual_agency_report.status = (
            AnnualAgencyProjectReport.SubmissionStatus.SUBMITTED
        )
        annual_agency_report.is_unlocked = True
        annual_agency_report.save()

        self.client.force_authenticate(user=mlfs_admin_user)
        url = reverse(
            "apr-toggle-lock",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )
        response = self.client.post(url, {"is_unlocked": False}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_unlocked"] is False
        assert "locked successfully" in response.data["message"]

        # Verify database was updated
        annual_agency_report.refresh_from_db()
        assert annual_agency_report.is_unlocked is False

    def test_cannot_toggle_draft_report(self, mlfs_admin_user, annual_agency_report):
        annual_agency_report.status = AnnualAgencyProjectReport.SubmissionStatus.DRAFT
        annual_agency_report.save()

        self.client.force_authenticate(user=mlfs_admin_user)
        url = reverse(
            "apr-toggle-lock",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )
        response = self.client.post(url, {"is_unlocked": True}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_cannot_toggle_endorsed_report(self, mlfs_admin_user, annual_agency_report):
        annual_agency_report.status = (
            AnnualAgencyProjectReport.SubmissionStatus.SUBMITTED
        )
        annual_agency_report.progress_report.endorsed = True
        annual_agency_report.progress_report.save()
        annual_agency_report.save()

        self.client.force_authenticate(user=mlfs_admin_user)
        url = reverse(
            "apr-toggle-lock",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )
        response = self.client.post(url, {"is_unlocked": True}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_missing_is_unlocked_parameter(self, mlfs_admin_user, annual_agency_report):
        annual_agency_report.status = (
            AnnualAgencyProjectReport.SubmissionStatus.SUBMITTED
        )
        annual_agency_report.save()

        self.client.force_authenticate(user=mlfs_admin_user)
        url = reverse(
            "apr-toggle-lock",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )
        response = self.client.post(url, {}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestAPREndorseView(BaseTest):
    def test_without_login(self, apr_year):
        self.client.force_authenticate(user=None)
        url = reverse("apr-endorse", kwargs={"year": apr_year})
        response = self.client.post(url, {}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_agency_user_cannot_endorse(
        self, agency_inputter_user, apr_year, annual_progress_report
    ):
        self.client.force_authenticate(user=agency_inputter_user)
        url = reverse("apr-endorse", kwargs={"year": apr_year})
        response = self.client.post(url, {}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_mlfs_viewer_cannot_endorse(
        self, secretariat_viewer_user, apr_year, annual_progress_report
    ):
        self.client.force_authenticate(user=secretariat_viewer_user)
        url = reverse("apr-endorse", kwargs={"year": apr_year})
        response = self.client.post(url, {}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_mlfs_full_access_can_endorse(
        self, mlfs_admin_user, apr_year, annual_progress_report
    ):
        # Create some submitted reports to allow endorsing
        agency1 = AgencyFactory()
        agency2 = AgencyFactory()

        AnnualAgencyProjectReportFactory(
            progress_report=annual_progress_report,
            agency=agency1,
            status=AnnualAgencyProjectReport.SubmissionStatus.SUBMITTED,
        )
        AnnualAgencyProjectReportFactory(
            progress_report=annual_progress_report,
            agency=agency2,
            status=AnnualAgencyProjectReport.SubmissionStatus.SUBMITTED,
        )

        self.client.force_authenticate(user=mlfs_admin_user)
        url = reverse("apr-endorse", kwargs={"year": apr_year})
        response = self.client.post(url, {}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert "endorsed successfully" in response.data["message"]
        assert response.data["year"] == apr_year
        assert response.data["total_agencies"] == 2

        annual_progress_report.refresh_from_db()
        assert annual_progress_report.endorsed is True

    def test_cannot_endorse_if_draft_reports_exist(
        self, mlfs_admin_user, apr_year, annual_progress_report
    ):
        agency1 = AgencyFactory()
        agency2 = AgencyFactory()

        AnnualAgencyProjectReportFactory(
            progress_report=annual_progress_report,
            agency=agency1,
            status=AnnualAgencyProjectReport.SubmissionStatus.SUBMITTED,
        )
        AnnualAgencyProjectReportFactory(
            progress_report=annual_progress_report,
            agency=agency2,
            status=AnnualAgencyProjectReport.SubmissionStatus.DRAFT,
        )

        self.client.force_authenticate(user=mlfs_admin_user)
        url = reverse("apr-endorse", kwargs={"year": apr_year})
        response = self.client.post(url, {}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_endorse_already_endorsed(
        self, mlfs_admin_user, apr_year, annual_progress_report
    ):
        annual_progress_report.endorsed = True
        annual_progress_report.save()

        self.client.force_authenticate(user=mlfs_admin_user)
        url = reverse("apr-endorse", kwargs={"year": apr_year})
        response = self.client.post(url, {}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_endorse_nonexistent_year(self, mlfs_admin_user):
        self.client.force_authenticate(user=mlfs_admin_user)
        url = reverse("apr-endorse", kwargs={"year": 9999})
        response = self.client.post(url, {}, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestAPRExportView(BaseTest):
    def test_without_login(self, apr_year, agency):
        self.client.force_authenticate(user=None)
        url = reverse(
            "apr-export",
            kwargs={"year": apr_year, "agency_id": agency.id},
        )
        response = self.client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_agency_user_can_export_own_report(
        self, agency_viewer_user, annual_agency_report, annual_project_report
    ):
        self.client.force_authenticate(user=agency_viewer_user)
        url = reverse(
            "apr-export",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )
        response = self.client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert (
            response["Content-Type"]
            == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        assert "attachment" in response["Content-Disposition"]
        assert (
            f"APR_{annual_agency_report.progress_report.year}"
            in response["Content-Disposition"]
        )
        assert (
            annual_agency_report.agency.name[:10] in response["Content-Disposition"]
        )  # Partial name match

        assert len(response.content) > 0

    def test_agency_user_cannot_export_other_agency_report(
        self, agency_viewer_user, annual_agency_report
    ):
        other_agency = AgencyFactory()
        other_report = AnnualAgencyProjectReportFactory(
            progress_report=annual_agency_report.progress_report,
            agency=other_agency,
        )

        self.client.force_authenticate(user=agency_viewer_user)
        url = reverse(
            "apr-export",
            kwargs={
                "year": other_report.progress_report.year,
                "agency_id": other_report.agency.id,
            },
        )
        response = self.client.get(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_mlfs_user_can_export_any_agency_report(
        self, secretariat_viewer_user, annual_agency_report, annual_project_report
    ):
        self.client.force_authenticate(user=secretariat_viewer_user)
        url = reverse(
            "apr-export",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )
        response = self.client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert (
            response["Content-Type"]
            == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        assert len(response.content) > 0

    def test_export_with_multiple_projects(
        self, agency_viewer_user, annual_agency_report, multiple_projects_for_apr
    ):
        for project in multiple_projects_for_apr[:3]:
            AnnualProjectReportFactory(
                report=annual_agency_report,
                project=project,
                funds_disbursed=10000.0,
            )

        self.client.force_authenticate(user=agency_viewer_user)
        url = reverse(
            "apr-export",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )
        response = self.client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.content) > 0

        workbook = load_workbook(BytesIO(response.content))
        worksheet = workbook[APRExportWriter.SHEET_NAME]
        # Ensure that all 3 rows are exported, as there are no filters
        data_rows = worksheet.max_row - APRExportWriter.HEADER_ROW
        assert data_rows == 3

    def test_export_with_status_filter(
        self, agency_viewer_user, annual_agency_report, annual_project_report
    ):
        annual_project_report.project.status.code = "ONG"
        annual_project_report.project.status.save()

        self.client.force_authenticate(user=agency_viewer_user)
        url = reverse(
            "apr-export",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )
        response = self.client.get(url, {"status": "ONG"})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.content) > 0

        workbook = load_workbook(BytesIO(response.content))
        worksheet = workbook[APRExportWriter.SHEET_NAME]
        data_rows = worksheet.max_row - APRExportWriter.HEADER_ROW
        assert data_rows == 1

    def test_export_empty_report(self, agency_viewer_user, annual_agency_report):
        self.client.force_authenticate(user=agency_viewer_user)
        url = reverse(
            "apr-export",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.content) > 0

        workbook = load_workbook(BytesIO(response.content))
        worksheet = workbook[APRExportWriter.SHEET_NAME]
        data_rows = worksheet.max_row - APRExportWriter.HEADER_ROW
        # For empty reports, we still export one empty data row
        assert data_rows == 1

        columns = APRExportWriter.build_column_mapping()
        first_data_row = APRExportWriter.FIRST_DATA_ROW + 1
        row_values = [
            worksheet.cell(first_data_row, col).value
            for col in range(1, len(columns) + 1)
        ]
        assert all(value is None or value == "" for value in row_values)

    def test_export_nonexistent_report(self, agency_viewer_user):
        self.client.force_authenticate(user=agency_viewer_user)
        url = reverse(
            "apr-export",
            kwargs={"year": 9999, "agency_id": 9999},
        )
        response = self.client.get(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_export_data_correctness(
        self, agency_viewer_user, annual_agency_report, annual_project_report
    ):
        project = ProjectFactory(
            code="TEST/CODE/2024/001",
            title="Test Project Title",
            agency=annual_agency_report.agency,
        )
        project.status.code = "ONG"
        project.status.save()

        AnnualProjectReportFactory(
            report=annual_agency_report,
            project=project,
            funds_disbursed=123456.78,
            last_year_remarks="Test remarkss",
            consumption_phased_out_odp=45.67,
            date_first_disbursement="2024-03-15",
        )

        self.client.force_authenticate(user=agency_viewer_user)
        url = reverse(
            "apr-export",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK

        workbook = load_workbook(BytesIO(response.content))
        worksheet = workbook[APRExportWriter.SHEET_NAME]
        columns = APRExportWriter.build_column_mapping()
        first_data_row = APRExportWriter.FIRST_DATA_ROW

        # All project data gets written to first data row; check it matches
        project_code_col = columns["project_code"]
        assert (
            worksheet.cell(first_data_row, project_code_col).value
            == "TEST/CODE/2024/001"
        )

        project_title_col = columns["project_title"]
        assert (
            worksheet.cell(first_data_row, project_title_col).value
            == "Test Project Title"
        )

        funds_disbursed_col = columns["funds_disbursed"]
        assert worksheet.cell(first_data_row, funds_disbursed_col).value == 123456.78

        odp_col = columns["consumption_phased_out_odp"]
        assert worksheet.cell(first_data_row, odp_col).value == 45.67

        date_col = columns["date_first_disbursement"]
        cell_value = worksheet.cell(first_data_row, date_col).value
        assert cell_value == datetime(2024, 3, 15, 0, 0)

        remarks_col = columns["last_year_remarks"]
        assert worksheet.cell(first_data_row, remarks_col).value == "Test remarkss"

        agency_col = columns["agency_name"]
        assert worksheet.cell(first_data_row, agency_col).value == project.agency.name

        country_col = columns["country_name"]
        assert worksheet.cell(first_data_row, country_col).value == project.country.name

    def test_export_null_values(self, agency_viewer_user, annual_agency_report):
        project = ProjectFactory(
            code="TEST/CODE/2024/001",
            title="Test Project Title",
            agency=annual_agency_report.agency,
        )
        project.status.code = "ONG"
        project.status.save()
        AnnualProjectReportFactory(
            report=annual_agency_report,
            project=project,
            funds_disbursed=None,
            consumption_phased_out_odp=45.67,
            last_year_remarks="",
            date_first_disbursement=None,
        )

        self.client.force_authenticate(user=agency_viewer_user)
        url = reverse(
            "apr-export",
            kwargs={
                "year": annual_agency_report.progress_report.year,
                "agency_id": annual_agency_report.agency.id,
            },
        )
        response = self.client.get(url)

        assert response.status_code == status.HTTP_200_OK

        workbook = load_workbook(BytesIO(response.content))
        worksheet = workbook[APRExportWriter.SHEET_NAME]
        columns = APRExportWriter.build_column_mapping()
        first_data_row = APRExportWriter.FIRST_DATA_ROW

        funds_col = columns["funds_disbursed"]
        assert worksheet.cell(first_data_row, funds_col).value is None

        date_col = columns["date_first_disbursement"]
        assert worksheet.cell(first_data_row, date_col).value is None

        remarks_col = columns["last_year_remarks"]
        cell_value = worksheet.cell(first_data_row, remarks_col).value
        assert cell_value is None
