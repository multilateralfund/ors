import re
from dataclasses import replace
from itertools import count
from datetime import date
from decimal import Decimal
from io import StringIO

import pytest
from constance.test import override_config
from django.core.exceptions import ImproperlyConfigured
from django.core.management import call_command
from django.urls import reverse

from core.api import dashboard_metrics
from core.api.dashboard_metrics import classify, cp, get_metric, registry, taxonomy
from core.api.dashboard_metrics.apr import AprMetrics
from core.api.dashboard_metrics.context import MetricContext
from core.api.dashboard_metrics.registry import Disposition
from core.api.dashboard_metrics.country import COUNTRY_METRICS
from core.api.dashboard_metrics.fund import FUND_METRICS
from core.api.tests.base import BaseTest
from core.management.commands.dashboard_metrics_spec import COLUMNS
from core.api.tests.factories import (
    AgencyFactory,
    AnnualAgencyProjectReportFactory,
    AnnualProgressReportFactory,
    AnnualProjectReportFactory,
    CountryFactory,
    CPRecordFactory,
    CPReportFactory,
    CPUsageFactory,
    DecisionFactory,
    FundingWindowFactory,
    GroupFactory,
    MeetingFactory,
    ProjectClusterFactory,
    ProjectFactory,
    ProjectOdsOdpFactory,
    ProjectSectorFactory,
    ProjectStatusFactory,
    ProjectTypeFactory,
    SubstanceFactory,
    TriennialContributionStatusFactory,
    UsageFactory,
)
from core.models.country import Country
from core.models.project import Project


def _explode(_context):
    raise ValueError("this metric cannot be computed")


_serial = count(1)


def approved_project(**kwargs):
    """A project carrying the identifiers one gets on approval.

    ``ProjectFactory`` leaves ``code`` and ``metacode`` null, which is a real
    pre-approval state - and one that no count is supposed to include.
    """
    kwargs.setdefault("code", f"PRJ/{next(_serial)}")
    kwargs.setdefault("metacode", kwargs["code"])
    return ProjectFactory(**kwargs)


pytestmark = pytest.mark.django_db
# pylint: disable=C8008,W0613,C0302

# The metric ids, pinned independently of the registry so a silent rename or
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
        "funds_disbursed_lvc_split",
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


def assert_envelope(payload, all_unavailable=False):
    """Every payload discloses its scope and its APR axes."""
    assert payload["as_of"].endswith("Z")
    assert "apr_scope" not in payload  # one axis; values carry both components
    assert isinstance(payload["apr_years_available"], list)
    assert payload["scope"]["population"] == "latest"
    assert sorted(payload["scope"]["excluded_statuses"]) == ["Closed", "Transferred"]
    assert payload["scope"]["production_included"] is True
    for metric_id, metric in payload["metrics"].items():
        assert metric["metric_id"] == metric_id
        assert metric["kind"] in ("scalar", "breakdown", "table", "series")
        assert metric["available"] is (metric["value"] is not None)
        if all_unavailable:
            assert metric["available"] is False
        # Nothing internal leaks onto a payload headed for a public page.
        assert "unavailable_reason" not in metric


def metrics_by_id(payload):
    """The payload's metrics, addressable by id."""
    return payload["metrics"]


class TestDashboardMetricsFund(BaseTest):
    url = reverse("dashboard-metrics-fund")

    def test_fund_envelope(self, user, brazil):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert set(response.data["metrics"]) == FUND_METRIC_IDS
        assert_envelope(response.data)

    def test_metrics_are_keyed_by_id(self, user, brazil):
        """A mapping, so a client addresses a figure rather than scanning for it."""
        self.client.force_authenticate(user=user)

        metrics = self.client.get(self.url).data["metrics"]
        assert isinstance(metrics, dict)
        # Each value still names itself, so iterating .values() loses nothing.
        assert metrics["funds_approved"]["metric_id"] == "funds_approved"

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
        assert set(response.data["metrics"]) == COUNTRY_METRIC_IDS
        assert response.data["entry"]["entry_type"] == "country"
        assert_envelope(response.data)

    def test_the_blocked_rows_are_the_only_unavailable_ones(self, user, brazil):
        """Everything else is either a figure or a measured zero."""
        self.client.force_authenticate(user=user)

        metrics = metrics_by_id(self.client.get(self.url).data)
        blocked = {
            m.metric_id
            for m in COUNTRY_METRICS
            if m.disposition == Disposition.NOT_AVAILABLE
        }
        unavailable = {mid for mid, m in metrics.items() if not m["available"]}

        assert blocked <= unavailable
        # Everything the population alone can answer is answered, even for a
        # country whose only project carries nothing but a status.
        assert unavailable.isdisjoint(
            {
                "scope_entry_type",
                "scope_excluded_status",
                "scope_no_code",
                "scope_rollup_mismatch",
                "attr_country_name",
                "attr_iso3",
                "kf_projects_approved",
                "kf_projects_ongoing",
                "kf_funding_approved",
                "kf_odp_approved",
                "kf_co2_approved",
                "theme_total",
                "theme_unmapped",
            }
        )

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

    def test_a_stand_in_cannot_shadow_a_computed_figure(self):
        """A placeholder overrides compute, so a real metric must not carry one."""
        real = replace(get_metric("funds_approved"), placeholder=lambda _c: "invented")

        with pytest.raises(ImproperlyConfigured):
            registry.index_metrics([real], "TEST_METRICS")

    def test_a_partly_computed_figure_may_carry_one(self):
        """COMPUTE_PARTIAL says the value has gaps a stand-in is meant to fill."""
        partial = replace(
            get_metric("funds_approved"),
            disposition=Disposition.COMPUTE_PARTIAL,
            placeholder=lambda _c: "invented",
        )

        assert registry.index_metrics([partial], "TEST_METRICS")

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

    def test_every_fund_metric_computes(self):
        """Nothing on the fund page is blocked; the country page carries them all."""
        uncomputed = {m.metric_id for m in FUND_METRICS if m.compute is None}
        assert uncomputed == set()

    def test_blocked_metrics_say_why(self):
        """Not served, but the spec command needs a reason for every one."""
        blocked = [
            m
            for m in FUND_METRICS + COUNTRY_METRICS
            if m.disposition == Disposition.NOT_AVAILABLE
        ]
        assert len(blocked) == 13
        assert all(m.unavailable_reason for m in blocked)


