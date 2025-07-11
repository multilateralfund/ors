import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from core.api.tests.factories import (
    AgencyFactory,
    ProjectFieldFactory,
    ProjectSpecificFieldsFactory,
)


pytestmark = pytest.mark.django_db

# pylint: disable=R0913,W0613


class TestProjectListPreviousTranches:
    client = APIClient()

    def _prepare_projects(self, project1, project2, project_approved_status):
        # Create two projects with different tranches
        project1.tranche = 2
        project1.save()
        project2.tranche = 1
        project2.submission_status = project_approved_status
        project2.meta_project = project1.meta_project
        project2.save()

    def test_project_list_previous_tranches_permissions(
        self,
        user,
        project,
        project_approved_status,
        project2,
        viewer_user,
        agency_user,
        agency_inputter_user,
        secretariat_viewer_user,
        secretariat_v1_v2_edit_access_user,
        secretariat_production_v1_v2_edit_access_user,
        secretariat_v3_edit_access_user,
        secretariat_production_v3_edit_access_user,
        admin_user,
    ):
        self._prepare_projects(project, project2, project_approved_status)

        def _test_user_permissions(user, expected_response_status):
            self.client.force_authenticate(user=user)
            response = self.client.get(
                reverse("project-v2-list-previous-tranches", args=(project.id,))
            )
            assert response.status_code == expected_response_status
            return response.data

        # test with unauthenticated user
        self.client.force_authenticate(user=None)
        response = self.client.get(
            reverse("project-v2-list-previous-tranches", args=(project.id,))
        )
        viewer_user.agency = agency_user.agency
        viewer_user.save()
        assert response.status_code == 403
        _test_user_permissions(user, 403)
        _test_user_permissions(viewer_user, 200)
        _test_user_permissions(agency_user, 200)
        _test_user_permissions(agency_inputter_user, 200)
        _test_user_permissions(secretariat_viewer_user, 200)
        _test_user_permissions(secretariat_v1_v2_edit_access_user, 200)
        _test_user_permissions(secretariat_production_v1_v2_edit_access_user, 200)
        _test_user_permissions(secretariat_v3_edit_access_user, 200)
        _test_user_permissions(secretariat_production_v3_edit_access_user, 200)
        _test_user_permissions(admin_user, 200)

    def test_project_list_previous_tranches(
        self,
        project,
        project_approved_status,
        project_draft_status,
        project2,
        secretariat_v1_v2_edit_access_user,
    ):
        self.client.force_authenticate(user=secretariat_v1_v2_edit_access_user)
        self._prepare_projects(project, project2, project_approved_status)

        response = self.client.get(
            reverse("project-v2-list-previous-tranches", args=(project.id,))
        )
        assert response.status_code == 200, response.data
        assert len(response.data) == 1
        assert response.data[0]["id"] == project2.id
        assert response.data[0]["tranche"] == 1

        # test with tranche query parameter
        response = self.client.get(
            reverse("project-v2-list-previous-tranches", args=(project.id,)),
            {"tranche": 2},
        )
        assert response.status_code == 200, response.data
        assert len(response.data) == 1
        assert response.data[0]["id"] == project2.id
        assert response.data[0]["tranche"] == 1

        # test with project2 without meta_project
        project2.meta_project = None
        project2.save()
        response = self.client.get(
            reverse("project-v2-list-previous-tranches", args=(project.id,))
        )
        assert response.status_code == 200, response.data
        assert len(response.data) == 0

        # test with project2 with different tranche
        project2.tranche = 3
        project2.meta_project = project.meta_project
        project2.save()
        response = self.client.get(
            reverse("project-v2-list-previous-tranches", args=(project.id,))
        )
        assert response.status_code == 200, response.data
        assert len(response.data) == 0

        # test with project2 with different submission status
        project2.submission_status = project_draft_status
        project2.tranche = 1
        project2.save()
        response = self.client.get(
            reverse("project-v2-list-previous-tranches", args=(project.id,))
        )
        assert response.status_code == 200, response.data
        assert len(response.data) == 0

    def test_project_list_previous_tranches_include_validation(
        self,
        project,
        project_approved_status,
        project_draft_status,
        project2,
        secretariat_v1_v2_edit_access_user,
    ):
        self.client.force_authenticate(user=secretariat_v1_v2_edit_access_user)
        self._prepare_projects(project, project2, project_approved_status)

        # set project specific fields

        project_specific_fields = ProjectSpecificFieldsFactory.create(
            cluster=project.cluster,
            type=project.project_type,
            sector=project.sector,
        )
        field1 = ProjectFieldFactory.create(
            import_name="number_of_female_technicians_trained",
            label="Number of female technicians trained",
            read_field_name="number_of_female_technicians",
            write_field_name="number_of_female_technicians",
            table="project",
            data_type="number",
            section="Impact",
            sort_order=1,
        )
        field2 = ProjectFieldFactory.create(
            import_name="number_of_female_technicians_trained_actual",
            label="Number of female technicians trained",
            read_field_name="number_of_female_technicians_trained_actual",
            write_field_name="number_of_female_technicians_trained_actual",
            table="project",
            data_type="number",
            section="Impact",
            is_actual=True,
            sort_order=2,
        )
        field3 = ProjectFieldFactory.create(
            import_name="total_number_of_trainers_trained_actual",
            label="Total number of trainers trained actual",
            read_field_name="total_number_of_trainers_trained_actual",
            write_field_name="total_number_of_trainers_trained_actual",
            table="project",
            data_type="number",
            section="Impact",
            is_actual=True,
            sort_order=3,
        )
        project_specific_fields.fields.add(field1, field2, field3)

        response = self.client.get(
            reverse("project-v2-list-previous-tranches", args=(project.id,)),
            {"include_validation": "true"},
        )
        assert response.status_code == 200, response.data
        assert len(response.data) == 1
        assert response.data[0]["id"] == project2.id
        assert response.data[0]["tranche"] == 1
        assert len(response.data[0]["errors"]) == 1
        assert (
            response.data[0]["errors"][0]["message"]
            == "At least one actual indicator should be filled."
        )
        assert response.data[0]["warnings"]
        assert "number_of_female_technicians_trained_actual" in [
            x["field"] for x in response.data[0]["warnings"]
        ]
        assert "total_number_of_trainers_trained_actual" in [
            x["field"] for x in response.data[0]["warnings"]
        ]

        project2.total_number_of_trainers_trained_actual = 10
        project2.save()

        response = self.client.get(
            reverse("project-v2-list-previous-tranches", args=(project.id,)),
            {"include_validation": "true"},
        )
        assert response.status_code == 200, response.data
        assert len(response.data) == 1
        assert response.data[0]["id"] == project2.id
        assert len(response.data[0]["errors"]) == 0
        assert len(response.data[0]["warnings"]) == 1


