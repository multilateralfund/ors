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
from core.api.dashboard_metrics import classify, get_metric, registry, taxonomy
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


def assert_envelope(payload, all_unavailable=False):
    """Every payload discloses its scope and its APR axes."""
    assert payload["as_of"].endswith("Z")
    assert "apr_scope" not in payload  # one axis; values carry both components
    assert isinstance(payload["apr_years_available"], list)
    assert payload["scope"]["population"] == "latest"
    assert sorted(payload["scope"]["excluded_statuses"]) == ["Closed", "Transferred"]
    assert payload["scope"]["production_included"] is True
    for metric in payload["metrics"]:
        assert metric["kind"] in ("scalar", "breakdown", "table", "series")
        assert metric["available"] is (metric["value"] is not None)
        if all_unavailable:
            assert metric["available"] is False
        # Nothing internal leaks onto a payload headed for a public page.
        assert "unavailable_reason" not in metric


def metrics_by_id(payload):
    """The payload's metrics, addressable by id."""
    return {metric["metric_id"]: metric for metric in payload["metrics"]}


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
        assert_envelope(response.data, all_unavailable=True)

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

    def test_every_fund_metric_computes_unless_it_is_blocked(self):
        """The two exceptions are declared blocked and say why."""
        uncomputed = {m.metric_id for m in FUND_METRICS if m.compute is None}
        assert uncomputed == {"baseline_phased_out_by_substance", "funds_lvc_split"}
        assert all(
            m.disposition == Disposition.NOT_AVAILABLE
            for m in FUND_METRICS
            if m.metric_id in uncomputed
        )

    def test_blocked_metrics_say_why(self):
        """Not served, but the spec command needs a reason for every one."""
        blocked = [
            m
            for m in FUND_METRICS + COUNTRY_METRICS
            if m.disposition == Disposition.NOT_AVAILABLE
        ]
        assert len(blocked) == 15
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
            "noninv_first_disbursement_scope",
        ):
            assert metrics[metric_id]["available"] is False
        assert metrics["funds_approved"]["available"] is True
        assert metrics["sector_ac"]["value"]["funds_disbursed"] is None

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

        with caplog.at_level("INFO"):
            classified = classify.classify([project])

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


class TestSpecCommand:
    """The registry's documentation half, replacing the old /spec/ endpoint."""

    def test_it_renders_every_metric(self):
        out = StringIO()
        call_command("dashboard_metrics_spec", stdout=out)
        rendered = out.getvalue()

        assert "90 metrics, 46 implemented." in rendered
        for metric_id in FUND_METRIC_IDS | COUNTRY_METRIC_IDS:
            assert f"`{metric_id}`" in rendered

    def test_pipes_in_a_value_cannot_break_the_table(self):
        out = StringIO()
        call_command("dashboard_metrics_spec", stdout=out)

        for line in out.getvalue().splitlines():
            if line.startswith("| `"):
                assert line.count("|") - line.count("\\|") == len(COLUMNS) + 1