class TestFundValues(BaseTest):
    """The arithmetic, over a portfolio small enough to check by hand."""

    url = reverse("dashboard-metrics-fund")

    def fund(self, user):
        self.client.force_authenticate(user=user)
        response = self.client.get(self.url)
        assert response.status_code == 200
        return metrics_by_id(response.data)

    def test_funding_is_the_raw_field_not_the_transfer_adjusted_one(
        self, user, ongoing_status
    ):
        """The published figures carry no fund_transferred adjustment."""
        ProjectFactory(
            status=ongoing_status,
            total_fund=100_000,
            support_cost_psc=7_000,
            fund_transferred=-40_000,
        )

        assert self.fund(user)["funds_approved"]["value"] == {
            "funds_approved": 100_000,
            "funds_plus_psc": 107_000,
        }

    def test_a_transferred_project_is_in_no_figure(self, user, ongoing_status):
        approved_project(status=ongoing_status, total_fund=100, support_cost_psc=0)
        approved_project(
            status=ProjectStatusFactory(code="TRF"), total_fund=900, support_cost_psc=0
        )

        metrics = self.fund(user)
        assert metrics["funds_approved"]["value"]["funds_approved"] == 100
        assert metrics["projects_approved_total"]["value"]["projects_by_code"] == 1

    def test_the_region_table_sums_to_the_fund(self, user, ongoing_status):
        """A project naming a region belongs to that region's row."""
        africa = CountryFactory(
            name="Africa", abbr="AFR", location_type=Country.LocationType.REGION
        )
        approved_project(
            country=CountryFactory(name="Ghana", iso3="GHA", parent=africa),
            status=ongoing_status,
            total_fund=100,
            support_cost_psc=0,
        )
        approved_project(
            country=africa, status=ongoing_status, total_fund=900, support_cost_psc=0
        )

        metrics = self.fund(user)
        assert metrics["by_region"]["value"] == [
            {
                "group": "Africa",
                "funds_approved": 1000,
                "funds_plus_psc": 1000,
                "projects_by_code": 2,
                "projects_by_metacode": 2,
            }
        ]
        assert metrics["funds_approved"]["value"]["funds_approved"] == 1000

    def test_counts_separate_multi_year_agreements_from_individual_projects(
        self, user, ongoing_status
    ):
        for serial in (1, 2):
            approved_project(
                status=ongoing_status,
                category=Project.Category.MYA,
                code=f"MYA/{serial}",
                metacode="MYA",
            )
        approved_project(
            status=ongoing_status,
            category=Project.Category.IND,
            code="IND/1",
            metacode="IND/1",
        )

        assert self.fund(user)["projects_approved_total"]["value"] == {
            "projects_by_code": 3,
            "projects_by_metacode": 2,
            "mya_by_metacode": 1,
            "individual_by_code": 1,
        }

    def test_completed_and_ongoing_are_counted_by_status(self, user, ongoing_status):
        approved_project(status=ongoing_status, total_fund=10, support_cost_psc=1)
        for code in ("COM", "FIN"):
            approved_project(
                status=ProjectStatusFactory(code=code),
                total_fund=100,
                support_cost_psc=10,
            )

        metrics = self.fund(user)
        assert metrics["ongoing_count"]["value"] == 1
        assert metrics["ongoing_funding"]["value"] == 11
        assert metrics["completed_count"]["value"] == 2
        assert metrics["completed_funding"]["value"] == 220

    def test_ods_phased_out_covers_hcfc_and_older_ods_alike(self, user, ongoing_status):
        """The per-country page splits ODS three ways; this figure stays the union."""
        for code, tonnes in (
            ("HPMP1", 100),
            ("HCFCIND", 25),
            ("CFCIND", 8),
            ("OOI", 2),
        ):
            approved_project(
                status=ongoing_status,
                cluster=ProjectClusterFactory(code=code, name=code),
                total_phase_out_odp_tonnes=tonnes,
            )

        assert self.fund(user)["ods_phased_out"]["value"] == 135

    def test_portfolio_headline_rounds_down_to_the_thousand(self, user, ongoing_status):
        approved_project(status=ongoing_status)

        metrics = self.fund(user)
        assert metrics["portfolio_projects"]["value"] == 1
        assert metrics["portfolio_projects_rounded"]["value"] == 0

    def test_bilateral_agencies_are_one_row(self, user, ongoing_status):
        for name in ("UNDP", "France", "Japan"):
            approved_project(
                status=ongoing_status,
                agency=AgencyFactory(name=name),
                total_fund=100,
                support_cost_psc=0,
            )

        table = self.fund(user)["by_agency"]["value"]
        assert [row["group"] for row in table] == ["UNDP", "Bilateral Agencies"]
        assert table[-1]["funds_approved"] == 200
        assert table[-1]["projects_by_code"] == 2

    def test_agency_names_are_matched_case_insensitively(self, user, ongoing_status):
        """Casing drift must not quietly move an agency into the bilateral total."""
        approved_project(status=ongoing_status, agency=AgencyFactory(name="undp"))

        assert [row["group"] for row in self.fund(user)["by_agency"]["value"]] == [
            "undp"
        ]

    def test_manual_figures_are_unavailable_until_someone_enters_them(
        self, user, ongoing_status
    ):
        ProjectFactory(status=ongoing_status)

        assert self.fund(user)["savings_to_society"]["available"] is False

    def test_a_manual_figure_appears_once_entered(self, user, ongoing_status):
        ProjectFactory(status=ongoing_status)

        with override_config(TOTAL_SAVINGS_TO_SOCIETY_IN_US_DOLLAR=Decimal("12.5")):
            assert self.fund(user)["savings_to_society"]["value"] == 12.5

    def test_pledges_are_unavailable_until_there_are_any(self, user, ongoing_status):
        ProjectFactory(status=ongoing_status)

        assert self.fund(user)["grant_funding_pledged"]["available"] is False

    def test_pledges_total_every_triennium(self, user, ongoing_status):
        ProjectFactory(status=ongoing_status)
        for start in (2021, 2024):
            TriennialContributionStatusFactory(
                start_year=start,
                end_year=start + 2,
                agreed_contributions=Decimal("100.55"),
            )

        assert self.fund(user)["grant_funding_pledged"]["value"] == 201.1

    def test_apr_figures_are_unavailable_without_a_reporting_cycle(
        self, user, ongoing_status
    ):
        """No cycle costs those figures, not the request."""
        approved_project(status=ongoing_status)

        metrics = self.fund(user)
        for metric_id in (
            "funds_disbursed",
            "investment_timeline",
            "inv_months_first_disb",
            "inv_months_completion",
            "noninv_first_disbursement_scope",
            "noninv_months_first_disb",
            "noninv_months_completion",
        ):
            assert metrics[metric_id]["available"] is False
        assert metrics["funds_approved"]["available"] is True
        assert metrics["sector_ac"]["value"]["funds_disbursed"] is None

    def test_completion_timelines_are_the_investment_split_of_one_measurement(
        self, user, ongoing_status
    ):
        """Both read approval to actual completion off the cycle, not the project.

        The project record carries its own start and end dates, which measure
        something else and are not what either figure means.
        """
        agency_report = AnnualAgencyProjectReportFactory(
            progress_report=AnnualProgressReportFactory(year=2024)
        )
        for type_code, completed in (
            ("INV", date(2021, 1, 1)),
            ("TAS", date(2022, 7, 1)),
        ):
            AnnualProjectReportFactory(
                project=approved_project(
                    status=ongoing_status,
                    project_type=ProjectTypeFactory(code=type_code),
                    project_start_date=date(1990, 1, 1),
                    project_end_date=date(1990, 2, 1),
                ),
                report=agency_report,
                date_approved_denorm=date(2020, 1, 1),
                date_actual_completion=completed,
                date_first_disbursement=None,
            )

        self.client.force_authenticate(user=user)
        metrics = metrics_by_id(self.client.get(self.url, {"apr_year": 2024}).data)

        assert metrics["inv_months_completion"]["value"] == 12
        assert metrics["noninv_months_completion"]["value"] == 30

    def test_a_metric_that_breaks_costs_only_itself(self, caplog):
        """One bad figure must not take the page down, or say anything."""
        broken = replace(get_metric("funds_approved"), compute=_explode)

        # pylint: disable=W0212
        rendered = dashboard_metrics._render(broken, MetricContext())

        assert rendered["available"] is False
        assert rendered["value"] is None
        assert set(rendered) == {
            "metric_id",
            "label",
            "section",
            "kind",
            "unit",
            "available",
            "value",
        }
        assert "funds_approved" in caplog.text


