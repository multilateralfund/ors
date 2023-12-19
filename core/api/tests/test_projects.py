from pathlib import Path

import pytest
from django.urls import reverse
from rest_framework.test import APIClient
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
    RbmMeasureFactory,
)
from core.models.project import Project, ProjectOdsOdp
from core.models.project import ProjectFile
from core.utils import get_project_sub_code

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
        assert response.data["substance_category"] == "Production"
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
        new_agency = AgencyFactory.create(code="NEWAG")

        update_data = {
            "title": "Into the Spell",
            "submission_category": "investment project",
            "agency_id": new_agency.id,
            "coop_agencies_id": [agency.id],
        }
        response = self.client.patch(project_url, update_data, format="json")
        assert response.status_code == 200

        project.refresh_from_db()
        assert project.title == "Into the Spell"
        assert project.submission_category == "investment project"
        assert project.coop_agencies.count() == 1
        assert "NEWAG" in project.generated_code

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
            proj = ProjectFactory.create(
                title=f"Project {i}",
                serial_number=i + 1,
                date_received=f"2020-01-{i+1}",
                **project_data,
            )
            proj.set_generated_code()

    projects_data[0].pop("cluster")
    proj = ProjectFactory.create(
        title=f"Project {25}",
        date_received="2020-01-30",
        **projects_data[0],
    )
    proj.set_generated_code()

    return new_agency, new_project_status, new_sector, new_meeting


class TestProjectList(BaseTest):
    url = reverse("project-list")

    def test_project_list(self, user, _setup_project_list):
        self.client.force_authenticate(user=user)

        # get project list
        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 9

    def test_project_list_w_submission(self, user, _setup_project_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"get_submission": True})
        assert response.status_code == 200
        assert len(response.data) == 4

    def test_project_list_wout_submission(self, user, _setup_project_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"get_submission": False})
        assert response.status_code == 200
        assert len(response.data) == 5

    def test_project_list_agency_filter(self, user, agency, _setup_project_list):
        new_agency, _, _, _ = _setup_project_list
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"agency_id": agency.id})
        assert response.status_code == 200
        assert len(response.data) == 5
        for project in response.data:
            assert project["agency"] == agency.name

        response = self.client.get(
            self.url, {"agency_id": f"{agency.id},{new_agency.id}"}
        )
        assert response.status_code == 200
        assert len(response.data) == 9

    def test_project_list_type_filter(self, user, project_type, _setup_project_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"project_type_id": project_type.id})
        assert response.status_code == 200
        assert len(response.data) == 5
        for project in response.data:
            assert project["project_type"] == project_type.name

    def test_project_list_status_filter(
        self, user, project_status, _setup_project_list
    ):
        _, new_project_status, _, _ = _setup_project_list
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"status_id": project_status.id})
        assert response.status_code == 200
        assert len(response.data) == 5
        for project in response.data:
            assert project["status"] == project_status.name

        response = self.client.get(
            self.url, {"status_id": f"{project_status.id},{new_project_status.id}"}
        )
        assert response.status_code == 200
        assert len(response.data) == 9

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
        assert len(response.data) == 5
        for project in response.data:
            assert project["substance_type"] == "HCFC"

    def test_project_list_meet_filter(self, user, _setup_project_list, meeting):
        _, _, _, new_meeting = _setup_project_list
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"approval_meeting_id": meeting.id})
        assert response.status_code == 200
        assert len(response.data) == 5
        for project in response.data:
            assert project["approval_meeting"] == meeting.number

        response = self.client.get(
            self.url, {"approval_meeting_id": f"{new_meeting.id},{meeting.id}"}
        )
        assert response.status_code == 200
        assert len(response.data) == 9

    def test_project_list_country_filter(self, user, country_ro, _setup_project_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"country_id": country_ro.id})
        assert response.status_code == 200
        assert len(response.data) == 5
        for project in response.data:
            assert project["country"] == country_ro.name

    def test_project_list_date_received_filter(self, user, _setup_project_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"date_received_after": "2020-01-03"})
        assert response.status_code == 200
        assert len(response.data) == 5
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


