import re
from io import StringIO

import pytest
from django.core.exceptions import ImproperlyConfigured
from django.core.management import call_command
from django.urls import reverse

from core.api.dashboard_metrics import get_metric, registry, taxonomy
from core.api.dashboard_metrics.registry import Disposition
from core.api.dashboard_metrics.country import COUNTRY_METRICS
from core.api.dashboard_metrics.fund import FUND_METRICS
from core.api.tests.base import BaseTest
from core.management.commands.dashboard_metrics_spec import COLUMNS
from core.api.tests.factories import (
    CountryFactory,
    ProjectClusterFactory,
    ProjectFactory,
    ProjectStatusFactory,
)
from core.models.country import Country

pytestmark = pytest.mark.django_db
# pylint: disable=C8008,W0613

# The 90 metric ids, pinned independently of the registry so a silent rename or
# drop fails here rather than in a consumer.
FUND_METRIC_IDS = frozenset(
    {
        "ods_avoided_emissions",
        "controlled_substances_avoided_emissions",
        "hfc_expected_avoided_emissions",
        "savings_to_society",
        "grant_funding_pledged",
        "ods_cost_per_odp_tonne",
        "controlled_substances_cost_per_co2eq_tonne",
        "hfc_expected_cost_per_co2eq_tonne",
        "ods_phased_out",
        "ods_funding_approved",
        "hfc_phased_out",
        "hfc_funding_approved",
        "baseline_phased_out_by_substance",
        "pct_countries_met",
        "countries_capacity",
        "countries_assisted",
        "funds_approved",
        "funds_lvc_split",
        "funds_disbursed",
        "projects_approved_total",
        "completed_count",
        "completed_funding",
        "completed_end_year",
        "ongoing_count",
        "ongoing_funding",
        "by_agency",
        "investment_timeline",
        "inv_months_first_disb",
        "inv_months_completion",
        "noninv_first_disbursement_scope",
        "noninv_months_first_disb",
        "noninv_months_completion",
        "portfolio_projects",
        "countries_portfolio",
        "portfolio_projects_rounded",
        "by_region",
        "theme_consumption",
        "theme_production",
        "theme_ee",
        "theme_disposal",
        "theme_hfc23",
        "theme_is",
        "sector_ac",
        "sector_ref",
        "sector_srv",
        "sector_foam",
        "sector_aerosol",
        "sector_solvent",
    }
)

COUNTRY_METRIC_IDS = frozenset(
    {
        "scope_entry_type",
        "scope_excluded_status",
        "scope_no_code",
        "scope_rollup_mismatch",
        "attr_country_name",
        "attr_iso3",
        "attr_region",
        "attr_ods_licensing",
        "attr_ods_quota",
        "attr_hfc_licensing",
        "attr_hfc_quota",
        "attr_hfc_group",
        "attr_hcfc_lvc",
        "attr_nou_ministry",
        "attr_nou_name",
        "attr_certification",
        "attr_meps",
        "kf_projects_approved",
        "kf_projects_ongoing",
        "kf_funding_approved",
        "kf_funding_disbursed",
        "kf_odp_phased",
        "kf_odp_approved",
        "kf_co2_phased",
        "kf_co2_approved",
        "trend_ods_consumption",
        "trend_hfc_consumption",
        "trend_ods_production",
        "theme_funding",
        "theme_total",
        "theme_unmapped",
        "sector_hfc",
        "sector_hcfc",
        "sector_other_ods",
        "sector_unclassified",
        "prod_tonnage",
        "ee_kwh_saved",
        "impact_technicians",
        "impact_customs",
        "impact_enterprises",
        "impact_certification",
        "impact_meps",
    }
)


@pytest.fixture(name="ongoing_status")
def _ongoing_status():
    ProjectStatusFactory(code="TRF", name="Transferred")
    ProjectStatusFactory(code="CLO", name="Closed")
    return ProjectStatusFactory(code="ONG", name="Ongoing")


@pytest.fixture(name="brazil")
def _brazil(ongoing_status):
    country = CountryFactory(name="Brazil", iso3="BRA")
    ProjectFactory(country=country, status=ongoing_status)
    return country


@pytest.fixture(name="africa")
def _africa(ongoing_status):
    region = CountryFactory(
        name="Africa", abbr="AFR", location_type=Country.LocationType.REGION
    )
    ProjectFactory(country=region, status=ongoing_status)
    return region


def assert_envelope(payload):
    """Every payload discloses its scope and its APR axes."""
    assert payload["as_of"].endswith("Z")
    assert "apr_scope" not in payload  # one axis; values carry both components
    assert isinstance(payload["apr_years_available"], list)
    assert payload["scope"]["population"] == "latest"
    assert sorted(payload["scope"]["excluded_statuses"]) == ["Closed", "Transferred"]
    assert payload["scope"]["production_included"] is True
    for metric in payload["metrics"]:
        assert metric["kind"] in ("scalar", "breakdown", "table", "series")
        assert metric["available"] is False
        assert metric["value"] is None
        # Nothing internal leaks onto a payload headed for a public page.
        assert "unavailable_reason" not in metric


