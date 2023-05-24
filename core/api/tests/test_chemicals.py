from core.api.tests.factories import (
    ExcludedUsageSubstFactory,
    UsageFactory,
    UserFactory,
    GroupFactory,
    SubstanceFactory,
)
import pytest
from django.urls import reverse
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


class TestGroupSubstances:
    client = APIClient()

    def test_group_substances_list(self):
        # add some groups with substances using factories
        group1 = GroupFactory.create()
        group2 = GroupFactory.create()
        usage1 = UsageFactory.create()
        usage2 = UsageFactory.create()
        substance1 = SubstanceFactory.create(group=group1)
        substance2 = SubstanceFactory.create(group=group1)
        substance3 = SubstanceFactory.create(group=group2)

        # create excluded usages
        ExcludedUsageSubstFactory.create(substance=substance1, usage=usage1)
        ExcludedUsageSubstFactory.create(substance=substance1, usage=usage2)

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
        assert usage2.id in response.data[0]["substances"][0]["excluded_usages"]
