import pytest
from django.urls import reverse
from core.api.tests.base import BaseTest

from core.api.tests.factories import (
    ProjectFactory,
    ProjectSectorFactory,
    ProjectSubSectorFactory,
    ProjectTypeFactory,
)


pytestmark = pytest.mark.django_db
# pylint: disable=C8008


class TestProjectsStatus(BaseTest):
    url = reverse("project-status-list")

    def test_project_status_list_user(self, admin_user, project_status):
        self.client.force_authenticate(user=admin_user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data == [
            {
                "id": project_status.id,
                "name": project_status.name,
                "code": project_status.code,
                "color": project_status.color,
            }
        ]


@pytest.fixture(name="_setup_project_sector")
def setup_project_sector():
    ProjectSectorFactory.create(name="Sector", code="SEC", sort_order=0)
    ProjectSectorFactory.create(name="Sector", code="SEC", sort_order=2)


class TestProjectSector(BaseTest):
    url = reverse("project-sector-list")

    def test_project_sector_list_user(self, admin_user, sector, _setup_project_sector):
        self.client.force_authenticate(user=admin_user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 3
        assert response.data[1] == {
            "id": sector.id,
            "name": sector.name,
            "code": sector.code,
            "sort_order": sector.sort_order,
        }


@pytest.fixture(name="_setup_project_subsector")
def setup_project_subsector(sector):
    ProjectSubSectorFactory.create(
        name="Subsector", code="SUBSEC", sort_order=0, sector=sector
    )
    ProjectSubSectorFactory.create(
        name="Subsector", code="SUBSEC", sort_order=2, sector=sector
    )


class TestProjectSubsector(BaseTest):
    url = reverse("project-subsector-list")

    def test_project_subsector_list_user(
        self, admin_user, sector, subsector, _setup_project_subsector
    ):
        self.client.force_authenticate(user=admin_user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 3
        assert response.data[1] == {
            "id": subsector.id,
            "name": subsector.name,
            "code": subsector.code,
            "sort_order": subsector.sort_order,
            "sector_id": sector.id,
        }


@pytest.fixture(name="_setup_project_type")
def setup_project_type():
    ProjectTypeFactory.create(name="Type", code="TYP", sort_order=0)
    ProjectTypeFactory.create(name="Type", code="TYP", sort_order=2)


class TestProjectType(BaseTest):
    url = reverse("project-type-list")

    def test_project_type_list_user(
        self, admin_user, project_type, _setup_project_type
    ):
        self.client.force_authenticate(user=admin_user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 3
        assert response.data[1] == {
            "id": project_type.id,
            "name": project_type.name,
            "code": project_type.code,
            "sort_order": project_type.sort_order,
        }


@pytest.fixture(name="_setup_project_meeting")
def setup_project_meeting(country_ro, agency, project_type, project_status, subsector):
    project_data = {
        "country": country_ro,
        "agency": agency,
        "project_type": project_type,
        "status": project_status,
        "subsector": subsector,
        "substance_type": "HCFC",
    }
    for i in range(1, 3):
        ProjectFactory.create(
            title=f"Smecherie{i}",
            description="E talent si e vrajeala ce nu se-nvata la scoala",
            approval_meeting_no=i,
            **project_data,
        )
    ProjectFactory.create(
        title="Valoare",
        description="Hai sa vedem, sa vedem, sa vedem/ cine-i as in smecherie / ma cunoasteti dintr-o mie",
        approval_meeting_no=3,
        **project_data,
    )


class TestProjectMeeting(BaseTest):
    url = reverse("project-meeting-list")

    def test_project_meeting_list_user(self, admin_user, _setup_project_meeting):
        self.client.force_authenticate(user=admin_user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 3
        assert response.data == [1, 2, 3]