class TestDashboardMetricsFund(BaseTest):
    url = reverse("dashboard-metrics-fund")

    def test_fund_envelope(self, user, brazil):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert {m["metric_id"] for m in response.data["metrics"]} == FUND_METRIC_IDS
        assert_envelope(response.data)

    def test_apr_year_overrides_the_cycle(self, user, brazil):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"apr_year": 2024})
        assert response.status_code == 200
        assert response.data["apr_year"] == 2024

    def test_a_non_integer_apr_year_is_rejected(self, user, brazil):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"apr_year": "last"})
        assert response.status_code == 400

    def test_an_unknown_parameter_is_ignored(self, user, brazil):
        """apr_scope was removed; a stale client must not get a 400."""
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"apr_scope": "cumulative"})
        assert response.status_code == 200


class TestDashboardMetricsCountryIndex(BaseTest):
    url = reverse("dashboard-metrics-countries")

    def test_index_lists_countries_and_regions(self, user, brazil, africa):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        entries = {e["key"]: e for e in response.data["entries"]}
        assert entries["BRA"] == {
            "key": "BRA",
            "name": "Brazil",
            "entry_type": "country",
            "iso3": "BRA",
        }
        assert entries["AFR"] == {
            "key": "AFR",
            "name": "Africa",
            "entry_type": "region",
            "iso3": None,
        }

    def test_index_excludes_countries_whose_only_project_is_out_of_scope(
        self, user, brazil
    ):
        chad = CountryFactory(name="Chad", iso3="TCD")
        ProjectFactory(country=chad, status=ProjectStatusFactory(code="TRF"))
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url)
        keys = {e["key"] for e in response.data["entries"]}
        assert keys == {"BRA"}


class TestDashboardMetricsCountry(BaseTest):
    url = reverse("dashboard-metrics-country", args=["BRA"])

    def test_country_envelope(self, user, brazil):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert {m["metric_id"] for m in response.data["metrics"]} == COUNTRY_METRIC_IDS
        assert response.data["entry"]["entry_type"] == "country"
        assert_envelope(response.data)

    def test_region_resolves_on_the_same_route(self, user, africa):
        self.client.force_authenticate(user=user)

        response = self.client.get(reverse("dashboard-metrics-country", args=["AFR"]))
        assert response.status_code == 200
        assert response.data["entry"] == {
            "key": "AFR",
            "name": "Africa",
            "entry_type": "region",
            "iso3": None,
        }

    def test_key_is_case_insensitive(self, user, brazil):
        self.client.force_authenticate(user=user)

        response = self.client.get(reverse("dashboard-metrics-country", args=["bra"]))
        assert response.status_code == 200
        assert response.data["entry"]["key"] == "BRA"

    def test_unknown_key_is_404(self, user, brazil):
        self.client.force_authenticate(user=user)

        response = self.client.get(reverse("dashboard-metrics-country", args=["ZZZ"]))
        assert response.status_code == 404


class TestBadDataDegradesQuietly(BaseTest):
    """Malformed data costs one entry, not the endpoint - and the client is
    never told, because this payload is destined for a public page."""

    url = reverse("dashboard-metrics-countries")

    def test_unaddressable_country_is_dropped_not_fatal(
        self, user, brazil, ongoing_status
    ):
        ProjectFactory(country=CountryFactory(name="Nowhere"), status=ongoing_status)
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert {e["key"] for e in response.data["entries"]} == {"BRA"}

    def test_colliding_keys_are_withheld_from_both_sides(
        self, user, brazil, ongoing_status
    ):
        clash = CountryFactory(
            name="Caribbean", abbr="BRA", location_type=Country.LocationType.REGION
        )
        ProjectFactory(country=clash, status=ongoing_status)
        self.client.force_authenticate(user=user)

        index = self.client.get(self.url)
        assert index.status_code == 200
        assert index.data["entries"] == []

        detail = self.client.get(reverse("dashboard-metrics-country", args=["BRA"]))
        assert detail.status_code == 404

    def test_payload_discloses_no_diagnostics(self, user, brazil, ongoing_status):
        ProjectFactory(country=CountryFactory(name="Nowhere"), status=ongoing_status)
        self.client.force_authenticate(user=user)

        scope = self.client.get(reverse("dashboard-metrics-fund")).data["scope"]
        assert set(scope) == {
            "population",
            "excluded_statuses",
            "production_included",
        }

    def test_an_unmapped_cluster_does_not_break_the_endpoint(self, user, brazil):
        ProjectClusterFactory(code="NEWC", name="Newly invented cluster")
        self.client.force_authenticate(user=user)

        assert self.client.get(self.url).status_code == 200


