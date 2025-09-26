import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from core.api.serializers.project_metadata import ProjectSubSectorSerializer

from core.api.tests.base import BaseTest
from core.api.tests.factories import (
    BlendFactory,
    BusinessPlanFactory,
    BPActivityFactory,
    ProjectFactory,
    MetaProjectFactory,
    ProjectOdsOdpFactory,
    ProjectStatusFactory,
    ProjectSubmissionStatusFactory,
    ProjectSubSectorFactory,
    SubstanceFactory,
)
from core.models import BPActivity
from core.models.project import MetaProject, Project, ProjectFile
from core.utils import (
    get_project_sub_code,
    get_meta_project_code,
    get_meta_project_new_code,
)


pytestmark = pytest.mark.django_db
# pylint: disable=C0302,C0415,C8008,W0221,R0912,R0913,R0913,R0914,R0915,W0613,


@pytest.fixture(name="_setup_project_list")
def setup_project_list(
    country_ro,
    agency,
    new_agency,
    new_country,
    project_type,
    new_project_type,
    project_status,
    submitted_status,
    project_draft_status,
    project_submitted_status,
    project_approved_status,
    subsector,
    meeting,
    new_meeting,
    sector,
    new_sector,
    project_cluster_kpp,
    project_cluster_kip,
):
    new_subsector = ProjectSubSectorFactory.create(sectors=[new_sector])
    projects = []
    projects_data = [
        {
            "country": country_ro,
            "agency": agency,
            "project_type": project_type,
            "status": project_status,
            "submission_status": project_draft_status,
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
            "status": submitted_status,
            "submission_status": project_submitted_status,
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
    projects.append(
        ProjectFactory.create(
            title="Project 25",
            **proj_data,
        )
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
    projects.append(
        ProjectFactory.create(
            title="Project 26",
            serial_number=26,
            **proj_data,
        )
    )

    proj_data = projects_data[0].copy()
    proj_data["production"] = True

    projects.append(
        ProjectFactory.create(
            title="Project 27",
            serial_number=27,
            **proj_data,
        )
    )

    proj_data["production"] = False
    proj_data["version"] = 2
    proj_data["submission_status"] = project_submitted_status
    projects.append(
        ProjectFactory.create(
            title="Project 28",
            serial_number=28,
            **proj_data,
        )
    )

    proj_data["version"] = 3
    proj_data["submission_status"] = project_approved_status
    projects.append(
        ProjectFactory.create(
            title="Project 29",
            serial_number=29,
            **proj_data,
        )
    )

    return projects


@pytest.fixture(name="project_file_url")
def _project_file_url(project_file):
    return reverse("project-files", args=(project_file.id,))


@pytest.fixture(name="_setup_project_create")
def setup_project_create(
    country_ro,
    new_agency,
    agency,
    project_type,
    meeting,
    subsector,
    project_cluster_kip,
    groupHCFC,
    decision,
):
    statuses_dict = [
        {"name": "N/A", "code": "NA"},
        {"name": "New submission", "code": "NEWSUB"},
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
        name="SubstanceA", odp=0.02, gwp=0.05, group=groupHCFC
    )
    blend = BlendFactory.create(
        name="Blend 1",
        composition=f"{substA.name}= 0.5",
        sort_order=1,
    )
    return {
        "ad_hoc_pcr": True,
        "agency": agency.id,
        "aggregated_consumption": 943.3,
        "baseline": 43.4,
        "bp_activity": bp_activity.id,
        "cost_effectiveness": 43.3,
        "cost_effectiveness_co2": 54.3,
        "number_of_production_lines_assisted": 3,
        "cluster": project_cluster_kip.id,
        "country": country_ro.id,
        "description": "Description",
        "date_completion": "2020-01-01",
        "decision": decision.id,
        "destruction_technology": "D1",
        "excom_provision": "test excom provision",
        "funding_window": "test funding window",
        "group": groupHCFC.id,
        "individual_consideration": False,
        "is_lvc": True,
        "is_sme": False,
        "lead_agency": new_agency.id,
        "meeting": meeting.id,
        "mya_start_date": "2023-10-01",
        "mya_end_date": "2024-09-30",
        "mya_project_funding": 1234.4,
        "mya_support_cost": 434.2,
        "number_of_enterprises": 2,
        "mya_phase_out_co2_eq_t": 948.3,
        "mya_phase_out_odp_t": 23.2,
        "mya_phase_out_mt": 3.53,
        "pcr_waived": False,
        "total_number_of_technicians_trained": 32,
        "number_of_female_technicians_trained": 12,
        "total_number_of_trainers_trained": 2,
        "number_of_female_trainers_trained": 4,
        "total_number_of_technicians_certified": 3,
        "number_of_female_technicians_certified": 65,
        "number_of_training_institutions_newly_assisted": 34,
        "number_of_tools_sets_distributed": 4,
        "total_number_of_customs_officers_trained": 23,
        "number_of_female_customs_officers_trained": 2,
        "total_number_of_nou_personnel_supported": 2,
        "number_of_female_nou_personnel_supported": 43,
        "number_of_enterprises_assisted": 43,
        "certification_system_for_technicians": True,
        "operation_of_recovery_and_recycling_scheme": False,
        "operation_of_reclamation_scheme": True,
        "establishment_of_imp_exp_licensing": False,
        "establishment_of_quota_systems": True,
        "ban_of_equipment": 2,
        "ban_of_substances": 3,
        "kwh_year_saved": 23.4,
        "meps_developed_domestic_refrigeration": True,
        "meps_developed_commercial_refrigeration": False,
        "meps_developed_residential_ac": False,
        "meps_developed_commercial_ac": True,
        "capacity_building_programmes": True,
        "ee_demonstration_project": False,
        "quantity_controlled_substances_destroyed_mt": 23.3,
        "quantity_controlled_substances_destroyed_co2_eq_t": 25.43,
        "checklist_regulations": "pr1",
        "quantity_hfc_23_by_product_generated": 23.43,
        "quantity_hfc_23_by_product_generation_rate": 12.32,
        "quantity_hfc_23_by_product_destroyed": 2.31,
        "quantity_hfc_23_by_product_emitted": 23.32,
        "production": True,
        "production_control_type": "reduction",
        "products_manufactured": "test products manufactured",
        "programme_officer": "Officer",
        "project_end_date": "2024-09-30",
        "project_start_date": "2023-10-01",
        "project_type": project_type.id,
        "sector": subsector.sectors.first().id,
        "starting_point": 543.4,
        "subsector_ids": [subsector.id],
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
                "phase_out_mt": 123.23,
                "ods_type": "production",
                "sort_order": 1,
            },
            {
                "ods_blend_id": blend.id,
                "odp": 41.41,
                "ods_replacement": "ods replacement test 2",
                "co2_mt": 543.23,
                "phase_out_mt": 223.23,
                "ods_type": "general",
                "sort_order": 2,
            },
        ],
    }


class TestProjectV2List(BaseTest):
    url = reverse("project-v2-list")

    def test_project_list_permissions(
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
        mlfs_admin_user,
        admin_user,
    ):
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
        _test_user_permissions(user, 403)
        viewer_user.agency = None
        viewer_user.save()
        _test_user_permissions(
            viewer_user, 200, 0
        )  # because user has no agency defined
        viewer_user.agency = agency_user.agency
        viewer_user.save()
        response_data = _test_user_permissions(viewer_user, 200, 9)
        for project in response_data:
            assert project["editable"] is False
        response_data = _test_user_permissions(agency_user, 200, 9)
        for project in response_data:
            assert project["agency"] == agency_user.agency.name
            if project["submission_status"] == "Draft":
                assert project["editable"] is True
            else:
                assert project["editable"] is False
        response_data = _test_user_permissions(agency_inputter_user, 200, 9)
        for project in response_data:
            assert project["agency"] == agency_inputter_user.agency.name
            if project["submission_status"] == "Draft":
                assert project["editable"] is True
            else:
                assert project["editable"] is False

        response_data = _test_user_permissions(secretariat_viewer_user, 200, 12)
        for project in response_data:
            assert project["editable"] is False
        response_data = _test_user_permissions(
            secretariat_v1_v2_edit_access_user, 200, 12
        )
        for project in response_data:
            if project["version"] < 3:
                assert project["editable"] is True
            else:
                assert project["editable"] is False
        response_data = _test_user_permissions(
            secretariat_production_v1_v2_edit_access_user, 200, 13
        )
        for project in response_data:
            if project["version"] < 3:
                assert project["editable"] is True
            else:
                assert project["editable"] is False
        response_data = _test_user_permissions(secretariat_v3_edit_access_user, 200, 12)
        for project in response_data:
            if project["version"] < 3:
                assert project["editable"] is False
            elif project["submission_status"] == "Approved":
                assert project["editable"] is False
            else:
                assert project["editable"] is True
        response_data = _test_user_permissions(
            secretariat_production_v3_edit_access_user, 200, 13
        )
        for project in response_data:
            if project["version"] < 3:
                assert project["editable"] is False
            elif project["submission_status"] == "Approved":
                assert project["editable"] is False
            else:
                assert project["editable"] is True

        response_data = _test_user_permissions(mlfs_admin_user, 200, 13)
        for project in response_data:
            if project["version"] < 3:
                assert project["editable"] is True
            elif project["submission_status"] == "Approved":
                assert project["editable"] is True
            else:
                assert project["editable"] is True

        response_data = _test_user_permissions(admin_user, 200, 13)
        for project in response_data:
            assert project["editable"] is True

    def test_project_list_agency_filter(
        self, secretariat_viewer_user, agency, new_agency, _setup_project_list
    ):
        self.client.force_authenticate(user=secretariat_viewer_user)
        response = self.client.get(self.url, {"agency_id": agency.id})
        assert response.status_code == 200
        assert len(response.data) == 8
        for project in response.data:
            assert project["agency"] == agency.name

        response = self.client.get(
            self.url, {"agency_id": f"{agency.id},{new_agency.id}"}
        )
        assert response.status_code == 200
        assert len(response.data) == 12

    def test_project_list_type_filter(
        self, secretariat_viewer_user, project_type, _setup_project_list
    ):
        self.client.force_authenticate(user=secretariat_viewer_user)
        response = self.client.get(self.url, {"project_type_id": project_type.id})
        assert response.status_code == 200
        assert len(response.data) == 8
        for project in response.data:
            assert project["project_type"]["id"] == project_type.id
            assert project["project_type"]["name"] == project_type.name
            assert project["project_type"]["code"] == project_type.code

    def test_project_list_status_filter(
        self,
        secretariat_viewer_user,
        project_status,
        submitted_status,
        _setup_project_list,
    ):
        self.client.force_authenticate(user=secretariat_viewer_user)
        response = self.client.get(self.url, {"status_id": project_status.id})
        assert response.status_code == 200
        assert len(response.data) == 8
        for project in response.data:
            assert project["status"] == project_status.name

        response = self.client.get(
            self.url, {"status_id": f"{project_status.id},{submitted_status.id}"}
        )
        assert response.status_code == 200
        assert len(response.data) == 12

    def test_project_list_submission_status_filter(
        self,
        secretariat_viewer_user,
        project_draft_status,
        project_submitted_status,
        _setup_project_list,
    ):
        self.client.force_authenticate(user=secretariat_viewer_user)

        response = self.client.get(
            self.url, {"submission_status_id": project_draft_status.id}
        )
        assert response.status_code == 200
        assert len(response.data) == 6
        for project in response.data:
            assert project["submission_status"] == project_draft_status.name

        response = self.client.get(
            self.url,
            {
                "submission_status_id": f"{project_draft_status.id},{project_submitted_status.id}"
            },
        )
        assert response.status_code == 200
        assert len(response.data) == 11

    def test_project_list_sector_filter(
        self, secretariat_viewer_user, sector, new_sector, _setup_project_list
    ):
        self.client.force_authenticate(user=secretariat_viewer_user)

        response = self.client.get(self.url, {"sector_id": sector.id})
        assert response.status_code == 200
        assert len(response.data) == 7
        for project in response.data:
            assert project["sector"]["id"] == sector.id
            assert project["sector"]["name"] == sector.name
            assert project["sector"]["code"] == sector.code

        response = self.client.get(
            self.url, {"sector_id": f"{sector.id},{new_sector.id}"}
        )
        assert response.status_code == 200
        assert len(response.data) == 11

    def test_project_list_subsector_filter(
        self, secretariat_viewer_user, subsector, _setup_project_list
    ):
        self.client.force_authenticate(user=secretariat_viewer_user)

        response = self.client.get(self.url, {"subsectors": [subsector.id]})
        assert response.status_code == 200
        assert len(response.data) == 7
        for project in response.data:
            assert project["subsectors"] == [ProjectSubSectorSerializer(subsector).data]

    def test_project_list_subs_type_filter(
        self, secretariat_viewer_user, _setup_project_list
    ):
        self.client.force_authenticate(user=secretariat_viewer_user)

        response = self.client.get(self.url, {"substance_type": "HCFC"})
        assert response.status_code == 200
        assert len(response.data) == 8
        for project in response.data:
            assert project["substance_type"] == "HCFC"

    def test_project_list_meet_filter(
        self, secretariat_viewer_user, new_meeting, _setup_project_list, meeting
    ):
        self.client.force_authenticate(user=secretariat_viewer_user)

        response = self.client.get(self.url, {"meeting_id": meeting.id})
        assert response.status_code == 200
        assert len(response.data) == 8
        for project in response.data:
            assert project["meeting"] == meeting.number

        response = self.client.get(
            self.url, {"meeting_id": f"{new_meeting.id},{meeting.id}"}
        )
        assert response.status_code == 200
        assert len(response.data) == 12

    def test_project_list_country_filter(
        self, secretariat_viewer_user, country_ro, _setup_project_list
    ):
        self.client.force_authenticate(user=secretariat_viewer_user)

        response = self.client.get(self.url, {"country_id": country_ro.id})
        assert response.status_code == 200
        assert len(response.data) == 8
        for project in response.data:
            assert project["country"] == country_ro.name

    def test_project_list_search_filter(
        self, secretariat_viewer_user, _setup_project_list
    ):
        self.client.force_authenticate(user=secretariat_viewer_user)

        response = self.client.get(self.url, {"search": "Project 26"})
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["title"] == "Project 26"


class TestProjectsRetrieve:
    client = APIClient()

    def test_projest_retrieve_permissions(
        self,
        project,
        new_agency,
        project_url,
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
    ):
        def _test_user_permissions(user, expected_response_status):
            self.client.force_authenticate(user=user)
            response = self.client.get(project_url)
            assert response.status_code == expected_response_status
            if expected_response_status == 200:
                assert response.data["id"] == project.id
            return response.data

        # test with unauthenticated user
        response = self.client.get(project_url)
        assert response.status_code == 403

        _test_user_permissions(user, 403)
        viewer_user.agency = agency_user.agency
        viewer_user.save()
        _test_user_permissions(viewer_user, 200)
        _test_user_permissions(agency_user, 200)
        _test_user_permissions(agency_inputter_user, 200)
        _test_user_permissions(secretariat_viewer_user, 200)
        _test_user_permissions(secretariat_v1_v2_edit_access_user, 200)
        _test_user_permissions(secretariat_production_v1_v2_edit_access_user, 200)
        _test_user_permissions(secretariat_v3_edit_access_user, 200)
        _test_user_permissions(secretariat_production_v3_edit_access_user, 200)
        _test_user_permissions(admin_user, 200)

        project.agency = new_agency
        project.save()

        # test project is not visible to other agency users
        _test_user_permissions(viewer_user, 404)
        _test_user_permissions(agency_user, 404)
        _test_user_permissions(agency_inputter_user, 404)

    def test_project_get(self, secretariat_viewer_user, project_url, project):
        self.client.force_authenticate(user=secretariat_viewer_user)
        response = self.client.get(project_url)
        assert response.status_code == 200
        assert response.data["id"] == project.id
        assert response.data["substance_category"] == "Production"
        assert response.data["latest_file"] is None

    def test_project_files_get(
        self, secretariat_viewer_user, project_url, project_file
    ):
        self.client.force_authenticate(user=secretariat_viewer_user)
        response = self.client.get(project_url)
        assert response.status_code == 200
        assert response.data["latest_file"]["id"] == project_file.id
        assert response.data["latest_file"]["name"] == project_file.file.name


class TestCreateProjects(BaseTest):
    url = reverse("project-v2-list")

    def test_create_project_permissions(
        self,
        _setup_project_create,
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
    ):
        # test with unauthenticated user

        def _test_user_permissions(user, expected_response_status):
            self.client.force_authenticate(user=user)
            response = self.client.post(self.url, _setup_project_create, format="json")
            assert response.status_code == expected_response_status, response.data

        response = self.client.post(self.url, _setup_project_create, format="json")
        assert response.status_code == 403, response.data

        _test_user_permissions(user, 403)
        _test_user_permissions(viewer_user, 403)
        _test_user_permissions(agency_user, 201)
        _test_user_permissions(agency_inputter_user, 201)
        _test_user_permissions(secretariat_viewer_user, 403)
        _test_user_permissions(secretariat_v1_v2_edit_access_user, 201)
        _test_user_permissions(secretariat_production_v1_v2_edit_access_user, 201)
        _test_user_permissions(secretariat_v3_edit_access_user, 403)
        _test_user_permissions(secretariat_production_v3_edit_access_user, 403)
        _test_user_permissions(admin_user, 201)

    def _test_response_data(self, response, data):
        fields = [
            "ad_hoc_pcr",
            "aggregated_consumption",
            "baseline",
            "bp_activity",
            "cost_effectiveness",
            "cost_effectiveness_co2",
            "number_of_production_lines_assisted",
            "description",
            "date_completion",
            "destruction_technology",
            "excom_provision",
            "funding_window",
            "individual_consideration",
            "is_lvc",
            "mya_start_date",
            "mya_end_date",
            "mya_project_funding",
            "mya_support_cost",
            "number_of_enterprises",
            "mya_phase_out_co2_eq_t",
            "mya_phase_out_odp_t",
            "mya_phase_out_mt",
            "pcr_waived",
            "total_number_of_technicians_trained",
            "number_of_female_technicians_trained",
            "total_number_of_trainers_trained",
            "number_of_female_trainers_trained",
            "total_number_of_technicians_certified",
            "number_of_female_technicians_certified",
            "number_of_training_institutions_newly_assisted",
            "number_of_tools_sets_distributed",
            "total_number_of_customs_officers_trained",
            "number_of_female_customs_officers_trained",
            "total_number_of_nou_personnel_supported",
            "number_of_female_nou_personnel_supported",
            "number_of_enterprises_assisted",
            "certification_system_for_technicians",
            "operation_of_recovery_and_recycling_scheme",
            "operation_of_reclamation_scheme",
            "establishment_of_imp_exp_licensing",
            "establishment_of_quota_systems",
            "ban_of_equipment",
            "ban_of_substances",
            "kwh_year_saved",
            "meps_developed_domestic_refrigeration",
            "meps_developed_commercial_refrigeration",
            "meps_developed_residential_ac",
            "meps_developed_commercial_ac",
            "capacity_building_programmes",
            "ee_demonstration_project",
            "quantity_controlled_substances_destroyed_mt",
            "quantity_controlled_substances_destroyed_co2_eq_t",
            "quantity_hfc_23_by_product_generated",
            "quantity_hfc_23_by_product_generation_rate",
            "quantity_hfc_23_by_product_destroyed",
            "quantity_hfc_23_by_product_emitted",
            "products_manufactured",
            "programme_officer",
            "project_end_date",
            "project_start_date",
            "starting_point",
            "support_cost_psc",
            "tranche",
            "targets",
            "title",
            "total_fund",
        ]
        for field in fields:
            if field == "bp_activity":
                assert response.data[field]["id"] == data[field]
            else:
                assert response.data[field] == data[field]

    def test_create_project(
        self,
        agency_inputter_user,
        country_ro,
        agency,
        new_agency,
        project2,
        project_type,
        subsector,
        meeting,
        project_cluster_kip,
        _setup_project_create,
        decision,
    ):
        data = _setup_project_create

        # check that passing an associated project results in assigning
        # its meta_project to the new project
        data["associate_project_id"] = project2.id
        self.client.force_authenticate(user=agency_inputter_user)

        # create project
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 201, response.data
        self._test_response_data(response, data)
        assert response.data["agency"] == agency.name
        assert response.data["cluster"]["id"] == data["cluster"]
        assert response.data["country"] == country_ro.name
        assert response.data["checklist_regulations"] == "PR1"
        assert response.data["decision_id"] == decision.id
        assert response.data["destruction_technology"] == "D1"
        assert response.data["group_id"] == data["group"]
        assert response.data["meeting_id"] == data["meeting"]
        assert response.data["project_type"]["id"] == data["project_type"]
        assert response.data["project_type"]["id"] == project_type.id
        assert response.data["project_type"]["name"] == project_type.name
        assert response.data["project_type"]["code"] == project_type.code
        assert response.data["production_control_type"] == "Reduction"
        assert response.data["production"] is True
        assert response.data["sector_id"] == data["sector"]
        sector = subsector.sectors.first()
        assert response.data["sector"]["id"] == sector.id
        assert response.data["sector"]["name"] == sector.name
        assert response.data["sector"]["code"] == sector.code
        assert response.data["is_sme"] == "Non-SME"
        assert response.data["starting_point"] == data["starting_point"]
        assert response.data["subsectors"] == [
            ProjectSubSectorSerializer(subsector).data
        ]
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
        assert (
            response.data["ods_odp"][0]["phase_out_mt"]
            == data["ods_odp"][0]["phase_out_mt"]
        )
        assert response.data["ods_odp"][0]["ods_type"] == "Production"
        assert (
            response.data["ods_odp"][0]["sort_order"]
            == data["ods_odp"][0]["sort_order"]
        )
        assert response.data["ods_odp"][1]["ods_substance_id"] is None
        assert (
            response.data["ods_odp"][1]["ods_blend_id"]
            == data["ods_odp"][1]["ods_blend_id"]
        )
        assert response.data["ods_odp"][1]["odp"] == data["ods_odp"][1]["odp"]

        assert (
            response.data["ods_odp"][1]["ods_replacement"]
            == data["ods_odp"][1]["ods_replacement"]
        )
        assert response.data["ods_odp"][1]["co2_mt"] == data["ods_odp"][1]["co2_mt"]
        assert (
            response.data["ods_odp"][1]["phase_out_mt"]
            == data["ods_odp"][1]["phase_out_mt"]
        )
        assert response.data["ods_odp"][1]["ods_type"] == "General"
        assert (
            response.data["ods_odp"][1]["sort_order"]
            == data["ods_odp"][1]["sort_order"]
        )
        assert response.data["status"] == "New submission"
        assert response.data["submission_status"] == "Draft"

        assert (
            response.data["code"] is None
        )  # code should be sent to FE as None till approved

        project = Project.objects.get(id=response.data["id"])
        project2.refresh_from_db()
        assert project.meta_project == project2.meta_project
        assert project.component
        assert project.component == project2.component

    def test_create_project_history(
        self,
        agency_inputter_user,
        _setup_project_create,
    ):
        from core.api.serializers.project_v2 import HISTORY_DESCRIPTION_CREATE

        data = _setup_project_create
        self.client.force_authenticate(user=agency_inputter_user)
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 201, response.data

        # check history items in get records
        history = response.data["history"]
        assert len(history) == 1

        history_item = history[0]
        assert history_item["description"] == HISTORY_DESCRIPTION_CREATE

        history_item_user = history_item["user"]
        assert history_item_user["username"] == agency_inputter_user.username
        assert history_item_user["email"] == agency_inputter_user.email
        assert history_item_user["first_name"] == agency_inputter_user.first_name
        assert history_item_user["last_name"] == agency_inputter_user.last_name

    def test_create_project_project_fk(
        self, agency_inputter_user, _setup_project_create
    ):
        data = _setup_project_create
        self.client.force_authenticate(user=agency_inputter_user)
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

    def test_meta_project_creation(
        self,
        agency,
        new_agency,
        new_country,
        meeting,
        country_ro,
        project_cluster_kpp,
        project_cluster_kip,
        project_closed_status,
        project_ongoing_status,
        project_type,
        sector,
        subsector,
        admin_user,
        _setup_project_create,
    ):
        data = {
            "cluster": project_cluster_kip.id,
            "country": country_ro.id,
            "meeting": meeting.id,
            "agency": agency.id,
            "lead_agency": agency.id,
            "sector": sector.id,
            "subsector_ids": [],
            "project_type": project_type.id,
            "title": "Meta Project Test",
            "description": "This is a test meta project",
        }

        # setup objects
        meta_project = MetaProjectFactory.create(
            lead_agency=agency,
        )
        project = ProjectFactory.create(
            title="Project test 1",
            cluster=project_cluster_kip,
            agency=agency,
            country=country_ro,
            status=project_closed_status,
        )
        project.meta_project = meta_project
        project.save()
        meta_project.new_code = get_meta_project_new_code([project])
        meta_project.code = get_meta_project_code(country_ro, project_cluster_kip)
        meta_project.save()

        # create project and expect a new meta project to be created
        # as the meta project does not have a project with a different status from closed
        self.client.force_authenticate(user=admin_user)
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 201, response.data
        created_meta_project_id = response.data["meta_project"]["id"]
        # created a new meta project
        assert MetaProject.objects.count() == 2

        # remove created meta project
        MetaProject.objects.filter(id=created_meta_project_id).delete()

        # add an ongoing project to the existing meta project
        project2 = ProjectFactory.create(
            title="Project test 2",
            cluster=project_cluster_kip,
            agency=agency,
            country=country_ro,
            status=project_ongoing_status,
        )
        project2.meta_project = meta_project
        project2.save()
        meta_project.new_code = get_meta_project_new_code([project, project2])
        meta_project.save()

        response = self.client.post(self.url, data, format="json")

        assert response.status_code == 201, response.data
        assert MetaProject.objects.count() == 1  # no new meta project created
        assert (
            response.data["meta_project"]["id"] == meta_project.id
        )  # meta project is used now

        # test warning message
        project3 = ProjectFactory.create(
            title="Project test 3",
            cluster=project_cluster_kip,
            agency=agency,
            country=country_ro,
            status=project_ongoing_status,
        )
        meta_project2 = MetaProjectFactory.create(
            lead_agency=agency,
        )
        project3.meta_project = meta_project2
        project3.save()
        meta_project2.new_code = get_meta_project_new_code([project3])
        meta_project2.code = get_meta_project_code(
            new_country, project_cluster_kip, new_agency
        )
        meta_project2.save()
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 201, response.data
        assert response.data["warnings"] == [
            "Multiple meta projects found for the same country and cluster. Using the first one found."
        ]


class TestProjectsV2Update:
    client = APIClient()

    def test_update_project_permissions(
        self,
        _setup_project_create,
        user,
        project,
        project_url,
        viewer_user,
        agency_user,
        new_agency,
        agency_inputter_user,
        secretariat_viewer_user,
        secretariat_v1_v2_edit_access_user,
        secretariat_production_v1_v2_edit_access_user,
        secretariat_v3_edit_access_user,
        secretariat_production_v3_edit_access_user,
        admin_user,
    ):
        def _test_user_permissions(user, expected_response_status):
            self.client.force_authenticate(user=user)
            response = self.client.patch(project_url, {"title": "Into the Spell"})
            assert response.status_code == expected_response_status, response.data

        response = self.client.patch(project_url, {"title": "Into the Spell"})
        assert response.status_code == 403, response.data

        def _test_permissions_for_different_project_agency(
            user,
            own_agency_response_status,
            different_agency_response_status,
            lead_agency_response_status,
        ):
            project.agency = user.agency
            project.save()
            _test_user_permissions(user, own_agency_response_status)
            project.agency = new_agency
            project.save()
            project.meta_project.lead_agency = None
            project.meta_project.save()
            _test_user_permissions(user, different_agency_response_status)
            project.meta_project.lead_agency = user.agency
            project.meta_project.save()
            _test_user_permissions(user, lead_agency_response_status)

        _test_user_permissions(user, 403)
        viewer_user.agency = agency_user.agency
        viewer_user.save()
        _test_permissions_for_different_project_agency(viewer_user, 403, 403, 403)
        _test_permissions_for_different_project_agency(agency_user, 200, 404, 200)
        _test_permissions_for_different_project_agency(
            agency_inputter_user, 200, 404, 200
        )
        secretariat_viewer_user.agency = agency_user.agency
        secretariat_viewer_user.save()
        _test_permissions_for_different_project_agency(
            secretariat_viewer_user, 403, 403, 403
        )
        secretariat_v1_v2_edit_access_user.agency = agency_user.agency
        secretariat_v1_v2_edit_access_user.save()
        _test_permissions_for_different_project_agency(
            secretariat_v1_v2_edit_access_user, 200, 200, 200
        )
        secretariat_production_v1_v2_edit_access_user.agency = agency_user.agency
        secretariat_production_v1_v2_edit_access_user.save()
        _test_permissions_for_different_project_agency(
            secretariat_production_v1_v2_edit_access_user, 200, 200, 200
        )

        # those return 404 because even if those users have edit access, they only have it for v3 projects
        secretariat_v3_edit_access_user.agency = agency_user.agency
        secretariat_v3_edit_access_user.save()
        _test_permissions_for_different_project_agency(
            secretariat_v3_edit_access_user, 404, 404, 404
        )
        secretariat_production_v3_edit_access_user.agency = agency_user.agency
        secretariat_production_v3_edit_access_user.save()
        _test_permissions_for_different_project_agency(
            secretariat_production_v3_edit_access_user, 404, 404, 404
        )
        _test_user_permissions(admin_user, 200)

    def test_project_update(self, agency_user, new_agency, project_url, project):
        self.client.force_authenticate(user=agency_user)
        update_data = {
            "title": "Into the Spell",
            "agency": new_agency.id,
            "production": True,
        }
        response = self.client.patch(project_url, update_data, format="json")
        assert response.status_code == 200, response.data

        project.refresh_from_db()
        assert project.title == "Into the Spell"
        assert project.production is True
        assert project.code == get_project_sub_code(
            project.country,
            project.cluster,
            new_agency,
            project.project_type,
            project.sector,
            project.meeting,
            None,
            project.serial_number,
        )

    # TODO: test ods_odp create/delete

    def test_project_patch_ods_odp(
        self,
        agency_user,
        project_url,
        project,
        project_ods_odp_subst,
        substance_hcfc,
    ):
        ods_odp_to_delete = ProjectOdsOdpFactory.create(
            project=project,
            ods_substance_id=substance_hcfc.id,
            odp=0.02,
        )
        blend = BlendFactory.create(
            name="test blend", sort_order=1, composition=f"{substance_hcfc.name}=100"
        )
        self.client.force_authenticate(user=agency_user)
        update_data = {
            "title": "Crocodile wearing a vest",
            "ods_odp": [
                {
                    "odp": 0.01,
                    "ods_replacement": "test replacement",
                },
                {
                    "id": project_ods_odp_subst.id,
                    "ods_substance_id": None,
                    "ods_blend_id": blend.id,
                    "odp": project_ods_odp_subst.odp + 5,
                },
            ],
        }
        response = self.client.patch(project_url, update_data, format="json")
        assert response.status_code == 200, response.data

        project.refresh_from_db()
        assert project.title == "Crocodile wearing a vest"
        assert project.ods_odp.count() == 2
        assert project.ods_odp.filter(id=ods_odp_to_delete.id).count() == 0
        # This test copied from v1 where it was not supposed to actually
        # update ods_odp, in our case it does update it.
        assert project.ods_odp.first().odp == project_ods_odp_subst.odp + 5
        assert project.ods_odp.first().ods_substance_id is None
        assert project.ods_odp.first().ods_blend_id == blend.id
        assert project.ods_odp.last().odp == update_data["ods_odp"][0]["odp"]

    def test_project_update_history(
        self, agency_inputter_user, agency_user, _setup_project_create
    ):
        from core.api.serializers.project_v2 import HISTORY_DESCRIPTION_UPDATE

        data = _setup_project_create
        self.client.force_authenticate(user=agency_inputter_user)
        response = self.client.post(TestCreateProjects.url, data, format="json")
        assert response.status_code == 201, response.data

        self.client.force_authenticate(user=agency_user)

        update_data = {
            "title": "Into the Spell",
        }
        project_url = reverse("project-v2-detail", args=(response.data["id"],))
        response = self.client.patch(project_url, update_data, format="json")
        assert response.status_code == 200, response.data

        # check history items in get records
        history = response.data["history"]
        assert len(history) > 1

        history_item = history[0]
        assert history_item["description"] == HISTORY_DESCRIPTION_UPDATE

        history_item_user = history_item["user"]
        assert history_item_user["username"] == agency_user.username
        assert history_item_user["email"] == agency_user.email
        assert history_item_user["first_name"] == agency_user.first_name
        assert history_item_user["last_name"] == agency_user.last_name

    def test_edit_approval_fields_permissions(
        self,
        project,
        user,
        viewer_user,
        agency_user,
        meeting,
        decision,
        agency_inputter_user,
        secretariat_viewer_user,
        secretariat_v1_v2_edit_access_user,
        secretariat_production_v1_v2_edit_access_user,
        secretariat_v3_edit_access_user,
        secretariat_production_v3_edit_access_user,
        admin_user,
    ):
        url = reverse("project-v2-edit-approval-fields", args=(project.id,))
        data = {
            "meeting_approved": meeting.id,
            "decision": decision.id,
        }

        def _test_user_permissions(user, expected_response_status):
            self.client.force_authenticate(user=user)
            response = self.client.put(url, data, format="json")
            assert response.status_code == expected_response_status

        # Unauthenticated
        self.client.force_authenticate(user=None)
        response = self.client.put(url, data, format="json")
        assert response.status_code == 403

        _test_user_permissions(user, 403)
        _test_user_permissions(viewer_user, 403)
        _test_user_permissions(agency_user, 403)
        _test_user_permissions(agency_inputter_user, 403)
        _test_user_permissions(secretariat_viewer_user, 403)
        _test_user_permissions(secretariat_v1_v2_edit_access_user, 403)
        _test_user_permissions(secretariat_production_v1_v2_edit_access_user, 403)
        _test_user_permissions(secretariat_v3_edit_access_user, 200)
        _test_user_permissions(secretariat_production_v3_edit_access_user, 200)
        _test_user_permissions(admin_user, 200)

    def test_edit_approval_fields_success(
        self,
        secretariat_v3_edit_access_user,
        meeting,
        decision,
        substance,
        project,
    ):
        url = reverse("project-v2-edit-approval-fields", args=(project.id,))
        data = {
            "meeting_approved": meeting.id,
            "decision": decision.id,
            "excom_provision": "test excom_provision",
            "date_completion": "2023-10-01",
            "total_fund": 12345.54,
            "support_cost_psc": 1232.43,
            "programme_officer": "test officer",
            "ods_odp": [
                {
                    "ods_substance_id": substance.id,
                    "odp": 0.05,
                    "ods_replacement": "test replacement",
                    "co2_mt": 100.0,
                    "phase_out_mt": 50.0,
                    "sort_order": 1,
                },
            ],
            "pcr_waived": True,
            "ad_hoc_pcr": False,
        }
        self.client.force_authenticate(user=secretariat_v3_edit_access_user)
        response = self.client.put(url, data, format="json")
        assert response.status_code == 200
        assert response.data["meeting_id"] == meeting.id
        assert response.data["decision_id"] == decision.id
        assert response.data["excom_provision"] == data["excom_provision"]
        assert response.data["date_completion"] == data["date_completion"]
        assert response.data["total_fund"] == data["total_fund"]
        assert response.data["support_cost_psc"] == data["support_cost_psc"]
        assert response.data["programme_officer"] == data["programme_officer"]
        assert len(response.data["ods_odp"]) == 1
        assert response.data["ods_odp"][0]["ods_substance_id"] == substance.id
        assert response.data["ods_odp"][0]["odp"] == data["ods_odp"][0]["odp"]
        assert (
            response.data["ods_odp"][0]["ods_replacement"]
            == data["ods_odp"][0]["ods_replacement"]
        )
        assert response.data["ods_odp"][0]["co2_mt"] == data["ods_odp"][0]["co2_mt"]
        assert (
            response.data["ods_odp"][0]["phase_out_mt"]
            == data["ods_odp"][0]["phase_out_mt"]
        )
        assert (
            response.data["ods_odp"][0]["sort_order"]
            == data["ods_odp"][0]["sort_order"]
        )
        assert response.data["pcr_waived"] is True
        assert response.data["ad_hoc_pcr"] is False
        assert response.data["date_approved"] == meeting.end_date


class TestProjectFiles:
    client = APIClient()

    def test_file_upload_permissions(
        self,
        agency_inputter_user,
        project,
        new_agency,
        test_file1,
        test_file2,
        user,
        viewer_user,
        agency_user,
        secretariat_viewer_user,
        secretariat_v1_v2_edit_access_user,
        secretariat_production_v1_v2_edit_access_user,
        secretariat_v3_edit_access_user,
        secretariat_production_v3_edit_access_user,
        admin_user,
    ):
        url = reverse("project-files-v2", args=(project.id,))
        data = {"files": [test_file1.open(), test_file2.open()]}

        def _test_user_permissions(
            user,
            expected_post_response_status,
            expected_get_response_status,
            expected_delete_response_status,
        ):
            self.client.force_authenticate(user=user)
            response = self.client.post(url, data, format="multipart")
            assert response.status_code == expected_post_response_status
            if expected_post_response_status == 201:
                ProjectFile.objects.filter(project=project).delete()
            response = self.client.get(url)
            assert response.status_code == expected_get_response_status

            if expected_get_response_status == 200:
                delete_data = {"file_ids": [entry["id"] for entry in response.data]}
            else:
                delete_data = {"file_ids": []}

            if expected_get_response_status == 200:
                if len(response.data) > 0:
                    download_url = reverse(
                        "project-files-v2-download",
                        args=(
                            response.data[0]["project_id"],
                            response.data[0]["id"],
                        ),
                    )
                    response = self.client.get(download_url)
                    assert response.status_code == 200

            response = self.client.delete(url, delete_data, format="json")
            assert response.status_code == expected_delete_response_status

        # test with unauthenticated user
        self.client.force_authenticate(user=None)
        response = self.client.post(url, data, format="multipart")
        assert response.status_code == 403
        response = self.client.get(url)
        assert response.status_code == 403
        response = self.client.delete(url)
        assert response.status_code == 403

        _test_user_permissions(user, 403, 403, 403)
        _test_user_permissions(viewer_user, 403, 200, 403)
        _test_user_permissions(agency_user, 201, 200, 204)
        _test_user_permissions(agency_inputter_user, 201, 200, 204)
        _test_user_permissions(secretariat_viewer_user, 403, 200, 403)
        _test_user_permissions(secretariat_v1_v2_edit_access_user, 201, 200, 204)
        _test_user_permissions(
            secretariat_production_v1_v2_edit_access_user, 201, 200, 204
        )

        _test_user_permissions(secretariat_v3_edit_access_user, 404, 200, 404)
        _test_user_permissions(
            secretariat_production_v3_edit_access_user, 404, 200, 404
        )
        _test_user_permissions(admin_user, 201, 200, 204)

        project.agency = new_agency
        project.save()

        _test_user_permissions(agency_user, 404, 404, 404)
        _test_user_permissions(agency_inputter_user, 404, 404, 404)

    def test_file_upload_wrong_extension(
        self, agency_inputter_user, project, test_file1, test_file2, wrong_format_file3
    ):
        self.client.force_authenticate(user=agency_inputter_user)
        url = reverse("project-files-v2", args=(project.id,))

        # upload file with wrong extension
        data = {
            "files": [test_file1.open(), test_file2.open(), wrong_format_file3.open()]
        }
        response = self.client.post(url, data, format="multipart")
        assert response.status_code == 400
        assert response.data == {"file": "File extension .csv is not valid"}

    def test_file_validation_endpoint(
        self, agency_inputter_user, test_file1, test_file2, wrong_format_file3
    ):
        self.client.force_authenticate(user=agency_inputter_user)
        url = reverse("project-files-validation")

        # upload file with wrong extension
        data = {
            "files": [test_file1.open(), test_file2.open(), wrong_format_file3.open()]
        }
        response = self.client.post(url, data, format="multipart")
        assert response.status_code == 400
        assert response.data == {"file": "File extension .csv is not valid"}

        self.client.force_authenticate(user=agency_inputter_user)
        url = reverse("project-files-validation")

        # upload file
        data = {"files": [test_file1.open(), test_file2.open()]}
        response = self.client.post(url, data, format="multipart")
        assert response.status_code == 200
        assert ProjectFile.objects.all().count() == 0

    def test_file_upload_duplicate(
        self, agency_inputter_user, project, test_file1, test_file2
    ):
        self.client.force_authenticate(user=agency_inputter_user)
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

    def test_file_upload(self, agency_inputter_user, project, test_file1, test_file2):
        self.client.force_authenticate(user=agency_inputter_user)
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

    def test_file_download(self, agency_inputter_user, project, test_file1):
        self.client.force_authenticate(user=agency_inputter_user)
        url = reverse("project-files-v2", args=(project.id,))

        # upload file
        data = {"files": [test_file1.open()]}
        response = self.client.post(url, data, format="multipart")
        assert response.status_code == 201

        # download file
        my_file = ProjectFile.objects.get(filename=test_file1.name)
        url = reverse(
            "project-files-v2-download",
            args=(
                my_file.project.id,
                my_file.id,
            ),
        )
        response = self.client.get(url)

        assert response.status_code == 200
        assert response.content == my_file.file.read()


class TestProjectV2FileIncludePreviousVersions:
    client = APIClient()

    def _prepare_projects_with_files(
        self, project, project2, project_file, project2_file, project3, project3_file
    ):
        project.version = 3
        project.save()
        project2.version = 2
        project2.meta_project = project.meta_project
        project2.latest_project = project
        project2.save()
        project3.version = 1
        project3.meta_project = project.meta_project
        project3.latest_project = project
        project3.save()
        project_file.project = project
        project_file.save()
        project2_file.project = project2
        project2_file.save()
        project3_file.project = project3
        project3_file.save()

    def test_permissions(
        self,
        project,
        project_file,
        project2,
        project2_file,
        project3,
        project3_file,
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
    ):
        url = reverse("project-v2-file-include-previous-versions", args=(project.id,))
        self._prepare_projects_with_files(
            project, project2, project_file, project2_file, project3, project3_file
        )

        def _test_user_permissions(user, expected_response_status):
            self.client.force_authenticate(user=user)
            response = self.client.get(url)
            assert response.status_code == expected_response_status
            return response.data

        # Unauthenticated
        self.client.force_authenticate(user=None)
        response = self.client.get(url)
        assert response.status_code == 403

        # Authenticated users
        _test_user_permissions(user, 403)
        _test_user_permissions(viewer_user, 200)
        _test_user_permissions(agency_user, 200)
        _test_user_permissions(agency_inputter_user, 200)
        _test_user_permissions(secretariat_viewer_user, 200)
        _test_user_permissions(secretariat_v1_v2_edit_access_user, 200)
        _test_user_permissions(secretariat_production_v1_v2_edit_access_user, 200)
        _test_user_permissions(secretariat_v3_edit_access_user, 200)
        _test_user_permissions(secretariat_production_v3_edit_access_user, 200)
        _test_user_permissions(admin_user, 200)

    def test_endpoint_returns_files_grouped_by_project_and_version(
        self,
        secretariat_v1_v2_edit_access_user,
        project,
        project2,
        project_file,
        project2_file,
        project3,
        project3_file,
    ):
        url = reverse("project-v2-file-include-previous-versions", args=(project.id,))
        self._prepare_projects_with_files(
            project, project2, project_file, project2_file, project3, project3_file
        )
        self.client.force_authenticate(user=secretariat_v1_v2_edit_access_user)

        response = self.client.get(url)
        assert response.status_code == 200
        data = response.data
        assert len(data) == 3
        assert data[0]["id"] == project.id
        assert data[1]["id"] == project2.id
        assert data[2]["id"] == project3.id

        for entry in data:
            if entry["id"] == project.id:
                assert any(f["id"] == project_file.id for f in entry["files"])
            if entry["id"] == project2.id:
                assert any(f["id"] == project2_file.id for f in entry["files"])
            if entry["id"] == project3.id:
                assert any(f["id"] == project3_file.id for f in entry["files"])

    def test_only_one_project(
        self,
        secretariat_v1_v2_edit_access_user,
        project,
        project_file,
        project2,
        project2_file,
        project3,
        project3_file,
    ):
        self._prepare_projects_with_files(
            project, project2, project_file, project2_file, project3, project3_file
        )
        url = reverse("project-v2-file-include-previous-versions", args=(project3.id,))
        self.client.force_authenticate(user=secretariat_v1_v2_edit_access_user)

        response = self.client.get(url)
        assert response.status_code == 200
        data = response.data
        assert len(data) == 1
        assert data[0]["id"] == project3.id
        assert any(f["id"] == project3_file.id for f in data[0]["files"])

    def test_project_version2_retrival(
        self,
        secretariat_v1_v2_edit_access_user,
        project,
        project2,
        project_file,
        project2_file,
        project3,
        project3_file,
    ):
        self._prepare_projects_with_files(
            project, project2, project_file, project2_file, project3, project3_file
        )
        url = reverse("project-v2-file-include-previous-versions", args=(project2.id,))
        self.client.force_authenticate(user=secretariat_v1_v2_edit_access_user)

        response = self.client.get(url)
        assert response.status_code == 200
        data = response.data
        assert len(data) == 2
        assert data[0]["id"] == project2.id  # project2 is the latest version
        assert data[1]["id"] == project3.id  # project3 is the archived version
        assert any(f["id"] == project2_file.id for f in data[0]["files"])
        assert any(f["id"] == project3_file.id for f in data[1]["files"])
