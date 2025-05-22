import pytest
from django.urls import reverse
from core.api.tests.base import BaseTest

from core.api.tests.factories import (
    ProjectClusterFactory,
    ProjectSpecificFieldsFactory,
    MeetingFactory,
    ProjectFactory,
    ProjectFieldFactory,
    ProjectSectorFactory,
    ProjectSubSectorFactory,
    ProjectTypeFactory,
    RbmMeasureFactory,
    SubstanceFactory,
)
from core.models.project_metadata import ProjectSector, ProjectSubSector


pytestmark = pytest.mark.django_db
# pylint: disable=C8008,W0221


class TestProjectsStatus(BaseTest):
    url = reverse("project-status-list")

    def test_project_status_list_user(self, viewer_user, project_status):
        self.client.force_authenticate(user=viewer_user)

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


@pytest.fixture(name="_setup_project_sector_list")
def setup_project_sector_list():
    ProjectSectorFactory.create(name="Sector0", code="SEC0", sort_order=0)
    ProjectSectorFactory.create(name="Sector2", code="SEC2", sort_order=2)
    ProjectSectorFactory.create(
        name="Sector4", code="SEC4", is_custom=True, sort_order=3
    )


class TestProjectSectorList(BaseTest):
    url = reverse("projectsector-list")

    def test_project_sector_list_user(
        self, viewer_user, sector, _setup_project_sector_list
    ):
        self.client.force_authenticate(user=viewer_user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 3
        assert response.data[1] == {
            "id": sector.id,
            "name": sector.name,
            "code": sector.code,
            "sort_order": sector.sort_order,
            "allowed_types": [],
        }


@pytest.fixture(name="_setup_sector_create")
def setup_sector_create(_setup_project_sector_list):
    return {
        "name": "Sectoru la Smecheri",
    }


class TestProjectSectorCreate(BaseTest):
    url = reverse("projectsector-list")

    def test_without_login(self, _setup_sector_create):
        self.client.force_authenticate(user=None)
        response = self.client.post(self.url, data=_setup_sector_create)
        assert response.status_code == 403

    def test_without_permission(self, country_user, _setup_sector_create):
        self.client.force_authenticate(user=country_user)
        response = self.client.post(self.url, data=_setup_sector_create)
        assert response.status_code == 403

    def test_create_as_viewer(self, viewer_user, _setup_sector_create):
        self.client.force_authenticate(user=viewer_user)
        response = self.client.post(self.url, data=_setup_sector_create)
        assert response.status_code == 403

    def test_create_with_code(self, agency_user, _setup_sector_create):
        self.client.force_authenticate(user=agency_user)

        data = {
            **_setup_sector_create,
            "code": "NOSMECH",
        }
        response = self.client.post(self.url, data=data)
        assert response.status_code == 201
        assert response.data["name"] == "Sectoru la Smecheri"
        assert response.data["code"] == f"CUST{response.data['id']}"

    def test_create_duplicate_sector(self, agency_user, sector):
        self.client.force_authenticate(user=agency_user)

        response = self.client.post(
            self.url, data={"name": sector.name, "code": sector.code}
        )
        assert response.status_code == 201
        assert response.data == {
            "id": sector.id,
            "name": sector.name,
            "code": sector.code,
            "sort_order": sector.sort_order,
            "allowed_types": [],
        }

        sect_co = ProjectSector.objects.count()
        assert sect_co == 1

    def test_create_sector(self, user, _setup_sector_create):
        self.client.force_authenticate(user=user)

        response = self.client.post(self.url, data=_setup_sector_create)
        assert response.status_code == 201
        assert response.data["name"] == "Sectoru la Smecheri"
        assert response.data["code"] == f"CUST{response.data['id']}"


@pytest.fixture(name="_setup_project_subsector_list")
def setup_project_subsector_list(sector):
    ProjectSubSectorFactory.create(
        name="Subsector0", code="SUBSEC0", sort_order=0, sector=sector
    )
    ProjectSubSectorFactory.create(
        name="Subsector2", code="SUBSEC2", sort_order=2, sector=sector
    )
    ProjectSubSectorFactory.create(
        name="Subsector3", code="SUBSEC3", sort_order=3, sector=sector, is_custom=True
    )


class TestProjectSubsectorList(BaseTest):
    url = reverse("projectsubsector-list")

    def test_project_subsector_list_user(
        self, viewer_user, sector, subsector, _setup_project_subsector_list
    ):
        self.client.force_authenticate(user=viewer_user)

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


@pytest.fixture(name="_setup_subsector_create")
def setup_subsector_create(sector):
    return {
        "name": "Subsectoru la Mafioti",
        "sector_id": sector.id,
    }


class TestProjectSubsectorCreate(BaseTest):
    url = reverse("projectsubsector-list")

    def test_without_login(self, _setup_subsector_create):
        self.client.force_authenticate(user=None)
        response = self.client.post(self.url, data=_setup_subsector_create)
        assert response.status_code == 403

    def test_without_permission(self, country_user, _setup_subsector_create):
        self.client.force_authenticate(user=country_user)
        response = self.client.post(self.url, data=_setup_subsector_create)
        assert response.status_code == 403

    def test_create_as_viewer(self, viewer_user, _setup_subsector_create):
        self.client.force_authenticate(user=viewer_user)
        response = self.client.post(self.url, data=_setup_subsector_create)
        assert response.status_code == 403

    def test_invalid_sector(self, agency_user, _setup_subsector_create):
        self.client.force_authenticate(user=agency_user)

        data = _setup_subsector_create
        data["sector_id"] = 999

        response = self.client.post(self.url, data=data)
        assert response.status_code == 400

    def test_create_with_code(self, agency_user, _setup_subsector_create, sector):
        self.client.force_authenticate(user=agency_user)

        data = {
            **_setup_subsector_create,
            "code": "NOSMECH",
        }
        response = self.client.post(self.url, data=data)
        assert response.status_code == 201
        assert response.data["name"] == "Subsectoru la Mafioti"
        assert response.data["code"] == f"CUST{response.data['id']}"
        assert response.data["sector_id"] == sector.id

    def test_create_duplicate_subsector(self, agency_user, subsector, sector):
        self.client.force_authenticate(user=agency_user)

        response = self.client.post(
            self.url, data={"name": subsector.name, "sector_id": sector.id}
        )
        assert response.status_code == 201
        assert response.data["id"] == subsector.id
        assert response.data["name"] == subsector.name

        subsect_co = ProjectSubSector.objects.count()
        assert subsect_co == 1


@pytest.fixture(name="_setup_project_type")
def setup_project_type():
    ProjectTypeFactory.create(name="Type", code="TYP", sort_order=0)
    ProjectTypeFactory.create(name="Type", code="TYP", sort_order=2)


class TestProjectType(BaseTest):
    url = reverse("project-type-list")

    def test_project_type_list_user(
        self, viewer_user, project_type, _setup_project_type
    ):
        self.client.force_authenticate(user=viewer_user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 3
        assert response.data[1] == {
            "id": project_type.id,
            "name": project_type.name,
            "code": project_type.code,
            "sort_order": project_type.sort_order,
            "allowed_sectors": [],
        }


@pytest.fixture(name="_setup_project_meeting")
def setup_project_meeting(country_ro, agency, project_type, project_status, subsector):
    project_data = {
        "country": country_ro,
        "agency": agency,
        "project_type": project_type,
        "status": project_status,
        "subsectors": [subsector],
        "substance_type": "HCFC",
    }

    meeting = MeetingFactory.create(number=3)
    ProjectFactory.create(
        title="Valoare",
        description="Hai sa vedem, sa vedem, sa vedem/ cine-i as in smecherie / ma cunoasteti dintr-o mie",
        meeting=meeting,
        **project_data,
    )
    for i in range(1, 3):
        meeting = MeetingFactory.create(number=i)
        ProjectFactory.create(
            title=f"Smecherie{i}",
            description="E talent si e vrajeala ce nu se-nvata la scoala",
            meeting=meeting,
            **project_data,
        )


class TestProjectMeeting(BaseTest):
    url = reverse("meeting-list")

    def test_project_meeting_list_user(self, viewer_user, _setup_project_meeting):
        self.client.force_authenticate(user=viewer_user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 3
        assert response.data[1]["number"] == 2


class TestProjectCluster(BaseTest):
    url = reverse("project-cluster-list")

    def test_project_cluster_list_user(
        self, viewer_user, project_cluster_kpp, project_cluster_kip
    ):
        self.client.force_authenticate(user=viewer_user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 2
        assert response.data[0]["name"] == project_cluster_kpp.name
        assert response.data[1]["name"] == project_cluster_kip.name
        assert response.data[1]["code"] == project_cluster_kip.code


@pytest.fixture(name="_setup_project_specific_fields")
def setup_project_specific_fields():
    cluster1 = ProjectClusterFactory.create(name="Cluster1", code="CL1", sort_order=1)
    project_type1 = ProjectTypeFactory.create(name="Type1", code="TYP1")
    sector1 = ProjectSectorFactory.create(name="Sector1", code="SEC1")

    project_specific_fields = ProjectSpecificFieldsFactory.create(
        cluster=cluster1,
        type=project_type1,
        sector=sector1,
    )
    field1 = ProjectFieldFactory.create(
        import_name="substance",
        label="Substance",
        read_field_name="ods_substance_name",
        write_field_name="ods_substance_id",
        table="ods_odp",
        data_type="drop_down",
        section="section1",
    )
    substance = SubstanceFactory.create()
    field2 = ProjectFieldFactory.create(
        import_name="EE demonstration project included (yes/no)",
        label="EE demonstration project included",
        read_field_name="ee_demonstration_project",
        write_field_name="ee_demonstration_project",
        table="project",
        data_type="boolean",
        section="section2",
    )

    project_specific_fields.fields.add(field1, field2)

    return cluster1, project_type1, sector1, field1, field2, substance


class TestProjectSpecificFields(BaseTest):

    def test_without_login(self, _setup_project_specific_fields):
        cluster1, project_type1, sector1, _, _, _ = _setup_project_specific_fields
        url = reverse(
            "project-specific-fields",
            kwargs={
                "cluster_id": cluster1.id,
                "type_id": project_type1.id,
                "sector_id": sector1.id,
            },
        )
        self.client.force_authenticate(user=None)
        response = self.client.delete(url)
        assert response.status_code == 403

    def test_project_project_specific_fields_list(
        self, viewer_user, _setup_project_specific_fields
    ):
        cluster1, project_type1, sector1, field1, field2, substance = (
            _setup_project_specific_fields
        )
        self.client.force_authenticate(user=viewer_user)
        url = reverse(
            "project-specific-fields",
            kwargs={
                "cluster_id": cluster1.id,
                "type_id": project_type1.id,
                "sector_id": sector1.id,
            },
        )
        response = self.client.get(url)
        assert response.status_code == 200
        fields = response.data["fields"]
        assert len(fields) == 2
        assert fields[0]["label"] == field1.label
        assert fields[0]["read_field_name"] == field1.read_field_name
        assert fields[0]["write_field_name"] == field1.write_field_name
        assert fields[0]["table"] == field1.table
        assert fields[0]["data_type"] == field1.data_type
        assert fields[0]["section"] == field1.section
        assert len(fields[0]["options"]) == 1
        assert fields[0]["options"][0]["id"] == substance.id
        assert fields[0]["options"][0]["name"] == substance.name
        assert fields[1]["label"] == field2.label
        assert fields[1]["read_field_name"] == field2.read_field_name
        assert fields[1]["write_field_name"] == field2.write_field_name
        assert fields[1]["table"] == field2.table
        assert fields[1]["data_type"] == field2.data_type
        assert fields[1]["section"] == field2.section


@pytest.fixture(name="_setup_rbm_measures")
def setup_rbm_measures():
    last_measure = RbmMeasureFactory.create(name="RBM Measure 0", sort_order=5)
    for i in range(1, 3):
        RbmMeasureFactory.create(name=f"RBM Measure {i}", sort_order=i)

    return last_measure


class TestRbmMeasures(BaseTest):
    url = reverse("rbm-measure-list")

    def test_rbm_measures_list_user(self, viewer_user, _setup_rbm_measures):
        self.client.force_authenticate(user=viewer_user)

        last_measure = _setup_rbm_measures

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 3
        assert response.data[2]["name"] == last_measure.name
