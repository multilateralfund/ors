import pytest
from django.urls import reverse

from core.api.serializers.meta_project import MetaProjectMyaSerializer
from core.api.tests.base import BaseTest
from core.api.tests.factories import AgencyFactory
from core.api.tests.factories import MetaProjectFactory
from core.api.tests.factories import ProjectFactory
from core.api.tests.factories import ProjectOdsOdpFactory
from core.models.project import MetaProject
from core.models.project import Project

pytestmark = pytest.mark.django_db

# pylint: disable=C0302,C0415,C8008,W0221,R0912,R0913,R0913,R0914,R0915,W0613


@pytest.fixture(name="_setup_metaprojects_list")
def setup_metaprojects_list(_setup_project_list, project_approved_status):
    project: Project = _setup_project_list[0]
    meta_project: MetaProject = MetaProjectFactory.create(
        type=MetaProject.MetaProjectType.MYA,
    )
    for project in _setup_project_list:
        project.category = Project.Category.MYA
        project.submission_status = project_approved_status
        project.lead_agency = project.agency
        project.meta_project = meta_project
        project.save()

    meta_project.save()

    return [meta_project]


class TestProjectV2List(BaseTest):
    url = reverse("meta-projects-for-mya-update")

    def test_list_permissions(
        self,
        _setup_metaprojects_list,
        user,
        viewer_user,
        secretariat_viewer_user,
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

        response = self.client.get(self.url)
        assert response.status_code == 403

        _test_user_permissions(user, 403)
        _test_user_permissions(viewer_user, 403, 1)
        _test_user_permissions(secretariat_viewer_user, 403)
        _test_user_permissions(mlfs_admin_user, 200, 1)

    def test_view_metaproject(
        self,
        _setup_metaprojects_list,
        _setup_project_list,
        mlfs_admin_user,
    ):
        mp = _setup_metaprojects_list[0]
        mp_url = reverse("meta-project-view", args=(mp.id,))

        self.client.force_authenticate(user=mlfs_admin_user)
        response = self.client.get(mp_url, format="json")

        assert response.status_code == 200
        data = response.data

        assert len(data["projects"]) == len(_setup_project_list)
        assert "field_data" in data
        assert "computed_field_data" in data

        for field_name, field_data in data["field_data"].items():
            assert field_data["value"] is None, field_name

    def test_view_metaproject_computed_values_ignore_unapproved_projects(
        self,
        project_approved_status,
        project_draft_status,
        mlfs_admin_user,
    ):
        mp = MetaProjectFactory.create(type=MetaProject.MetaProjectType.MYA)
        ProjectFactory.create(
            meta_project=mp,
            category=Project.Category.MYA,
            submission_status=project_approved_status,
            total_fund=100,
            support_cost_psc=10,
        )
        approved_project = ProjectFactory.create(
            meta_project=mp,
            category=Project.Category.MYA,
            submission_status=project_approved_status,
            total_fund=100,
            support_cost_psc=10,
        )
        ProjectOdsOdpFactory.create(
            project=approved_project, co2_mt=2, odp=1, phase_out_mt=3
        )
        ProjectOdsOdpFactory.create(
            project=approved_project, co2_mt=4, odp=2, phase_out_mt=5
        )
        ProjectFactory.create(
            meta_project=mp,
            category=Project.Category.MYA,
            submission_status=project_draft_status,
            total_fund=200,
            support_cost_psc=20,
        )
        mp_url = reverse("meta-project-view", args=(mp.id,))

        self.client.force_authenticate(user=mlfs_admin_user)
        response = self.client.get(mp_url, format="json")

        assert response.status_code == 200
        assert len(response.data["projects"]) == 2
        assert response.data["possible_projects"] == []
        assert response.data["computed_field_data"]["project_funding"] == 200
        assert response.data["computed_field_data"]["support_cost"] == 20
        assert response.data["computed_field_data"]["phase_out_co2_eq_t"] == 6
        assert response.data["computed_field_data"]["phase_out_odp"] == 3
        assert response.data["computed_field_data"]["phase_out_mt"] == 8

    def test_list_metaprojects_lead_agency_uses_first_approved_project(
        self,
        project_approved_status,
        mlfs_admin_user,
    ):
        first_lead_agency = AgencyFactory.create(name="Lead agency A")
        second_lead_agency = AgencyFactory.create(name="Lead agency B")
        mp = MetaProjectFactory.create(type=MetaProject.MetaProjectType.MYA)
        first_project = ProjectFactory.create(
            meta_project=mp,
            category=Project.Category.MYA,
            submission_status=project_approved_status,
            lead_agency=first_lead_agency,
        )
        ProjectFactory.create(
            meta_project=mp,
            category=Project.Category.MYA,
            submission_status=project_approved_status,
            lead_agency=second_lead_agency,
        )

        self.client.force_authenticate(user=mlfs_admin_user)
        response = self.client.get(self.url, format="json")

        assert response.status_code == 200
        data = next(item for item in response.data if item["id"] == mp.id)
        assert data["lead_agency"]["name"] == first_lead_agency.name
        assert mp.first_approved_mya_project().id == first_project.id

    def test_view_metaproject_lead_agency_uses_first_approved_project(
        self,
        project_approved_status,
        mlfs_admin_user,
    ):
        first_lead_agency = AgencyFactory.create(name="Lead agency A")
        second_lead_agency = AgencyFactory.create(name="Lead agency B")
        mp = MetaProjectFactory.create(type=MetaProject.MetaProjectType.MYA)
        first_project = ProjectFactory.create(
            meta_project=mp,
            category=Project.Category.MYA,
            submission_status=project_approved_status,
            lead_agency=first_lead_agency,
        )
        ProjectFactory.create(
            meta_project=mp,
            category=Project.Category.MYA,
            submission_status=project_approved_status,
            lead_agency=second_lead_agency,
        )
        mp_url = reverse("meta-project-view", args=(mp.id,))

        self.client.force_authenticate(user=mlfs_admin_user)
        response = self.client.get(mp_url, format="json")

        assert response.status_code == 200
        assert response.data["lead_agency"]["name"] == first_lead_agency.name
        assert mp.first_approved_mya_project().id == first_project.id

    def test_view_metaproject_lead_agency_returns_none_without_lead_agency(
        self,
        project_approved_status,
        mlfs_admin_user,
    ):
        second_lead_agency = AgencyFactory.create(name="Lead agency B")
        mp = MetaProjectFactory.create(type=MetaProject.MetaProjectType.MYA)
        ProjectFactory.create(
            meta_project=mp,
            category=Project.Category.MYA,
            submission_status=project_approved_status,
            lead_agency=None,
        )
        ProjectFactory.create(
            meta_project=mp,
            category=Project.Category.MYA,
            submission_status=project_approved_status,
            lead_agency=second_lead_agency,
        )
        mp_url = reverse("meta-project-view", args=(mp.id,))

        self.client.force_authenticate(user=mlfs_admin_user)
        response = self.client.get(mp_url, format="json")

        assert response.status_code == 200
        assert response.data["lead_agency"] is None

    def test_first_approved_mya_project_returns_none_without_approved_projects(self):
        mp = MetaProjectFactory.create(type=MetaProject.MetaProjectType.MYA)

        assert mp.first_approved_mya_project() is None
        assert MetaProjectMyaSerializer(mp).data["lead_agency"] is None

    def test_edit_metaproject(
        self,
        _setup_metaprojects_list,
        _setup_project_list,
        mlfs_admin_user,
    ):
        mp = _setup_metaprojects_list[0]
        mp_url = reverse("meta-project-view", args=(mp.id,))

        self.client.force_authenticate(user=mlfs_admin_user)
        data = {"project_funding": 20.20}
        response = self.client.put(mp_url, data=data, format="json")

        assert response.status_code == 200
        assert float(response.data["project_funding"]) == 20.20

    def test_edit_metaproject_no_permission(
        self,
        _setup_metaprojects_list,
        _setup_project_list,
        viewer_user,
    ):
        mp = _setup_metaprojects_list[0]
        mp_url = reverse("meta-project-view", args=(mp.id,))

        self.client.force_authenticate(user=viewer_user)
        data = {"project_funding": 20.20}
        response = self.client.put(mp_url, data=data, format="json")

        assert response.status_code == 403

    def test_view_metaproject_not_found_for_unapproved_only_meta_project(
        self,
        project_draft_status,
        mlfs_admin_user,
    ):
        mp = MetaProjectFactory.create(type=MetaProject.MetaProjectType.MYA)
        ProjectFactory.create(
            meta_project=mp,
            category=Project.Category.MYA,
            submission_status=project_draft_status,
        )
        mp_url = reverse("meta-project-view", args=(mp.id,))

        self.client.force_authenticate(user=mlfs_admin_user)
        response = self.client.get(mp_url, format="json")

        assert response.status_code == 404
