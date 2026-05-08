import pytest
from datetime import date
from decimal import Decimal

from django.urls import reverse

from rest_framework.test import APIClient

from core.api.tests.base import BaseTest
from core.api.tests.factories import (
    EnterpriseFactory,
    Enterprise,
    EnterpriseOdsOdp,
)

pytestmark = pytest.mark.django_db
# pylint: disable=C8008,W0221,R0913,R0914


@pytest.fixture(name="_setup_enterprises")
def setup_enterprises(new_country, new_agency, substance_hcfc, meeting, agency):

    enterprise1 = EnterpriseFactory(name="Enterprise 1", meeting=meeting, agency=agency)
    enterprise2 = EnterpriseFactory(name="Enterprise 2", meeting=meeting)
    enterprise3 = EnterpriseFactory(
        name="Enterprise 3", agency=new_agency, country=new_country, meeting=meeting
    )
    EnterpriseOdsOdp.objects.create(
        enterprise=enterprise1, ods_substance=substance_hcfc
    )
    EnterpriseOdsOdp.objects.create(
        enterprise=enterprise2, ods_substance=substance_hcfc
    )
    EnterpriseOdsOdp.objects.create(
        enterprise=enterprise2, ods_substance=substance_hcfc
    )
    return enterprise1, enterprise2, enterprise3


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


