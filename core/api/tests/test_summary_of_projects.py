import base64
import io
import json

import openpyxl
import pytest
from django.urls import reverse

from core.api.tests.base import BaseTest
from core.api.tests.factories import MeetingFactory
from core.api.tests.factories import ProjectClusterFactory
from core.api.tests.factories import ProjectFactory


pytestmark = pytest.mark.django_db


class TestSummaryOfProjectsFilters(BaseTest):
    url = reverse("summary-of-projects-filters")

    def test_cluster_options_include_code(self, admin_user):
        cluster = ProjectClusterFactory.create(
            name="Kigali Implementation Plan Stage 1",
            code="KIP1",
        )
        ProjectFactory.create(cluster=cluster)

        self.client.force_authenticate(user=admin_user)
        response = self.client.get(self.url)

        assert response.status_code == 200
        assert response.data["cluster"] == [
            {
                "id": cluster.id,
                "name": "Kigali Implementation Plan Stage 1",
                "code": "KIP1",
            }
        ]


class TestSummaryOfProjects(BaseTest):
    url = reverse("summary-of-projects-list")
    export_url = reverse("summary-of-projects-export")

    @staticmethod
    def _encode_row_data(row_data):
        return base64.b64encode(json.dumps(row_data).encode()).decode()

    def test_recommended_summary_excludes_history_for_approved_latest_project(
        self,
        secretariat_approver_edit_access_user,
        project_approved_status,
        project_recommended_status,
    ):
        meeting = MeetingFactory()

        ProjectFactory.create(
            meeting=meeting,
            submission_status=project_recommended_status,
            version=2,
            total_fund=100,
            support_cost_psc=10,
        )

        latest_recommended_project = ProjectFactory.create(
            meeting=meeting,
            submission_status=project_recommended_status,
            version=3,
            total_fund=9999,
            support_cost_psc=999,
        )
        ProjectFactory.create(
            meeting=meeting,
            submission_status=project_recommended_status,
            version=2,
            latest_project=latest_recommended_project,
            total_fund=200,
            support_cost_psc=20,
        )

        latest_approved_project = ProjectFactory.create(
            meeting=meeting,
            submission_status=project_approved_status,
            version=3,
            total_fund=9999,
            support_cost_psc=999,
        )
        ProjectFactory.create(
            meeting=meeting,
            submission_status=project_recommended_status,
            version=2,
            latest_project=latest_approved_project,
            total_fund=300,
            support_cost_psc=30,
        )

        self.client.force_authenticate(user=secretariat_approver_edit_access_user)
        response = self.client.get(
            self.url,
            {
                "meeting_id": meeting.id,
                "submission_status": "recommended",
            },
        )

        assert response.status_code == 200
        assert response.data["projects_count"] == 2
        assert response.data["amounts_recommended"] == 330

    def test_export_complies_with_recommended_and_approved_version_flow(
        self,
        secretariat_approver_edit_access_user,
        project_approved_status,
        project_recommended_status,
    ):
        meeting = MeetingFactory()

        ProjectFactory.create(
            meeting=meeting,
            submission_status=project_recommended_status,
            version=2,
            total_fund=100,
            support_cost_psc=10,
        )

        latest_recommended_project = ProjectFactory.create(
            meeting=meeting,
            submission_status=project_recommended_status,
            version=3,
            total_fund=9999,
            support_cost_psc=999,
        )
        ProjectFactory.create(
            meeting=meeting,
            submission_status=project_recommended_status,
            version=2,
            latest_project=latest_recommended_project,
            total_fund=200,
            support_cost_psc=20,
        )

        latest_approved_project = ProjectFactory.create(
            meeting=meeting,
            submission_status=project_approved_status,
            version=3,
            total_fund=400,
            support_cost_psc=40,
        )
        ProjectFactory.create(
            meeting=meeting,
            submission_status=project_recommended_status,
            version=2,
            latest_project=latest_approved_project,
            total_fund=300,
            support_cost_psc=30,
        )

        row_data = [
            {
                "text": "Recommended",
                "params": {
                    "meeting_id": meeting.id,
                    "submission_status": "recommended",
                },
            },
            {
                "text": "Approved",
                "params": {
                    "meeting_id": meeting.id,
                    "submission_status": "approved",
                },
            },
        ]

        self.client.force_authenticate(user=secretariat_approver_edit_access_user)
        response = self.client.get(
            self.export_url,
            {"row_data": self._encode_row_data(row_data)},
        )

        assert response.status_code == 200

        workbook = openpyxl.load_workbook(io.BytesIO(response.getvalue()))
        sheet = workbook["Summary of projects"]

        assert sheet["A3"].value == "Recommended"
        assert sheet["C3"].value == 2
        assert sheet["D3"].value == 330

        assert sheet["A4"].value == "Approved"
        assert sheet["C4"].value == 1
        assert sheet["D4"].value == 440
