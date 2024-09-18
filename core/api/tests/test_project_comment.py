import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from core.api.tests.base import BaseProjectUtilityCreate, BaseProjectUtilityDelete

from core.models.project import ProjectComment

pytestmark = pytest.mark.django_db
# pylint: disable=C8008,W0221,R0913


@pytest.fixture(name="_create_project_comment")
def create_project_comment(project, meeting):
    return {
        "project_id": project.id,
        "meeting_of_report_id": meeting.id,
        "secretariat_comment": "La robinet sa curga banii",
        "agency_response": "Asa viseaza dusmanii",
    }


class TestProjectCommentCreate(BaseProjectUtilityCreate):
    url = reverse("projectcomment-list")
    proj_utility_attr_name = "comments"

    @pytest.fixture(autouse=True)
    def setup(self, _create_project_comment):
        self.__class__.new_utility_data = _create_project_comment

    def test_invalid_meeting(self, user, _create_project_comment):
        self.client.force_authenticate(user=user)

        project_data = _create_project_comment
        project_data["meeting_of_report_id"] = 999
        response = self.client.post(self.url, project_data, format="json")
        assert response.status_code == 400


@pytest.fixture(name="project_comment")
def _project_comment(project, meeting):
    return ProjectComment.objects.create(project=project, meeting_of_report=meeting)


@pytest.fixture(name="project_comment_detail_url")
def _project_comment_detail_url(project_comment):
    return reverse("projectcomment-detail", args=(project_comment.id,))


class TestProjectCommentUpdate:
    client = APIClient()

    def test_update_anon(self, project_comment_detail_url):
        response = self.client.patch(project_comment_detail_url)
        assert response.status_code == 403

    def test_as_viewer(self, viewer_user, project_comment_detail_url):
        self.client.force_authenticate(user=viewer_user)

        response = self.client.patch(project_comment_detail_url)
        assert response.status_code == 403

    def test_update(self, user, project_comment_detail_url, project_comment):
        self.client.force_authenticate(user=user)

        response = self.client.patch(
            project_comment_detail_url, {"secretariat_comment": "24 de karate"}
        )
        assert response.status_code == 200

        project_comment.refresh_from_db()
        assert project_comment.secretariat_comment == "24 de karate"


class TestProjectsCommentDelete(BaseProjectUtilityDelete):
    @pytest.fixture(autouse=True)
    def setup(self, project_comment_detail_url):
        self.__class__.url = project_comment_detail_url
        self.__class__.proj_utility_attr_name = "comments"
