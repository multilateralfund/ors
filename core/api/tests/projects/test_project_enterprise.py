import pytest

from django.urls import reverse

from rest_framework.test import APIClient


from core.api.tests.base import BaseTest
from core.api.tests.factories import (
    ProjectEnterprise,
    ProjectEnterpriseOdsOdp,
)

pytestmark = pytest.mark.django_db
# pylint: disable=C8008,W0221,R0913


@pytest.fixture(name="_setup_enterprises")
def setup_enterprises(project, project2, new_country, new_agency):
    project2.country = new_country
    project2.meta_project.lead_agency = new_agency
    project2.save()

    enterprise1 = ProjectEnterprise.objects.create(
        project=project,
        enterprise="Enterprise 1",
    )
    ProjectEnterpriseOdsOdp.objects.create(enterprise=enterprise1)
    ProjectEnterpriseOdsOdp.objects.create(enterprise=enterprise1)
    enterprise2 = ProjectEnterprise.objects.create(
        project=project2,
        enterprise="Enterprise 2",
    )
    ProjectEnterpriseOdsOdp.objects.create(enterprise=enterprise2)
    enterprise3 = ProjectEnterprise.objects.create(
        project=project2,
        enterprise="Enterprise 3",
    )
    return enterprise1, enterprise2, enterprise3


class TestListProjectEnterprise(BaseTest):
    url = reverse("project-enterprise-list")

    def test_project_list_permissions(
        self,
        _setup_enterprises,
        user,
        viewer_user,
        agency_user,
        agency_inputter_user,
        secretariat_viewer_user,
        secretariat_v1_v2_edit_access_user,
        secretariat_production_v1_v2_edit_access_user,
        secretariat_v3_edit_access_user,
        secretariat_production_v3_edit_access_user,
        mlfs_admin_user,
        admin_user,
        project2,
        new_country,
        new_agency,
    ):
        def _test_user(user, expected_status, response_count=None):
            self.client.force_authenticate(user=user)
            response = self.client.get(self.url)
            assert response.status_code == expected_status
            if response_count is not None:
                assert len(response.data) == response_count
            return response

        # test for unauthenticated user
        response = self.client.get(self.url)
        assert response.status_code == 403
        project2.agency = new_agency
        project2.country = new_country
        project2.meta_project.lead_agency = new_agency
        project2.save()

        # test for different user roles
        _test_user(user, 403)
        _test_user(viewer_user, 200, response_count=1)
        _test_user(agency_user, 200, response_count=1)
        _test_user(agency_inputter_user, 200, response_count=1)
        _test_user(secretariat_viewer_user, 200, response_count=3)
        _test_user(secretariat_v1_v2_edit_access_user, 200, response_count=3)
        _test_user(secretariat_production_v1_v2_edit_access_user, 200, response_count=3)
        _test_user(secretariat_v3_edit_access_user, 200, response_count=3)
        _test_user(secretariat_production_v3_edit_access_user, 200, response_count=3)
        _test_user(mlfs_admin_user, 200, response_count=3)
        _test_user(admin_user, 200, response_count=3)

    def test_list(self, mlfs_admin_user, _setup_enterprises):
        enterprise1, enterprise2, enterprise3 = _setup_enterprises
        self.client.force_authenticate(user=mlfs_admin_user)
        response = self.client.get(self.url + "?ordering=enterprise")
        assert response.status_code == 200
        assert len(response.data) == 3
        assert response.data[0]["id"] == enterprise1.id
        assert response.data[0]["project"] == enterprise1.project.id
        assert response.data[0]["enterprise"] == enterprise1.enterprise
        assert len(response.data[0]["ods_odp"]) == 2

        assert response.data[1]["id"] == enterprise2.id
        assert response.data[1]["project"] == enterprise2.project.id
        assert response.data[1]["enterprise"] == enterprise2.enterprise
        assert len(response.data[1]["ods_odp"]) == 1

        assert response.data[2]["id"] == enterprise3.id
        assert response.data[2]["project"] == enterprise3.project.id
        assert response.data[2]["enterprise"] == enterprise3.enterprise
        assert len(response.data[2]["ods_odp"]) == 0


