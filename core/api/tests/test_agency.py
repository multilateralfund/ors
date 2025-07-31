import pytest
from django.urls import reverse

from core.api.tests.base import BaseTest


pytestmark = pytest.mark.django_db
# pylint: disable=C8008


class TestAgencyList(BaseTest):
    url = reverse("agency-list")

    def test_agency_list_user(self, admin_user, agency):
        self.client.force_authenticate(user=admin_user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data == [
            {
                "id": agency.id,
                "name": agency.name,
                "name_display": agency.get_name_display(),
            }
        ]
