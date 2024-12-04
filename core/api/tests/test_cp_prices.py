import pytest
from django.urls import reverse

from core.api.tests.base import BaseTest

# pylint: disable=W0221

pytestmark = pytest.mark.django_db


class TestCPPriceList(BaseTest):
    url = reverse("country-programme-price-list")

    def test_without_login(self, country_ro):
        self.client.force_authenticate(user=None)
        response = self.client.get(
            self.url, {"year": 2019, "country_id": country_ro.id}
        )
        assert response.status_code == 403

    def test_get_cp_prices_list(
        self, user, country_ro, cp_report_2019, _setup_new_cp_report
    ):
        self.client.force_authenticate(user=user)

        # get cp prices list 2020
        response = self.client.get(
            self.url, {"year": cp_report_2019.year, "country_id": country_ro.id}
        )
        assert response.status_code == 200
        assert len(response.data) == 7
        for price in response.data:
            if price["blend_id"]:
                assert not price["previous_year_price"]
            else:
                assert str(price["previous_year_price"]) == "2018"
            assert str(price["current_year_price"]) == "2019"

        # get cp prices list 2022
        response = self.client.get(
            self.url, {"year": 2022, "country_id": country_ro.id}
        )
        assert response.status_code == 200
        assert len(response.data) == 0