class TestProjectRetrieveProjectEnterprise:

    client = APIClient()

    def test_project_retrieve_permissions(
        self,
        _setup_enterprises,
        user,
        viewer_user,
        agency_user,
        agency_inputter_user,
        secretariat_viewer_user,
        secretariat_v1_v2_edit_access_user,
        secretariat_production_v1_v2_edit_access_user,
        secretariat_v3_edit_access_user,
        secretariat_production_v3_edit_access_user,
        mlfs_admin_user,
        admin_user,
        project2,
        new_country,
        new_agency,
    ):
        project2.agency = new_agency
        project2.country = new_country
        project2.meta_project.lead_agency = new_agency
        project2.save()
        enterprise1, enterprise2, _ = _setup_enterprises

        def _test_user(user, expected_status, enterprise):
            url = reverse("project-enterprise-detail", args=[enterprise.id])
            self.client.force_authenticate(user=user)
            response = self.client.get(url)
            assert response.status_code == expected_status

        # test for unauthenticated user

        url = reverse("project-enterprise-detail", args=[enterprise1.id])
        response = self.client.get(url)
        assert response.status_code == 403

        # test for different user roles
        _test_user(user, 403, enterprise1)
        _test_user(user, 403, enterprise2)

        _test_user(viewer_user, 200, enterprise1)
        _test_user(
            viewer_user, 404, enterprise2
        )  # viewer_user has no access to project2
        _test_user(agency_user, 200, enterprise1)
        _test_user(
            agency_user, 404, enterprise2
        )  # agency_user has no access to project2
        _test_user(agency_inputter_user, 200, enterprise1)
        _test_user(
            agency_inputter_user, 404, enterprise2
        )  # agency_inputter_user has no access to project2

        _test_user(secretariat_viewer_user, 200, enterprise2)
        _test_user(secretariat_v1_v2_edit_access_user, 200, enterprise2)
        _test_user(secretariat_production_v1_v2_edit_access_user, 200, enterprise2)
        _test_user(secretariat_v3_edit_access_user, 200, enterprise2)
        _test_user(secretariat_production_v3_edit_access_user, 200, enterprise2)
        _test_user(mlfs_admin_user, 200, enterprise2)
        _test_user(admin_user, 200, enterprise2)

    def test_retrieve(self, mlfs_admin_user, _setup_enterprises):
        enterprise1, _, _ = _setup_enterprises
        url = reverse("project-enterprise-detail", args=[enterprise1.id])
        self.client.force_authenticate(user=mlfs_admin_user)
        response = self.client.get(url)
        assert response.status_code == 200
        assert response.data["id"] == enterprise1.id
        assert response.data["project"] == enterprise1.project.id
        assert response.data["enterprise"] == enterprise1.enterprise
        assert len(response.data["ods_odp"]) == 2


