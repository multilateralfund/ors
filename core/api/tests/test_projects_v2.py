import pytest
from django.urls import reverse
from core.api.tests.base import BaseTest

from core.api.tests.factories import (
    AgencyFactory,
    CountryFactory,
    MeetingFactory,
    ProjectFactory,
    ProjectSectorFactory,
    ProjectStatusFactory,
    ProjectSubSectorFactory,
    ProjectTypeFactory,
    UserFactory,
)
from core.models.project import Project
from core.models.project import ProjectFile
from core.utils import get_project_sub_code

pytestmark = pytest.mark.django_db
# pylint: disable=C8008,W0221,R0913,R0914


@pytest.fixture(name="other_agency_user")
def _other_agency_user():
    other_agency = AgencyFactory.create(name="Agency2", code="AG2")
    return UserFactory.create(agency=other_agency, user_type="agency_submitter")


@pytest.fixture(name="other_country_user")
def _other_country_user():
    other_country = CountryFactory.create(name="New Country")
    return UserFactory.create(country=other_country, user_type="country_user")


@pytest.fixture(name="project_url")
def _project_url(project):
    return reverse("project-detail", args=(project.id,))


@pytest.fixture(name="project_upload_url")
def _project_upload_url(project):
    return reverse("project-upload", args=(project.id,))


@pytest.fixture(name="test_file")
def _test_file(tmp_path):
    p = tmp_path / "scott.txt"
    p.write_text("Living on a Prayer!")
    return p


@pytest.fixture(name="project_file")
def _project_file(project, test_file):
    project_file = ProjectFile(project=project)
    project_file.file.save("scott.txt", test_file.open())
    project_file.save()
    return project_file


@pytest.fixture(name="project_file_url")
def _project_file_url(project_file):
    return reverse("project-files", args=(project_file.id,))


@pytest.fixture(name="_setup_project_list")
def setup_project_list(
    country_ro,
    agency,
    project_type,
    project_status,
    subsector,
    meeting,
    sector,
    project_cluster_kpp,
    project_cluster_kip,
):
    new_country = CountryFactory.create(iso3="NwC")
    new_agency = AgencyFactory.create(code="NewAg")
    new_project_type = ProjectTypeFactory.create(code="NewType")
    new_project_status = ProjectStatusFactory.create(code="NEWSUB")
    new_sector = ProjectSectorFactory.create(name="New Sector")
    new_subsector = ProjectSubSectorFactory.create(sector=new_sector)
    new_meeting = MeetingFactory.create(number=3, date="2020-03-14")

    projects_data = [
        {
            "country": country_ro,
            "agency": agency,
            "project_type": project_type,
            "status": project_status,
            "sector": sector,
            "subsector": subsector,
            "substance_type": "HCFC",
            "approval_meeting": meeting,
            "cluster": project_cluster_kpp,
        },
        {
            "country": new_country,
            "agency": new_agency,
            "project_type": new_project_type,
            "status": new_project_status,
            "sector": new_sector,
            "subsector": new_subsector,
            "substance_type": "CFC",
            "approval_meeting": new_meeting,
            "cluster": project_cluster_kip,
        },
    ]

    for i in range(4):
        for project_data in projects_data:
            project_data["code"] = get_project_sub_code(
                project_data["country"],
                project_data["cluster"],
                project_data["agency"],
                project_data["project_type"],
                project_data["sector"],
                project_data["approval_meeting"],
                project_data["approval_meeting"],
                i + 1,
            )
            ProjectFactory.create(
                title=f"Project {i}",
                serial_number=i + 1,
                date_received=f"2020-01-{i+1}",
                **project_data,
            )

    # project_without cluster
    proj_data = projects_data[0].copy()
    proj_data.pop("cluster")
    proj_data["code"] = get_project_sub_code(
        proj_data["country"],
        None,
        project_data["agency"],
        project_data["project_type"],
        project_data["sector"],
        project_data["approval_meeting"],
        project_data["approval_meeting"],
        25,
    )
    ProjectFactory.create(
        title=f"Project {25}",
        date_received="2020-01-30",
        **proj_data,
    )

    # project_without sector and subsector
    proj_data = projects_data[0].copy()
    proj_data["sector"] = None
    proj_data["subsector"] = None
    proj_data["code"] = get_project_sub_code(
        proj_data["country"],
        proj_data["cluster"],
        project_data["agency"],
        project_data["project_type"],
        project_data["sector"],
        project_data["approval_meeting"],
        project_data["approval_meeting"],
        26,
    )
    ProjectFactory.create(
        title=f"Project {26}",
        serial_number=26,
        date_received="2020-01-30",
        **proj_data,
    )

    return new_agency, new_project_status, new_sector, new_meeting