class TestListEnterprise(BaseTest, DataTestMixin):
    url = reverse("enterprise-list")

    enterprise_fields_to_test = [
        "id",
        "country",
        "agency",
        "legacy_code",
        "code",
        "name",
        "location",
        "city",
        "stage",
        "sector",
        "subsector",
        "application",
        "project_type",
        "planned_completion_date",
        "actual_completion_date",
        "status",
        "project_duration",
        "local_ownership",
        "export_to_non_a5",
        "revision_number",
        "meeting",
        "date_of_approval",
        "chemical_phased_out",
        "impact",
        "funds_approved",
        "capital_cost_approved",
        "operating_cost_approved",
        "cost_effectiveness_approved",
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
        response = self.client.get(self.url + "?ordering=id")
        assert response.status_code == 200

        assert len(response.data) == 3
        # Enterprise 1
        self._test_fields(
            response.data[0],
            enterprise1,
            self.enterprise_fields_to_test,
        )
        assert len(response.data[0]["ods_odp"]) == 1

        # Enterprise 2
        self._test_fields(
            response.data[1],
            enterprise2,
            self.enterprise_fields_to_test,
        )
        assert len(response.data[1]["ods_odp"]) == 2

        # Enterprise 3
        self._test_fields(
            response.data[2],
            enterprise3,
            self.enterprise_fields_to_test,
        )

        assert len(response.data[2]["ods_odp"]) == 0


class TestProjectRetrieveProjectEnterprise(DataTestMixin):

    client = APIClient()

    enterprise_fields_to_test = [
        "id",
        "country",
        "agency",
        "legacy_code",
        "code",
        "name",
        "location",
        "city",
        "stage",
        "sector",
        "subsector",
        "application",
        "project_type",
        "planned_completion_date",
        "actual_completion_date",
        "status",
        "project_duration",
        "local_ownership",
        "export_to_non_a5",
        "revision_number",
        "meeting",
        "date_of_approval",
        "chemical_phased_out",
        "impact",
        "funds_approved",
        "capital_cost_approved",
        "operating_cost_approved",
        "cost_effectiveness_approved",
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
    ):
        enterprise1, enterprise2, _ = _setup_enterprises

        def _test_user(user, expected_status, enterprise):
            url = reverse("enterprise-detail", args=[enterprise.id])
            self.client.force_authenticate(user=user)
            response = self.client.get(url)
            assert response.status_code == expected_status

        # test for unauthenticated user

        url = reverse("enterprise-detail", args=[enterprise1.id])
        response = self.client.get(url)
        assert response.status_code == 403

        # test for different user roles
        _test_user(user, 403, enterprise1)
        _test_user(user, 403, enterprise2)

        _test_user(viewer_user, 200, enterprise1)
        _test_user(
            viewer_user, 404, enterprise2
        )  # viewer_user has no access to enterprise2
        _test_user(agency_user, 200, enterprise1)
        _test_user(
            agency_user, 404, enterprise2
        )  # agency_user has no access to enterprise2
        _test_user(agency_inputter_user, 200, enterprise1)
        _test_user(
            agency_inputter_user, 404, enterprise2
        )  # agency_inputter_user has no access to enterprise2

        _test_user(secretariat_viewer_user, 200, enterprise2)
        _test_user(secretariat_v1_v2_edit_access_user, 200, enterprise2)
        _test_user(secretariat_production_v1_v2_edit_access_user, 200, enterprise2)
        _test_user(secretariat_v3_edit_access_user, 200, enterprise2)
        _test_user(secretariat_production_v3_edit_access_user, 200, enterprise2)
        _test_user(mlfs_admin_user, 200, enterprise2)
        _test_user(admin_user, 200, enterprise2)

    def test_retrieve(self, mlfs_admin_user, _setup_enterprises):
        enterprise1, _, _ = _setup_enterprises
        url = reverse("enterprise-detail", args=[enterprise1.id])
        self.client.force_authenticate(user=mlfs_admin_user)
        response = self.client.get(url)
        assert response.status_code == 200
        self._test_fields(
            response.data,
            enterprise1,
            self.enterprise_fields_to_test,
        )
        assert len(response.data["ods_odp"]) == 1


class TestCreateProjectEnterprise(DataTestMixin):

    client = APIClient()
    url = reverse("enterprise-list")

    enterprise_fields_to_test = [
        "country",
        "agency",
        "legacy_code",
        "code",
        "name",
        "location",
        "city",
        "stage",
        "sector",
        "subsector",
        "application",
        "project_type",
        "planned_completion_date",
        "actual_completion_date",
        "status",
        "project_duration",
        "local_ownership",
        "export_to_non_a5",
        "revision_number",
        "meeting",
        "date_of_approval",
        "chemical_phased_out",
        "impact",
        "funds_approved",
        "capital_cost_approved",
        "operating_cost_approved",
        "cost_effectiveness_approved",
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
        "date_of_revision",
    ]

    def get_create_data(
        self,
        country,
        substance,
        blend,
        agency,
        sector,
        subsector,
        meeting,
        project_type,
        enterprise_ongoing_status,
    ):
        blend.composition = f"{substance.name}: 100%"
        blend.components.create(substance=substance, percentage=0.2)
        blend.save()
        return {
            "country": country.id,
            "agency": agency.id,
            "legacy_code": "LEG123",
            "code": "ENT123",
            "name": "New Enterprise",
            "location": "New City",
            "city": "New City",
            "stage": "New Stage",
            "sector": sector.id,
            "subsector": subsector.id,
            "application": "New Application",
            "project_type": project_type.id,
            "project_duration": 24,
            "planned_completion_date": "2024-12-31",
            "actual_completion_date": "2024-11-30",
            "status": enterprise_ongoing_status.id,
            "local_ownership": "50.0",
            "export_to_non_a5": "30.0",
            "revision_number": 1,
            "meeting": meeting.id,
            "date_of_approval": "2023-01-15",
            "chemical_phased_out": 2000.0,
            "impact": 300.0,
            "funds_approved": 20000.0,
            "capital_cost_approved": 10000.0,
            "operating_cost_approved": 5000.0,
            "cost_effectiveness_approved": 20.0,
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
            "date_of_revision": "2023-06-20",
            "ods_odp": [
                {
                    "ods_substance": substance.id,
                    "consumption": 10.0,
                    "selected_alternative": "Alternative Tech 1",
                    "chemical_phased_in_mt": 50.0,
                },
                {
                    "ods_blend": blend.id,
                    "consumption": 20.0,
                    "selected_alternative": "Alternative Tech 2",
                    "chemical_phased_in_mt": 70.0,
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
        agency,
        substance_hcfc,
        country_ro,
        blend,
        sector,
        subsector,
        meeting,
        project_type,
        enterprise_ongoing_status,
    ):
        data = self.get_create_data(
            country_ro,
            substance_hcfc,
            blend,
            agency,
            sector,
            subsector,
            meeting,
            project_type,
            enterprise_ongoing_status,
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
        _test_user(agency_user, 201, data)
        _test_user(agency_inputter_user, 201, data)
        _test_user(secretariat_viewer_user, 403, data)
        _test_user(secretariat_v1_v2_edit_access_user, 201, data)
        _test_user(secretariat_production_v1_v2_edit_access_user, 201, data)

        _test_user(secretariat_v3_edit_access_user, 201, data)
        _test_user(secretariat_production_v3_edit_access_user, 201, data)
        _test_user(mlfs_admin_user, 201, data)
        _test_user(admin_user, 201, data)

    def test_create(
        self,
        mlfs_admin_user,
        substance_hcfc,
        country_ro,
        agency,
        blend,
        sector,
        subsector,
        meeting,
        project_type,
        enterprise_ongoing_status,
    ):
        self.client.force_authenticate(user=mlfs_admin_user)
        data = self.get_create_data(
            country_ro,
            substance_hcfc,
            blend,
            agency,
            sector,
            subsector,
            meeting,
            project_type,
            enterprise_ongoing_status,
        )
        assert Enterprise.objects.all().count() == 0
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 201
        assert Enterprise.objects.all().count() == 1
        enterprise = Enterprise.objects.first()
        self._test_fields(response.data, enterprise, self.enterprise_fields_to_test)

        assert enterprise.ods_odp.count() == 2
        ods_odp_1 = enterprise.ods_odp.get(ods_substance=substance_hcfc)
        assert ods_odp_1.consumption == 10.0
        assert ods_odp_1.selected_alternative == "Alternative Tech 1"
        assert ods_odp_1.chemical_phased_in_mt == 50.0
        ods_odp_2 = enterprise.ods_odp.get(ods_blend=blend)
        assert ods_odp_2.consumption == 20.0
        assert ods_odp_2.selected_alternative == "Alternative Tech 2"
        assert ods_odp_2.chemical_phased_in_mt == 70.0


class TestUpdateProjectEnterprise(DataTestMixin):

    client = APIClient()

    enterprise_fields_to_test = [
        "country",
        "agency",
        "legacy_code",
        "code",
        "name",
        "location",
        "city",
        "stage",
        "sector",
        "subsector",
        "application",
        "project_type",
        "planned_completion_date",
        "actual_completion_date",
        "status",
        "project_duration",
        "local_ownership",
        "export_to_non_a5",
        "revision_number",
        "meeting",
        "date_of_approval",
        "chemical_phased_out",
        "impact",
        "funds_approved",
        "capital_cost_approved",
        "operating_cost_approved",
        "cost_effectiveness_approved",
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
        "date_of_revision",
    ]

    def get_update_data(
        self,
        country,
        substance_hcfc,
        blend,
        enterprise,
        agency,
        sector,
        subsector,
        meeting,
        project_type,
        enterprise_ongoing_status,
    ):
        ods_odp = enterprise.ods_odp.first()
        blend.composition = f"{substance_hcfc.name}: 100%"
        blend.save()
        blend.components.create(substance=substance_hcfc, percentage=0.5)
        return {
            "id": enterprise.id,
            "country": country.id,
            "agency": agency.id,
            "legacy_code": "LEG123upd",
            "code": "ENT123upd",
            "name": "Updated Enterprise",
            "location": "Updated Location",
            "city": "Updated City",
            "stage": "Updated Stage",
            "sector": sector.id,
            "subsector": subsector.id,
            "application": "Updated Application",
            "project_type": project_type.id,
            "project_duration": 24,
            "planned_completion_date": "2024-12-31",
            "actual_completion_date": "2024-11-30",
            "status": enterprise_ongoing_status.id,
            "local_ownership": 60.0,
            "export_to_non_a5": 40.0,
            "revision_number": 2,
            "meeting": meeting.id,
            "date_of_approval": "2023-01-15",
            "chemical_phased_out": 2500.0,
            "impact": 300.0,
            "funds_approved": 20000.0,
            "capital_cost_approved": 20000.0,
            "operating_cost_approved": 10000.0,
            "cost_effectiveness_approved": 20.0,
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
            "date_of_revision": "2023-06-20",
            "ods_odp": [
                {
                    "ods_odp": ods_odp.id,
                    "ods_substance": substance_hcfc.id,
                    "consumption": 15.0,
                    "selected_alternative": "Updated Alternative Tech 1",
                    "chemical_phased_in_mt": 50.0,
                },
                {
                    "ods_blend": blend.id,
                    "consumption": 25.0,
                    "selected_alternative": "New Alternative Tech 2",
                    "chemical_phased_in_mt": 70.0,
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
        country_ro,
        substance_hcfc,
        blend,
        agency,
        sector,
        subsector,
        meeting,
        project_type,
        enterprise_ongoing_status,
    ):
        enterprise1, _, _ = _setup_enterprises

        data = self.get_update_data(
            country_ro,
            substance_hcfc,
            blend,
            enterprise1,
            agency,
            sector,
            subsector,
            meeting,
            project_type,
            enterprise_ongoing_status,
        )

        def _test_user(user, expected_status, enterprise, data):
            url = reverse("enterprise-detail", args=[enterprise.id])
            self.client.force_authenticate(user=user)
            response = self.client.put(url, data, format="json")
            assert response.status_code == expected_status
            return response

        # test for unauthenticated user
        url = reverse("enterprise-detail", args=[enterprise1.id])
        response = self.client.put(url, data, format="json")
        assert response.status_code == 403

        # test for different user roles
        _test_user(user, 403, enterprise1, data)
        _test_user(viewer_user, 403, enterprise1, data)
        _test_user(agency_user, 200, enterprise1, data)
        _test_user(agency_inputter_user, 200, enterprise1, data)
        _test_user(secretariat_viewer_user, 403, enterprise1, data)
        _test_user(secretariat_v1_v2_edit_access_user, 200, enterprise1, data)
        _test_user(
            secretariat_production_v1_v2_edit_access_user, 200, enterprise1, data
        )

        _test_user(secretariat_v3_edit_access_user, 200, enterprise1, data)
        _test_user(secretariat_production_v3_edit_access_user, 200, enterprise1, data)
        _test_user(mlfs_admin_user, 200, enterprise1, data)
        _test_user(admin_user, 200, enterprise1, data)

    def test_update(
        self,
        mlfs_admin_user,
        _setup_enterprises,
        substance_hcfc,
        blend,
        agency,
        sector,
        subsector,
        meeting,
        country_ro,
        project_type,
        enterprise_ongoing_status,
    ):
        enterprise1, _, _ = _setup_enterprises
        self.client.force_authenticate(user=mlfs_admin_user)
        data = self.get_update_data(
            country_ro,
            substance_hcfc,
            blend,
            enterprise1,
            agency,
            sector,
            subsector,
            meeting,
            project_type,
            enterprise_ongoing_status,
        )
        url = reverse("enterprise-detail", args=[enterprise1.id])
        response = self.client.put(url, data, format="json")
        assert response.status_code == 200
        enterprise1.refresh_from_db()
        self._test_fields(response.data, enterprise1, self.enterprise_fields_to_test)

        assert enterprise1.ods_odp.count() == 2
        ods_odp_1 = enterprise1.ods_odp.get(ods_substance=substance_hcfc)
        assert ods_odp_1.consumption == 15.0
        assert ods_odp_1.selected_alternative == "Updated Alternative Tech 1"
        assert ods_odp_1.chemical_phased_in_mt == 50.0
        ods_odp_2 = enterprise1.ods_odp.get(ods_blend=blend)
        assert ods_odp_2.consumption == 25.0
        assert ods_odp_2.selected_alternative == "New Alternative Tech 2"
        assert ods_odp_2.chemical_phased_in_mt == 70.0


class TestDeleteEnterprise(DataTestMixin):

    client = APIClient()

    def test_enterprise_delete_permissions(
        self,
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
        meeting,
        agency,
        new_agency,
    ):

        enterprise1 = EnterpriseFactory(
            name="Enterprise 1", meeting=meeting, agency=agency
        )
        enterprise2 = EnterpriseFactory(
            name="Enterprise 2", meeting=meeting, agency=new_agency
        )

        def _test_user(user, expected_status, enterprise):
            url = reverse("enterprise-detail", args=[enterprise.id])
            self.client.force_authenticate(user=user)
            response = self.client.delete(url)
            assert response.status_code == expected_status

        # test for unauthenticated user
        url = reverse("enterprise-detail", args=[enterprise1.id])
        response = self.client.delete(url)
        assert response.status_code == 403

        # test for different user roles
        _test_user(user, 403, enterprise1)
        _test_user(viewer_user, 403, enterprise1)
        _test_user(agency_user, 204, enterprise1)
        _test_user(
            agency_user, 404, enterprise2
        )  # agency_user has no access to enterprise2

        enterprise1 = EnterpriseFactory(
            name="Enterprise 1", meeting=meeting, agency=agency
        )

        _test_user(agency_inputter_user, 204, enterprise1)
        _test_user(
            agency_inputter_user, 404, enterprise2
        )  # agency_inputter_user has no access to enterprise2

        enterprise1 = EnterpriseFactory(
            name="Enterprise 1", meeting=meeting, agency=agency
        )

        _test_user(secretariat_viewer_user, 403, enterprise1)

        _test_user(secretariat_v1_v2_edit_access_user, 204, enterprise1)
        _test_user(secretariat_v1_v2_edit_access_user, 204, enterprise2)

        enterprise1 = EnterpriseFactory(
            name="Enterprise 1", meeting=meeting, agency=agency
        )
        enterprise2 = EnterpriseFactory(
            name="Enterprise 2", meeting=meeting, agency=new_agency
        )
        _test_user(secretariat_production_v1_v2_edit_access_user, 204, enterprise1)
        _test_user(secretariat_production_v1_v2_edit_access_user, 204, enterprise2)

        enterprise1 = EnterpriseFactory(
            name="Enterprise 1", meeting=meeting, agency=agency
        )
        enterprise2 = EnterpriseFactory(
            name="Enterprise 2", meeting=meeting, agency=new_agency
        )
        _test_user(secretariat_v3_edit_access_user, 204, enterprise1)
        _test_user(secretariat_v3_edit_access_user, 204, enterprise2)

        enterprise1 = EnterpriseFactory(
            name="Enterprise 1", meeting=meeting, agency=agency
        )
        enterprise2 = EnterpriseFactory(
            name="Enterprise 2", meeting=meeting, agency=new_agency
        )
        _test_user(secretariat_production_v3_edit_access_user, 204, enterprise1)
        _test_user(secretariat_production_v3_edit_access_user, 204, enterprise2)

        enterprise1 = EnterpriseFactory(
            name="Enterprise 1", meeting=meeting, agency=agency
        )
        enterprise2 = EnterpriseFactory(
            name="Enterprise 2", meeting=meeting, agency=new_agency
        )
        _test_user(mlfs_admin_user, 204, enterprise1)
        _test_user(mlfs_admin_user, 204, enterprise2)

        enterprise1 = EnterpriseFactory(
            name="Enterprise 1", meeting=meeting, agency=agency
        )
        enterprise2 = EnterpriseFactory(
            name="Enterprise 2", meeting=meeting, agency=new_agency
        )
        _test_user(admin_user, 204, enterprise1)
        _test_user(admin_user, 204, enterprise2)
