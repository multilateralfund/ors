from core.api.tests.factories import UsageFactory, UserFactory
import pytest
from django.urls import reverse
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


class TestUsages:
    client = APIClient()

    def test_usages_list(self):
        # add some usages using usage factory
        usage1 = UsageFactory.create(sort_order=2)
        usage2 = UsageFactory.create(sort_order=2.1, parent=usage1)
        usage3 = UsageFactory.create(sort_order=2.12, parent=usage2)
        usage4 = UsageFactory.create(sort_order=1)

        # test without authentication
        url = reverse("usages-list")
        response = self.client.get(url)
        assert response.status_code == 403

        self.client.force_authenticate(user=UserFactory())

        # get usages list
        url = reverse("usages-list")
        response = self.client.get(url)
        assert response.status_code == 200
        assert len(response.data) == 4
        assert response.data[0]["id"] == usage4.id
        assert response.data[1]["id"] == usage1.id
        assert response.data[1]["children"][0]["id"] == usage2.id
        assert response.data[1]["children"][0]["children"][0]["id"] == usage3.id

        # get only parents
        response = self.client.get(url, {"only_parents": True})
        assert response.status_code == 200
        assert len(response.data) == 2
        assert response.data[0]["id"] == usage4.id
        assert response.data[1]["id"] == usage1.id