class TestLvcSplits(BaseTest):
    """Approved and disbursed funding, split by the LVC classification."""

    url = reverse("dashboard-metrics-fund")

    def fund(self, user):
        self.client.force_authenticate(user=user)
        response = self.client.get(self.url)
        assert response.status_code == 200
        return metrics_by_id(response.data)

    def test_the_lvc_split_accounts_for_every_project(self, user, ongoing_status):
        """The three components sum to the fund, so a pie of them is honest."""
        africa = CountryFactory(
            name="Africa", abbr="AFR", location_type=Country.LocationType.REGION
        )
        approved_project(
            country=CountryFactory(name="Ghana", iso3="GHA", is_lvc=True),
            status=ongoing_status,
            total_fund=100,
            support_cost_psc=0,
        )
        approved_project(
            country=CountryFactory(name="Brazil", iso3="BRA", is_lvc=False),
            status=ongoing_status,
            total_fund=200,
            support_cost_psc=0,
        )
        approved_project(
            country=africa, status=ongoing_status, total_fund=700, support_cost_psc=0
        )

        metrics = self.fund(user)
        split = metrics["funds_lvc_split"]["value"]

        assert split["lvc"]["funds_approved"] == 100
        assert split["non_lvc"]["funds_approved"] == 200
        assert split["not_classified"]["funds_approved"] == 700
        assert (
            sum(component["funds_plus_psc"] for component in split.values())
            == metrics["funds_approved"]["value"]["funds_plus_psc"]
        )

    def test_the_lvc_split_and_the_country_page_share_one_derivation(
        self, user, ongoing_status
    ):
        """The fund splits on the status the country page states."""
        lvc_country = CountryFactory(name="Ghana", iso3="GHA", is_lvc=True)
        approved_project(
            country=lvc_country,
            status=ongoing_status,
            total_fund=100,
            support_cost_psc=0,
        )

        self.client.force_authenticate(user=user)
        stated = self.client.get(
            reverse("dashboard-metrics-country", args=["GHA"])
        ).data["metrics"]["attr_hcfc_lvc"]["value"]
        split = self.fund(user)["funds_lvc_split"]["value"]

        # The page says "LVC"; the money must be in the lvc component, not
        # beside it in a second reading of Country.is_lvc.
        assert stated == "LVC"
        assert split["lvc"]["funds_approved"] == 100
        assert split["non_lvc"]["funds_approved"] == 0

    def test_disbursement_splits_on_the_same_classification_as_approvals(
        self, user, ongoing_status
    ):
        """Two donuts side by side must divide the portfolio the same way."""
        agency_report = AnnualAgencyProjectReportFactory(
            progress_report=AnnualProgressReportFactory(year=2024)
        )
        for country, disbursed in (
            (CountryFactory(name="Ghana", iso3="GHA", is_lvc=True), 60),
            (CountryFactory(name="Brazil", iso3="BRA", is_lvc=False), 40),
        ):
            AnnualProjectReportFactory(
                project=approved_project(country=country, status=ongoing_status),
                report=agency_report,
                funds_disbursed=disbursed,
            )

        self.client.force_authenticate(user=user)
        metrics = metrics_by_id(self.client.get(self.url, {"apr_year": 2024}).data)
        disbursed = metrics["funds_disbursed_lvc_split"]["value"]

        assert disbursed["lvc"]["all_time"] == 60
        assert disbursed["non_lvc"]["all_time"] == 40
        # Same components as the approved split, so the slices line up.
        assert set(disbursed) == set(metrics["funds_lvc_split"]["value"])
        # And they total what the undivided figure reports.
        assert sum(c["all_time"] for c in disbursed.values()) == (
            metrics["funds_disbursed"]["value"]["all_time"]
        )

    def test_a_component_with_no_reports_is_zero_rather_than_missing(
        self, user, ongoing_status
    ):
        """A slice that vanished would read as a different split, not as silence."""
        agency_report = AnnualAgencyProjectReportFactory(
            progress_report=AnnualProgressReportFactory(year=2024)
        )
        AnnualProjectReportFactory(
            project=approved_project(
                country=CountryFactory(name="Ghana", iso3="GHA", is_lvc=True),
                status=ongoing_status,
            ),
            report=agency_report,
            funds_disbursed=60,
        )

        self.client.force_authenticate(user=user)
        disbursed = metrics_by_id(self.client.get(self.url, {"apr_year": 2024}).data)[
            "funds_disbursed_lvc_split"
        ]["value"]

        assert disbursed["non_lvc"] == {"all_time": 0.0, "active_cycle": 0.0}
        assert disbursed["not_classified"] == {"all_time": 0.0, "active_cycle": 0.0}

    def test_the_disbursement_split_is_unavailable_without_a_cycle(
        self, user, ongoing_status
    ):
        approved_project(status=ongoing_status)

        assert self.fund(user)["funds_disbursed_lvc_split"]["available"] is False

    def test_a_regionally_booked_project_is_not_filed_as_non_lvc(
        self, user, ongoing_status
    ):
        """``is_lvc`` defaults to False on a region, which is not a statement."""
        africa = CountryFactory(
            name="Africa",
            abbr="AFR",
            location_type=Country.LocationType.REGION,
            is_lvc=False,
        )
        approved_project(
            country=africa, status=ongoing_status, total_fund=500, support_cost_psc=0
        )

        split = self.fund(user)["funds_lvc_split"]["value"]
        assert split["non_lvc"]["funds_approved"] == 0
        assert split["not_classified"]["funds_approved"] == 500


class TestMetricContext:
    """The shared data a payload's metrics are computed against."""

    def test_naming_a_country_narrows_the_population(self, ongoing_status):
        """The seam the per-country payload is built on."""
        brazil = CountryFactory(name="Brazil", iso3="BRA")
        approved_project(country=brazil, status=ongoing_status)
        approved_project(
            country=CountryFactory(name="Chad", iso3="TCD"), status=ongoing_status
        )

        assert len(MetricContext().projects) == 2
        narrowed = MetricContext(country=brazil).projects
        assert [row.project.country for row in narrowed] == [brazil]

    def test_a_country_narrows_the_reporting_cycle_too(self, ongoing_status):
        brazil = CountryFactory(name="Brazil", iso3="BRA")
        chad = CountryFactory(name="Chad", iso3="TCD")
        # One cycle, one agency report: AnnualProgressReport.year is unique.
        agency_report = AnnualAgencyProjectReportFactory(
            progress_report=AnnualProgressReportFactory(year=2024)
        )
        for country in (brazil, chad):
            AnnualProjectReportFactory(
                project=approved_project(country=country, status=ongoing_status),
                report=agency_report,
            )

        assert len(MetricContext(apr_year=2024).apr.records) == 2
        assert len(MetricContext(apr_year=2024, country=brazil).apr.records) == 1

    def test_a_cycle_with_no_reports_is_none(self, ongoing_status):
        approved_project(status=ongoing_status)

        assert MetricContext(apr_year=2024).apr is None


