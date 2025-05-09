import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from core.api.tests.base import BaseTest
from core.api.tests.factories import (
    AgencyFactory,
    BusinessPlanFactory,
    BPActivityFactory,
    CountryFactory,
    MeetingFactory,
    ProjectFactory,
    ProjectSectorFactory,
    ProjectStatusFactory,
    ProjectSubmissionStatusFactory,
    ProjectSubSectorFactory,
    ProjectTypeFactory,
    SubstanceFactory,
    UserFactory,
)
from core.models import BPActivity

from core.models.project import Project, ProjectFile
from core.utils import get_project_sub_code

pytestmark = pytest.mark.django_db
# pylint: disable=C8008,W0221,R0913,R0914,R0915


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
    return reverse("project-v2-detail", args=(project.id,))


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


@pytest.fixture(name="test_file1")
def _test_file1(tmp_path):
    p = tmp_path / "project_file1.docx"
    p.write_text("This is the first project test file")
    return p


@pytest.fixture(name="test_file2")
def _test_file2(tmp_path):
    p = tmp_path / "project_file2.pdf"
    p.write_text("This is the second project test file")
    return p


@pytest.fixture(name="wrong_format_file3")
def _wrong_format_file3(tmp_path):
    p = tmp_path / "project_file3.csv"
    p.write_text("This is the third project test file")
    return p


