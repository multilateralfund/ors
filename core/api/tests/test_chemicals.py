from django.urls import reverse
import pytest
from rest_framework.test import APIClient

from core.api.tests.factories import (
    ExcludedUsageSubstFactory,
    ExcludedUsageBlendFactory,
    UsageFactory,
    GroupFactory,
    SubstanceFactory,
    BlendFactory,
)
from core.models.blend import Blend

pytestmark = pytest.mark.django_db


# pylint: disable=C8008
class TestChemicalsList:
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

    def test_substances_list(self, user):
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

        self.client.force_authenticate(user=user)

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

    def test_blends_list(self, user):
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

        self.client.force_authenticate(user=user)

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


# pylint: disable=C8008
class TestCreateBlend:
    client = APIClient()
    url = reverse("blends-create")

    def create_simple_blend_test(self, substA, substF, subst_otherF):
        # create blend with 3 substances (2 from group F and 1 from group A)
        data = {
            "composition": "A-20%; F-30%; SubstFFF-50%",
            "other_names": "Blend1 other names",
            "components": [
                (substA.id, "", 20),
                (substF.id, "", 30),
                (subst_otherF.id, "SubstFFF", 50),
            ],
        }
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 200
        assert response.data["name"] == "CustMix-0"
        assert response.data["other_names"] == data["other_names"]
        assert response.data["type"] == "Custom"
        assert response.data["is_contained_in_polyols"] is False
        assert (
            float(response.data["odp"])
            == substA.odp * 0.2 + substF.odp * 0.3 + subst_otherF.odp * 0.5
        )
        assert float(response.data["gwp"]) == substF.gwp * 0.3 + subst_otherF.gwp * 0.5
        assert response.data["composition_alt"] == data["composition"]
        assert (
            response.data["composition"]
            == "SubstFFF-50.00%; SubstanceF-30.00%; SubstanceA-20.00%"
        )

    def blend_already_exists_test(self, substA, substF, subst_otherF):
        initial_count = Blend.objects.count()
        # same data
        self.create_simple_blend_test(substA, substF, subst_otherF)
        assert (Blend.objects.count()) == initial_count
        blend = Blend.objects.first()

        # same components, different name and composition
        data = {
            "composition": "sub_A-20%; sub_F-30%; SubstFFF-50%",
            "other_names": "BBBBBBBllllllleeeeennnndddd",
            "components": [
                (substA.id, "", 20),
                (subst_otherF.id, "SubstFFF", 50),
                (substF.id, "", 30),
            ],
        }
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 200
        assert response.data["id"] == blend.id

        assert (Blend.objects.count()) == initial_count

    def invalid_request_test(self, substA, substF, subst_otherF):
        initial_count = Blend.objects.count()

        # invalid percentage
        data = {
            "composition": "Blend2 composition",
            "other_names": "Blend2",
            "components": [
                (substA.id, "", 20),
                (subst_otherF.id, "SubstFFF", 50),
            ],
        }
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400

        # invalid substance
        data["components"][0] = (1212, "", 20)
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400

        # duplicate component
        data["components"] = {
            (substA.id, "", 20),
            (substF.id, "", 50),
            (substF.id, "", 30),
        }
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400

        # invalid component name for other substances
        data["components"] = [
            (substA.id, "", 50),
            (subst_otherF.id, "", 50),
        ]
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400

        # check that no blend was created
        assert (Blend.objects.count()) == initial_count

    def multiple_other_subs_test(self, substA, subst_otherF):
        initial_count = Blend.objects.count()

        data = {
            "composition": "Blend3 composition",
            "other_names": "Blend3",
            "components": [
                (substA.id, "", 20),
                (subst_otherF.id, "SubstFFF", 50),
                (subst_otherF.id, "SubstFFF2", 30),
            ],
        }
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 200
        assert response.data["name"] == "CustMix-1"
        assert response.data["other_names"] == data["other_names"]
        assert response.data["composition_alt"] == data["composition"]
        assert (
            response.data["composition"]
            == "SubstFFF-50.00%; SubstFFF2-30.00%; SubstanceA-20.00%"
        )
        assert float(response.data["odp"]) == substA.odp * 0.2 + subst_otherF.odp * 0.8
        assert float(response.data["gwp"]) == subst_otherF.gwp * 0.8
        assert (Blend.objects.count()) == initial_count + 1

    def test_create_blend(self, user, groupA):
        self.client.force_authenticate(user=user)
        # create group
        groupF = GroupFactory.create(name="GroupF", annex="F")

        # create substance
        substA = SubstanceFactory.create(
            name="SubstanceA", odp=0.02, gwp=0.05, group=groupA
        )
        substF = SubstanceFactory.create(
            name="SubstanceF", odp=0.03, gwp=0.02, group=groupF
        )
        subst_otherF = SubstanceFactory.create(
            name="Other Substances", odp=0.01, gwp=0.01, group=groupF
        )

        self.create_simple_blend_test(substA, substF, subst_otherF)
        assert (Blend.objects.count()) == 1

        self.blend_already_exists_test(substA, substF, subst_otherF)

        self.invalid_request_test(substA, substF, subst_otherF)

        self.multiple_other_subs_test(substA, subst_otherF)
