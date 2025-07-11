import pytest
from django.urls import reverse
from core.api.tests.base import BaseTest
from core.api.tests.factories import (
    AgencyFactory,
    ProjectFactory,
)

pytestmark = pytest.mark.django_db
# pylint: disable=C0302,C8008,W0221,R0913,R0914,R0915,W0613


@pytest.fixture(name="_setup_project_list")
def setup_project_list():
    project = ProjectFactory.create(
        title=f"Project {25}",
        date_received="2020-01-30",
    )
    return project


class TestProjectAssociationListing(BaseTest):
    url = reverse("project-association-list")

    def test_projest_association_listing_permissions(
        self,
        _setup_project_list,
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
        meta_project,
    ):
        agency = AgencyFactory.create(code="Agency1")
        agency2 = AgencyFactory.create(code="Agency2")
        project = _setup_project_list

        def _set_project_user_same_agency(user):
            project.agency = agency
            project.meta_project = meta_project
            project.save()
            user.agency = agency
            user.save()
            meta_project.lead_agency = None
            meta_project.save()

        def _set_project_user_different_agency(
            user,
        ):
            project.agency = agency2
            project.meta_project = meta_project
            project.save()
            user.agency = agency
            user.save()
            meta_project.lead_agency = None
            meta_project.save()

        def _set_project_user_same_lead_agency(user):
            project.agency = agency2
            project.meta_project = meta_project
            project.save()
            user.agency = agency
            user.save()
            meta_project.lead_agency = agency
            meta_project.save()

        def _test_user_permissions(user, expected_response_status, expected_count=None):
            self.client.force_authenticate(user=user)
            response = self.client.get(self.url)
            assert response.status_code == expected_response_status
            if expected_count is not None:
                assert len(response.data) == expected_count
            return response.data

        # test with unauthenticated user
        response = self.client.get(self.url)
        assert response.status_code == 403

        # test with authenticated user
        self.client.force_authenticate(user=user)
        response = self.client.get(self.url)
        assert response.status_code == 403

        # test with viewer user
        _set_project_user_same_agency(viewer_user)
        _test_user_permissions(viewer_user, 200, 1)
        _set_project_user_different_agency(viewer_user)
        _test_user_permissions(viewer_user, 200, 0)
        _set_project_user_same_lead_agency(viewer_user)
        _test_user_permissions(viewer_user, 200, 1)

        # test with agency user
        _set_project_user_same_agency(agency_user)
        _test_user_permissions(agency_user, 200, 1)
        _set_project_user_different_agency(agency_user)
        _test_user_permissions(agency_user, 200, 0)
        _set_project_user_same_lead_agency(agency_user)
        _test_user_permissions(agency_user, 200, 1)

        # test with agency inputter user
        _set_project_user_same_agency(agency_inputter_user)
        _test_user_permissions(agency_inputter_user, 200, 1)
        _set_project_user_different_agency(agency_inputter_user)
        _test_user_permissions(agency_inputter_user, 200, 0)
        _set_project_user_same_lead_agency(agency_inputter_user)
        _test_user_permissions(agency_inputter_user, 200, 1)

        # test with secretariat viewer user
        _set_project_user_same_agency(secretariat_viewer_user)
        _test_user_permissions(secretariat_viewer_user, 200, 1)
        _set_project_user_different_agency(secretariat_viewer_user)
        _test_user_permissions(secretariat_viewer_user, 200, 1)
        _set_project_user_same_lead_agency(secretariat_viewer_user)
        _test_user_permissions(secretariat_viewer_user, 200, 1)

        # test with secretariat v1 v2 edit access user
        _set_project_user_same_agency(secretariat_v1_v2_edit_access_user)
        _test_user_permissions(secretariat_v1_v2_edit_access_user, 200, 1)
        _set_project_user_different_agency(secretariat_v1_v2_edit_access_user)
        _test_user_permissions(secretariat_v1_v2_edit_access_user, 200, 1)
        _set_project_user_same_lead_agency(secretariat_v1_v2_edit_access_user)
        _test_user_permissions(secretariat_v1_v2_edit_access_user, 200, 1)

        # test with secretariat production v1 v2 edit access user
        _set_project_user_same_agency(secretariat_production_v1_v2_edit_access_user)
        _test_user_permissions(secretariat_production_v1_v2_edit_access_user, 200, 1)
        _set_project_user_different_agency(
            secretariat_production_v1_v2_edit_access_user
        )
        _test_user_permissions(secretariat_production_v1_v2_edit_access_user, 200, 1)
        _set_project_user_same_lead_agency(
            secretariat_production_v1_v2_edit_access_user
        )
        _test_user_permissions(secretariat_production_v1_v2_edit_access_user, 200, 1)

        # test with secretariat v3 edit access user
        _set_project_user_same_agency(secretariat_v3_edit_access_user)
        _test_user_permissions(secretariat_v3_edit_access_user, 200, 1)
        _set_project_user_different_agency(secretariat_v3_edit_access_user)
        _test_user_permissions(secretariat_v3_edit_access_user, 200, 1)
        _set_project_user_same_lead_agency(secretariat_v3_edit_access_user)
        _test_user_permissions(secretariat_v3_edit_access_user, 200, 1)

        # test with secretariat production v3 edit access user
        _set_project_user_same_agency(secretariat_production_v3_edit_access_user)
        _test_user_permissions(secretariat_production_v3_edit_access_user, 200, 1)
        _set_project_user_different_agency(secretariat_production_v3_edit_access_user)
        _test_user_permissions(secretariat_production_v3_edit_access_user, 200, 1)
        _set_project_user_same_lead_agency(secretariat_production_v3_edit_access_user)
        _test_user_permissions(secretariat_production_v3_edit_access_user, 200, 1)

        # test with admin user
        _set_project_user_same_agency(admin_user)
        _test_user_permissions(admin_user, 200, 1)
        _set_project_user_different_agency(admin_user)
        _test_user_permissions(admin_user, 200, 1)
        _set_project_user_same_lead_agency(admin_user)
        _test_user_permissions(admin_user, 200, 1)

    def test_project_association_listing(
        self,
        _setup_project_list,
        secretariat_viewer_user,
        meta_project,
        meta_project_mya,
    ):
        project1 = _setup_project_list
        project2 = ProjectFactory.create(
            title=f"Project {26}",
            date_received="2020-01-31",
            agency=project1.agency,
            meta_project=meta_project_mya,
        )
        project1.meta_project = meta_project
        project1.save()

        self.client.force_authenticate(user=secretariat_viewer_user)
        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 2
        assert response.data[0]["code"] == meta_project_mya.code
        assert response.data[0]["projects"][0]["code"] == project2.code
        assert response.data[0]["projects"][0]["title"] == project2.title
        assert response.data[1]["code"] == meta_project.code
        assert response.data[1]["projects"][0]["code"] == project1.code
        assert response.data[1]["projects"][0]["title"] == project1.title