class TestAssociateProject:
    client = APIClient()

    def test_associate_project_permissions(
        self,
        project,
        project2,
        user,
        viewer_user,
        agency_user,
        agency_inputter_user,
        secretariat_viewer_user,
        secretariat_v1_v2_edit_access_user,
        secretariat_production_v1_v2_edit_access_user,
        secretariat_v3_edit_access_user,
        secretariat_production_v3_edit_access_user,
        admin_user,
    ):
        url = reverse("project-v2-associate-projects")
        agency = AgencyFactory.create(code="TESTAG")

        def _test_user_permissions(user, expected_response_status):
            self.client.force_authenticate(user=user)
            response = self.client.post(
                url,
                data={
                    "project_ids": [project.id, project2.id],
                    "lead_agency_id": agency.id,
                },
                format="json",
            )
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
        _test_user_permissions(secretariat_production_v1_v2_edit_access_user, 200)
        _test_user_permissions(secretariat_v3_edit_access_user, 200)
        _test_user_permissions(secretariat_production_v3_edit_access_user, 200)
        _test_user_permissions(admin_user, 200)

    def test_associate_project(
        self,
        secretariat_v1_v2_edit_access_user,
        project,
        project2,
    ):
        self.client.force_authenticate(user=secretariat_v1_v2_edit_access_user)
        url = reverse("project-v2-associate-projects")
        agency = AgencyFactory.create(code="TESTAG")
        # associate project
        response = self.client.post(
            url,
            format="json",
            data={
                "project_ids": [project.id, project2.id],
                "lead_agency_id": agency.id,
            },
        )
        assert response.status_code == 200, response.data

        project.refresh_from_db()
        project2.refresh_from_db()
        assert project.meta_project == project2.meta_project
        assert project.meta_project.lead_agency == agency

        project.meta_project = None
        project.save()
        project2.meta_project = None
        project2.save()

        response = self.client.post(
            url,
            format="json",
            data={
                "project_ids": [project.id, project2.id],
                "lead_agency_id": agency.id,
            },
        )
        assert response.status_code == 200, response.data

        project.refresh_from_db()
        project2.refresh_from_db()
        assert project.meta_project == project2.meta_project
        assert project.meta_project.lead_agency == agency


