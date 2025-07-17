import datetime
import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from core.api.tests.factories import (
    ProjectComponentsFactory,
    ProjectFieldFactory,
    ProjectSpecificFieldsFactory,
)
from core.models.project import Project, ProjectFile


pytestmark = pytest.mark.django_db

# pylint: disable=R0913,R0915,W0613


class TestProjectVersioning:
    client = APIClient()

    def test_submit_permissions(
        self,
        agency_inputter_user,
        project,
        project_file,
        project_draft_status,
        user,
        viewer_user,
        agency_user,
        secretariat_viewer_user,
        secretariat_v1_v2_edit_access_user,
        secretariat_production_v1_v2_edit_access_user,
        secretariat_v3_edit_access_user,
        secretariat_production_v3_edit_access_user,
        admin_user,
    ):
        project.is_lvc = False
        project.project_start_date = "2023-10-01"
        project.project_end_date = "2024-09-30"
        project.total_fund = 2340000
        project.support_cost_psc = 23
        project.save()

        url = reverse("project-v2-submit", args=(project.id,))

        def _test_user_permissions(user, expected_response_status):
            self.client.force_authenticate(user=user)
            response = self.client.post(url)
            assert response.status_code == expected_response_status
            return response.data

        def _set_project_back_to_v1():
            project.version = 1
            project.submission_status = project_draft_status
            project.save()
            archive_project = (
                Project.objects.really_all().filter(latest_project=project).first()
            )
            ProjectFile.objects.filter(project=archive_project).update(project=project)
            archive_project.delete()

        # test with unauthenticated user
        self.client.force_authenticate(user=None)
        response = self.client.post(url)
        assert response.status_code == 403

        _test_user_permissions(user, 403)
        _test_user_permissions(viewer_user, 403)
        _test_user_permissions(agency_user, 200)
        _set_project_back_to_v1()
        _test_user_permissions(agency_inputter_user, 403)
        _test_user_permissions(secretariat_viewer_user, 403)
        _test_user_permissions(secretariat_v1_v2_edit_access_user, 200)
        _set_project_back_to_v1()
        _test_user_permissions(secretariat_production_v1_v2_edit_access_user, 200)
        _set_project_back_to_v1()
        _test_user_permissions(secretariat_v3_edit_access_user, 403)
        _test_user_permissions(secretariat_production_v3_edit_access_user, 403)
        _test_user_permissions(admin_user, 200)

    def test_submit_project(
        self,
        agency_user,
        project,
        project_file,
        project_draft_status,
    ):
        self.client.force_authenticate(user=agency_user)
        url = reverse("project-v2-submit", args=(project.id,))

        # submit project and expect failure due to missing required fields
        response = self.client.post(url)
        assert response.status_code == 400
        assert response.data

        # set required fields
        project.is_lvc = False
        project.project_start_date = "2023-10-01"
        project.project_end_date = "2024-09-30"
        project.total_fund = 2340000
        project.support_cost_psc = 23
        project.save()

        self.client.force_authenticate(user=agency_user)
        url = reverse("project-v2-submit", args=(project.id,))

        # submit project
        response = self.client.post(url)
        assert response.status_code == 200

        # check if the project is archived
        archived_project = Project.objects.really_all().get(latest_project=project)
        assert archived_project.submission_status.name == "Submitted"
        assert archived_project.version == 1

        # check if the project file is archived
        assert ProjectFile.objects.filter(project=project).count() == 0
        assert ProjectFile.objects.filter(project=archived_project).count() == 1

        # check project
        project.refresh_from_db()
        assert project.submission_status.name == "Submitted"
        assert project.version == 2

    def test_submit_project_with_associated_projects(
        self,
        project,
        project_draft_status,
        project2,
        project3,
        project_approved_status,
        project_file,
        project2_file,
        agency_user,
    ):
        self.client.force_authenticate(user=agency_user)
        url = reverse("project-v2-submit", args=(project2.id,))

        # setup projects for submission

        project2.submission_status = project_draft_status
        project2.component = ProjectComponentsFactory()
        project2.save()
        project.submission_status = project_draft_status
        project.meta_project = project2.meta_project
        project.tranche = 2
        project.component = project2.component
        project.save()
        project3.submission_status = project_approved_status
        project3.tranche = 1
        project3.meta_project = project.meta_project
        project3.save()

        project_specific_fields = ProjectSpecificFieldsFactory.create(
            cluster=project3.cluster,
            type=project3.project_type,
            sector=project3.sector,
        )
        field = ProjectFieldFactory.create(
            import_name="number_of_female_technicians_trained_actual",
            label="Number of female technicians trained",
            read_field_name="number_of_female_technicians_trained_actual",
            write_field_name="number_of_female_technicians_trained_actual",
            table="project",
            data_type="number",
            section="Impact",
            is_actual=True,
        )
        project_specific_fields.fields.add(field)

        # submit project and expect failure due to missing required fields
        response = self.client.post(url)
        assert response.status_code == 400
        assert len(response.data) == 2

        # check project 2
        assert response.data[0]["id"] == project2.id
        assert len(response.data[0]["errors"]) == 5

        # check project 1
        assert response.data[1]["id"] == project.id
        assert len(response.data[1]["errors"]) == 6
        assert "previous_tranches" in response.data[1]["errors"]

        # set required fields
        project.is_lvc = False
        project.project_start_date = "2023-10-01"
        project.project_end_date = "2024-09-30"
        project.total_fund = 2340000
        project.support_cost_psc = 23
        project.save()

        project3.number_of_female_technicians_trained_actual = 3
        project3.save()

        # set required fields
        project2.is_lvc = False
        project2.project_start_date = "2023-10-01"
        project2.project_end_date = "2024-09-30"
        project2.total_fund = 2340000
        project2.support_cost_psc = 23
        project2.save()

        url = reverse("project-v2-submit", args=(project.id,))

        # submit project
        response = self.client.post(url)
        assert response.status_code == 200

        # check if the project is archived
        archived_project = Project.objects.really_all().get(latest_project=project)
        assert archived_project.submission_status.name == "Submitted"
        assert archived_project.version == 1

        archived_project2 = Project.objects.really_all().get(latest_project=project2)
        assert archived_project2.submission_status.name == "Submitted"
        assert archived_project2.version == 1

        # check if the project file is archived
        assert ProjectFile.objects.filter(project=project).count() == 0
        assert ProjectFile.objects.filter(project=archived_project).count() == 1

        assert ProjectFile.objects.filter(project=project2).count() == 0
        assert ProjectFile.objects.filter(project=archived_project2).count() == 1

        # check project
        project.refresh_from_db()
        project2.refresh_from_db()
        assert project.submission_status.name == "Submitted"
        assert project.version == 2

        assert project2.submission_status.name == "Submitted"
        assert project2.version == 2

    def test_recommend_permissions(
        self,
        agency_inputter_user,
        project,
        project_file,
        project_submitted_status,
        user,
        viewer_user,
        agency_user,
        secretariat_viewer_user,
        secretariat_v1_v2_edit_access_user,
        secretariat_production_v1_v2_edit_access_user,
        secretariat_v3_edit_access_user,
        secretariat_production_v3_edit_access_user,
        admin_user,
    ):
        project.version = 2
        project.submission_status = project_submitted_status
        project.is_lvc = False
        project.project_start_date = "2023-10-01"
        project.project_end_date = "2024-09-30"
        project.total_fund = 2340000
        project.support_cost_psc = 23
        project.save()

        url = reverse("project-v2-recommend", args=(project.id,))

        def _test_user_permissions(user, expected_response_status):
            self.client.force_authenticate(user=user)
            response = self.client.post(url)
            assert response.status_code == expected_response_status
            return response.data

        def _set_project_back_to_v2():
            project.version = 2
            project.submission_status = project_submitted_status
            project.save()
            archive_project = (
                Project.objects.really_all().filter(latest_project=project).first()
            )
            ProjectFile.objects.filter(project=archive_project).update(project=project)
            archive_project.delete()

        # test with unauthenticated user
        self.client.force_authenticate(user=None)
        response = self.client.post(url)
        assert response.status_code == 403

        _test_user_permissions(user, 403)
        _test_user_permissions(viewer_user, 403)
        _test_user_permissions(agency_user, 403)
        _test_user_permissions(agency_inputter_user, 403)
        _test_user_permissions(secretariat_viewer_user, 403)
        _test_user_permissions(secretariat_v1_v2_edit_access_user, 200)
        _set_project_back_to_v2()
        _test_user_permissions(secretariat_production_v1_v2_edit_access_user, 200)
        _set_project_back_to_v2()
        _test_user_permissions(secretariat_v3_edit_access_user, 403)
        _test_user_permissions(secretariat_production_v3_edit_access_user, 403)
        _test_user_permissions(admin_user, 200)

    def test_recommend_project(
        self,
        secretariat_v1_v2_edit_access_user,
        project,
        project_file,
        project_submitted_status,
    ):
        self.client.force_authenticate(user=secretariat_v1_v2_edit_access_user)
        url = reverse("project-v2-recommend", args=(project.id,))

        # submit project and expect failure due to missing required fields
        response = self.client.post(url)
        assert response.status_code == 400
        assert response.data

        # set required fields
        project.version = 2
        project.submission_status = project_submitted_status
        project.is_lvc = False
        project.project_start_date = "2023-10-01"
        project.project_end_date = "2024-09-30"
        project.total_fund = 2340000
        project.support_cost_psc = 23
        project.save()

        self.client.force_authenticate(user=secretariat_v1_v2_edit_access_user)
        url = reverse("project-v2-recommend", args=(project.id,))

        # submit project
        response = self.client.post(url)
        assert response.status_code == 200

        # check if the project is archived
        archived_project = Project.objects.really_all().get(latest_project=project)
        assert archived_project.submission_status.name == "Recommended"
        assert archived_project.version == 2

        # check if the project file is archived
        assert ProjectFile.objects.filter(project=project).count() == 0
        assert ProjectFile.objects.filter(project=archived_project).count() == 1

        # check project
        project.refresh_from_db()
        assert project.submission_status.name == "Recommended"
        assert project.version == 3

    def test_withdraw_permissions(
        self,
        agency_inputter_user,
        project,
        project_submitted_status,
        user,
        viewer_user,
        agency_user,
        secretariat_viewer_user,
        secretariat_v1_v2_edit_access_user,
        secretariat_production_v1_v2_edit_access_user,
        secretariat_v3_edit_access_user,
        secretariat_production_v3_edit_access_user,
        admin_user,
    ):
        project.version = 2
        project.submission_status = project_submitted_status
        project.save()

        url = reverse("project-v2-withdraw", args=(project.id,))

        def _test_user_permissions(user, expected_response_status):
            self.client.force_authenticate(user=user)
            response = self.client.post(url)
            assert response.status_code == expected_response_status
            return response.data

        # test with unauthenticated user
        self.client.force_authenticate(user=None)
        response = self.client.post(url)
        assert response.status_code == 403

        _test_user_permissions(user, 403)
        _test_user_permissions(viewer_user, 403)
        _test_user_permissions(agency_user, 403)
        _test_user_permissions(agency_inputter_user, 403)
        _test_user_permissions(secretariat_viewer_user, 403)
        _test_user_permissions(secretariat_v1_v2_edit_access_user, 200)
        project.submission_status = project_submitted_status
        project.save()
        _test_user_permissions(secretariat_production_v1_v2_edit_access_user, 200)
        project.submission_status = project_submitted_status
        project.save()
        _test_user_permissions(secretariat_v3_edit_access_user, 403)
        _test_user_permissions(secretariat_production_v3_edit_access_user, 403)
        _test_user_permissions(admin_user, 200)

    def test_withdraw_project(
        self,
        secretariat_v1_v2_edit_access_user,
        project,
        project_submitted_status,
    ):
        self.client.force_authenticate(user=secretariat_v1_v2_edit_access_user)
        url = reverse("project-v2-withdraw", args=(project.id,))

        # submit project and expect failure due to bad submission status
        response = self.client.post(url)
        assert response.status_code == 400
        assert response.data

        # set required fields
        project.version = 2
        project.submission_status = project_submitted_status
        project.save()

        self.client.force_authenticate(user=secretariat_v1_v2_edit_access_user)
        url = reverse("project-v2-withdraw", args=(project.id,))

        response = self.client.post(url)
        assert response.status_code == 200
        project.refresh_from_db()
        assert project.submission_status.name == "Withdrawn"

    def test_reject_permissions(
        self,
        agency_inputter_user,
        project,
        project_recommended_status,
        project_not_approved_status,
        user,
        viewer_user,
        agency_user,
        secretariat_viewer_user,
        secretariat_v1_v2_edit_access_user,
        secretariat_production_v1_v2_edit_access_user,
        secretariat_v3_edit_access_user,
        secretariat_production_v3_edit_access_user,
        admin_user,
    ):
        project.version = 3
        project.submission_status = project_recommended_status
        project.save()

        url = reverse("project-v2-reject", args=(project.id,))

        def _test_user_permissions(user, expected_response_status):
            self.client.force_authenticate(user=user)
            response = self.client.post(url)
            assert response.status_code == expected_response_status
            return response.data

        # test with unauthenticated user
        self.client.force_authenticate(user=None)
        response = self.client.post(url)
        assert response.status_code == 403

        _test_user_permissions(user, 403)
        _test_user_permissions(viewer_user, 403)
        _test_user_permissions(agency_user, 403)
        _test_user_permissions(agency_inputter_user, 403)
        _test_user_permissions(secretariat_viewer_user, 403)
        _test_user_permissions(secretariat_v1_v2_edit_access_user, 403)
        _test_user_permissions(secretariat_production_v1_v2_edit_access_user, 403)
        _test_user_permissions(secretariat_v3_edit_access_user, 200)
        project.submission_status = project_recommended_status
        project.save()

        _test_user_permissions(secretariat_production_v3_edit_access_user, 200)
        project.submission_status = project_recommended_status
        project.save()
        _test_user_permissions(admin_user, 200)

    def test_reject_project(
        self,
        secretariat_v3_edit_access_user,
        project,
        project_recommended_status,
        project_not_approved_status,
    ):
        self.client.force_authenticate(user=secretariat_v3_edit_access_user)
        url = reverse("project-v2-reject", args=(project.id,))

        # submit project and expect failure due to bad submission status
        response = self.client.post(url)
        assert response.status_code == 400
        assert response.data

        # set required fields
        project.version = 3
        project.submission_status = project_recommended_status
        project.save()

        self.client.force_authenticate(user=secretariat_v3_edit_access_user)
        url = reverse("project-v2-reject", args=(project.id,))

        response = self.client.post(url)
        assert response.status_code == 200
        project.refresh_from_db()
        assert project.submission_status == project_not_approved_status

    def test_approve_permissions(
        self,
        agency_inputter_user,
        project,
        project_recommended_status,
        project_approved_status,
        project_ongoing_status,
        decision,
        user,
        viewer_user,
        agency_user,
        secretariat_viewer_user,
        secretariat_v1_v2_edit_access_user,
        secretariat_production_v1_v2_edit_access_user,
        secretariat_v3_edit_access_user,
        secretariat_production_v3_edit_access_user,
        admin_user,
    ):
        project.version = 3
        project.submission_status = project_recommended_status
        project.decision = decision
        project.excom_provision = "Excom Provision"
        project.date_completion = datetime.date(2024, 9, 30)
        project.save()

        url = reverse("project-v2-approve", args=(project.id,))

        def _test_user_permissions(user, expected_response_status):
            self.client.force_authenticate(user=user)
            response = self.client.post(url)
            assert response.status_code == expected_response_status
            return response.data

        # test with unauthenticated user
        self.client.force_authenticate(user=None)
        response = self.client.post(url)
        assert response.status_code == 403

        _test_user_permissions(user, 403)
        _test_user_permissions(viewer_user, 403)
        _test_user_permissions(agency_user, 403)
        _test_user_permissions(agency_inputter_user, 403)
        _test_user_permissions(secretariat_viewer_user, 403)
        _test_user_permissions(secretariat_v1_v2_edit_access_user, 403)
        _test_user_permissions(secretariat_production_v1_v2_edit_access_user, 403)
        _test_user_permissions(secretariat_v3_edit_access_user, 200)

        project.submission_status = project_recommended_status
        project.save()

        _test_user_permissions(secretariat_production_v3_edit_access_user, 200)
        project.submission_status = project_recommended_status
        project.save()
        _test_user_permissions(admin_user, 200)

    def test_approve_project(
        self,
        secretariat_v3_edit_access_user,
        project,
        decision,
        project_recommended_status,
        project_approved_status,
        project_ongoing_status,
    ):
        self.client.force_authenticate(user=secretariat_v3_edit_access_user)
        url = reverse("project-v2-approve", args=(project.id,))

        # submit project and expect failure due to bad submission status
        response = self.client.post(url)
        assert response.status_code == 400
        assert response.data

        # set required fields
        project.version = 3
        project.submission_status = project_recommended_status
        project.save()

        # submit project and expect failure due to missing required fields
        self.client.force_authenticate(user=secretariat_v3_edit_access_user)
        url = reverse("project-v2-approve", args=(project.id,))

        response = self.client.post(url)
        assert response.status_code == 400

        project.decision = decision
        project.excom_provision = "Excom Provision"
        project.date_completion = datetime.date(2024, 9, 30)
        project.save()

        self.client.force_authenticate(user=secretariat_v3_edit_access_user)
        url = reverse("project-v2-approve", args=(project.id,))
        response = self.client.post(url)
        assert response.status_code == 200

        project.refresh_from_db()
        assert project.submission_status == project_approved_status
        assert project.status == project_ongoing_status

    def test_send_back_to_draft_permissions(
        self,
        agency_inputter_user,
        project,
        project_submitted_status,
        user,
        viewer_user,
        agency_user,
        secretariat_viewer_user,
        secretariat_v1_v2_edit_access_user,
        secretariat_production_v1_v2_edit_access_user,
        secretariat_v3_edit_access_user,
        secretariat_production_v3_edit_access_user,
        admin_user,
    ):
        project.version = 2
        project.submission_status = project_submitted_status
        project.save()

        url = reverse("project-v2-send-back-to-draft", args=(project.id,))

        def _test_user_permissions(user, expected_response_status):
            self.client.force_authenticate(user=user)
            response = self.client.post(url)
            assert response.status_code == expected_response_status
            return response.data

        # test with unauthenticated user
        self.client.force_authenticate(user=None)
        response = self.client.post(url)
        assert response.status_code == 403

        _test_user_permissions(user, 403)
        _test_user_permissions(viewer_user, 403)
        _test_user_permissions(agency_user, 403)
        _test_user_permissions(agency_inputter_user, 403)
        _test_user_permissions(secretariat_viewer_user, 403)
        _test_user_permissions(secretariat_v1_v2_edit_access_user, 200)
        project.submission_status = project_submitted_status
        project.save()
        _test_user_permissions(secretariat_production_v1_v2_edit_access_user, 200)
        project.submission_status = project_submitted_status
        project.save()
        _test_user_permissions(secretariat_v3_edit_access_user, 403)
        _test_user_permissions(secretariat_production_v3_edit_access_user, 403)
        _test_user_permissions(admin_user, 200)

    def test_send_back_to_draft_project(
        self,
        secretariat_v1_v2_edit_access_user,
        project,
        project_submitted_status,
    ):
        self.client.force_authenticate(user=secretariat_v1_v2_edit_access_user)
        url = reverse("project-v2-send-back-to-draft", args=(project.id,))

        # submit project and expect failure due to bad submission status
        response = self.client.post(url)
        assert response.status_code == 400
        assert response.data

        # set required fields
        project.version = 2
        project.submission_status = project_submitted_status
        project.save()

        self.client.force_authenticate(user=secretariat_v1_v2_edit_access_user)
        url = reverse("project-v2-send-back-to-draft", args=(project.id,))

        response = self.client.post(url)
        assert response.status_code == 200
        project.refresh_from_db()
        assert project.submission_status.name == "Draft"