@pytest.fixture(name="_setup_project_list")
def setup_project_list(
    country_ro,
    agency,
    project_type,
    project_status,
    project_submission_status,
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
    new_project_submission_status = ProjectSubmissionStatusFactory.create(
        code="submitted", name="Submitted"
    )
    new_sector = ProjectSectorFactory.create(name="New Sector")
    new_subsector = ProjectSubSectorFactory.create(sector=new_sector)
    new_meeting = MeetingFactory.create(number=3, date="2020-03-14")

    projects_data = [
        {
            "country": country_ro,
            "agency": agency,
            "project_type": project_type,
            "status": project_status,
            "submission_status": project_submission_status,
            "sector": sector,
            "subsectors": [subsector],
            "substance_type": "HCFC",
            "meeting": meeting,
            "cluster": project_cluster_kpp,
        },
        {
            "country": new_country,
            "agency": new_agency,
            "project_type": new_project_type,
            "status": new_project_status,
            "submission_status": new_project_submission_status,
            "sector": new_sector,
            "subsectors": [new_subsector],
            "substance_type": "CFC",
            "meeting": new_meeting,
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
                project_data["meeting"],
                project_data["meeting"],
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
        project_data["meeting"],
        project_data["meeting"],
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
    proj_data["subsectors"] = None
    proj_data["code"] = get_project_sub_code(
        proj_data["country"],
        proj_data["cluster"],
        project_data["agency"],
        project_data["project_type"],
        project_data["sector"],
        project_data["meeting"],
        project_data["meeting"],
        26,
    )
    ProjectFactory.create(
        title=f"Project {26}",
        serial_number=26,
        date_received="2020-01-30",
        **proj_data,
    )

    return (
        new_agency,
        new_project_status,
        new_project_submission_status,
        new_sector,
        new_meeting,
    )


@pytest.fixture(name="project_file_url")
def _project_file_url(project_file):
    return reverse("project-files", args=(project_file.id,))


@pytest.fixture(name="_setup_project_create")
def setup_project_create(
    country_ro,
    agency,
    project_type,
    meeting,
    subsector,
    project_cluster_kip,
    groupA,
    decision,
):
    statuses_dict = [
        {"name": "N/A", "code": "NA"},
    ]

    submission_statuses_dict = [
        {"name": "Draft", "code": "draft"},
    ]
    statuses = []
    for status in statuses_dict:
        statuses.append(ProjectStatusFactory.create(**status))
    submission_statuses = []
    for status in submission_statuses_dict:
        submission_statuses.append(ProjectSubmissionStatusFactory.create(**status))

    bp = BusinessPlanFactory.create()
    bp_activity = BPActivityFactory.create(
        business_plan=bp,
        agency=agency,
        country=country_ro,
        status=BPActivity.Status.approved,
    )

    substA = SubstanceFactory.create(
        name="SubstanceA", odp=0.02, gwp=0.05, group=groupA
    )
    substB = SubstanceFactory.create(
        name="Substanceb", odp=0.03, gwp=0.02, group=groupA
    )

    return {
        "ad_hoc_pcr": True,
        "agency": agency.id,
        "aggregated_consumption": 943.3,
        "baseline": 43.4,
        "bp_activity": bp_activity.id,
        "cost_effectiveness": 43.3,
        "cost_effectiveness_co2": 54.3,
        "cluster": project_cluster_kip.id,
        "country": country_ro.id,
        "description": "Description",
        "date_completion": "2020-01-01",
        "date_approved": "2023-10-01",
        "decision": decision.id,
        "destruction_tehnology": "destruction tehnology test",
        "excom_provision": "test excom provision",
        "funding_window": "test funding window",
        "group": groupA.id,
        "individual_consideration": False,
        "is_lvc": True,
        "is_sme": False,
        "lead_agency": agency.id,
        "meeting": meeting.id,
        "mya_start_date": "2023-10-01",
        "mya_end_date": "2024-09-30",
        "mya_project_funding": 1234.4,
        "mya_support_cost": 434.2,
        "mya_phase_out_co2_eq_t": 948.3,
        "mya_phase_out_odp_t": 23.2,
        "mya_phase_out_mt": 3.53,
        "pcr_waived": False,
        "production_control_type": "test production control type",
        "products_manufactured": "test products manufactured",
        "programme_officer": "Officer",
        "project_end_date": "2024-09-30",
        "project_start_date": "2023-10-01",
        "project_type": project_type.id,
        "sector": subsector.sector.id,
        "starting_point": 543.4,
        "subsector": subsector.id,
        "support_cost_psc": 23,
        "tranche": 2,
        "targets": 543.4,
        "title": "test title",
        "total_fund": 2340000,
        "ods_odp": [
            {
                "ods_substance_id": substA.id,
                "odp": 11.11,
                "ods_replacement": "ods replacement test",
                "co2_mt": 323.23,
                "ods_type": "production",
                "sort_order": 1,
            },
            {
                "ods_substance_id": substB.id,
                "odp": 41.41,
                "ods_replacement": "ods replacement test 2",
                "co2_mt": 543.23,
                "ods_type": "general",
                "sort_order": 2,
            },
        ],
    }


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

    def test_project_list_agency_filter(self, user, agency, _setup_project_list):
        new_agency, _, _, _, _ = _setup_project_list
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
            assert project["project_type"]["id"] == project_type.id
            assert project["project_type"]["name"] == project_type.name
            assert project["project_type"]["code"] == project_type.code

    def test_project_list_status_filter(
        self, user, project_status, _setup_project_list
    ):
        _, new_project_status, _, _, _ = _setup_project_list
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

    def test_project_list_submission_status_filter(
        self, user, project_submission_status, _setup_project_list
    ):
        _, _, new_project_submission_status, _, _ = _setup_project_list
        self.client.force_authenticate(user=user)

        response = self.client.get(
            self.url, {"submission_status_id": project_submission_status.id}
        )
        assert response.status_code == 200
        assert len(response.data) == 6
        for project in response.data:
            assert project["submission_status"] == project_submission_status.name

        response = self.client.get(
            self.url,
            {
                "submission_status_id": f"{project_submission_status.id},{new_project_submission_status.id}"
            },
        )
        assert response.status_code == 200
        assert len(response.data) == 10

    def test_project_list_sector_filter(self, user, sector, _setup_project_list):
        _, _, _, new_sector, _ = _setup_project_list
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"sector_id": sector.id})
        assert response.status_code == 200
        assert len(response.data) == 5
        for project in response.data:
            assert project["sector"]["id"] == sector.id
            assert project["sector"]["name"] == sector.name
            assert project["sector"]["code"] == sector.code

        response = self.client.get(
            self.url, {"sector_id": f"{sector.id},{new_sector.id}"}
        )
        assert response.status_code == 200
        assert len(response.data) == 9

    def test_project_list_subsector_filter(self, user, subsector, _setup_project_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"subsectors": [subsector.id]})
        assert response.status_code == 200
        assert len(response.data) == 5
        for project in response.data:
            assert project["subsector_names"] == [subsector.name]

    def test_project_list_subs_type_filter(self, user, _setup_project_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"substance_type": "HCFC"})
        assert response.status_code == 200
        assert len(response.data) == 6
        for project in response.data:
            assert project["substance_type"] == "HCFC"

    def test_project_list_meet_filter(self, user, _setup_project_list, meeting):
        _, _, _, _, new_meeting = _setup_project_list
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"meeting_id": meeting.id})
        assert response.status_code == 200
        assert len(response.data) == 6
        for project in response.data:
            assert project["meeting"] == meeting.number

        response = self.client.get(
            self.url, {"meeting_id": f"{new_meeting.id},{meeting.id}"}
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


class TestProjectsRetrieve:
    client = APIClient()

    def test_project_get_anon(self, project_url):
        response = self.client.get(project_url)
        assert response.status_code == 403

    def test_without_permission_wrong_agency(self, other_agency_user, project_url):
        self.client.force_authenticate(user=other_agency_user)
        response = self.client.get(project_url)
        assert response.status_code == 404

    def test_without_permission_wrong_country(self, other_country_user, project_url):
        self.client.force_authenticate(user=other_country_user)
        response = self.client.get(project_url)
        assert response.status_code == 404

    def test_project_get(self, viewer_user, project_url, project):
        self.client.force_authenticate(user=viewer_user)
        response = self.client.get(project_url)
        assert response.status_code == 200
        assert response.data["id"] == project.id
        assert response.data["substance_category"] == "Production"
        assert response.data["latest_file"] is None

    def test_project_files_get(self, viewer_user, project_url, project_file):
        self.client.force_authenticate(user=viewer_user)
        response = self.client.get(project_url)
        assert response.status_code == 200
        assert response.data["latest_file"]["id"] == project_file.id
        assert response.data["latest_file"]["name"] == project_file.file.name


class TestCreateProjects(BaseTest):
    url = reverse("project-v2-list")

    def test_without_login(self, _setup_project_create):
        data = _setup_project_create
        self.client.force_authenticate(user=None)

        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 403

    def test_as_viewer(self, viewer_user, _setup_project_create):
        data = _setup_project_create
        self.client.force_authenticate(user=viewer_user)

        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 403

    def test_create_project(
        self,
        user,
        country_ro,
        agency,
        project_type,
        subsector,
        meeting,
        project_cluster_kip,
        _setup_project_create,
        decision,
    ):
        data = _setup_project_create
        self.client.force_authenticate(user=user)

        # create project
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 201
        assert response.data["ad_hoc_pcr"] is True
        assert response.data["agency"] == agency.name
        assert response.data["aggregated_consumption"] == data["aggregated_consumption"]
        assert response.data["baseline"] == data["baseline"]
        assert response.data["bp_activity"] == data["bp_activity"]
        assert response.data["cost_effectiveness"] == data["cost_effectiveness"]
        assert response.data["cost_effectiveness_co2"] == data["cost_effectiveness_co2"]
        assert response.data["cluster"]["id"] == data["cluster"]
        assert response.data["country"] == country_ro.name
        assert response.data["description"] == data["description"]
        assert response.data["date_completion"] == data["date_completion"]
        assert response.data["date_approved"] == data["date_approved"]
        assert response.data["decision_id"] == decision.id
        assert response.data["destruction_tehnology"] == data["destruction_tehnology"]
        assert response.data["excom_provision"] == data["excom_provision"]
        assert response.data["funding_window"] == data["funding_window"]
        assert response.data["group_id"] == data["group"]
        assert (
            response.data["individual_consideration"]
            == data["individual_consideration"]
        )
        assert response.data["is_lvc"] == data["is_lvc"]
        assert response.data["is_sme"] == data["is_sme"]
        assert response.data["lead_agency"] == agency.name
        assert response.data["meeting_id"] == data["meeting"]
        assert response.data["mya_start_date"] == data["mya_start_date"]
        assert response.data["mya_end_date"] == data["mya_end_date"]
        assert response.data["mya_project_funding"] == data["mya_project_funding"]
        assert response.data["mya_support_cost"] == data["mya_support_cost"]
        assert response.data["mya_phase_out_co2_eq_t"] == data["mya_phase_out_co2_eq_t"]
        assert response.data["mya_phase_out_odp_t"] == data["mya_phase_out_odp_t"]
        assert response.data["mya_phase_out_mt"] == data["mya_phase_out_mt"]
        assert response.data["pcr_waived"] == data["pcr_waived"]
        assert (
            response.data["production_control_type"] == data["production_control_type"]
        )
        assert response.data["products_manufactured"] == data["products_manufactured"]
        assert response.data["programme_officer"] == data["programme_officer"]
        assert response.data["project_end_date"] == data["project_end_date"]
        assert response.data["project_start_date"] == data["project_start_date"]
        assert response.data["project_type"]["id"] == data["project_type"]
        assert response.data["project_type"]["id"] == project_type.id
        assert response.data["project_type"]["name"] == project_type.name
        assert response.data["project_type"]["code"] == project_type.code
        assert response.data["sector_id"] == data["sector"]
        assert response.data["sector"]["id"] == subsector.sector.id
        assert response.data["sector"]["name"] == subsector.sector.name
        assert response.data["sector"]["code"] == subsector.sector.code
        assert response.data["starting_point"] == data["starting_point"]
        assert response.data["subsector_id"] == data["subsector"]
        assert response.data["support_cost_psc"] == data["support_cost_psc"]
        assert response.data["tranche"] == data["tranche"]
        assert response.data["targets"] == data["targets"]
        assert response.data["title"] == data["title"]
        assert response.data["total_fund"] == data["total_fund"]
        assert (
            response.data["ods_odp"][0]["ods_substance_id"]
            == data["ods_odp"][0]["ods_substance_id"]
        )
        assert response.data["ods_odp"][0]["odp"] == data["ods_odp"][0]["odp"]
        assert (
            response.data["ods_odp"][0]["ods_replacement"]
            == data["ods_odp"][0]["ods_replacement"]
        )
        assert response.data["ods_odp"][0]["co2_mt"] == data["ods_odp"][0]["co2_mt"]
        assert response.data["ods_odp"][0]["ods_type"] == data["ods_odp"][0]["ods_type"]
        assert (
            response.data["ods_odp"][0]["sort_order"]
            == data["ods_odp"][0]["sort_order"]
        )
        assert (
            response.data["ods_odp"][1]["ods_substance_id"]
            == data["ods_odp"][1]["ods_substance_id"]
        )
        assert response.data["ods_odp"][1]["odp"] == data["ods_odp"][1]["odp"]
        assert (
            response.data["ods_odp"][1]["ods_replacement"]
            == data["ods_odp"][1]["ods_replacement"]
        )
        assert response.data["ods_odp"][1]["co2_mt"] == data["ods_odp"][1]["co2_mt"]
        assert response.data["ods_odp"][1]["ods_type"] == data["ods_odp"][1]["ods_type"]
        assert (
            response.data["ods_odp"][1]["sort_order"]
            == data["ods_odp"][1]["sort_order"]
        )
        assert response.data["status"] == "N/A"
        assert response.data["submission_status"] == "Draft"
        assert response.data["code"] == get_project_sub_code(
            country_ro,
            project_cluster_kip,
            agency,
            project_type,
            subsector.sector,
            meeting,
            None,
            2,
        )

    def test_create_project_project_fk(self, user, _setup_project_create):
        data = _setup_project_create
        self.client.force_authenticate(user=user)
        # invalid country, agency, sector, project_type ids
        for field in [
            "agency",
            "sector",
            "project_type",
            "country",
            "cluster",
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


class TestCPFiles:
    client = APIClient()

    def test_file_upload_anon(self, project):
        url = reverse("project-files-v2", args=(project.id,))
        response = self.client.post(url, {})
        assert response.status_code == 403

    def test_file_upload_wrong_extension(
        self, user, project, test_file1, test_file2, wrong_format_file3
    ):
        self.client.force_authenticate(user=user)
        url = reverse("project-files-v2", args=(project.id,))

        # upload file with wrong extension
        data = {
            "files": [test_file1.open(), test_file2.open(), wrong_format_file3.open()]
        }
        response = self.client.post(url, data, format="multipart")
        assert response.status_code == 400
        assert response.data == {"file": "File extension .csv is not valid"}

    def test_file_upload_duplicate(self, user, project, test_file1, test_file2):
        self.client.force_authenticate(user=user)
        url = reverse("project-files-v2", args=(project.id,))

        # upload file
        data = {"files": [test_file1.open(), test_file2.open()]}
        response = self.client.post(url, data, format="multipart")
        assert response.status_code == 201
        assert project.files.all().count() == 2
        assert project.files.first().filename == test_file1.name
        assert project.files.last().filename == test_file2.name

        # upload same file again
        response = self.client.post(url, data, format="multipart")
        assert response.status_code == 400
        assert response.data == {
            "files": f"Some files already exist: {test_file1.name}, {test_file2.name}"
        }

    def test_file_upload(self, user, project, test_file1, test_file2):
        self.client.force_authenticate(user=user)
        url = reverse("project-files-v2", args=(project.id,))

        # upload file
        data = {"files": [test_file1.open(), test_file2.open()]}
        response = self.client.post(url, data, format="multipart")
        assert response.status_code == 201

        # check upload (GET)
        response = self.client.get(url)
        assert response.status_code == 200
        assert response.data[0]["project_id"] == project.id
        assert response.data[0]["filename"] == test_file1.name
        assert response.data[1]["project_id"] == project.id
        assert response.data[1]["filename"] == test_file2.name

        # delete file (DELETE)
        file_ids = [response.data[0]["id"], response.data[1]["id"]]
        data = {"file_ids": file_ids}
        response = self.client.delete(url, data, format="json")
        assert response.status_code == 204

        # check delete (GET)
        response = self.client.get(url)
        assert response.status_code == 200
        assert response.data == []

    def test_file_download(self, user, project, test_file1):
        self.client.force_authenticate(user=user)
        url = reverse("project-files-v2", args=(project.id,))

        # upload file
        data = {"files": [test_file1.open()]}
        response = self.client.post(url, data, format="multipart")
        assert response.status_code == 201

        # download file
        my_file = ProjectFile.objects.get(filename=test_file1.name)
        url = reverse("project-files-v2-download", args=(my_file.id,))
        response = self.client.get(url)

        assert response.status_code == 200
        assert response.content == my_file.file.read()
