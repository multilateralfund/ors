import pytest
from django.urls import reverse

from core.api.tests.base import BaseTest
from core.api.tests.factories import CommentTypeFactory


pytestmark = pytest.mark.django_db
# pylint: disable=C8008


class TestCommentTypeList(BaseTest):
    url = reverse("comment-type-list")

    def test_comment_type_list(self, user, comment_type):
        self.client.force_authenticate(user=user)

        # get all comment types
        other_comment_type = CommentTypeFactory()
        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 2
        assert response.data == [
            {
                "id": comment_type.id,
                "name": comment_type.name,
            },
            {
                "id": other_comment_type.id,
                "name": other_comment_type.name,
            },
        ]

        # filter by name
        response = self.client.get(self.url, {"name": comment_type.name})
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data == [
            {
                "id": comment_type.id,
                "name": comment_type.name,
            }
        ]
