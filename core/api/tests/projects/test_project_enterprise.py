import pytest

from django.urls import reverse

from rest_framework.test import APIClient


from core.api.tests.base import BaseTest
from core.api.tests.factories import (
    EnterpriseFactory,
    ProjectEnterprise,
    ProjectEnterpriseOdsOdp,
)
from core.models.utils import EnterpriseStatus

pytestmark = pytest.mark.django_db
# pylint: disable=C8008,W0221,R0913


@pytest.fixture(name="_setup_enterprises")
def setup_enterprises(project, project2, new_country, new_agency):
    project2.country = new_country
    project2.meta_project.lead_agency = new_agency
    project2.save()
    enterprise1 = EnterpriseFactory(name="Enterprise 1")
    enterprise2 = EnterpriseFactory(name="Enterprise 2")
    enterprise3 = EnterpriseFactory(name="Enterprise 3")
    project_enterprise1 = ProjectEnterprise.objects.create(
        project=project,
        enterprise=enterprise1
    )
    ProjectEnterpriseOdsOdp.objects.create(project_enterprise=project_enterprise1)
    ProjectEnterpriseOdsOdp.objects.create(project_enterprise=project_enterprise1)
    project_enterprise2 = ProjectEnterprise.objects.create(
        project=project2,
        enterprise=enterprise2,
    )
    ProjectEnterpriseOdsOdp.objects.create(project_enterprise=project_enterprise2)
    project_enterprise3 = ProjectEnterprise.objects.create(
        project=project2,
        enterprise=enterprise3,
    )
    return project_enterprise1, project_enterprise2, project_enterprise3


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
        enterprise1, _,_ = _setup_enterprises
        enterprise1.status = EnterpriseStatus.APPROVED
        enterprise1.save()
        # test for different user roles
        _test_user(user, 403)
        _test_user(viewer_user, 200, response_count=1)
        _test_user(agency_user, 200, response_count=1)
        _test_user(agency_inputter_user, 200, response_count=1)
        _test_user(secretariat_viewer_user, 200, response_count=1)
        _test_user(secretariat_v1_v2_edit_access_user, 200, response_count=1)
        _test_user(secretariat_production_v1_v2_edit_access_user, 200, response_count=1)
        _test_user(secretariat_v3_edit_access_user, 200, response_count=3)
        _test_user(secretariat_production_v3_edit_access_user, 200, response_count=3)
        _test_user(mlfs_admin_user, 200, response_count=3)
        _test_user(admin_user, 200, response_count=3)

    def test_list(self, mlfs_admin_user, _setup_enterprises):
        project_enterprise1, project_enterprise2, project_enterprise3 = (
            _setup_enterprises
        )
        self.client.force_authenticate(user=mlfs_admin_user)
        response = self.client.get(self.url + "?ordering=enterprise")
        assert response.status_code == 200
        assert len(response.data) == 3
        assert response.data[0]["id"] == project_enterprise1.id
        assert response.data[0]["project"] == project_enterprise1.project.id
        assert response.data[0]["enterprise"]["id"] == project_enterprise1.enterprise.id
        assert (
            response.data[0]["enterprise"]["name"]
            == project_enterprise1.enterprise.name
        )
        assert (
            response.data[0]["enterprise"]["country"]
            == project_enterprise1.enterprise.country.id
        )
        assert (
            response.data[0]["enterprise"]["location"]
            == project_enterprise1.enterprise.location
        )
        assert (
            response.data[0]["enterprise"]["application"]
            == project_enterprise1.enterprise.application
        )

        assert len(response.data[0]["ods_odp"]) == 2

        assert response.data[1]["id"] == project_enterprise2.id
        assert response.data[1]["project"] == project_enterprise2.project.id
        assert response.data[1]["enterprise"]["id"] == project_enterprise2.enterprise.id
        assert (
            response.data[1]["enterprise"]["name"]
            == project_enterprise2.enterprise.name
        )
        assert (
            response.data[1]["enterprise"]["country"]
            == project_enterprise2.enterprise.country.id
        )
        assert (
            response.data[1]["enterprise"]["location"]
            == project_enterprise2.enterprise.location
        )
        assert (
            response.data[1]["enterprise"]["application"]
            == project_enterprise2.enterprise.application
        )
        assert len(response.data[1]["ods_odp"]) == 1

        assert response.data[2]["id"] == project_enterprise3.id
        assert response.data[2]["project"] == project_enterprise3.project.id
        assert response.data[2]["enterprise"]["id"] == project_enterprise3.enterprise.id
        assert (
            response.data[2]["enterprise"]["name"]
            == project_enterprise3.enterprise.name
        )
        assert (
            response.data[2]["enterprise"]["country"]
            == project_enterprise3.enterprise.country.id
        )
        assert (
            response.data[2]["enterprise"]["location"]
            == project_enterprise3.enterprise.location
        )
        assert (
            response.data[2]["enterprise"]["application"]
            == project_enterprise3.enterprise.application
        )
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
        enterprise1, _, _ = _setup_enterprises
        enterprise1.status = EnterpriseStatus.APPROVED
        enterprise1.save()
        project2.agency = new_agency
        project2.country = new_country
        project2.meta_project.lead_agency = new_agency
        project2.save()
        project_enterprise1, project_enterprise2, _ = _setup_enterprises

        def _test_user(user, expected_status, enterprise):
            url = reverse("project-enterprise-detail", args=[enterprise.id])
            self.client.force_authenticate(user=user)
            response = self.client.get(url)
            assert response.status_code == expected_status

        # test for unauthenticated user

        url = reverse("project-enterprise-detail", args=[project_enterprise1.id])
        response = self.client.get(url)
        assert response.status_code == 403

        # test for different user roles
        _test_user(user, 403, project_enterprise1)
        _test_user(user, 403, project_enterprise2)

        _test_user(viewer_user, 200, project_enterprise1)
        _test_user(
            viewer_user, 404, project_enterprise2
        )  # viewer_user has no access to project2
        _test_user(agency_user, 200, project_enterprise1)
        _test_user(
            agency_user, 404, project_enterprise2
        )  # agency_user has no access to project2
        _test_user(agency_inputter_user, 200, project_enterprise1)
        _test_user(
            agency_inputter_user, 404, project_enterprise2
        )  # agency_inputter_user has no access to project2

        _test_user(secretariat_viewer_user, 404, project_enterprise2)
        _test_user(secretariat_v1_v2_edit_access_user, 404, project_enterprise2)
        _test_user(
            secretariat_production_v1_v2_edit_access_user, 404, project_enterprise2
        )
        _test_user(secretariat_v3_edit_access_user, 200, project_enterprise2)
        _test_user(secretariat_production_v3_edit_access_user, 200, project_enterprise2)
        _test_user(mlfs_admin_user, 200, project_enterprise2)
        _test_user(admin_user, 200, project_enterprise2)

    def test_retrieve(self, mlfs_admin_user, _setup_enterprises):
        project_enterprise1, _, _ = _setup_enterprises
        url = reverse("project-enterprise-detail", args=[project_enterprise1.id])
        self.client.force_authenticate(user=mlfs_admin_user)
        response = self.client.get(url)
        assert response.status_code == 200
        assert response.data["id"] == project_enterprise1.id
        assert response.data["project"] == project_enterprise1.project.id
        assert response.data["enterprise"]["id"] == project_enterprise1.enterprise.id
        assert (
            response.data["enterprise"]["name"] == project_enterprise1.enterprise.name
        )
        assert (
            response.data["enterprise"]["country"]
            == project_enterprise1.enterprise.country.id
        )
        assert (
            response.data["enterprise"]["location"]
            == project_enterprise1.enterprise.location
        )
        assert (
            response.data["enterprise"]["application"]
            == project_enterprise1.enterprise.application
        )
        assert len(response.data["ods_odp"]) == 2