class TestProjectV2List(BaseTest):
    url = reverse("project-v2-list")

    def test_project_list(self, viewer_user, _setup_project_list):
        self.client.force_authenticate(user=viewer_user)

        # get project list
        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 10

    def test_project_list_agency_user(self, agency_user, _setup_project_list):
        self.client.force_authenticate(user=agency_user)

        # get project list for user agency
        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 6
        for project in response.data:
            assert project["agency"] == agency_user.agency.name

    def test_project_list_country_user(self, country_user, _setup_project_list):
        self.client.force_authenticate(user=country_user)

        # get project list for user country
        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 6
        for project in response.data:
            assert project["country"] == country_user.country.name

    def test_project_list_w_submission(self, user, _setup_project_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"get_submission": True})
        assert response.status_code == 200
        assert len(response.data) == 4

    def test_project_list_wout_submission(self, user, _setup_project_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"get_submission": False})
        assert response.status_code == 200
        assert len(response.data) == 6

    def test_project_list_agency_filter(self, user, agency, _setup_project_list):
        new_agency, _, _, _ = _setup_project_list
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"agency_id": agency.id})
        assert response.status_code == 200
        assert len(response.data) == 6
        for project in response.data:
            assert project["agency"] == agency.name

        response = self.client.get(
            self.url, {"agency_id": f"{agency.id},{new_agency.id}"}
        )
        assert response.status_code == 200
        assert len(response.data) == 10

    def test_project_list_type_filter(self, user, project_type, _setup_project_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"project_type_id": project_type.id})
        assert response.status_code == 200
        assert len(response.data) == 6
        for project in response.data:
            assert project["project_type"] == project_type.name

    def test_project_list_status_filter(
        self, user, project_status, _setup_project_list
    ):
        _, new_project_status, _, _ = _setup_project_list
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"status_id": project_status.id})
        assert response.status_code == 200
        assert len(response.data) == 6
        for project in response.data:
            assert project["status"] == project_status.name

        response = self.client.get(
            self.url, {"status_id": f"{project_status.id},{new_project_status.id}"}
        )
        assert response.status_code == 200
        assert len(response.data) == 10

    def test_project_list_sector_filter(self, user, sector, _setup_project_list):
        _, _, new_sector, _ = _setup_project_list
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"sector_id": sector.id})
        assert response.status_code == 200
        assert len(response.data) == 5
        for project in response.data:
            assert project["sector"] == sector.name

        response = self.client.get(
            self.url, {"sector_id": f"{sector.id},{new_sector.id}"}
        )
        assert response.status_code == 200
        assert len(response.data) == 9

    def test_project_list_subsector_filter(self, user, subsector, _setup_project_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"subsector_id": subsector.id})
        assert response.status_code == 200
        assert len(response.data) == 5
        for project in response.data:
            assert project["subsector"] == subsector.name

    def test_project_list_subs_type_filter(self, user, _setup_project_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"substance_type": "HCFC"})
        assert response.status_code == 200
        assert len(response.data) == 6
        for project in response.data:
            assert project["substance_type"] == "HCFC"

    def test_project_list_meet_filter(self, user, _setup_project_list, meeting):
        _, _, _, new_meeting = _setup_project_list
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"approval_meeting_id": meeting.id})
        assert response.status_code == 200
        assert len(response.data) == 6
        for project in response.data:
            assert project["approval_meeting"] == meeting.number

        response = self.client.get(
            self.url, {"approval_meeting_id": f"{new_meeting.id},{meeting.id}"}
        )
        assert response.status_code == 200
        assert len(response.data) == 10

    def test_project_list_country_filter(self, user, country_ro, _setup_project_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"country_id": country_ro.id})
        assert response.status_code == 200
        assert len(response.data) == 6
        for project in response.data:
            assert project["country"] == country_ro.name

    def test_project_list_date_received_filter(self, user, _setup_project_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"date_received_after": "2020-01-03"})
        assert response.status_code == 200
        assert len(response.data) == 6
        for project in response.data:
            assert project["date_received"] in [
                "2020-01-03",
                "2020-01-04",
                "2020-01-30",
            ]

        response = self.client.get(self.url, {"date_received_before": "2020-01-01"})
        assert response.status_code == 200
        assert len(response.data) == 2
        assert response.data[0]["date_received"] == "2020-01-01"

    def test_project_list_search_filter(self, user, _setup_project_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"search": "Project 26"})
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["title"] == "Project 26"
