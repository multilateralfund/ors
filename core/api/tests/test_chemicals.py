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

    def create_usages(self, count=3):
        return [UsageFactory.create() for _ in range(count)]

    def create_excluded_usages(self, usages, chemical, type_ch, count=2):
        if type_ch == "substance":
            for i in range(count):
                ExcludedUsageSubstFactory.create(substance=chemical, usage=usages[i])
        elif type_ch == "blend":
            for i in range(count):
                ExcludedUsageBlendFactory.create(blend=chemical, usage=usages[i])

    def test_group_substances_list(self):
        # add some groups with substances
        groups = []
        substances = []
        for gr_name in ["A", "B"]:
            group = GroupFactory.create(name=gr_name)
            groups.append(group)
            for i in range(2):
                substances.append(SubstanceFactory.create(group=group, sort_order=i))
        # add some usages
        usages = self.create_usages()
        # add excluded usages for first substance
        self.create_excluded_usages(usages, substances[0], "substance")

        # test without authentication
        url = reverse("group-substances-list")
        response = self.client.get(url)
        assert response.status_code == 403

        self.client.force_authenticate(user=UserFactory())

        # get group substances list without usages
        url = reverse("group-substances-list")
        response = self.client.get(url)
        assert response.status_code == 200
        # check that groups are sorted by name
        assert len(response.data) == 2
        for i in range(2):
            group_data = response.data[i]
            assert group_data["id"] == groups[i].id
            # check that every group has 2 substances and no excluded usages
            assert len(group_data["substances"]) == 2
            for j in range(2):
                assert group_data["substances"][j]["id"] == substances[i * 2 + j].id
                assert len(group_data["substances"][j]["excluded_usages"]) == 0

        # get group substances list with usages
        url = reverse("group-substances-list")
        response = self.client.get(url, {"with_usages": True})
        assert response.status_code == 200
        assert len(response.data) == 2
        assert response.data[0]["id"] == groups[0].id
        assert len(response.data[0]["substances"]) == 2
        # check that excluded usages are returned
        for i in range(2):
            assert usages[i].id in response.data[0]["substances"][0]["excluded_usages"]

    def test_blends_list(self):
        # add some blends
        blends = []
        for i in range(3):
            blends.append(BlendFactory.create(name="Blend" + str(i), sort_order=i))
        # add some usages
        usages = self.create_usages()
        # create excluded usages
        self.create_excluded_usages(usages, blends[0], "blend")

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
        for i in range(3):
            assert response.data[i]["id"] == blends[i].id
        assert len(response.data[0]["excluded_usages"]) == 0

        # get blends list with usages
        url = reverse("blends-list")
        response = self.client.get(url, {"with_usages": True})
        assert response.status_code == 200
        assert len(response.data) == 3
        # check that blends are sorted by sort_order
        for i in range(3):
            assert response.data[i]["id"] == blends[i].id
        # check that excluded usages are returned
        for i in range(2):
            assert usages[i].id in response.data[0]["excluded_usages"]
        # check that excluded usages are not returned for blends without excluded usages
        assert len(response.data[2]["excluded_usages"]) == 0
