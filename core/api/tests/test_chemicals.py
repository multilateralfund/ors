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
class TestChemicals:
    client = APIClient()
    group_list = ["A", "B", "C", "D", "E", "F", "unknown"]

    def create_usages(self, count=3):
        return [UsageFactory.create() for _ in range(count)]

    def create_excluded_usages(
        self, usages, chemical, type_ch, count=2, with_years=True
    ):
        factory_cls = None
        create_data = {}
        if type_ch == "substance":
            factory_cls = ExcludedUsageSubstFactory
            create_data["substance"] = chemical
        else:
            factory_cls = ExcludedUsageBlendFactory
            create_data["blend"] = chemical

        for i in range(count):
            if with_years:
                create_data["start_year"] = 2000 + i
                create_data["end_year"] = 2010 + i
            factory_cls.create(
                usage=usages[i],
                **create_data,
            )

    def test_substances_list(self):
        # add 2 groups with 2 substances each
        groups = []
        substances = []
        for gr_name in self.group_list:
            group = GroupFactory.create(name=gr_name, annex=gr_name)
            groups.append(group)
            for i in range(2):
                substances.append(
                    SubstanceFactory.create(
                        group=group,
                        sort_order=i,
                    )
                )
        # add 3 usages
        usages = self.create_usages()
        # add excluded usages for first group substances
        self.create_excluded_usages(usages, substances[0], "substance")
        self.create_excluded_usages(
            usages, substances[1], "substance", with_years=False
        )

        # test without authentication
        url = reverse("substances-list")
        response = self.client.get(url)
        assert response.status_code == 403

        self.client.force_authenticate(user=UserFactory())

        # get group substances list without usages
        response = self.client.get(url)
        assert response.status_code == 200
        # check that groups are sorted by name
        count_substances = len(response.data)
        assert count_substances == 14
        for i in range(count_substances):
            assert response.data[i]["group_name"] == self.group_list[int(i / 2)]

        # get substances list with usages
        response = self.client.get(url, {"with_usages": True})
        assert response.status_code == 200
        assert len(response.data) == 14
        # check that excluded usages are returned
        for i in range(2):
            assert usages[i].id in response.data[0]["excluded_usages"]

        # check for_year filter for excluded usages
        # for_year = 2000 => 1 excluded usage
        response = self.client.get(url, {"with_usages": True, "for_year": 2000})
        assert response.status_code == 200
        # substance0 1 excluded usage (2000-2010)
        excluded_usages_list = response.data[0]["excluded_usages"]
        assert len(excluded_usages_list) == 1
        assert excluded_usages_list[0] == usages[0].id

        # check section filter
        # section A => annex in ["A", "B", "C", "D", "E"] => 10 substances
        response = self.client.get(url, {"section": "A"})
        assert response.status_code == 200
        assert len(response.data) == 10
        # section B => annex in ["F"] => 2 substances
        response = self.client.get(url, {"section": "B"})
        assert response.status_code == 200
        assert len(response.data) == 2
        # section C => annex in ["C", "E", "F", "unknown"] => 4 substances
        response = self.client.get(url, {"section": "C"})
        assert response.status_code == 200
        assert len(response.data) == 8

    def test_blends_list(self):
        # add some blends
        blends = []
        for i in range(3):
            blends.append(BlendFactory.create(name="Blend" + str(i), sort_order=i))
        # add some usages
        usages = self.create_usages()
        # create excluded usages
        self.create_excluded_usages(usages, blends[0], "blend")
        self.create_excluded_usages(usages, blends[1], "blend", with_years=False)

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

        # check for_year filter for excluded usages
        # for_year = 2000 => 1 excluded usage
        response = self.client.get(url, {"with_usages": True, "for_year": 2000})
        assert response.status_code == 200
        # blend0 1 excluded usage (2000-2010)
        excluded_usages_list = response.data[0]["excluded_usages"]
        assert len(excluded_usages_list) == 1
        assert excluded_usages_list[0] == usages[0].id
        # blend1 2 excluded usages (no years)
        excluded_usages_list = response.data[1]["excluded_usages"]
        assert len(excluded_usages_list) == 2