class TestRegistryAssertions:
    """Test-only guards. The request path degrades instead of raising, and
    never tells the client why - so this is where a person finds out."""

    def test_entry_keys_are_disjoint(self, brazil, africa):
        registry.assert_entry_keys_disjoint()

    def test_colliding_iso3_and_abbr_raise(self, brazil, ongoing_status):
        """Caribbean.abbr == 'LCA' == Saint Lucia's iso3 - the real hazard."""
        clash = CountryFactory(
            name="Caribbean", abbr="BRA", location_type=Country.LocationType.REGION
        )
        ProjectFactory(country=clash, status=ongoing_status)

        with pytest.raises(ImproperlyConfigured, match="keyspaces have collided"):
            registry.assert_entry_keys_disjoint()

    def test_project_bearing_country_without_a_key_raises(self, ongoing_status):
        unkeyed = CountryFactory(name="Nowhere")
        ProjectFactory(country=unkeyed, status=ongoing_status)

        with pytest.raises(ImproperlyConfigured, match="no iso3/abbr key"):
            registry.assert_entry_keys_disjoint()

    def test_known_clusters_are_mapped(self):
        for code in taxonomy.THEME_BY_CLUSTER_CODE:
            ProjectClusterFactory(code=code, name=code)
        for code in taxonomy.KNOWN_UNMAPPED_CLUSTER_CODES:
            ProjectClusterFactory(code=code, name=code)

        registry.assert_clusters_mapped()

    def test_a_new_cluster_raises(self):
        ProjectClusterFactory(code="NEWC", name="Newly invented cluster")

        with pytest.raises(ImproperlyConfigured, match="NEWC"):
            registry.assert_clusters_mapped()

    def test_obsolete_clusters_are_ignored(self):
        ProjectClusterFactory(code="OLDC", name="Retired cluster", obsolete=True)

        registry.assert_clusters_mapped()

    def test_every_theme_maps_to_a_bar(self):
        assert set(taxonomy.THEME_BY_CLUSTER_CODE.values()) == set(taxonomy.THEME_ORDER)


class TestRegistryDeclarations:
    """Pure-Python invariants; no database."""

    def test_registries_hold_exactly_the_pinned_ids(self):
        assert {m.metric_id for m in FUND_METRICS} == FUND_METRIC_IDS
        assert {m.metric_id for m in COUNTRY_METRICS} == COUNTRY_METRIC_IDS

    def test_metric_ids_are_unique_across_both_registries(self):
        """get_metric() consults both, so an id must mean one thing."""
        ids = [m.metric_id for m in FUND_METRICS + COUNTRY_METRICS]
        assert len(set(ids)) == len(ids)

    def test_get_metric_finds_either_registry(self):
        assert get_metric("funds_approved").label == "Funds approved"
        assert get_metric("attr_iso3").label == "ISO3"
        assert get_metric("no_such_metric") is None

    def test_labels_carry_no_figures(self):
        """A label names the datapoint; it never carries a number."""
        for metric in FUND_METRICS + COUNTRY_METRICS:
            assert not re.search(
                r"[$\d]",
                metric.label.replace("CO2", "")
                .replace("ISO3", "")
                .replace("HFC-23", ""),
            ), f"{metric.metric_id}: {metric.label!r}"

    def test_nothing_computes_yet(self):
        assert all(m.compute is None for m in FUND_METRICS + COUNTRY_METRICS)

    def test_blocked_metrics_say_why(self):
        """Not served, but the spec command needs a reason for every one."""
        blocked = [
            m
            for m in FUND_METRICS + COUNTRY_METRICS
            if m.disposition == Disposition.NOT_AVAILABLE
        ]
        assert len(blocked) == 15
        assert all(m.unavailable_reason for m in blocked)


class TestSpecCommand:
    """The registry's documentation half, replacing the old /spec/ endpoint."""

    def test_it_renders_every_metric(self):
        out = StringIO()
        call_command("dashboard_metrics_spec", stdout=out)
        rendered = out.getvalue()

        assert "90 metrics, 0 implemented." in rendered
        for metric_id in FUND_METRIC_IDS | COUNTRY_METRIC_IDS:
            assert f"`{metric_id}`" in rendered

    def test_pipes_in_a_value_cannot_break_the_table(self):
        out = StringIO()
        call_command("dashboard_metrics_spec", stdout=out)

        for line in out.getvalue().splitlines():
            if line.startswith("| `"):
                assert line.count("|") - line.count("\\|") == len(COLUMNS) + 1
