from pathlib import Path

import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from core.api.tests.base import BaseTest

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
from core.models.project import Project, ProjectOdsOdp
from core.models.project import ProjectFile

pytestmark = pytest.mark.django_db
# pylint: disable=C8008,W0221,R0913


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


class TestProjectsRetrieve:
    client = APIClient()

    def test_project_get_anon(self, project_url):
        response = self.client.get(project_url)
        assert response.status_code == 403

    def test_project_get(self, user, project_url, project):
        self.client.force_authenticate(user=user)
        response = self.client.get(project_url)
        assert response.status_code == 200
        assert response.data["id"] == project.id
        assert response.data["latest_file"] is None

    def test_project_files_get(self, user, project_url, project_file):
        self.client.force_authenticate(user=user)
        response = self.client.get(project_url)
        assert response.status_code == 200
        assert response.data["latest_file"]["id"] == project_file.id
        assert response.data["latest_file"]["name"] == project_file.file.name


class TestProjectFiles:
    client = APIClient()

    def test_project_file_get_anon(self, project_file_url):
        response = self.client.get(project_file_url)
        assert response.status_code == 403

    def test_project_file_delete_anon(self, project_file_url):
        response = self.client.delete(project_file_url)
        assert response.status_code == 403

    def test_project_file_get(self, user, project_file_url):
        self.client.force_authenticate(user=user)
        response = self.client.get(project_file_url)
        assert response.status_code == 200
        assert response.getvalue() == b"Living on a Prayer!"

    def test_project_file_delete(self, user, project_file, project_file_url):
        self.client.force_authenticate(user=user)
        response = self.client.delete(project_file_url)
        assert response.status_code == 204

        assert not ProjectFile.objects.filter(pk=project_file.pk).exists()
        assert not Path(project_file.file.path).is_file()


class TestProjectsUpdate:
    client = APIClient()

    def test_project_patch_anon(self, project_url):
        response = self.client.patch(project_url, {"title": "Into the Spell"})
        assert response.status_code == 403

    def test_project_patch(self, user, project_url, project, agency):
        self.client.force_authenticate(user=user)

        update_data = {
            "title": "Into the Spell",
            "submission": {
                "category": "investment project",
            },
            "coop_agencies_id": [agency.id],
        }
        response = self.client.patch(project_url, update_data, format="json")
        assert response.status_code == 200

        project.refresh_from_db()
        assert project.title == "Into the Spell"
        assert project.submission.category == "investment project"
        assert project.coop_agencies.count() == 1

    def test_project_patch_ods_odp(
        self, user, project_url, project, project_ods_odp_subst
    ):
        self.client.force_authenticate(user=user)

        update_data = {
            "title": "Crocodile wearing a vest",
            "ods_odp": [
                {
                    "id": project_ods_odp_subst.id,
                    "odp": project_ods_odp_subst.odp + 5,
                }
            ],
        }
        response = self.client.patch(project_url, update_data, format="json")
        # fails silently -> update only the title
        assert response.status_code == 200

        project.refresh_from_db()
        assert project.title == "Crocodile wearing a vest"
        assert project.ods_odp.count() == 1
        assert project.ods_odp.first().odp == project_ods_odp_subst.odp


class TestProjectUpload:
    client = APIClient()

    def test_upload_file_anon(self, project_upload_url):
        response = self.client.post(project_upload_url, {})
        assert response.status_code == 403

    def test_upload_file(self, user, project_upload_url, project, test_file):
        self.client.force_authenticate(user=user)

        response = self.client.post(
            project_upload_url, {"file": test_file.open()}, format="multipart"
        )
        assert response.status_code == 201

        project.refresh_from_db()
        project_file = project.files.first()
        assert project_file.file.open().read() == b"Living on a Prayer!"


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


