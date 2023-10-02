from core.api.tests.base import BaseTest
from core.api.tests.factories import UsageFactory
import pytest
from django.urls import reverse

pytestmark = pytest.mark.django_db
# pylint: disable=C8008


@pytest.fixture(name="_setup_usages")
def setup_usages():
    usage1 = UsageFactory.create(name="Chef", full_name="Chef", sort_order=2)
    usage2 = UsageFactory.create(
        name="de Chef", full_name="Chef de Chef", sort_order=2.1, parent=usage1
    )
    usage3 = UsageFactory.create(sort_order=2.12, parent=usage2)
    usage4 = UsageFactory.create(sort_order=1)

    return usage1, usage2, usage3, usage4


class TestUsages(BaseTest):
    url = reverse("usages-list")

    def test_usages_list(self, user, _setup_usages):
        self.client.force_authenticate(user=user)
        usage1, usage2, usage3, usage4 = _setup_usages

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 4
        assert response.data[0]["id"] == usage4.id
        assert response.data[1]["id"] == usage1.id
        assert response.data[1]["children"][0]["id"] == usage2.id
        assert response.data[1]["children"][0]["children"][0]["id"] == usage3.id

    def test_usages_list_parents(self, user, _setup_usages):
        self.client.force_authenticate(user=user)
        usage1, _, _, usage4 = _setup_usages

        response = self.client.get(self.url, {"only_parents": True})
        assert response.status_code == 200
        assert len(response.data) == 2
        assert response.data[0]["id"] == usage4.id
        assert response.data[1]["id"] == usage1.id
