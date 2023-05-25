from core.api.tests.factories import (
    ExcludedUsageBlendFactory,
    UsageFactory,
    BlendFactory,
    UserFactory,
)
import pytest
from django.urls import reverse
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db

class TestBlends:
    client = APIClient()

    def test_blends_list(self):
        # add some blends using factories
        blend1 = BlendFactory.create(name="Blend1")
        blend2 = BlendFactory.create(name="Blend2")
        blend3 = BlendFactory.create(name="Blend3")
        usage1 = UsageFactory.create()
        usage2 = UsageFactory.create()

        # create excluded usages
        ExcludedUsageBlendFactory.create(blend=blend1, usage=usage1)
        ExcludedUsageBlendFactory.create(blend=blend1, usage=usage2)

        # test without authentication
        url = reverse("blends-list")
        response = self.client.get(url)
        assert response.status_code == 403

        self.client.force_authenticate(user=UserFactory())

        # get blends list
        url = reverse("blends-list")
        response = self.client.get(url)
        assert response.status_code == 200
        assert len(response.data) == 3
        assert response.data[0]["id"] == blend1.id
        assert response.data[1]["id"] == blend2.id
        assert response.data[2]["id"] == blend3.id
        assert len(response.data[0]["excluded_usages"]) == 0

        # get blends list with usages
        url = reverse("blends-list")
        response = self.client.get(url, {"with_usages": True})
        assert response.status_code == 200
        assert len(response.data) == 3
        assert response.data[0]["id"] == blend1.id
        assert response.data[1]["id"] == blend2.id
        assert usage1.id in response.data[0]["excluded_usages"]
        assert usage2.id in response.data[0]["excluded_usages"]
        assert len(response.data[2]["excluded_usages"]) == 0