class TestCreateProjectEnterprise:

    client = APIClient()
    url = reverse("project-enterprise-list")

    def get_create_data(self, project, substance, blend):
        return {
            "project": project.id,
            "enterprise": "New Enterprise",
            "location": "New City",
            "application": "New Application",
            "local_ownership": 50.0,
            "export_to_non_a5": 30.0,
            "capital_cost_approved": 10000.0,
            "operating_cost_approved": 5000.0,
            "funds_disbursed": 2000.0,
            "remarks": "Some remarks",
            "ods_odp": [
                {
                    "ods_substance": substance.id,
                    "phase_out_mt": 10.0,
                    "ods_replacement": "Alternative Tech 1",
                    "ods_replacement_phase_in": "Replacement Tech 1",
                },
                {
                    "ods_blend": blend.id,
                    "phase_out_mt": 20.0,
                    "ods_replacement": "Alternative Tech 2",
                    "ods_replacement_phase_in": "Replacement Tech 2",
                },
            ],
        }

    def test_project_create_permissions(
        self,
        _setup_enterprises,
        user,
        viewer_user,
        agency_user,
        agency_inputter_user,
        secretariat_viewer_user,
        secretariat_v1_v2_edit_access_user,
        secretariat_production_v1_v2_edit_access_user,
        secretariat_v3_edit_access_user,
        secretariat_production_v3_edit_access_user,
        mlfs_admin_user,
        admin_user,
        project,
        substance,
        blend,
    ):
        data = self.get_create_data(project, substance, blend)

        def _test_user(user, expected_status, data):
            self.client.force_authenticate(user=user)
            response = self.client.post(self.url, data, format="json")
            assert response.status_code == expected_status
            return response

        # test for unauthenticated user
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 403

        # test for different user roles
        _test_user(user, 403, data)
        _test_user(viewer_user, 403, data)
        _test_user(agency_user, 403, data)
        _test_user(agency_inputter_user, 403, data)
        _test_user(secretariat_viewer_user, 403, data)
        _test_user(secretariat_v1_v2_edit_access_user, 403, data)
        _test_user(secretariat_production_v1_v2_edit_access_user, 403, data)

        _test_user(secretariat_v3_edit_access_user, 201, data)
        _test_user(secretariat_production_v3_edit_access_user, 201, data)
        _test_user(mlfs_admin_user, 201, data)
        _test_user(admin_user, 201, data)

    def test_create(self, mlfs_admin_user, project, substance, blend):
        self.client.force_authenticate(user=mlfs_admin_user)
        data = self.get_create_data(project, substance, blend)
        assert ProjectEnterprise.objects.all().count() == 0
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 201
        assert ProjectEnterprise.objects.all().count() == 1
        enterprise = ProjectEnterprise.objects.first()
        assert enterprise.enterprise == "New Enterprise"
        assert enterprise.location == "New City"
        assert enterprise.application == "New Application"
        assert enterprise.local_ownership == 50.0
        assert enterprise.export_to_non_a5 == 30.0
        assert enterprise.capital_cost_approved == 10000.0
        assert enterprise.operating_cost_approved == 5000.0
        assert enterprise.funds_disbursed == 2000.0
        assert enterprise.remarks == "Some remarks"
        assert enterprise.project == project
        assert enterprise.ods_odp.count() == 2
        ods_odp_1 = enterprise.ods_odp.get(ods_substance=substance)
        assert ods_odp_1.phase_out_mt == 10.0
        assert ods_odp_1.ods_replacement == "Alternative Tech 1"
        assert ods_odp_1.ods_replacement_phase_in == "Replacement Tech 1"
        ods_odp_2 = enterprise.ods_odp.get(ods_blend=blend)
        assert ods_odp_2.phase_out_mt == 20.0
        assert ods_odp_2.ods_replacement == "Alternative Tech 2"
        assert ods_odp_2.ods_replacement_phase_in == "Replacement Tech 2"


class TestUpdateProjectEnterprise:

    client = APIClient()

    def get_update_data(self, project, substance, blend, enterprise):
        ods_odp = enterprise.ods_odp.first()
        return {
            "id": enterprise.id,
            "project": project.id,
            "enterprise": "Updated Enterprise",
            "location": "Updated City",
            "application": "Updated Application",
            "local_ownership": 60.0,
            "export_to_non_a5": 40.0,
            "capital_cost_approved": 20000.0,
            "operating_cost_approved": 10000.0,
            "funds_disbursed": 4000.0,
            "remarks": "Updated remarks",
            "ods_odp": [
                {
                    "ods_odp": ods_odp.id,
                    "ods_substance": substance.id,
                    "phase_out_mt": 15.0,
                    "ods_replacement": "Updated Alternative Tech 1",
                    "ods_replacement_phase_in": "Updated Replacement Tech 1",
                },
                {
                    "ods_blend": blend.id,
                    "phase_out_mt": 25.0,
                    "ods_replacement": "New Alternative Tech 2",
                    "ods_replacement_phase_in": "New Replacement Tech 2",
                },
            ],
        }

    def test_project_update_permissions(
        self,
        _setup_enterprises,
        user,
        viewer_user,
        agency_user,
        agency_inputter_user,
        secretariat_viewer_user,
        secretariat_v1_v2_edit_access_user,
        secretariat_production_v1_v2_edit_access_user,
        secretariat_v3_edit_access_user,
        secretariat_production_v3_edit_access_user,
        mlfs_admin_user,
        admin_user,
        project,
        substance,
        blend,
    ):
        enterprise1, _, _ = _setup_enterprises
        data = self.get_update_data(project, substance, blend, enterprise1)

        def _test_user(user, expected_status, enterprise, data):
            url = reverse("project-enterprise-detail", args=[enterprise.id])
            self.client.force_authenticate(user=user)
            response = self.client.put(url, data, format="json")
            assert response.status_code == expected_status
            return response

        # test for unauthenticated user
        url = reverse("project-enterprise-detail", args=[enterprise1.id])
        response = self.client.put(url, data, format="json")
        assert response.status_code == 403

        # test for different user roles
        _test_user(user, 403, enterprise1, data)
        _test_user(viewer_user, 403, enterprise1, data)
        _test_user(agency_user, 403, enterprise1, data)
        _test_user(agency_inputter_user, 403, enterprise1, data)
        _test_user(secretariat_viewer_user, 403, enterprise1, data)
        _test_user(secretariat_v1_v2_edit_access_user, 403, enterprise1, data)
        _test_user(
            secretariat_production_v1_v2_edit_access_user, 403, enterprise1, data
        )

        _test_user(secretariat_v3_edit_access_user, 200, enterprise1, data)
        _test_user(secretariat_production_v3_edit_access_user, 200, enterprise1, data)
        _test_user(mlfs_admin_user, 200, enterprise1, data)
        _test_user(admin_user, 200, enterprise1, data)

    def test_update(
        self, mlfs_admin_user, _setup_enterprises, project, substance, blend
    ):
        enterprise1, _, _ = _setup_enterprises
        self.client.force_authenticate(user=mlfs_admin_user)
        data = self.get_update_data(project, substance, blend, enterprise1)
        url = reverse("project-enterprise-detail", args=[enterprise1.id])
        response = self.client.put(url, data, format="json")
        assert response.status_code == 200
        enterprise1.refresh_from_db()
        assert enterprise1.enterprise == "Updated Enterprise"
        assert enterprise1.location == "Updated City"
        assert enterprise1.application == "Updated Application"
        assert enterprise1.local_ownership == 60.0
        assert enterprise1.export_to_non_a5 == 40.0
        assert enterprise1.capital_cost_approved == 20000.0
        assert enterprise1.operating_cost_approved == 10000.0
        assert enterprise1.funds_disbursed == 4000.0
        assert enterprise1.remarks == "Updated remarks"
        assert enterprise1.project == project
        assert enterprise1.ods_odp.count() == 2
        ods_odp_1 = enterprise1.ods_odp.get(ods_substance=substance)
        assert ods_odp_1.phase_out_mt == 15.0
        assert ods_odp_1.ods_replacement == "Updated Alternative Tech 1"
        assert ods_odp_1.ods_replacement_phase_in == "Updated Replacement Tech 1"
        ods_odp_2 = enterprise1.ods_odp.get(ods_blend=blend)
        assert ods_odp_2.phase_out_mt == 25.0
        assert ods_odp_2.ods_replacement == "New Alternative Tech 2"
        assert ods_odp_2.ods_replacement_phase_in == "New Replacement Tech 2"