class TestClassification:
    """Which bucket a project lands in, and in what order the rules are tried."""

    def project(self, **kwargs):
        return ProjectFactory(status=ProjectStatusFactory(code="ONG"), **kwargs)

    def window(self, code):
        return FundingWindowFactory(
            decision=DecisionFactory(number=code), description=code
        )

    def test_a_production_project_is_production_whatever_else_it_is(self):
        project = self.project(
            production=True, cluster=ProjectClusterFactory(code="EE", name="EE")
        )

        assert classify.project_theme(project, classify.is_production(project)) == (
            classify.THEME_PRODUCTION
        )

    def test_production_is_read_from_the_cluster_as_well_as_the_project(self):
        project = self.project(
            production=False,
            cluster=ProjectClusterFactory(code="KPP1", name="KPP1", production=True),
        )

        assert classify.is_production(project) is True

    def test_a_cluster_that_allows_both_is_not_production_on_its_own(self):
        project = self.project(
            production=False,
            cluster=ProjectClusterFactory(
                code="HFCIND", name="HFCIND", production=None
            ),
        )

        assert classify.is_production(project) is False

    def test_energy_efficiency_can_come_from_the_funding_window_alone(self):
        project = self.project(funding_window=self.window("89/6"))

        assert classify.project_theme(project, False) == (
            classify.THEME_ENERGY_EFFICIENCY
        )

    def test_disposal_can_come_from_the_funding_window_alone(self):
        project = self.project(funding_window=self.window("91/66"))

        assert classify.project_theme(project, False) == classify.THEME_DISPOSAL

    def test_a_window_names_itself_by_meeting_and_decision(self):
        window = FundingWindowFactory(
            decision=DecisionFactory(number="6", meeting=MeetingFactory(number=89)),
            description="",
        )

        assert classify.window_code(window) == "89/6"

    def test_a_window_with_no_decision_falls_back_to_its_description(self):
        window = FundingWindowFactory(decision=None, description=" 91/66 ")

        assert classify.window_code(window) == "91/66"

    def test_a_contradictory_window_follows_its_decision(self, caplog):
        window = FundingWindowFactory(
            decision=DecisionFactory(number="91/65"), description="91/66"
        )

        assert classify.window_code(window) == "91/65"
        assert "is named" in caplog.text

    def test_institutional_strengthening_comes_last(self):
        project = self.project(
            project_type=ProjectTypeFactory(code="INS"),
            cluster=ProjectClusterFactory(code="DISP", name="DISP"),
        )

        assert classify.project_theme(project, False) == classify.THEME_DISPOSAL

    def test_everything_unclaimed_is_consumption(self):
        assert classify.project_theme(self.project(), False) == (
            classify.THEME_CONSUMPTION
        )

    def test_a_region_is_found_up_the_parent_chain(self):
        """A subregion often sits between a country and its region."""
        region = CountryFactory(
            name="Africa", abbr="AFR", location_type=Country.LocationType.REGION
        )
        subregion = CountryFactory(
            name="West Africa",
            parent=region,
            location_type=Country.LocationType.SUBREGION,
        )
        ghana = CountryFactory(name="Ghana", iso3="GHA", parent=subregion)

        assert classify.region_of(ghana) == "Africa"

    def test_an_aggregate_entry_is_under_no_region(self):
        region = CountryFactory(
            name="Africa", abbr="AFR", location_type=Country.LocationType.REGION
        )

        assert classify.region_of(region) is None
        assert classify.region_of(CountryFactory(name="Nowhere")) is None
        assert classify.region_of(None) is None

    def test_a_region_is_charted_under_itself(self):
        """Where a country sits and where it is charted are two questions."""
        region = CountryFactory(
            name="Africa", abbr="AFR", location_type=Country.LocationType.REGION
        )
        ghana = CountryFactory(name="Ghana", iso3="GHA", parent=region)

        assert classify.region_bucket(region) == "Africa"
        assert classify.region_bucket(ghana) == "Africa"
        assert classify.region_bucket(CountryFactory(name="Nowhere")) is None
        assert classify.region_bucket(None) is None

    def test_the_family_comes_from_the_cluster(self):
        project = self.project(
            cluster=ProjectClusterFactory(code="HFCIND", name="HFCIND")
        )

        assert classify.substance_family(project) == classify.HFC

    def test_the_family_falls_back_to_the_substances(self):
        project = self.project(cluster=None)
        ProjectOdsOdpFactory(
            project=project,
            ods_substance=SubstanceFactory(group=GroupFactory(annex="F", group_id="F")),
        )

        assert classify.substance_family(project) == classify.HFC

    def test_a_project_with_neither_signal_has_no_family(self):
        assert classify.substance_family(self.project(cluster=None)) is None

    def test_servicing_takes_both_servicing_sectors(self):
        for code in ("SRV", "SRVEE"):
            project = self.project(sector=ProjectSectorFactory(code=code))
            assert classify.sector_bucket(project) == classify.SECTOR_SERVICING

    def test_a_sector_outside_the_six_is_dropped_and_reported(self, caplog):
        project = self.project(sector=ProjectSectorFactory(code="NOU"), total_fund=500)

        classified = classify.classify([project])
        with caplog.at_level("INFO"):
            classify.log_unbucketed_sectors(classified)

        assert classified[0].sector_bucket is None
        assert "NOU" in caplog.text