class TestProjectList(BaseTest):
    url = reverse("project-list")

    def test_project_list(self, user, _setup_project_list):
        self.client.force_authenticate(user=user)

        # get project list
        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 4
        # check if there is no submission data
        for project in response.data:
            assert not project["submission"]

    def test_project_list_w_submission(self, user, _setup_project_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"get_submission": True})
        assert response.status_code == 200
        assert len(response.data) == 4
        # check if there is submission data
        projects_with_submission = 0
        for project in response.data:
            if project["submission"]:
                projects_with_submission += 1
        assert projects_with_submission == 2

    def test_project_list_agency_filter(self, user, agency, _setup_project_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"agency_id": agency.id})
        assert response.status_code == 200
        assert len(response.data) == 2
        for project in response.data:
            assert project["agency"] == agency.name

    def test_project_list_type_filter(self, user, project_type, _setup_project_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"project_type_id": project_type.id})
        assert response.status_code == 200
        assert len(response.data) == 2
        for project in response.data:
            assert project["project_type"] == project_type.name

    def test_project_list_status_filter(
        self, user, project_status, _setup_project_list
    ):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"status_id": project_status.id})
        assert response.status_code == 200
        assert len(response.data) == 2
        for project in response.data:
            assert project["status"] == project_status.name

    def test_project_list_sector_filter(self, user, sector, _setup_project_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"sector_id": sector.id})
        assert response.status_code == 200
        assert len(response.data) == 2
        for project in response.data:
            assert project["sector"] == sector.name

    def test_project_list_subsector_filter(self, user, subsector, _setup_project_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"subsector_id": subsector.id})
        assert response.status_code == 200
        assert len(response.data) == 2
        for project in response.data:
            assert project["subsector"] == subsector.name

    def test_project_list_subs_type_filter(self, user, _setup_project_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"substance_type": "HCFC"})
        assert response.status_code == 200
        assert len(response.data) == 2
        for project in response.data:
            assert project["substance_type"] == "HCFC"

    def test_project_list_meet_no_filter(self, user, _setup_project_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"approval_meeting_no": 1})
        assert response.status_code == 200
        assert len(response.data) == 2
        for project in response.data:
            assert project["approval_meeting_no"] == 1


@pytest.fixture(name="_setup_project_create")
def setup_project_create(country_ro, agency, project_type, subsector, substance, blend):
    statuses = [
        {"name": "New Submission", "code": "NEWSUB"},
        {"name": "New", "code": "NEW"},
    ]
    for status in statuses:
        ProjectStatusFactory.create(**status)

    # create coop agencies
    coop_agencies = [AgencyFactory.create().id for i in range(2)]

    return {
        "title": "Project",
        "description": "Description",
        "country_id": country_ro.id,
        "agency_id": agency.id,
        "coop_agencies_id": coop_agencies,
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
        "funds": [
            {
                "amount": 41,
                "fund_type": "allocated",
            },
            {
                "amount": 42,
                "fund_type": "transferred",
            },
        ],
    }


class TestCreateProjects(BaseTest):
    url = reverse("project-list")

    def test_without_login(self, _setup_project_create):
        data = _setup_project_create
        self.client.force_authenticate(user=None)

        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 403

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
        data = _setup_project_create
        self.client.force_authenticate(user=user)

        # create project
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 201
        assert response.data["title"] == data["title"]
        assert response.data["country"] == country_ro.name
        assert response.data["agency"] == agency.name
        assert len(response.data["coop_agencies"]) == 2
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

        funds = response.data["funds"]
        assert len(funds) == 2
        assert funds[0]["amount"] == 41
        assert funds[0]["fund_type"] == "allocated"
        assert funds[1]["amount"] == 42
        assert funds[1]["fund_type"] == "transferred"

    def test_create_project_project_fk(self, user, _setup_project_create):
        data = _setup_project_create
        self.client.force_authenticate(user=user)
        # invalid country, agency, subsector, project_type ids
        for field in ["agency_id", "subsector_id", "project_type_id", "country_id"]:
            initial_value = data[field]
            data[field] = 999
            # test with invalid id
            response = self.client.post(self.url, data, format="json")
            assert response.status_code == 400
            assert field in response.data
            data[field] = initial_value

        # check project count
        assert Project.objects.count() == 0

    def test_create_project_ods_fk(self, user, _setup_project_create):
        data = _setup_project_create
        self.client.force_authenticate(user=user)
        # invalid substance, blend ids
        for index, field in [(0, "ods_substance_id"), (1, "ods_blend_id")]:
            initial_value = data["ods_odp"][index][field]
            data["ods_odp"][index][field] = 999
            response = self.client.post(self.url, data, format="json")
            assert response.status_code == 400
            assert field in response.data["ods_odp"][index]
            data["ods_odp"][index][field] = initial_value

        # check project count
        assert Project.objects.count() == 0

    def test_create_project_submission_category(self, user, _setup_project_create):
        data = _setup_project_create
        self.client.force_authenticate(user=user)

        data["submission"]["category"] = "invalid"
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400
        assert "submission" in response.data
        assert "category" in response.data["submission"]

        # check project count
        assert Project.objects.count() == 0
