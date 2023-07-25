from core.api.tests.factories import (
    AgencyFactory,
    CountryFactory,
    ProjectFactory,
    ProjectSectorFactory,
    ProjectStatusFactory,
    ProjectSubSectorFactory,
    ProjectSubmissionFactory,
    ProjectTypeFactory,
)
import pytest
from django.urls import reverse
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


@pytest.fixture(name="_setup_project_list")
def setup_project_list(country_ro, agency, project_type, project_status, subsector):
    new_country = CountryFactory.create()
    new_agency = AgencyFactory.create()
    new_project_type = ProjectTypeFactory.create()
    new_project_status = ProjectStatusFactory.create()
    new_sector = ProjectSectorFactory.create()
    new_subsector = ProjectSubSectorFactory.create(sector=new_sector)

    projects_data = [
        (
            country_ro,
            agency,
            project_type,
            project_status,
            subsector,
            "HCFC",
        ),
        (
            new_country,
            new_agency,
            new_project_type,
            new_project_status,
            new_subsector,
            "CFC",
        ),
    ]

    for project_data in projects_data:
        for i in range(2):
            project = ProjectFactory.create(
                title=f"Project {i}",
                country=project_data[0],
                agency=project_data[1],
                project_type=project_data[2],
                status=project_data[3],
                subsector=project_data[4],
                substance_type=project_data[5],
                approval_meeting_no=i + 1,
            )
        ProjectSubmissionFactory.create(project=project)


# pylint: disable=C8008,R0913
class TestProjects:
    client = APIClient()

    def test_project_list(
        self,
        user,
        agency,
        project_type,
        project_status,
        sector,
        subsector,
        _setup_project_list,
    ):
        url = reverse("project-list")

        # test without authentication
        response = self.client.get(url)
        assert response.status_code == 403

        self.client.force_authenticate(user=user)

        # get project list
        response = self.client.get(url)
        assert response.status_code == 200
        assert len(response.data) == 4
        # check if there is no submission data
        for project in response.data:
            assert not project["submission"]

        # get project list with submission data
        response = self.client.get(url, {"get_submission": True})
        assert response.status_code == 200
        assert len(response.data) == 4
        # check if there is submission data
        projects_with_submission = 0
        for project in response.data:
            if project["submission"]:
                projects_with_submission += 1
        assert projects_with_submission == 2

        # get project list with filters
        # filter by agency id
        response = self.client.get(url, {"agency_id": agency.id})
        assert response.status_code == 200
        assert len(response.data) == 2
        for project in response.data:
            assert project["agency"] == agency.name

        # filter by project type id
        response = self.client.get(url, {"project_type_id": project_type.id})
        assert response.status_code == 200
        assert len(response.data) == 2
        for project in response.data:
            assert project["project_type"] == project_type.name

        # filter by project status id
        response = self.client.get(url, {"status_id": project_status.id})
        assert response.status_code == 200
        assert len(response.data) == 2
        for project in response.data:
            assert project["status"] == project_status.name

        # filter by sector id
        response = self.client.get(url, {"sector_id": sector.id})
        assert response.status_code == 200
        assert len(response.data) == 2
        for project in response.data:
            assert project["sector"] == sector.name

        # filter by subsector id
        response = self.client.get(url, {"subsector_id": subsector.id})
        assert response.status_code == 200
        assert len(response.data) == 2
        for project in response.data:
            assert project["subsector"] == subsector.name

        # filter by substance_type
        response = self.client.get(url, {"substance_type": "HCFC"})
        assert response.status_code == 200
        assert len(response.data) == 2
        for project in response.data:
            assert project["substance_type"] == "HCFC"

        # filter by meeting number
        response = self.client.get(url, {"approval_meeting_no": 1})
        assert response.status_code == 200
        assert len(response.data) == 2
        for project in response.data:
            assert project["approval_meeting_no"] == 1