class TestProjectEnterpriseApproval:

    client = APIClient()

    def test_project_approval_permissions(
        self,
        _setup_enterprises,
        user,
        viewer_user,
        agency_user,
        agency_inputter_user,
        secretariat_viewer_user,
        secretariat_v1_v2_edit_access_user,
        secretariat_production_v1_v2_edit_access_user,
        secretariat_v3_edit_access_user,
        secretariat_production_v3_edit_access_user,
        mlfs_admin_user,
        admin_user,
    ):
        enterprise1, _, _ = _setup_enterprises
        url = reverse("project-enterprise-approve", args=[enterprise1.id])

        def _test_user(user, expected_status, url):
            self.client.force_authenticate(user=user)
            response = self.client.post(url)
            assert response.status_code == expected_status
            if response.status_code == 200:
                enterprise1.status = "Pending Approval"
                enterprise1.save()

            return response

        # test for unauthenticated user
        response = self.client.post(url)
        assert response.status_code == 403

        # test for different user roles
        _test_user(user, 403, url)
        _test_user(viewer_user, 403, url)
        _test_user(agency_user, 403, url)
        _test_user(agency_inputter_user, 403, url)
        _test_user(secretariat_viewer_user, 403, url)
        _test_user(secretariat_v1_v2_edit_access_user, 403, url)
        _test_user(secretariat_production_v1_v2_edit_access_user, 403, url)

        _test_user(secretariat_v3_edit_access_user, 200, url)
        _test_user(secretariat_production_v3_edit_access_user, 200, url)
        _test_user(mlfs_admin_user, 200, url)
        _test_user(admin_user, 200, url)

    def test_approve(self, mlfs_admin_user, _setup_enterprises):
        enterprise1, _, _ = _setup_enterprises
        self.client.force_authenticate(user=mlfs_admin_user)
        url = reverse("project-enterprise-approve", args=[enterprise1.id])
        assert enterprise1.status == "Pending Approval"
        response = self.client.post(url)
        assert response.status_code == 200
        enterprise1.refresh_from_db()
        assert enterprise1.status == "Approved"

        # test cannot approve again
        response = self.client.post(url)
        assert response.status_code == 400
        assert response.data["detail"] == "Only pending enterprises can be approved."