class TestCreateProjectEnterprise:

    client = APIClient()
    url = reverse("project-enterprise-list")

    def get_create_data(self, project, substance, blend):
        return {
            "project": project.id,
            "enterprise": {
                "name": "New Enterprise",
                "country": project.country.id,
                "location": "New City",
                "application": "New Application",
                "local_ownership": 50.0,
                "export_to_non_a5": 30.0,
                "remarks": "Some remarks",
            },
            "capital_cost_approved": 10000.0,
            "operating_cost_approved": 5000.0,
            "funds_disbursed": 2000.0,
            "ods_odp": [
                {
                    "ods_substance": substance.id,
                    "phase_out_mt": 10.0,
                    "ods_replacement": "Alternative Tech 1",
                    "ods_replacement_phase_in": 50.0,
                },
                {
                    "ods_blend": blend.id,
                    "phase_out_mt": 20.0,
                    "ods_replacement": "Alternative Tech 2",
                    "ods_replacement_phase_in": 70.0,
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
        project_enterprise = ProjectEnterprise.objects.first()
        assert project_enterprise.enterprise.name == "New Enterprise"
        assert project_enterprise.enterprise.location == "New City"
        assert project_enterprise.enterprise.application == "New Application"
        assert project_enterprise.enterprise.local_ownership == 50.0
        assert project_enterprise.enterprise.export_to_non_a5 == 30.0
        assert project_enterprise.capital_cost_approved == 10000.0
        assert project_enterprise.operating_cost_approved == 5000.0
        assert project_enterprise.funds_disbursed == 2000.0
        assert project_enterprise.enterprise.remarks == "Some remarks"
        assert project_enterprise.project == project
        assert project_enterprise.ods_odp.count() == 2
        ods_odp_1 = project_enterprise.ods_odp.get(ods_substance=substance)
        assert ods_odp_1.phase_out_mt == 10.0
        assert ods_odp_1.ods_replacement == "Alternative Tech 1"
        assert ods_odp_1.ods_replacement_phase_in == 50.0
        ods_odp_2 = project_enterprise.ods_odp.get(ods_blend=blend)
        assert ods_odp_2.phase_out_mt == 20.0
        assert ods_odp_2.ods_replacement == "Alternative Tech 2"
        assert ods_odp_2.ods_replacement_phase_in == 70.0


class TestUpdateProjectEnterprise:

    client = APIClient()

    def get_update_data(self, project, substance, blend, enterprise):
        ods_odp = enterprise.ods_odp.first()
        return {
            "id": enterprise.id,
            "project": project.id,
            "enterprise": {
                "name": "Updated Enterprise",
                "country": project.country.id,
                "location": "Updated City",
                "application": "Updated Application",
                "local_ownership": 60.0,
                "export_to_non_a5": 40.0,
                "remarks": "Updated remarks",
            },
            "capital_cost_approved": 20000.0,
            "operating_cost_approved": 10000.0,
            "funds_disbursed": 4000.0,
            "ods_odp": [
                {
                    "ods_odp": ods_odp.id,
                    "ods_substance": substance.id,
                    "phase_out_mt": 15.0,
                    "ods_replacement": "Updated Alternative Tech 1",
                    "ods_replacement_phase_in": 50.0,
                },
                {
                    "ods_blend": blend.id,
                    "phase_out_mt": 25.0,
                    "ods_replacement": "New Alternative Tech 2",
                    "ods_replacement_phase_in": 70.0,
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
        project_enterprise1, _, _ = _setup_enterprises
        self.client.force_authenticate(user=mlfs_admin_user)
        data = self.get_update_data(project, substance, blend, project_enterprise1)
        url = reverse("project-enterprise-detail", args=[project_enterprise1.id])
        response = self.client.put(url, data, format="json")
        assert response.status_code == 200
        project_enterprise1.refresh_from_db()
        assert project_enterprise1.enterprise.name == "Updated Enterprise"
        assert project_enterprise1.enterprise.location == "Updated City"
        assert project_enterprise1.enterprise.application == "Updated Application"
        assert project_enterprise1.enterprise.local_ownership == 60.0
        assert project_enterprise1.enterprise.export_to_non_a5 == 40.0
        assert project_enterprise1.capital_cost_approved == 20000.0
        assert project_enterprise1.operating_cost_approved == 10000.0
        assert project_enterprise1.funds_disbursed == 4000.0
        assert project_enterprise1.enterprise.remarks == "Updated remarks"
        assert project_enterprise1.project == project
        assert project_enterprise1.ods_odp.count() == 2
        ods_odp_1 = project_enterprise1.ods_odp.get(ods_substance=substance)
        assert ods_odp_1.phase_out_mt == 15.0
        assert ods_odp_1.ods_replacement == "Updated Alternative Tech 1"
        assert ods_odp_1.ods_replacement_phase_in == 50.0
        ods_odp_2 = project_enterprise1.ods_odp.get(ods_blend=blend)
        assert ods_odp_2.phase_out_mt == 25.0
        assert ods_odp_2.ods_replacement == "New Alternative Tech 2"
        assert ods_odp_2.ods_replacement_phase_in == 70.0


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
        project_enterprise1, _, _ = _setup_enterprises
        url = reverse("project-enterprise-approve", args=[project_enterprise1.id])

        def _test_user(user, expected_status, url):
            self.client.force_authenticate(user=user)
            response = self.client.post(url)
            assert response.status_code == expected_status
            if response.status_code == 200:
                project_enterprise1.status = "Pending Approval"
                project_enterprise1.save()

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