class TestProjectListAssocitatedProjects:
    client = APIClient()

    def _prepare_projects(self, project1, project2, project_draft_status):
        # Create two projects with different tranches
        project1.submission_status = project_draft_status
        project1.save()
        project1.submission_status = project_draft_status
        project1.meta_project = project2.meta_project
        project1.save()

    def test_list_associated_projects_permissions(
        self,
        user,
        project,
        project_draft_status,
        project2,
        viewer_user,
        agency_user,
        agency_inputter_user,
        secretariat_viewer_user,
        secretariat_v1_v2_edit_access_user,
        secretariat_production_v1_v2_edit_access_user,
        secretariat_v3_edit_access_user,
        secretariat_production_v3_edit_access_user,
        admin_user,
    ):
        self._prepare_projects(project, project2, project_draft_status)

        def _test_user_permissions(user, expected_response_status):
            self.client.force_authenticate(user=user)
            response = self.client.get(
                reverse("project-v2-list-associated-projects", args=(project2.id,))
            )
            assert response.status_code == expected_response_status
            return response.data

        # test with unauthenticated user
        self.client.force_authenticate(user=None)
        response = self.client.get(
            reverse("project-v2-list-associated-projects", args=(project2.id,))
        )
        viewer_user.agency = agency_user.agency
        viewer_user.save()
        assert response.status_code == 403
        _test_user_permissions(user, 403)
        _test_user_permissions(viewer_user, 200)
        _test_user_permissions(agency_user, 200)
        _test_user_permissions(agency_inputter_user, 200)
        _test_user_permissions(secretariat_viewer_user, 200)
        _test_user_permissions(secretariat_v1_v2_edit_access_user, 200)
        _test_user_permissions(secretariat_production_v1_v2_edit_access_user, 200)
        _test_user_permissions(secretariat_v3_edit_access_user, 200)
        _test_user_permissions(secretariat_production_v3_edit_access_user, 200)
        _test_user_permissions(admin_user, 200)

    def test_list_associated_projects(
        self,
        project,
        project_draft_status,
        project2,
        project3,
        project_approved_status,
        secretariat_v1_v2_edit_access_user,
    ):
        self.client.force_authenticate(user=secretariat_v1_v2_edit_access_user)
        self._prepare_projects(project, project2, project_draft_status)

        project.tranche = 2
        project.save()
        project3.submission_status = project_approved_status
        project3.save()

        response = self.client.get(
            reverse("project-v2-list-associated-projects", args=(project2.id,))
        )
        assert response.status_code == 200, response.data
        assert len(response.data) == 1
        assert response.data[0]["id"] == project.id

        response = self.client.get(
            reverse("project-v2-list-associated-projects", args=(project2.id,)),
            {"include_project": "true"},
        )

        assert response.status_code == 200, response.data
        assert len(response.data) == 2
        assert response.data[0]["id"] == project2.id
        assert response.data[1]["id"] == project.id

        response = self.client.get(
            reverse("project-v2-list-associated-projects", args=(project2.id,)),
            {"include_project": "true", "include_validation": "true"},
        )

        # test validation with expecting previous_tranche for project
        assert response.status_code == 200, response.data
        assert len(response.data) == 2
        assert response.data[0]["id"] == project2.id
        assert response.data[1]["id"] == project.id
        assert len(response.data[0]["errors"]) == 6
        assert len(response.data[1]["errors"]) == 7
        assert response.data[1]["errors"]["tranche"][0] == (
            "Project must have at least one previous tranche entry."
        )

        # test validation with expecting previous_tranche for project2
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

        response = self.client.get(
            reverse("project-v2-list-associated-projects", args=(project2.id,)),
            {"include_project": "true", "include_validation": "true"},
        )

        # test validation with expecting previous_tranche for project
        assert response.status_code == 200, response.data
        assert len(response.data) == 2
        assert response.data[0]["id"] == project2.id
        assert response.data[1]["id"] == project.id
        assert len(response.data[0]["errors"]) == 6
        assert len(response.data[1]["errors"]) == 7
        assert response.data[1]["errors"]["previous_tranches"][0] == (
            f"Previous tranche {project3.title}({project3.id}): At least one actual indicator should be filled."
        )
