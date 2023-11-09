from django.urls import reverse
import pytest
from rest_framework.test import APIClient
from core.api.tests.base import BaseTest

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

GROUP_LIST = ["A", "B", "C", "D", "E", "F", "unknown"]


def create_usages(count=3):
    return [UsageFactory.create() for _ in range(count)]


def create_excluded_usages(usages, chemical, type_ch, time_frames, count=2):
    factory_cls = None
    create_data = {}
    time_frames_list = list(time_frames.values())
    if type_ch == "substance":
        factory_cls = ExcludedUsageSubstFactory
        create_data["substance"] = chemical
    else:
        factory_cls = ExcludedUsageBlendFactory
        create_data["blend"] = chemical

    for i in range(count):
        j = i % len(time_frames_list)
        create_data["time_frame"] = time_frames_list[j]
        factory_cls.create(
            usage=usages[i],
            **create_data,
        )


@pytest.fixture(name="_setup_substances_list")
def setup_substances_list(time_frames):
    groups = []
    substances = []
    for gr_name in GROUP_LIST:
        group = GroupFactory.create(name=gr_name, annex=gr_name, name_alt=gr_name)
        groups.append(group)
        for i in range(2):
            substances.append(
                SubstanceFactory.create(
                    group=group,
                    sort_order=i,
                    displayed_in_all=(i == 0),
                    displayed_in_latest_format=(i == 1),
                )
            )
    # add 3 usages
    usages = create_usages()
    # add excluded usages for first group substances
    create_excluded_usages(usages, substances[0], "substance", time_frames)
    return usages


class TestSubstancesList(BaseTest):
    group_list = ["A", "B", "C", "D", "E", "F", "unknown"]
    url = reverse("substances-list")

    def test_subs_list(self, user, _setup_substances_list):
        self.client.force_authenticate(user=user)

        # get group substances list without usages
        response = self.client.get(self.url)
        assert response.status_code == 200
        # check that groups are sorted by name
        count_substances = len(response.data)
        assert count_substances == 14
        for i in range(count_substances):
            assert response.data[i]["group"] == self.group_list[int(i / 2)]

    def test_subs_list_w_usages(self, user, _setup_substances_list):
        self.client.force_authenticate(user=user)
        usages = _setup_substances_list
        response = self.client.get(self.url, {"with_usages": True})
        assert response.status_code == 200
        assert len(response.data) == 14
        assert len(response.data[0]["excluded_usages"]) == 2
        # check that excluded usages are returned
        for i in range(2):
            assert usages[i].id in response.data[0]["excluded_usages"]

    def test_subs_list_year_filter(self, user, _setup_substances_list):
        self.client.force_authenticate(user=user)
        usages = _setup_substances_list
        # check for_year filter for excluded usages
        # for_year = 2000 => 1 excluded usage (2000, 2011)
        response = self.client.get(self.url, {"with_usages": True, "for_year": 2000})
        assert response.status_code == 200
        # substance0 1 excluded usage (2000, 2011)
        excluded_usages_list = response.data[0]["excluded_usages"]
        assert len(excluded_usages_list) == 1
        assert excluded_usages_list[0] == usages[0].id

    def test_subs_list_section_filter(self, user, _setup_substances_list):
        self.client.force_authenticate(user=user)

        # section A => annex in ["A", "B", "C", "D", "E"] => 10 substances
        response = self.client.get(self.url, {"section": "A"})
        assert response.status_code == 200
        assert len(response.data) == 10
        # section B => annex in ["F"] => 2 substances
        response = self.client.get(self.url, {"section": "B"})
        assert response.status_code == 200
        assert len(response.data) == 2
        # section C => annex in ["C", "E", "F", "unknown"] => 4 substances
        response = self.client.get(self.url, {"section": "C"})
        assert response.status_code == 200
        assert len(response.data) == 8

    def test_displayed_in_all_filter(self, user, _setup_substances_list):
        self.client.force_authenticate(user=user)

        # displayed_in_all = True => 7 substances
        response = self.client.get(self.url, {"displayed_in_all": True})
        assert response.status_code == 200
        assert len(response.data) == 7
        # displayed_in_all = False => 7 substances
        response = self.client.get(self.url, {"displayed_in_all": False})
        assert response.status_code == 200
        assert len(response.data) == 7

    def test_displayed_in_latest_format_filter(self, user, _setup_substances_list):
        self.client.force_authenticate(user=user)

        # displayed_in_latest_format = True => 7 substances
        response = self.client.get(self.url, {"displayed_in_latest_format": True})
        assert response.status_code == 200
        assert len(response.data) == 7
        # displayed_in_latest_format = False => 7 substances
        response = self.client.get(self.url, {"displayed_in_latest_format": False})
        assert response.status_code == 200
        assert len(response.data) == 7


