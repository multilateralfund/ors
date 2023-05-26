from core.api.tests.factories import (
    ExcludedUsageSubstFactory,
    ExcludedUsageBlendFactory,
    UsageFactory,
    UserFactory,
    GroupFactory,
    SubstanceFactory,
    BlendFactory,
)
import pytest
from django.urls import reverse
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


# pylint: disable=C8008
class TestGroupSubstances:
    client = APIClient()

    def test_group_substances_list(self):
        # add some groups with substances using factories
        group1 = GroupFactory.create(name="A")
        group2 = GroupFactory.create(name="B")
        usage1 = UsageFactory.create()
        usage3 = UsageFactory.create()
        UsageFactory.create()
        substance1 = SubstanceFactory.create(group=group1)
        substance2 = SubstanceFactory.create(group=group1)
        substance3 = SubstanceFactory.create(group=group2)

        # create excluded usages
        ExcludedUsageSubstFactory.create(substance=substance1, usage=usage1)
        ExcludedUsageSubstFactory.create(substance=substance1, usage=usage3)

        # test without authentication
        url = reverse("group-substances-list")
        response = self.client.get(url)
        assert response.status_code == 403

        self.client.force_authenticate(user=UserFactory())

        # get group substances list
        url = reverse("group-substances-list")
        response = self.client.get(url)
        assert response.status_code == 200
        assert len(response.data) == 2
        assert response.data[0]["id"] == group1.id
        assert len(response.data[0]["substances"]) == 2
        assert response.data[0]["substances"][0]["id"] == substance1.id
        assert response.data[0]["substances"][1]["id"] == substance2.id
        assert response.data[1]["id"] == group2.id
        assert len(response.data[1]["substances"]) == 1
        assert response.data[1]["substances"][0]["id"] == substance3.id
        assert len(response.data[0]["substances"][0]["excluded_usages"]) == 0

        # get group substances list with usages
        url = reverse("group-substances-list")
        response = self.client.get(url, {"with_usages": True})
        assert response.status_code == 200
        assert len(response.data) == 2
        assert response.data[0]["id"] == group1.id
        assert len(response.data[0]["substances"]) == 2
        assert response.data[0]["substances"][0]["id"] == substance1.id
        assert response.data[0]["substances"][1]["id"] == substance2.id
        assert usage1.id in response.data[0]["substances"][0]["excluded_usages"]
        assert usage3.id in response.data[0]["substances"][0]["excluded_usages"]

    def test_blends_list(self):
        # add some blends using factories
        blend1 = BlendFactory.create(name="Blend1", sort_order=1)
        blend2 = BlendFactory.create(name="Blend2", sort_order=2)
        blend3 = BlendFactory.create(name="Blend3", sort_order=3)
        usage1 = UsageFactory.create()
        usage3 = UsageFactory.create()
        UsageFactory.create()

        # create excluded usages
        ExcludedUsageBlendFactory.create(blend=blend1, usage=usage1)
        ExcludedUsageBlendFactory.create(blend=blend1, usage=usage3)

        # test without authentication
        self.client.logout()
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
        assert usage3.id in response.data[0]["excluded_usages"]
        assert len(response.data[2]["excluded_usages"]) == 0
