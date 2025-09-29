import pytest
from django.urls import reverse

from core.api.tests.base import BaseTest
from core.api.tests.factories import MetaProjectFactory
from core.api.tests.projects.test_projects_v2 import (
    setup_project_list,
)  # pylint: disable=unused-import
from core.models.project import MetaProject
from core.models.project import Project
from core.utils import get_meta_project_code
from core.utils import get_meta_project_new_code

pytestmark = pytest.mark.django_db
# pylint: disable=C0302,C0415,C8008,W0221,R0912,R0913,R0913,R0914,R0915,W0613


@pytest.fixture(name="_setup_metaprojects_list")
def setup_metaprojects_list(_setup_project_list):
    project: Project = _setup_project_list[0]
    meta_project: MetaProject = MetaProjectFactory.create(
        lead_agency=project.agency,
        type=MetaProject.MetaProjectType.MYA,
    )
    for project in _setup_project_list:
        project.meta_project = meta_project
        project.save()

    meta_project.new_code = get_meta_project_new_code([project])
    meta_project.code = get_meta_project_code(project.country, project.cluster)
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
        _test_user_permissions(viewer_user, 200, 1)
        _test_user_permissions(secretariat_viewer_user, 403)
        _test_user_permissions(mlfs_admin_user, 200, 1)

    def test_view_metaproject(
        self,
        _setup_metaprojects_list,
        _setup_project_list,
        user,
        viewer_user,
        secretariat_viewer_user,
        mlfs_admin_user,
        admin_user,
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

    def test_edit_metaproject(
        self,
        _setup_metaprojects_list,
        _setup_project_list,
        user,
        viewer_user,
        secretariat_viewer_user,
        mlfs_admin_user,
        admin_user,
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
        user,
        viewer_user,
        secretariat_viewer_user,
        mlfs_admin_user,
        admin_user,
    ):
        mp = _setup_metaprojects_list[0]
        mp_url = reverse("meta-project-view", args=(mp.id,))

        self.client.force_authenticate(user=viewer_user)
        data = {"project_funding": 20.20}
        response = self.client.put(mp_url, data=data, format="json")

        assert response.status_code == 403