@pytest.fixture(name="_setup_blend_list")
def setup_blend_list(time_frames):
    # add some blends
    blends = []
    for i in range(3):
        blends.append(
            BlendFactory.create(
                name="Blend" + str(i),
                sort_order=i,
                displayed_in_all=(i == 0),
                displayed_in_latest_format=(i == 1),
            )
        )
    # add some usages
    usages = create_usages()
    # create excluded usages
    create_excluded_usages(usages, blends[0], "blend", time_frames)

    return blends, usages


class TestBlendList(BaseTest):
    url = reverse("blends-list")

    def test_blends_list(self, user, _setup_blend_list):
        self.client.force_authenticate(user=user)
        blends, _ = _setup_blend_list

        # get blends list
        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 3
        for i in range(3):
            assert response.data[i]["id"] == blends[i].id
        assert len(response.data[0]["excluded_usages"]) == 0

    def test_blends_list_w_usages(self, user, _setup_blend_list):
        self.client.force_authenticate(user=user)
        blends, usages = _setup_blend_list

        response = self.client.get(self.url, {"with_usages": True})
        assert response.status_code == 200
        assert len(response.data) == 3
        # check that blends are sorted by sort_order
        for i in range(3):
            assert response.data[i]["id"] == blends[i].id
        # check that excluded usages are returned
        assert len(response.data[0]["excluded_usages"]) == 2
        for i in range(2):
            assert usages[i].id in response.data[0]["excluded_usages"]
        # check that excluded usages are not returned for blends without excluded usages
        assert len(response.data[2]["excluded_usages"]) == 0

    def test_blends_list_year_filter(self, user, _setup_blend_list):
        self.client.force_authenticate(user=user)
        _, usages = _setup_blend_list

        # for_year = 2000 => 1 excluded usage
        response = self.client.get(self.url, {"with_usages": True, "for_year": 2000})
        assert response.status_code == 200
        # blend0 1 excluded usage (2000-2011)
        excluded_usages_list = response.data[0]["excluded_usages"]
        assert len(excluded_usages_list) == 1
        assert excluded_usages_list[0] == usages[0].id

    def test_displayed_in_all_filter(self, user, _setup_blend_list):
        self.client.force_authenticate(user=user)

        # displayed_in_all = True => 1 blend
        response = self.client.get(self.url, {"displayed_in_all": True})
        assert response.status_code == 200
        assert len(response.data) == 1
        # displayed_in_all = False => 2 blends
        response = self.client.get(self.url, {"displayed_in_all": False})
        assert response.status_code == 200
        assert len(response.data) == 2

    def test_displayed_in_latest_format_filter(self, user, _setup_blend_list):
        self.client.force_authenticate(user=user)

        # displayed_in_latest_format = True => 1 blend
        response = self.client.get(self.url, {"displayed_in_latest_format": True})
        assert response.status_code == 200
        assert len(response.data) == 1
        # displayed_in_latest_format = False => 2 blends
        response = self.client.get(self.url, {"displayed_in_latest_format": False})
        assert response.status_code == 200
        assert len(response.data) == 2


@pytest.fixture(name="_setup_blend_create")
def setup_blend_create(groupA):
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
    return substA, substF, subst_otherF


@pytest.fixture(name="_setup_similar_blend")
def setup_similar_blend(_setup_blend_create):
    substA, substF, subst_otherF = _setup_blend_create
    # create blend with 3 substances (2 from group F and 1 from group A)
    components = {
        "blendAFOF": [
            {
                "substance_id": substA.id,
                "percentage": 0.2,
            },
            {
                "substance_id": substF.id,
                "percentage": 0.3,
            },
            {
                "substance_id": subst_otherF.id,
                "component_name": "Substafof",
                "percentage": 0.5,
            },
        ],
        "blendAF": [
            {
                "substance_id": substA.id,
                "percentage": 0.2,
            },
            {
                "substance_id": substF.id,
                "percentage": 0.8,
            },
        ],
        "blendFA": [
            {
                "substance_id": substF.id,
                "percentage": 0.2,
            },
            {
                "substance_id": substA.id,
                "percentage": 0.8,
            },
        ],
    }

    blends = {}
    for name, components_list in components.items():
        blend = BlendFactory.create(name=name)
        for component in components_list:
            blend.components.create(**component)

        blends[name] = blend

    # set percentages to be in range [0, 100]
    for name, components_list in components.items():
        for component in components_list:
            component["percentage"] = component["percentage"] * 100

    return blends, components


