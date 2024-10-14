import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from core.api.tests.factories import CountryFactory, SubstanceFactory
from core.models.business_plan import BusinessPlan

pytestmark = pytest.mark.django_db
# pylint: disable=R0913


class TestBPActivitiesDiff:
    client = APIClient()

    def create_business_plan(self, agency_id, activity_data):
        url = reverse("businessplan-list")
        data = {
            "name": "Test BP",
            "agency_id": agency_id,
            "year_start": 2020,
            "year_end": 2023,
            "status": "Agency Draft",
            "activities": activity_data,
        }
        response = self.client.post(url, data, format="json")
        business_plan_id = response.data["id"]

        # update status
        BusinessPlan.objects.filter(id=business_plan_id).update(
            status=BusinessPlan.Status.need_changes
        )
        return business_plan_id, response.data["activities"]

    def update_business_plan(self, business_plan_id, agency_id, activity_data):
        url = reverse("businessplan-list") + f"{business_plan_id}/"
        data = {
            "agency_id": agency_id,
            "year_start": 2020,
            "year_end": 2023,
            "status": "Agency Draft",
            "activities": activity_data,
        }
        response = self.client.put(url, data, format="json")
        return response.data["id"]

    def test_activities_diff(
        self,
        agency_user,
        _setup_bp_activity_create,
        agency,
        country_ro,
        project_cluster_kip,
        project_cluster_kpp,
        substance,
    ):
        self.client.force_authenticate(user=agency_user)

        # create business plan
        bp_id, activities = self.create_business_plan(
            agency.id, [_setup_bp_activity_create]
        )
        initial_id = activities[0]["initial_id"]

        # update business plan (new version)
        other_country = CountryFactory()
        other_substance = SubstanceFactory.create(name="substance2")
        activity_data = _setup_bp_activity_create
        activity_data["initial_id"] = initial_id
        activity_data["country_id"] = other_country.id
        activity_data["project_cluster_id"] = project_cluster_kip.id
        activity_data["substances"] = [substance.id, other_substance.id]
        activity_data["title"] = "Planu 2"
        activity_data["status"] = "P"
        activity_data["is_multi_year"] = True
        activity_data["remarks"] = "Merge rau"
        activity_data["values"] = [
            {
                "year": 2021,
                "is_after": False,
                "value_usd": 200,
                "value_odp": 200,
                "value_mt": 100,
            },
            {
                "year": 2022,
                "is_after": True,
                "value_usd": 300,
                "value_odp": 300,
                "value_mt": 300,
            },
        ]
        new_id = self.update_business_plan(bp_id, agency.id, [activity_data])

        # check activities diff
        url = reverse("business-plan-activity-diff")
        response = self.client.get(url, {"business_plan_id": new_id})
        assert response.status_code == 200

        assert response.data[0]["change_type"] == "changed"
        assert response.data[0]["country"]["name"] == other_country.name
        assert response.data[0]["country_old"]["name"] == country_ro.name
        assert response.data[0]["project_cluster"]["name"] == project_cluster_kip.name
        assert (
            response.data[0]["project_cluster_old"]["name"] == project_cluster_kpp.name
        )
        assert response.data[0]["substances"] == [substance.id, other_substance.id]
        assert response.data[0]["substances_old"] == [substance.id]
        assert response.data[0]["substances_display"] == [
            substance.name,
            other_substance.name,
        ]
        assert response.data[0]["substances_display_old"] == [substance.name]
        assert response.data[0]["title"] == "Planu 2"
        assert response.data[0]["title_old"] == "Planu"
        assert response.data[0]["status"] == "P"
        assert response.data[0]["status_old"] == "A"
        assert response.data[0]["status_display"] == "Planned"
        assert response.data[0]["status_display_old"] == "Approved"
        assert response.data[0]["is_multi_year"] is True
        assert response.data[0]["is_multi_year_old"] is False
        assert response.data[0]["is_multi_year_display"] == "Multi-Year"
        assert response.data[0]["is_multi_year_display_old"] == "Individual"
        assert response.data[0]["remarks"] == "Merge rau"
        assert response.data[0]["remarks_old"] == "Merge bine, bine, bine ca aeroplanu"

        values_data = response.data[0]["values"]
        assert values_data[0]["year"] == 2021
        assert float(values_data[0]["value_mt"]) == 100
        assert float(values_data[0]["value_mt_old"]) == 200

        assert values_data[1]["year"] == 2022
        assert float(values_data[1]["value_usd"]) == 300
        assert values_data[1]["value_usd_old"] is None

    def test_activities_diff_with_filters(
        self,
        agency_user,
        _setup_bp_activity_create,
        agency,
        country_ro,
    ):
        self.client.force_authenticate(user=agency_user)

        # create business plan
        bp_id, activities = self.create_business_plan(
            agency.id,
            [_setup_bp_activity_create, _setup_bp_activity_create],
        )
        initial_id = activities[0]["initial_id"]

        # update business plan (new version)
        activity_data = _setup_bp_activity_create
        activity_data["initial_id"] = initial_id
        activity_data["title"] = "Am un milion"
        new_id = self.update_business_plan(bp_id, agency.id, [activity_data])

        # check activities diff
        url = reverse("business-plan-activity-diff")
        response = self.client.get(
            url, {"business_plan_id": new_id, "country_id": country_ro.id}
        )
        assert response.status_code == 200
        assert len(response.data) == 2

        assert response.data[0]["change_type"] == "changed"
        assert response.data[0]["title"] == "Am un milion"
        assert response.data[0]["title_old"] == "Planu"
        assert response.data[1]["change_type"] == "deleted"

    def test_activities_diff_all_bps(
        self,
        user,
        _setup_bp_activity_create,
        agency,
        new_agency,
        country_ro,
        project_cluster_kip,
        project_cluster_kpp,
    ):
        self.client.force_authenticate(user=user)

        other_country = CountryFactory()

        for ag, country in [(agency, country_ro), (new_agency, other_country)]:
            # create business plan
            bp_id, activities = self.create_business_plan(
                ag.id, [_setup_bp_activity_create]
            )
            initial_id = activities[0]["initial_id"]

            # update business plan (new version)
            activity_data = _setup_bp_activity_create.copy()
            activity_data["initial_id"] = initial_id
            activity_data["country_id"] = country.id
            activity_data["project_cluster_id"] = project_cluster_kip.id
            activity_data["values"] = [
                {
                    "year": 2021,
                    "is_after": False,
                    "value_usd": 200,
                    "value_odp": 200,
                    "value_mt": 100,
                },
                {
                    "year": 2022,
                    "is_after": True,
                    "value_usd": 300,
                    "value_odp": 300,
                    "value_mt": 300,
                },
            ]
            _ = self.update_business_plan(bp_id, ag.id, [activity_data])

        # check all activities diff - no filter
        url = reverse("business-plan-activity-diff-all")
        response = self.client.get(
            url,
            {"year_start": 2020, "year_end": 2023},
        )
        assert response.status_code == 200
        assert len(response.data) == 2

        for ag, country, data in zip(
            [agency, new_agency],
            [country_ro, other_country],
            response.data,
            strict=True,
        ):
            assert data["agency_id"] == ag.id
            assert data["change_type"] == "changed"
            assert data["country"]["name"] == country.name
            assert data["country_old"]["name"] == country_ro.name
            assert data["project_cluster"]["name"] == project_cluster_kip.name
            assert data["project_cluster_old"]["name"] == project_cluster_kpp.name

            values_data = data["values"]
            assert values_data[0]["year"] == 2021
            assert float(values_data[0]["value_mt"]) == 100
            assert float(values_data[0]["value_mt_old"]) == 200

            assert values_data[1]["year"] == 2022
            assert float(values_data[1]["value_usd"]) == 300
            assert values_data[1]["value_usd_old"] is None

        # check all activities diff - country filter
        url = reverse("business-plan-activity-diff-all")
        response = self.client.get(
            url,
            {"year_start": 2020, "year_end": 2023, "country_id": other_country.id},
        )
        assert response.status_code == 200
        assert len(response.data) == 1

        assert response.data[0]["agency_id"] == new_agency.id
        assert response.data[0]["change_type"] == "changed"
        assert response.data[0]["country"]["name"] == other_country.name
        assert response.data[0]["country_old"]["name"] == country_ro.name
