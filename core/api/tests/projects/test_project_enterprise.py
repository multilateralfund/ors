import pytest
from datetime import date
from decimal import Decimal

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
# pylint: disable=C8008,W0221,R0913,R0914


@pytest.fixture(name="_setup_enterprises")
def setup_enterprises(project, project2, new_country, new_agency, substance_hcfc):

    project2.country = new_country
    project2.lead_agency = new_agency
    project2.save()
    enterprise1 = EnterpriseFactory(name="Enterprise 1")
    enterprise2 = EnterpriseFactory(name="Enterprise 2")
    enterprise3 = EnterpriseFactory(name="Enterprise 3")
    project_enterprise1 = ProjectEnterprise.objects.create(
        project=project, enterprise=enterprise1, agency=new_agency
    )
    ProjectEnterpriseOdsOdp.objects.create(
        project_enterprise=project_enterprise1, ods_substance=substance_hcfc
    )
    ProjectEnterpriseOdsOdp.objects.create(
        project_enterprise=project_enterprise1, ods_substance=substance_hcfc
    )
    project_enterprise2 = ProjectEnterprise.objects.create(
        project=project2,
        enterprise=enterprise2,
        agency=new_agency,
    )
    ProjectEnterpriseOdsOdp.objects.create(
        project_enterprise=project_enterprise2, ods_substance=substance_hcfc
    )
    project_enterprise3 = ProjectEnterprise.objects.create(
        project=project2,
        enterprise=enterprise3,
        agency=new_agency,
    )
    return project_enterprise1, project_enterprise2, project_enterprise3


class DataTestMixin:

    def _test_fields(self, response_data, model_instance, fields):
        for field in fields:
            model_field = model_instance._meta.get_field(field)
            field_value = getattr(model_instance, field)

            if model_field.many_to_one and field_value is not None:
                assert response_data[field] == field_value.id
            elif isinstance(field_value, Decimal):
                expected = field_value
                actual = Decimal(str(response_data[field]))
                assert actual.quantize(expected) == expected
            elif isinstance(field_value, date):
                assert response_data[field] == field_value.strftime("%Y-%m-%d")
            else:
                assert response_data[field] == field_value