class TestSimilarBlend(BaseTest):
    url = reverse("blends-similar")

    def test_without_login(self, **kwargs):
        self.client.force_authenticate(user=None)
        response = self.client.post(self.url, kwargs)
        assert response.status_code == 403

    def test_similar_blend_list(self, user, _setup_similar_blend):
        self.client.force_authenticate(user=user)
        blends, components = _setup_similar_blend
        # get similar blends for blendAFOF
        response = self.client.post(
            self.url, {"components": components["blendAFOF"]}, format="json"
        )
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["id"] == blends["blendAFOF"].id

        # get similar blends for blendAF
        response = self.client.post(
            self.url, {"components": components["blendAF"]}, format="json"
        )
        assert response.status_code == 200
        assert len(response.data) == 3

    def test_same_substnces_list_filter(self, user, _setup_similar_blend):
        self.client.force_authenticate(user=user)
        _, components = _setup_similar_blend

        params = {
            "components": components["blendAF"],
            "same_substances": True,
        }
        response = self.client.post(self.url, params, format="json")
        assert response.status_code == 200
        assert len(response.data) == 2
        for blend in response.data:
            assert len(blend["components"]) == 2

    def test_invalid_substance(self, user, _setup_similar_blend):
        self.client.force_authenticate(user=user)
        _, components = _setup_similar_blend
        components_data = components["blendAF"]
        components_data[0]["substance_id"] = 999
        response = self.client.post(
            self.url, {"components": components_data}, format="json"
        )
        assert response.status_code == 200
        assert len(response.data) == 0

    def test_no_components(self, user, _setup_similar_blend):
        self.client.force_authenticate(user=user)
        response = self.client.post(self.url)
        assert response.status_code == 400

        response = self.client.post(self.url, {"components": []}, format="json")
        assert response.status_code == 400

    def test_no_blends(self, user, _setup_similar_blend, substance):
        self.client.force_authenticate(user=user)
        _, components = _setup_similar_blend
        components_data = components["blendAFOF"]
        components_data[0]["substance_id"] = substance.id
        response = self.client.post(
            self.url, {"components": components_data}, format="json"
        )
        assert response.status_code == 200
        assert len(response.data) == 0