class TestInheritedAprAggregations:
    """Guards on the export writer's helpers.

    Each pins a known value rather than "it ran", so an upstream rename,
    re-signature or change of arithmetic fails here and names the method.
    """

    def records(self, *specs):
        """One APR record per (type code, approved date, first disbursement)."""
        return [
            AnnualProjectReportFactory(
                project=ProjectFactory(
                    project_type=ProjectTypeFactory(code=type_code),
                    status=ProjectStatusFactory(code="ONG"),
                ),
                date_approved_denorm=approved,
                date_first_disbursement=disbursed,
                date_actual_completion=None,
            )
            for type_code, approved, disbursed in specs
        ]

    def test_months_are_truncated_to_whole_months(self):
        """45 days is one month here, not 1.5 - the convention is ORS's."""
        records = self.records(
            ("INV", date(2020, 1, 1), date(2020, 2, 15)),
            ("INV", date(2020, 1, 1), date(2021, 7, 1)),
        )

        assert AprMetrics(records).months_to_first_disbursement(records) == 9.5

    def test_an_unmeasurable_set_is_none_rather_than_zero(self):
        """Zero months would read as a real measurement."""
        records = self.records(("INV", date(2020, 1, 1), None))

        assert AprMetrics(records).months_to_first_disbursement(records) is None

    def test_investment_and_non_investment_split_on_the_project_type(self):
        records = self.records(
            ("INV", date(2020, 1, 1), date(2020, 2, 1)),
            ("TAS", date(2020, 1, 1), date(2020, 2, 1)),
        )
        metrics = AprMetrics(records)

        assert len(metrics.investment()) == 1
        assert len(metrics.non_investment()) == 1

    def test_disbursement_groups_by_sector_code(self):
        records = self.records(("INV", date(2020, 1, 1), date(2020, 2, 1)))
        records[0].sector_code_denorm = "AC"
        records[0].funds_disbursed = 250

        assert AprMetrics(records).disbursed_by_sector_code() == {"AC": 250}

    def test_the_active_cycle_is_the_apr_row_status_not_the_project_status(self):
        """A project's own status only catches up once the cycle is endorsed."""
        ProjectStatusFactory(code="ONG", name="Ongoing")
        ProjectStatusFactory(code="COM", name="Completed")
        records = self.records(
            ("INV", date(2020, 1, 1), date(2020, 2, 1)),
            ("INV", date(2020, 1, 1), date(2020, 2, 1)),
        )
        records[0].status = "Ongoing"
        records[0].funds_disbursed = 100
        records[1].status = "Financially completed"
        records[1].funds_disbursed = 900

        assert AprMetrics(records).funds_disbursed() == {
            "all_time": 1000,
            "active_cycle": 100,
        }


class TestSubstanceFamilySplit:
    """The per-country page splits ODS in two. The fund-wide page must not notice."""

    def project(self, **kwargs):
        return ProjectFactory(status=ProjectStatusFactory(code="ONG"), **kwargs)

    def cluster_project(self, code):
        return self.project(cluster=ProjectClusterFactory(code=code, name=code))

    def test_ods_still_means_hcfc_and_older_ods_together(self):
        """Splitting the country's three families must not shrink the fund's two."""
        for code in ("HPMP1", "HCFCIND", "CFCIND", "OOI"):
            assert classify.substance_family(self.cluster_project(code)) == classify.ODS

    def test_the_ods_cluster_set_is_exactly_the_union(self):
        """Pure declaration, but it is the invariant the fund figure rests on."""
        assert classify.ODS_CLUSTER_CODES == (
            classify.HCFC_CLUSTER_CODES | classify.OTHER_ODS_CLUSTER_CODES
        )
        assert not classify.HCFC_CLUSTER_CODES & classify.OTHER_ODS_CLUSTER_CODES
        assert not classify.ODS_CLUSTER_CODES & classify.HFC_CLUSTER_CODES

    def test_the_country_split_tells_the_two_apart(self):
        assert classify.substance_family_detail(self.cluster_project("HPMP1")) == (
            classify.HCFC
        )
        assert classify.substance_family_detail(self.cluster_project("CFCIND")) == (
            classify.OTHER_ODS
        )

    def test_hfc_is_untouched_by_the_split(self):
        project = self.cluster_project("HFCIND")

        assert classify.substance_family_detail(project) == classify.HFC
        assert classify.substance_family(project) == classify.HFC

    def test_the_annex_fallback_finds_hcfcs_in_annex_c_group_one(self):
        project = self.project(cluster=None)
        ProjectOdsOdpFactory(
            project=project,
            ods_substance=SubstanceFactory(
                group=GroupFactory(annex="C", group_id="CI")
            ),
        )

        assert classify.substance_family_detail(project) == classify.HCFC
        assert classify.substance_family(project) == classify.ODS

    def test_an_older_annex_falls_back_to_the_other_ods_family(self):
        project = self.project(cluster=None)
        ProjectOdsOdpFactory(
            project=project,
            ods_substance=SubstanceFactory(
                group=GroupFactory(annex="A", group_id="AI")
            ),
        )

        assert classify.substance_family_detail(project) == classify.OTHER_ODS
        assert classify.substance_family(project) == classify.ODS

    def test_an_uncontrolled_substance_has_no_family(self):
        project = self.project(cluster=None)
        ProjectOdsOdpFactory(
            project=project,
            ods_substance=SubstanceFactory(
                group=GroupFactory(annex="unknown", group_id="uncontrolled")
            ),
        )

        assert classify.substance_family_detail(project) is None
        assert classify.substance_family(project) is None


class TestCountrySectorBuckets:
    """A second bucketing, because the two pages chart different sectors."""

    def project(self, code):
        return ProjectFactory(
            status=ProjectStatusFactory(code="ONG"),
            sector=ProjectSectorFactory(code=code),
        )

    def test_solvent_has_no_bar_of_its_own_here(self):
        """It does on the fund-wide page, which is why there are two functions."""
        project = self.project("SOL")

        assert classify.sector_bucket(project) == classify.SECTOR_SOLVENT
        assert classify.country_sector_bucket(project) == classify.SECTOR_OTHER

    def test_an_unbucketed_sector_is_a_bucket_here_rather_than_a_drop(self):
        project = self.project("NOU")

        assert classify.sector_bucket(project) is None
        assert classify.country_sector_bucket(project) == classify.SECTOR_OTHER

    def test_the_five_named_sectors_keep_their_names(self):
        for code, bucket in (
            ("AC", classify.SECTOR_AIR_CONDITIONING),
            ("REF", classify.SECTOR_REFRIGERATION),
            ("FOA", classify.SECTOR_FOAM),
            ("ARS", classify.SECTOR_AEROSOL),
            ("SRVEE", classify.SECTOR_SERVICING),
        ):
            assert classify.country_sector_bucket(self.project(code)) == bucket


