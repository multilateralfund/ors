import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from core.models.project import ProjectComment

pytestmark = pytest.mark.django_db
# pylint: disable=C8008,W0221,R0913


@pytest.fixture(name="project_comment")
def _project_comment(project):
    return ProjectComment.objects.create(project=project, meeting_of_report="1")


@pytest.fixture(name="project_comment_url")
def _project_comment_url(project_comment):
    return reverse("projectcomment-detail", args=(project_comment.id,))


class TestProjectCommentUpdate:
    client = APIClient()

    def test_update_anon(self, project_comment_url):
        response = self.client.patch(project_comment_url)
        assert response.status_code == 403

    def test_update(self, user, project_comment_url, project_comment):
        self.client.force_authenticate(user=user)

        response = self.client.patch(project_comment_url, {"meeting_of_report": "42"})
        assert response.status_code == 200

        project_comment.refresh_from_db()
        assert project_comment.meeting_of_report == "42"


class TestProjectsFundDelete:
    client = APIClient()

    def test_delete_anon(self, project_comment_url):
        response = self.client.delete(project_comment_url)
        assert response.status_code == 403

    def test_delete(self, user, project_comment_url, project):
        self.client.force_authenticate(user=user)

        response = self.client.delete(project_comment_url)
        assert response.status_code == 204

        assert not project.comments.exists()