class TestProjectStatistics(BaseTest):
    url = reverse("project-statistics")

    def test_project_statistics(self, user, _setup_project_list):
        self.client.force_authenticate(user=user)

        # get project list
        response = self.client.get(self.url)
        assert response.status_code == 200
        assert response.data["projects_total_count"] == 9
        assert response.data["projects_count"] == 9
        assert response.data["projects_code_count"] == 1
        assert response.data["projects_code_subcode_count"] == 8
        assert response.data["projects_count_per_sector"][0]["sector__name"] == "Sector"
        assert response.data["projects_count_per_sector"][0]["count"] == 5
        assert (
            response.data["projects_count_per_sector"][1]["sector__name"]
            == "New Sector"
        )
        assert response.data["projects_count_per_sector"][1]["count"] == 4
        assert response.data["projects_count_per_cluster"][0]["count"] == 4
        assert response.data["projects_count_per_cluster"][1]["count"] == 4

    def test_proj_stat_w_filters(self, user, _setup_project_list, project_cluster_kpp):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"cluster_id": project_cluster_kpp.id})
        assert response.status_code == 200
        assert response.data["projects_total_count"] == 9
        assert response.data["projects_count"] == 4
        assert response.data["projects_code_count"] == 0
        assert response.data["projects_code_subcode_count"] == 4
        assert len(response.data["projects_count_per_sector"]) == 1
        assert response.data["projects_count_per_sector"][0]["sector__name"] == "Sector"
        assert response.data["projects_count_per_sector"][0]["count"] == 4
        assert len(response.data["projects_count_per_cluster"]) == 1
        assert (
            response.data["projects_count_per_cluster"][0]["cluster__name"]
            == project_cluster_kpp.name
        )
        assert response.data["projects_count_per_cluster"][0]["count"] == 4


@pytest.fixture(name="_setup_project_create")
def setup_project_create(
    country_ro,
    agency,
    project_type,
    subsector,
    substance,
    blend,
    meeting,
    project_cluster_kip,
    rbm_measure,
):
    statuses_dict = [
        {"name": "New Submission", "code": "NEWSUB"},
        {"name": "New", "code": "NEW"},
    ]
    statuses = []
    for status in statuses_dict:
        statuses.append(ProjectStatusFactory.create(**status))
    new_rbm_measure = RbmMeasureFactory.create(name="new_measure")

    # create coop agencies
    coop_agencies = [AgencyFactory.create().id for i in range(2)]
    new_meeting = MeetingFactory.create(number=2, date="2020-03-14")

    return {
        "title": "Project",
        "description": "Description",
        "country_id": country_ro.id,
        "agency_id": agency.id,
        "coop_agencies_id": coop_agencies,
        "sector_id": subsector.sector_id,
        "subsector_id": subsector.id,
        "project_type_id": project_type.id,
        "status_id": statuses[0].id,
        "substance_type": "HCFC",
        "approval_meeting_id": meeting.id,
        "cluster_id": project_cluster_kip.id,
        "national_agency": "National Agency",
        "submission_category": "bilateral cooperation",
        "funds_allocated": 1234,
        "support_cost_psc": 12.3,
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
        "rbm_measures": [
            {
                "measure_id": rbm_measure.id,
                "value": 10,
            },
            {
                "measure_id": new_rbm_measure.id,
                "value": 20,
            },
        ],
        "comments": [
            {
                "meeting_of_report_id": meeting.id,
                "secretariat_comment": "Well watch out. It's a sickly air that fills the place.",
                "agency_response": "Perhaps dreams aren't such great things after all...",
            },
            {
                "meeting_of_report": new_meeting.id,
                "secretariat_comment": "Don't look so glum, coz.",
                "agency_response": "Uncle Alexander said he won't be back again.",
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
        rbm_measure,
        meeting,
        project_cluster_kip,
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
        assert response.data["submission_category"] == "bilateral cooperation"
        assert response.data["code"] == get_project_sub_code(
            country_ro,
            project_cluster_kip,
            None,
            agency,
            project_type,
            subsector.sector,
            meeting,
            None,
        )

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

        rbm_measures = response.data["rbm_measures"]
        assert len(rbm_measures) == 2
        assert rbm_measures[0]["value"] == 10
        assert rbm_measures[0]["measure_name"] == rbm_measure.name

        comments = response.data["comments"]
        assert len(comments) == 2
        assert comments[0]["meeting_of_report"] == meeting.number

    def test_create_project_project_fk(self, user, _setup_project_create):
        data = _setup_project_create
        self.client.force_authenticate(user=user)
        # invalid country, agency, subsector, project_type ids
        for field in [
            "agency_id",
            "subsector_id",
            "project_type_id",
            "country_id",
            "cluster_id",
        ]:
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

        data["submission_category"] = "invalid"
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400
        assert "submission_category" in response.data

        # check project count
        assert Project.objects.count() == 0

    def teste_create_project_rbm_meas_fk(self, user, _setup_project_create):
        data = _setup_project_create
        self.client.force_authenticate(user=user)

        data["rbm_measures"][0]["measure_id"] = 999
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400

        # check project count
        assert Project.objects.count() == 0

    def test_create_project_comments(self, user, _setup_project_create):
        data = _setup_project_create
        self.client.force_authenticate(user=user)

        data["comments"][0]["meeting_of_report_id"] = 999
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400

        # check project count
        assert Project.objects.count() == 0