class TestCountryValues(BaseTest):
    """One entry's figures, over a portfolio small enough to check by hand."""

    url = reverse("dashboard-metrics-country", args=["BRA"])

    def entry(self, user, key="BRA"):
        self.client.force_authenticate(user=user)
        response = self.client.get(reverse("dashboard-metrics-country", args=[key]))
        assert response.status_code == 200
        return metrics_by_id(response.data)

    def test_every_figure_covers_only_the_entry_named(self, user, ongoing_status):
        """The narrowing the whole per-country payload rests on."""
        brazil = CountryFactory(name="Brazil", iso3="BRA")
        approved_project(
            country=brazil, status=ongoing_status, total_fund=100, support_cost_psc=10
        )
        approved_project(
            country=CountryFactory(name="Chad", iso3="TCD"),
            status=ongoing_status,
            total_fund=900,
            support_cost_psc=90,
        )

        metrics = self.entry(user)
        assert metrics["kf_funding_approved"]["value"] == {
            "funds_approved": 100,
            "funds_plus_psc": 110,
        }
        assert metrics["kf_projects_approved"]["value"] == 1
        assert metrics["theme_total"]["value"] == 110

    def test_a_region_carries_no_country_attributes(self, user, africa):
        """They are somewhere projects are booked, not somewhere with an ozone unit."""
        metrics = self.entry(user, "AFR")

        assert metrics["scope_entry_type"]["value"] == "region"
        assert metrics["attr_country_name"]["value"] == "Africa"
        for metric_id in ("attr_iso3", "attr_hfc_group", "attr_hcfc_lvc"):
            assert metrics[metric_id]["available"] is False

    def test_country_attributes_are_read_off_the_country(self, user, ongoing_status):
        brazil = CountryFactory(
            name="Brazil",
            iso3="BRA",
            is_lvc=True,
            consumption_group="I",
            ozone_unit="Ministry of the Environment",
        )
        approved_project(country=brazil, status=ongoing_status)

        metrics = self.entry(user)
        assert metrics["scope_entry_type"]["value"] == "country"
        assert metrics["attr_iso3"]["value"] == "BRA"
        assert metrics["attr_hfc_group"]["value"] == "Group 1"
        assert metrics["attr_hcfc_lvc"]["value"] == "LVC"
        assert metrics["attr_nou_ministry"]["value"] == "Ministry of the Environment"

    def test_a_blank_ozone_unit_is_absent_rather_than_empty(self, user, ongoing_status):
        brazil = CountryFactory(name="Brazil", iso3="BRA", ozone_unit="nan")
        approved_project(country=brazil, status=ongoing_status)

        assert self.entry(user)["attr_nou_ministry"]["available"] is False

    def test_what_the_status_rule_removed_is_reported_not_hidden(
        self, user, ongoing_status
    ):
        brazil = CountryFactory(name="Brazil", iso3="BRA")
        approved_project(
            country=brazil, status=ongoing_status, total_fund=100, support_cost_psc=0
        )
        approved_project(
            country=brazil,
            status=ProjectStatusFactory(code="TRF"),
            total_fund=900,
            support_cost_psc=50,
        )

        metrics = self.entry(user)
        assert metrics["kf_funding_approved"]["value"]["funds_approved"] == 100
        assert metrics["scope_excluded_status"]["value"] == {
            "projects_by_code": 1,
            "projects_by_metacode": 1,
            "funds_approved": 900,
            "funds_plus_psc": 950,
        }

    def test_projects_with_no_code_are_counted_where_the_count_cannot_see_them(
        self, user, ongoing_status
    ):
        brazil = CountryFactory(name="Brazil", iso3="BRA")
        approved_project(country=brazil, status=ongoing_status, total_fund=100)
        ProjectFactory(country=brazil, status=ongoing_status, total_fund=25)

        metrics = self.entry(user)
        assert metrics["scope_no_code"]["value"] == 1
        assert metrics["kf_projects_approved"]["value"] == 1
        assert metrics["kf_funding_approved"]["value"]["funds_approved"] == 125

    def test_a_stale_rollup_is_reported_never_substituted(self, user, ongoing_status):
        """Swapping in the substance sum would put this page at odds with the rest."""
        brazil = CountryFactory(name="Brazil", iso3="BRA")
        project = approved_project(
            country=brazil,
            status=ongoing_status,
            total_phase_out_odp_tonnes=10,
            total_phase_out_co2_tonnes=500,
        )
        ProjectOdsOdpFactory(project=project, odp=40, co2_mt=9000)

        metrics = self.entry(user)
        assert metrics["scope_rollup_mismatch"]["value"] == {
            "projects_affected": 1,
            "odp_project_rollup": 10.0,
            "odp_substance_rows": 40.0,
            "co2_project_rollup": 500.0,
            "co2_substance_rows": 9000.0,
        }
        # The figure on the page is still the project's own column.
        assert metrics["kf_odp_approved"]["value"] == 10.0

    def test_a_rollup_that_agrees_reports_no_gap(self, user, ongoing_status):
        brazil = CountryFactory(name="Brazil", iso3="BRA")
        project = approved_project(
            country=brazil,
            status=ongoing_status,
            total_phase_out_odp_tonnes=40,
            total_phase_out_co2_tonnes=9000,
        )
        ProjectOdsOdpFactory(project=project, odp=40, co2_mt=9000)

        assert self.entry(user)["scope_rollup_mismatch"]["value"] == {
            "projects_affected": 0,
            "odp_project_rollup": 0.0,
            "odp_substance_rows": 0.0,
            "co2_project_rollup": 0.0,
            "co2_substance_rows": 0.0,
        }

    def test_tonnage_by_sector_folds_solvent_into_the_residual(
        self, user, ongoing_status
    ):
        brazil = CountryFactory(name="Brazil", iso3="BRA")
        hcfc = ProjectClusterFactory(code="HPMP1", name="HPMP1")
        for code, tonnes in (("AC", 30), ("SOL", 5), ("NOU", 2)):
            approved_project(
                country=brazil,
                status=ongoing_status,
                cluster=hcfc,
                sector=ProjectSectorFactory(code=code),
                total_phase_out_odp_tonnes=tonnes,
            )

        table = self.entry(user)["sector_hcfc"]["value"]
        assert [row["group"] for row in table] == list(classify.COUNTRY_SECTOR_ORDER)
        by_bucket = {row["group"]: row["tonnage"] for row in table}
        assert by_bucket[classify.SECTOR_AIR_CONDITIONING] == 30
        assert by_bucket[classify.SECTOR_OTHER] == 7
        assert by_bucket[classify.SECTOR_REFRIGERATION] == 0

    def test_the_families_are_charted_apart(self, user, ongoing_status):
        brazil = CountryFactory(name="Brazil", iso3="BRA")
        sector = ProjectSectorFactory(code="AC")
        approved_project(
            country=brazil,
            status=ongoing_status,
            sector=sector,
            cluster=ProjectClusterFactory(code="HPMP1", name="HPMP1"),
            total_phase_out_odp_tonnes=30,
        )
        approved_project(
            country=brazil,
            status=ongoing_status,
            sector=sector,
            cluster=ProjectClusterFactory(code="CFCIND", name="CFCIND"),
            total_phase_out_odp_tonnes=8,
        )
        approved_project(
            country=brazil,
            status=ongoing_status,
            sector=sector,
            cluster=ProjectClusterFactory(code="HFCIND", name="HFCIND"),
            total_phase_out_co2_tonnes=4000,
        )

        metrics = self.entry(user)
        assert self.tonnage(metrics["sector_hcfc"]) == 30
        assert self.tonnage(metrics["sector_other_ods"]) == 8
        assert self.tonnage(metrics["sector_hfc"]) == 4000
        assert metrics["sector_unclassified"]["available"] is False

    def tonnage(self, metric):
        return sum(row["tonnage"] for row in metric["value"])

    def test_a_production_project_is_left_off_the_sector_charts(
        self, user, ongoing_status
    ):
        """They are charted on their own, in their own section."""
        brazil = CountryFactory(name="Brazil", iso3="BRA")
        approved_project(
            country=brazil,
            status=ongoing_status,
            production=True,
            cluster=ProjectClusterFactory(code="HPMP1", name="HPMP1"),
            sector=ProjectSectorFactory(code="AC"),
            total_phase_out_odp_tonnes=12,
        )

        metrics = self.entry(user)
        assert metrics["sector_hcfc"]["available"] is False
        assert metrics["prod_tonnage"]["value"] == 12

    def test_no_production_project_means_no_production_chart(
        self, user, ongoing_status
    ):
        brazil = CountryFactory(name="Brazil", iso3="BRA")
        approved_project(
            country=brazil, status=ongoing_status, total_phase_out_odp_tonnes=12
        )

        assert self.entry(user)["prod_tonnage"]["available"] is False

    def test_funding_by_theme_follows_the_chart_order(self, user, ongoing_status):
        brazil = CountryFactory(name="Brazil", iso3="BRA")
        for code, fund in (("DISP", 10), ("KIP1", 900), ("HPMP1", 500)):
            approved_project(
                country=brazil,
                status=ongoing_status,
                cluster=ProjectClusterFactory(code=code, name=code),
                total_fund=fund,
                support_cost_psc=0,
            )

        table = self.entry(user)["theme_funding"]["value"]
        assert [row["group"] for row in table] == [
            "HFCs consumption",
            "HCFCs consumption",
            "Disposal",
        ]
        assert table[0]["funds_plus_psc"] == 900

    def test_funding_with_no_theme_is_reported_beside_the_total(
        self, user, ongoing_status
    ):
        """The bars and the callout visibly do not add up, rather than quietly."""
        brazil = CountryFactory(name="Brazil", iso3="BRA")
        approved_project(
            country=brazil,
            status=ongoing_status,
            cluster=ProjectClusterFactory(code="HPMP1", name="HPMP1"),
            total_fund=500,
            support_cost_psc=0,
        )
        approved_project(
            country=brazil,
            status=ongoing_status,
            cluster=ProjectClusterFactory(code="AGC", name="AGC"),
            total_fund=200,
            support_cost_psc=0,
        )

        metrics = self.entry(user)
        assert metrics["theme_total"]["value"] == 700
        assert metrics["theme_unmapped"]["value"] == 200
        assert [row["group"] for row in metrics["theme_funding"]["value"]] == [
            "HCFCs consumption"
        ]

    def test_the_reporting_cycle_supplies_the_actual_phase_out(
        self, user, ongoing_status
    ):
        """Approved is what a project set out to do; this is what it reports doing."""
        brazil = CountryFactory(name="Brazil", iso3="BRA")
        agency_report = AnnualAgencyProjectReportFactory(
            progress_report=AnnualProgressReportFactory(year=2024)
        )
        AnnualProjectReportFactory(
            project=approved_project(
                country=brazil, status=ongoing_status, total_phase_out_odp_tonnes=99
            ),
            report=agency_report,
            consumption_phased_out_odp=4,
            production_phased_out_odp=1.5,
            consumption_phased_out_co2=300,
            production_phased_out_co2=0,
            funds_disbursed=250,
        )

        self.client.force_authenticate(user=user)
        response = self.client.get(
            reverse("dashboard-metrics-country", args=["BRA"]), {"apr_year": 2024}
        )
        metrics = metrics_by_id(response.data)

        assert metrics["kf_odp_phased"]["value"] == 5.5
        assert metrics["kf_co2_phased"]["value"] == 300
        assert metrics["kf_funding_disbursed"]["value"] == 250
        assert metrics["kf_odp_approved"]["value"] == 99


