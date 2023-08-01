import pytest
from django.urls import reverse
from rest_framework.test import APIClient

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
from core.models.project import ProjectOdsOdp

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


@pytest.fixture(name="_setup_project_create")
def setup_project_create():
    statuses = [
        {"name": "New Submission", "code": "NEWSUB"},
        {"name": "New", "code": "NEW"},
    ]
    for status in statuses:
        ProjectStatusFactory.create(**status)


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

    def test_create_project(
        self,
        user,
        country_ro,
        agency,
        substance,
        blend,
        project_type,
        subsector,
        _setup_project_create,
    ):
        url = reverse("project-list")
        data = {
            "title": "Project",
            "description": "Description",
            "country_id": country_ro.id,
            "agency_id": agency.id,
            "subsector_id": subsector.id,
            "project_type_id": project_type.id,
            "status_id": 1,
            "substance_type": "HCFC",
            "approval_meeting_no": 1,
            "national_agency": "National Agency",
            "submission": {
                "category": "bilateral cooperation",
                "funds_allocated": 1234,
                "support_cost_13": 12.3,
            },
            "ods_odp": [
                {
                    "odp": 3.14,
                    "ods_substance_id": substance.id,
                    "ods_replacement": "replacement",
                    "ods_type": ProjectOdsOdp.ProjectOdsOdpType.GENERAL,
                },
                {
                    "odp": 3.14,
                    "ods_blend_id": blend.id,
                    "ods_replacement": "replacement",
                    "ods_type": ProjectOdsOdp.ProjectOdsOdpType.PRODUCTION,
                },
            ],
        }

        # test without authentication
        self.client.force_authenticate(user=None)
        response = self.client.post(url, data, format="json")
        assert response.status_code == 403

        self.client.force_authenticate(user=user)

        # create project
        response = self.client.post(url, data, format="json")
        assert response.status_code == 201
        assert response.data["title"] == data["title"]
        assert response.data["country"] == country_ro.name
        assert response.data["agency"] == agency.name
        assert response.data["sector"] == subsector.sector.name
        assert response.data["subsector"] == subsector.name
        assert response.data["project_type"] == project_type.name
        assert response.data["status"] == "New Submission"
        assert response.data["substance_type"] == "HCFC"
        assert response.data["national_agency"] == "National Agency"
        submission = response.data["submission"]
        assert submission["category"] == "bilateral cooperation"
        ods_odp = response.data["ods_odp"]
        assert len(ods_odp) == 2
        assert ods_odp[0]["odp"] == 3.14
        assert ods_odp[0]["ods_display_name"] == substance.name
        assert ods_odp[0]["ods_replacement"] == "replacement"
        assert ods_odp[0]["ods_type"] == "general"
        assert ods_odp[1]["ods_display_name"] == blend.name

        # invalid country id
        data["country_id"] = 999
        response = self.client.post(url, data, format="json")
        assert response.status_code == 400
        assert "country_id" in response.data
        data["country_id"] = country_ro.id

        # invalid agency, subsector, project_type ids
        for field in ["agency_id", "subsector_id", "project_type_id"]:
            initial_value = data[field]
            data[field] = 999
            # test with invalid id
            response = self.client.post(url, data, format="json")
            assert response.status_code == 400
            assert field in response.data
            data[field] = initial_value

        # invalid substance, blend ids
        for index, field in [(0, "ods_substance_id"), (1, "ods_blend_id")]:
            initial_value = data["ods_odp"][index][field]
            data["ods_odp"][index][field] = 999
            response = self.client.post(url, data, format="json")
            assert response.status_code == 400
            assert field in response.data["ods_odp"][index]
            data["ods_odp"][index][field] = initial_value

        # invalid submission category
        data["submission"]["category"] = "invalid"
        response = self.client.post(url, data, format="json")
        assert response.status_code == 400
        assert "submission" in response.data
        assert "category" in response.data["submission"]