class TestCreateBlend:
    client = APIClient()
    url = reverse("blends-create")

    def _create_simple_blend(self, substA, substF, subst_otherF):
        data = {
            "composition": "A-20%; F-30%; SubstFFF-50%",
            "other_names": "Blend1 other names",
            "components": [
                {"substance_id": substA.id, "component_name": "", "percentage": 20},
                {"substance_id": substF.id, "component_name": "", "percentage": 30},
                {
                    "substance_id": subst_otherF.id,
                    "component_name": "SubstFFF",
                    "percentage": 50,
                },
            ],
        }
        return self.client.post(self.url, data, format="json")

    def test_create_simple_blend_anon(self, _setup_blend_create):
        substA, substF, subst_otherF = _setup_blend_create

        response = self._create_simple_blend(substA, substF, subst_otherF)
        assert response.status_code == 403

    def test_create_simple_blend(self, user, _setup_blend_create):
        substA, substF, subst_otherF = _setup_blend_create
        self.client.force_authenticate(user=user)
        # create blend with 3 substances (2 from group F and 1 from group A)

        response = self._create_simple_blend(substA, substF, subst_otherF)
        assert response.status_code == 200
        assert response.data["name"] == "CustMix-0"
        assert response.data["other_names"] == "Blend1 other names"
        assert response.data["type"] == "Custom"
        assert response.data["is_contained_in_polyols"] is False
        assert (
            float(response.data["odp"])
            == substA.odp * 0.2 + substF.odp * 0.3 + subst_otherF.odp * 0.5
        )
        assert float(response.data["gwp"]) == substF.gwp * 0.3 + subst_otherF.gwp * 0.5
        assert response.data["composition_alt"] == "A-20%; F-30%; SubstFFF-50%"
        assert (
            response.data["composition"]
            == "SubstFFF-50.00%; SubstanceF-30.00%; SubstanceA-20.00%"
        )
        assert response.data["created"]

    def test_blend_already_exists(self, user, _setup_blend_create):
        substA, substF, subst_otherF = _setup_blend_create
        self.client.force_authenticate(user=user)
        self._create_simple_blend(substA, substF, subst_otherF)

        initial_count = Blend.objects.count()
        # same data
        self._create_simple_blend(substA, substF, subst_otherF)
        assert (Blend.objects.count()) == initial_count
        blend = Blend.objects.first()

        # same components, different name and composition
        data = {
            "composition": "sub_A-20%; sub_F-30%; SubstFFF-50%",
            "other_names": "BBBBBBBllllllleeeeennnndddd",
            "components": [
                {"substance_id": substA.id, "component_name": "", "percentage": 20},
                {
                    "substance_id": subst_otherF.id,
                    "component_name": "SubstFFF",
                    "percentage": 50,
                },
                {"substance_id": substF.id, "component_name": "", "percentage": 30},
            ],
        }
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 200
        assert response.data["id"] == blend.id

        assert (Blend.objects.count()) == initial_count
        assert not response.data["created"]

    def test_invalid_request(self, user, _setup_blend_create):
        substA, substF, subst_otherF = _setup_blend_create
        self.client.force_authenticate(user=user)

        initial_count = Blend.objects.count()

        # invalid percentage
        data = {
            "composition": "Blend2 composition",
            "other_names": "Blend2",
            "components": [
                {"substance_id": substA.id, "component_name": "", "percentage": 20},
                {
                    "substance_id": subst_otherF.id,
                    "component_name": "SubstFFF",
                    "percentage": 50,
                },
            ],
        }
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400

        # invalid substance id
        data["components"][0] = {
            "substance_id": 1212,
            "component_name": "",
            "percentage": 20,
        }
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400

        # duplicate component
        data["components"] = [
            {"substance_id": substA.id, "component_name": "", "percentage": 20},
            {"substance_id": substF.id, "component_name": "", "percentage": 30},
            {"substance_id": substF.id, "component_name": "", "percentage": 30},
        ]
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400

        # invalid component name for other substances
        data["components"] = [
            {"substance_id": substA.id, "component_name": "", "percentage": 50},
            {"substance_id": subst_otherF.id, "component_name": "", "percentage": 50},
        ]
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400

        # check that no blend was created
        assert (Blend.objects.count()) == initial_count

    def test_invalid_request_missing_fields(self, user, _setup_blend_create):
        substA, substF, subst_otherF = _setup_blend_create
        self.client.force_authenticate(user=user)

        data = {
            "composition": "A-20%; F-30%; SubstFFF-50%",
            "other_names": "Blend1 other names",
            "components": [
                {"substance_id": substA.id, "component_name": "", "percentage": 20},
                {"substance_id": substF.id, "component_name": "", "percentage": 30},
                {
                    "substance_id": subst_otherF.id,
                    "component_name": "SubstFFF",
                    "percentage": 50,
                },
            ],
        }
        for key in data:
            new_data = data.copy()
            del new_data[key]
            response = self.client.post(self.url, new_data, format="json")
            assert response.status_code == 400

    def test_multiple_other_subs(self, user, _setup_blend_create):
        substA, _, subst_otherF = _setup_blend_create
        self.client.force_authenticate(user=user)

        data = {
            "composition": "A-20%; F-30%; SubstFFF-50%",
            "other_names": "Blend1 other names",
            "components": [
                {"substance_id": substA.id, "component_name": "", "percentage": 20},
                {
                    "substance_id": subst_otherF.id,
                    "component_name": "SubstFFF",
                    "percentage": 50,
                },
                {
                    "substance_id": subst_otherF.id,
                    "component_name": "SubstFFF2",
                    "percentage": 30,
                },
            ],
        }
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 200
        assert response.data["name"] == "CustMix-0"
        assert response.data["other_names"] == data["other_names"]
        assert response.data["composition_alt"] == data["composition"]
        assert (
            response.data["composition"]
            == "SubstFFF-50.00%; SubstFFF2-30.00%; SubstanceA-20.00%"
        )
        assert float(response.data["odp"]) == substA.odp * 0.2 + subst_otherF.odp * 0.8
        assert float(response.data["gwp"]) == subst_otherF.gwp * 0.8
        assert Blend.objects.count() == 1