class TestCountryProgrammeTrends:
    """The consumption series - a reshaping of the export's own computation."""

    def substance(self, name="HCFC-22", odp=1, gwp=0, annex="C", group_id="CI"):
        return SubstanceFactory(
            name=name,
            odp=odp,
            gwp=gwp,
            group=GroupFactory(annex=annex, group_id=group_id),
        )

    def record(self, country, year, substance, section="A", **kwargs):
        kwargs.setdefault("imports", 0)
        kwargs.setdefault("exports", 0)
        kwargs.setdefault("production", 0)
        return CPRecordFactory(
            country_programme_report=CPReportFactory(
                country=country, year=year, name=f"{country.name} {year}"
            ),
            substance=substance,
            blend=None,
            section=section,
            **kwargs,
        )

    def country(self):
        return CountryFactory(name="Brazil", iso3="BRA")

    def test_consumption_is_reshaped_into_an_ascending_series(self):
        """imports - exports + production, converted to ODP - all of it inherited."""
        country = self.country()
        substance = self.substance(odp=2)
        self.record(country, 2021, substance, imports=10, exports=4)
        self.record(country, 2020, substance, imports=5)

        assert cp.load_trends().consumption_odp("Brazil") == [
            [2020, 10.0],
            [2021, 12.0],
        ]

    def test_a_year_that_reached_zero_is_kept(self):
        """A country reaching zero is the result the programme exists to produce."""
        country = self.country()
        substance = self.substance(odp=1)
        self.record(country, 2020, substance, imports=5)
        self.record(country, 2021, substance)

        assert cp.load_trends().consumption_odp("Brazil") == [[2020, 5.0], [2021, 0.0]]

    def test_a_country_that_never_reported_has_no_series(self):
        self.record(self.country(), 2021, self.substance(), imports=5)
        CountryFactory(name="Chad", iso3="TCD")

        assert cp.load_trends().consumption_odp("Chad") is None

    def test_methyl_bromide_counts_only_its_non_exempt_usage(self):
        """QPS is exempt under the Protocol; the export already knows that."""
        country = self.country()
        record = self.record(
            country,
            2021,
            self.substance(name="Methyl Bromide", odp=1, annex="E", group_id="EI"),
            imports=50,
        )
        for name, quantity in (("QPS", 30), ("Non-QPS", 7)):
            CPUsageFactory(
                country_programme_record=record,
                usage=UsageFactory(name=name, full_name=name),
                quantity=quantity,
            )

        assert cp.load_trends().consumption_odp("Brazil") == [[2021, 7.0]]

    def test_sector_usage_carries_a_year_that_reports_no_trade(self):
        """5,000-odd records report usage and no trade; they used to count as zero."""
        country = self.country()
        record = self.record(country, 2021, self.substance(odp=1))
        CPUsageFactory(
            country_programme_record=record,
            usage=UsageFactory(name="Foam", full_name="Foam"),
            quantity=12,
        )

        assert cp.load_trends().consumption_odp("Brazil") == [[2021, 12.0]]

    def test_hfc_consumption_arrives_converted_to_co2(self):
        country = self.country()
        substance = self.substance(
            name="HFC-134a", odp=0, gwp=1430, annex="F", group_id="F"
        )
        self.record(country, 2021, substance, section="B", imports=10)

        assert cp.load_trends().consumption_co2("Brazil") == [[2021, 14300.0]]

    def test_production_is_converted_to_odp(self):
        country = self.country()
        self.record(country, 2021, self.substance(odp=3), production=4)

        assert cp.load_trends().production_odp("Brazil") == [[2021, 12.0]]

    def test_a_country_that_produces_nothing_has_no_production_chart(self):
        """Unlike consumption, a column of zeros here is a chart the page skips."""
        country = self.country()
        self.record(country, 2021, self.substance(odp=1), imports=5)

        assert cp.load_trends().production_odp("Brazil") is None

    def test_no_reports_at_all_costs_nothing(self):
        assert cp.load_trends().consumption_odp("Brazil") is None