class TestListProjectEnterprise(BaseTest, DataTestMixin):
    url = reverse("project-enterprise-list")

    project_enterprise_fields_to_test = [
        "id",
        "capital_cost_approved",
        "operating_cost_approved",
        "funds_disbursed",
        "capital_cost_disbursed",
        "operating_cost_disbursed",
        "cost_effectiveness_actual",
        "co_financing_planned",
        "co_financing_actual",
        "funds_transferred",
        "agency_remarks",
        "secretariat_remarks",
        "excom_provision",
        "date_of_report",
        "planned_completion_date",
        "actual_completion_date",
        "project_duration",
        "project",
        "status",
        "impact",
        "funds_approved",
    ]

    enterprise_fields_to_test = [
        "id",
        "code",
        "name",
        "country",
        "sector",
        "subsector",
        "location",
        "stage",
        "application",
        "local_ownership",
        "export_to_non_a5",
        "status",
        "date_of_approval",
        "date_of_revision",
    ]

    def test_enterprise_list_permissions(
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
        project2.lead_agency = new_agency
        project2.save()
        enterprise1, _, _ = _setup_enterprises
        enterprise1.status = EnterpriseStatus.APPROVED
        enterprise1.save()
        # test for different user roles
        _test_user(user, 403)
        _test_user(viewer_user, 403, response_count=1)
        _test_user(agency_user, 403, response_count=1)
        _test_user(agency_inputter_user, 403, response_count=1)
        _test_user(secretariat_viewer_user, 403, response_count=1)
        _test_user(secretariat_v1_v2_edit_access_user, 403, response_count=1)
        _test_user(secretariat_production_v1_v2_edit_access_user, 403, response_count=1)
        _test_user(secretariat_v3_edit_access_user, 403, response_count=1)
        _test_user(secretariat_production_v3_edit_access_user, 403, response_count=1)
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
        # Enterprise 1
        self._test_fields(
            response.data[0],
            project_enterprise1,
            self.project_enterprise_fields_to_test,
        )
        self._test_fields(
            response.data[0]["enterprise"],
            project_enterprise1.enterprise,
            self.enterprise_fields_to_test,
        )
        assert len(response.data[0]["ods_odp"]) == 2

        # Enterprise 2
        self._test_fields(
            response.data[1],
            project_enterprise2,
            self.project_enterprise_fields_to_test,
        )
        self._test_fields(
            response.data[1]["enterprise"],
            project_enterprise2.enterprise,
            self.enterprise_fields_to_test,
        )
        assert len(response.data[1]["ods_odp"]) == 1

        # Enterprise 3
        self._test_fields(
            response.data[2],
            project_enterprise3,
            self.project_enterprise_fields_to_test,
        )
        self._test_fields(
            response.data[2]["enterprise"],
            project_enterprise3.enterprise,
            self.enterprise_fields_to_test,
        )
        assert len(response.data[2]["ods_odp"]) == 0


class TestProjectRetrieveProjectEnterprise(DataTestMixin):

    client = APIClient()

    project_enterprise_fields_to_test = [
        "id",
        "capital_cost_approved",
        "operating_cost_approved",
        "funds_disbursed",
        "capital_cost_disbursed",
        "operating_cost_disbursed",
        "cost_effectiveness_actual",
        "co_financing_planned",
        "co_financing_actual",
        "funds_transferred",
        "agency_remarks",
        "secretariat_remarks",
        "excom_provision",
        "date_of_report",
        "planned_completion_date",
        "actual_completion_date",
        "project_duration",
        "project",
        "status",
        "impact",
        "funds_approved",
    ]

    enterprise_fields_to_test = [
        "id",
        "code",
        "name",
        "country",
        "sector",
        "subsector",
        "location",
        "stage",
        "application",
        "local_ownership",
        "export_to_non_a5",
        "status",
        "date_of_approval",
        "date_of_revision",
    ]

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
        project2.lead_agency = new_agency
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

        _test_user(viewer_user, 403, project_enterprise1)
        _test_user(
            viewer_user, 403, project_enterprise2
        )  # viewer_user has no access to project2
        _test_user(agency_user, 403, project_enterprise1)
        _test_user(
            agency_user, 403, project_enterprise2
        )  # agency_user has no access to project2
        _test_user(agency_inputter_user, 403, project_enterprise1)
        _test_user(
            agency_inputter_user, 403, project_enterprise2
        )  # agency_inputter_user has no access to project2

        _test_user(secretariat_viewer_user, 403, project_enterprise2)
        _test_user(secretariat_v1_v2_edit_access_user, 403, project_enterprise2)
        _test_user(
            secretariat_production_v1_v2_edit_access_user, 403, project_enterprise2
        )
        _test_user(secretariat_v3_edit_access_user, 403, project_enterprise2)
        _test_user(secretariat_production_v3_edit_access_user, 403, project_enterprise2)
        _test_user(mlfs_admin_user, 200, project_enterprise2)
        _test_user(admin_user, 200, project_enterprise2)

    def test_retrieve(self, mlfs_admin_user, _setup_enterprises):
        project_enterprise1, _, _ = _setup_enterprises
        url = reverse("project-enterprise-detail", args=[project_enterprise1.id])
        self.client.force_authenticate(user=mlfs_admin_user)
        response = self.client.get(url)
        assert response.status_code == 200
        self._test_fields(
            response.data, project_enterprise1, self.project_enterprise_fields_to_test
        )
        self._test_fields(
            response.data["enterprise"],
            project_enterprise1.enterprise,
            self.enterprise_fields_to_test,
        )
        assert len(response.data["ods_odp"]) == 2


class TestCreateProjectEnterprise(DataTestMixin):

    client = APIClient()
    url = reverse("project-enterprise-list")

    project_enterprise_fields_to_test = [
        "capital_cost_approved",
        "operating_cost_approved",
        "funds_disbursed",
        "capital_cost_disbursed",
        "operating_cost_disbursed",
        "cost_effectiveness_actual",
        "co_financing_planned",
        "co_financing_actual",
        "funds_transferred",
        "agency_remarks",
        "secretariat_remarks",
        "excom_provision",
        "date_of_report",
        "planned_completion_date",
        "actual_completion_date",
        "project_duration",
        "project",
        "status",
        "impact",
        "funds_approved",
    ]

    enterprise_fields_to_test = [
        "name",
        "country",
        "sector",
        "subsector",
        "location",
        "stage",
        "application",
        "local_ownership",
        "export_to_non_a5",
        "status",
        "date_of_approval",
        "date_of_revision",
    ]

    def get_create_data(self, project, substance, blend, agency, sector, subsector):
        blend.composition = f"{substance.name}: 100%"
        blend.components.create(substance=substance, percentage=0.2)
        blend.save()
        return {
            "project": project.id,
            "agency": agency.id,
            "enterprise": {
                "name": "New Enterprise",
                "country": project.country.id,
                "location": "New City",
                "stage": "New Stage",
                "sector": sector.id,
                "subsector": subsector.id,
                "application": "New Application",
                "local_ownership": 50.0,
                "export_to_non_a5": 30.0,
                "date_of_approval": "2023-01-15",
                "date_of_revision": "2023-06-20",
            },
            "capital_cost_approved": 10000.0,
            "operating_cost_approved": 5000.0,
            "funds_disbursed": 2000.0,
            "capital_cost_disbursed": 1500.0,
            "operating_cost_disbursed": 500.0,
            "cost_effectiveness_actual": 25.0,
            "co_financing_planned": 3000.0,
            "co_financing_actual": 1500.0,
            "funds_transferred": 4000.0,
            "agency_remarks": "Some remarks",
            "secretariat_remarks": "Secretariat remarks",
            "excom_provision": "Provision details",
            "date_of_report": "2023-07-01",
            "planned_completion_date": "2024-12-31",
            "actual_completion_date": "2024-11-30",
            "project_duration": 24,
            "impact": "High",
            "funds_approved": 20000.0,
            "ods_odp": [
                {
                    "ods_substance": substance.id,
                    "consumption": 10.0,
                    "selected_alternative": "Alternative Tech 1",
                    "chemical_phased_in": 50.0,
                },
                {
                    "ods_blend": blend.id,
                    "consumption": 20.0,
                    "selected_alternative": "Alternative Tech 2",
                    "chemical_phased_in": 70.0,
                },
            ],
        }

    def test_enterprise_create_permissions(
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
        agency,
        substance_hcfc,
        blend,
        sector,
        subsector,
    ):
        data = self.get_create_data(
            project, substance_hcfc, blend, agency, sector, subsector
        )

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

        _test_user(secretariat_v3_edit_access_user, 403, data)
        _test_user(secretariat_production_v3_edit_access_user, 403, data)
        _test_user(mlfs_admin_user, 201, data)
        _test_user(admin_user, 201, data)

    def test_create(
        self, mlfs_admin_user, project, substance_hcfc, blend, agency, sector, subsector
    ):
        self.client.force_authenticate(user=mlfs_admin_user)
        data = self.get_create_data(
            project, substance_hcfc, blend, agency, sector, subsector
        )
        assert ProjectEnterprise.objects.all().count() == 0
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 201
        assert ProjectEnterprise.objects.all().count() == 1
        project_enterprise = ProjectEnterprise.objects.first()
        self._test_fields(
            response.data, project_enterprise, self.project_enterprise_fields_to_test
        )
        self._test_fields(
            response.data["enterprise"],
            project_enterprise.enterprise,
            self.enterprise_fields_to_test,
        )

        assert project_enterprise.ods_odp.count() == 2
        ods_odp_1 = project_enterprise.ods_odp.get(ods_substance=substance_hcfc)
        assert ods_odp_1.consumption == 10.0
        assert ods_odp_1.selected_alternative == "Alternative Tech 1"
        assert ods_odp_1.chemical_phased_in == 50.0
        ods_odp_2 = project_enterprise.ods_odp.get(ods_blend=blend)
        assert ods_odp_2.consumption == 20.0
        assert ods_odp_2.selected_alternative == "Alternative Tech 2"
        assert ods_odp_2.chemical_phased_in == 70.0


class TestUpdateProjectEnterprise(DataTestMixin):

    client = APIClient()

    project_enterprise_fields_to_test = [
        "capital_cost_approved",
        "operating_cost_approved",
        "funds_disbursed",
        "capital_cost_disbursed",
        "operating_cost_disbursed",
        "cost_effectiveness_actual",
        "co_financing_planned",
        "co_financing_actual",
        "funds_transferred",
        "agency_remarks",
        "secretariat_remarks",
        "excom_provision",
        "date_of_report",
        "planned_completion_date",
        "actual_completion_date",
        "project_duration",
        "project",
        "status",
        "impact",
        "funds_approved",
    ]

    enterprise_fields_to_test = [
        "name",
        "country",
        "sector",
        "subsector",
        "location",
        "stage",
        "application",
        "local_ownership",
        "export_to_non_a5",
        "status",
        "date_of_approval",
        "date_of_revision",
    ]

    def get_update_data(
        self, project, substance_hcfc, blend, enterprise, agency, sector, subsector
    ):
        ods_odp = enterprise.ods_odp.first()
        blend.composition = f"{substance_hcfc.name}: 100%"
        blend.save()
        blend.components.create(substance=substance_hcfc, percentage=0.5)
        return {
            "id": enterprise.id,
            "project": project.id,
            "agency": agency.id,
            "enterprise": {
                "name": "Updated Enterprise",
                "country": project.country.id,
                "location": "Updated City",
                "stage": "Updated Stage",
                "sector": sector.id,
                "subsector": subsector.id,
                "application": "Updated Application",
                "local_ownership": 60.0,
                "export_to_non_a5": 40.0,
                "date_of_approval": "2023-01-15",
                "date_of_revision": "2023-06-20",
            },
            "capital_cost_approved": 20000.0,
            "operating_cost_approved": 10000.0,
            "funds_disbursed": 4000.0,
            "capital_cost_disbursed": 1500.0,
            "operating_cost_disbursed": 500.0,
            "cost_effectiveness_actual": 25.0,
            "co_financing_planned": 3000.0,
            "co_financing_actual": 1500.0,
            "funds_transferred": 4000.0,
            "agency_remarks": "Some remarks",
            "secretariat_remarks": "Secretariat remarks",
            "excom_provision": "Provision details",
            "date_of_report": "2023-07-01",
            "planned_completion_date": "2024-12-31",
            "actual_completion_date": "2024-11-30",
            "project_duration": 24,
            "impact": "High",
            "funds_approved": 20000.0,
            "ods_odp": [
                {
                    "ods_odp": ods_odp.id,
                    "ods_substance": substance_hcfc.id,
                    "consumption": 15.0,
                    "selected_alternative": "Updated Alternative Tech 1",
                    "chemical_phased_in": 50.0,
                },
                {
                    "ods_blend": blend.id,
                    "consumption": 25.0,
                    "selected_alternative": "New Alternative Tech 2",
                    "chemical_phased_in": 70.0,
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
        substance_hcfc,
        blend,
        agency,
        sector,
        subsector,
    ):
        enterprise1, _, _ = _setup_enterprises

        data = self.get_update_data(
            project, substance_hcfc, blend, enterprise1, agency, sector, subsector
        )

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

        _test_user(secretariat_v3_edit_access_user, 403, enterprise1, data)
        _test_user(secretariat_production_v3_edit_access_user, 403, enterprise1, data)
        _test_user(mlfs_admin_user, 200, enterprise1, data)
        _test_user(admin_user, 200, enterprise1, data)

    def test_update(
        self,
        mlfs_admin_user,
        _setup_enterprises,
        project,
        substance_hcfc,
        blend,
        agency,
        sector,
        subsector,
    ):
        project_enterprise1, _, _ = _setup_enterprises
        self.client.force_authenticate(user=mlfs_admin_user)
        data = self.get_update_data(
            project,
            substance_hcfc,
            blend,
            project_enterprise1,
            agency,
            sector,
            subsector,
        )
        url = reverse("project-enterprise-detail", args=[project_enterprise1.id])
        response = self.client.put(url, data, format="json")
        assert response.status_code == 200
        project_enterprise1.refresh_from_db()
        self._test_fields(
            response.data, project_enterprise1, self.project_enterprise_fields_to_test
        )
        self._test_fields(
            response.data["enterprise"],
            project_enterprise1.enterprise,
            self.enterprise_fields_to_test,
        )

        assert project_enterprise1.ods_odp.count() == 2
        ods_odp_1 = project_enterprise1.ods_odp.get(ods_substance=substance_hcfc)
        assert ods_odp_1.consumption == 15.0
        assert ods_odp_1.selected_alternative == "Updated Alternative Tech 1"
        assert ods_odp_1.chemical_phased_in == 50.0
        ods_odp_2 = project_enterprise1.ods_odp.get(ods_blend=blend)
        assert ods_odp_2.consumption == 25.0
        assert ods_odp_2.selected_alternative == "New Alternative Tech 2"
        assert ods_odp_2.chemical_phased_in == 70.0


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

        _test_user(secretariat_v3_edit_access_user, 403, url)
        _test_user(secretariat_production_v3_edit_access_user, 403, url)
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