class TestPlaceholders(BaseTest):
    """Invented stand-ins, served only when asked for and always flagged."""

    url = reverse("dashboard-metrics-country", args=["BRA"])

    # The rows with no source yet. Nine are country attributes; four are impact
    # figures, which an aggregate entry can meaningfully carry.
    ATTRIBUTES = frozenset(
        {
            "attr_ods_licensing",
            "attr_ods_quota",
            "attr_hfc_licensing",
            "attr_hfc_quota",
            "attr_nou_name",
            "attr_certification",
            "attr_meps",
            "impact_certification",
            "impact_meps",
        }
    )
    IMPACT = frozenset(
        {"impact_technicians", "impact_customs", "impact_enterprises", "ee_kwh_saved"}
    )

    def entry(self, user, key="BRA", **params):
        self.client.force_authenticate(user=user)
        response = self.client.get(
            reverse("dashboard-metrics-country", args=[key]), params
        )
        assert response.status_code == 200
        return metrics_by_id(response.data)

    @staticmethod
    def flagged(metrics):
        return {mid for mid, m in metrics.items() if m.get("placeholder")}

    def test_nothing_is_invented_unless_it_is_asked_for(self, user, brazil):
        """The default payload is the honest one."""
        metrics = self.entry(user)

        assert self.flagged(metrics) == set()
        for metric_id in self.ATTRIBUTES | self.IMPACT:
            assert metrics[metric_id]["available"] is False
            assert metrics[metric_id]["value"] is None

    def test_asking_fills_every_row_that_has_no_source(self, user, brazil):
        metrics = self.entry(user, placeholders="true")

        assert self.flagged(metrics) == self.ATTRIBUTES | self.IMPACT
        for metric_id in self.ATTRIBUTES | self.IMPACT:
            assert metrics[metric_id]["available"] is True
            assert metrics[metric_id]["value"] is not None

    def test_only_invented_values_carry_the_flag(self, user, brazil):
        """A real figure must never be mistaken for a stand-in."""
        metrics = self.entry(user, placeholders="true")

        for metric_id, metric in metrics.items():
            if metric.get("placeholder"):
                assert metric_id in self.ATTRIBUTES | self.IMPACT
            else:
                assert "placeholder" not in metric

    def test_the_same_entry_gives_the_same_answer_every_time(self, user, brazil):
        """A page whose figures moved between loads would be worse than a blank one."""
        first = self.entry(user, placeholders="true")
        second = self.entry(user, placeholders="true")

        assert {k: v["value"] for k, v in first.items()} == {
            k: v["value"] for k, v in second.items()
        }

    def test_two_entries_do_not_get_the_same_answer(self, user, brazil, africa):
        """Seeded per entry, so the pages do not all read alike."""
        brazil_metrics = self.entry(user, placeholders="true")
        africa_metrics = self.entry(user, key="AFR", placeholders="true")

        assert any(
            brazil_metrics[m]["value"] != africa_metrics[m]["value"]
            for m in self.IMPACT
        )

    def test_a_fact_shown_twice_cannot_disagree_with_itself(self, user, brazil):
        """These are one fact each, rendered in two sections of the page."""
        metrics = self.entry(user, placeholders="true")

        assert (
            metrics["attr_certification"]["value"]
            == metrics["impact_certification"]["value"]
        )
        assert metrics["attr_meps"]["value"] == metrics["impact_meps"]["value"]

    def test_an_aggregate_entry_gets_impact_figures_but_no_attributes(
        self, user, africa
    ):
        """A region has people trained across it, but no ozone unit of its own."""
        metrics = self.entry(user, key="AFR", placeholders="true")

        assert self.flagged(metrics) == self.IMPACT
        for metric_id in self.ATTRIBUTES:
            assert metrics[metric_id]["available"] is False

    def test_a_placeholder_that_breaks_costs_only_itself(self, caplog):
        """A demo aid must not be able to take the endpoint down."""
        broken = replace(
            get_metric("attr_nou_name"), compute=None, placeholder=_explode
        )

        # pylint: disable=W0212
        rendered = dashboard_metrics._render(broken, MetricContext(), True)

        assert rendered["available"] is False
        assert "placeholder" not in rendered
        assert "attr_nou_name" in caplog.text

    def test_a_real_metric_never_gains_a_stand_in(self, user, brazil):
        """``placeholder`` only fires where ``compute`` gave nothing."""
        available = {m.metric_id for m in COUNTRY_METRICS if m.compute is not None}

        metrics = self.entry(user, placeholders="true")
        assert self.flagged(metrics) & available == set()

    def test_a_nonsense_value_is_rejected(self, user, brazil):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"placeholders": "maybe"})
        assert response.status_code == 400

    def test_it_can_be_turned_off_explicitly(self, user, brazil):
        assert self.flagged(self.entry(user, placeholders="false")) == set()


class TestFundPlaceholders(BaseTest):
    """The one fund row with no source, and its one real component."""

    url = reverse("dashboard-metrics-fund")

    def fund(self, user, **params):
        self.client.force_authenticate(user=user)
        response = self.client.get(self.url, params)
        assert response.status_code == 200
        return metrics_by_id(response.data)

    def test_the_baseline_table_keeps_its_shape_without_placeholders(
        self, user, brazil
    ):
        """All three rows, with the two we cannot work out as null - not zero."""
        metric = self.fund(user)["baseline_phased_out_by_substance"]
        rows = {row["group"]: row for row in metric["value"]}

        assert metric["available"] is True
        assert "placeholder" not in metric
        assert rows["HFC"]["value"] is None
        assert rows["HCFC"]["value"] is None
        assert rows["OTHER_ODS"]["value"] == 100.0

    def test_asking_serves_all_three_families(self, user, brazil):
        metric = self.fund(user, placeholders="true")[
            "baseline_phased_out_by_substance"
        ]

        assert metric["available"] is True
        assert [row["group"] for row in metric["value"]] == ["HFC", "HCFC", "OTHER_ODS"]

    def test_the_invented_rows_are_flagged_and_the_real_one_is_not(self, user, brazil):
        """Partly invented, so the rows say which halves are which."""
        metric = self.fund(user, placeholders="true")[
            "baseline_phased_out_by_substance"
        ]
        rows = {row["group"]: row for row in metric["value"]}

        # The metric-level flag says "contains invented data" without a walk.
        assert metric["placeholder"] is True
        assert rows["HFC"]["placeholder"] is True
        assert rows["HCFC"]["placeholder"] is True

        # Article 5 countries really have phased these out completely.
        assert rows["OTHER_ODS"]["value"] == 100.0
        assert "placeholder" not in rows["OTHER_ODS"]


class TestSpecCommand:
    """The registry's documentation half, replacing the old /spec/ endpoint."""

    def test_it_renders_every_metric(self):
        out = StringIO()
        call_command("dashboard_metrics_spec", stdout=out)
        rendered = out.getvalue()

        assert "91 metrics, 78 implemented." in rendered
        for metric_id in FUND_METRIC_IDS | COUNTRY_METRIC_IDS:
            assert f"`{metric_id}`" in rendered

    def test_pipes_in_a_value_cannot_break_the_table(self):
        out = StringIO()
        call_command("dashboard_metrics_spec", stdout=out)

        for line in out.getvalue().splitlines():
            if line.startswith("| `"):
                assert line.count("|") - line.count("\\|") == len(COLUMNS) + 1
