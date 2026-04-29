from unittest.mock import MagicMock

import pytest
from django.db.models import Prefetch

from core.api.export.projects_inventory_report import ProjectsInventoryReportWriter
from core.api.tests.factories import (
    AnnualAgencyProjectReportFactory,
    AnnualProgressReportFactory,
    AnnualProjectReportFactory,
    ProjectFactory,
)
from core.models import Project as ProjectModel
from core.models.annual_project_report import AnnualProjectReport

pytestmark = pytest.mark.django_db


class TestGetLatestApr:  # pylint: disable=protected-access
    def test_returns_none_when_attr_missing(self):
        # this makes sure there is no prefetched_endorsed_aprs attribute on the project,
        # which should lead to `_get_latest_apr` returning None.
        project = MagicMock(spec=[])
        assert ProjectsInventoryReportWriter._get_latest_apr(project) is None

    def test_returns_none_when_list_empty(self):
        project = MagicMock(prefetched_endorsed_aprs=[])
        assert ProjectsInventoryReportWriter._get_latest_apr(project) is None

    def test_returns_first_item(self):
        apr1, apr2 = MagicMock(), MagicMock()
        project = MagicMock(prefetched_endorsed_aprs=[apr1, apr2])
        assert ProjectsInventoryReportWriter._get_latest_apr(project) is apr1


class TestAprPhaseOutTotal:  # pylint: disable=protected-access
    def _make_apr(self, consumption, production):
        apr = MagicMock()
        apr.consumption_phased_out_odp = consumption
        apr.production_phased_out_odp = production
        return apr

    def test_returns_none_when_apr_is_none(self):
        assert (
            ProjectsInventoryReportWriter._apr_phase_out_total(
                None, "consumption_phased_out_odp", "production_phased_out_odp"
            )
            is None
        )

    def test_sums_consumption_and_production(self):
        apr = self._make_apr(consumption=3.0, production=7.0)
        result = ProjectsInventoryReportWriter._apr_phase_out_total(
            apr, "consumption_phased_out_odp", "production_phased_out_odp"
        )
        assert result == pytest.approx(10.0)

    def test_treats_none_field_as_zero(self):
        apr = self._make_apr(consumption=None, production=5.0)
        result = ProjectsInventoryReportWriter._apr_phase_out_total(
            apr, "consumption_phased_out_odp", "production_phased_out_odp"
        )
        assert result == pytest.approx(5.0)

    def test_returns_none_when_both_fields_none(self):
        apr = self._make_apr(consumption=None, production=None)
        result = ProjectsInventoryReportWriter._apr_phase_out_total(
            apr, "consumption_phased_out_odp", "production_phased_out_odp"
        )
        assert result is None


class TestPrefetchedEndorsedAprs:  # pylint: disable=protected-access
    def test_latest_endorsed_apr_resolved_via_prefetch(self):
        project = ProjectFactory()

        # Older endorsed APR (year N)
        older_progress = AnnualProgressReportFactory(year=2023, endorsed=True)
        older_agency_report = AnnualAgencyProjectReportFactory(
            progress_report=older_progress
        )
        AnnualProjectReportFactory(
            project=project,
            report=older_agency_report,
            funds_disbursed=100.0,
        )

        # Newer endorsed APR (year N+1)
        newer_progress = AnnualProgressReportFactory(year=2024, endorsed=True)
        newer_agency_report = AnnualAgencyProjectReportFactory(
            progress_report=newer_progress
        )
        newer_apr = AnnualProjectReportFactory(
            project=project,
            report=newer_agency_report,
            funds_disbursed=200.0,
        )

        # Non-endorsed APR, which must be excluded
        draft_progress = AnnualProgressReportFactory(year=2025, endorsed=False)
        draft_agency_report = AnnualAgencyProjectReportFactory(
            progress_report=draft_progress
        )
        AnnualProjectReportFactory(
            project=project,
            report=draft_agency_report,
            funds_disbursed=999.0,
        )

        qs = ProjectModel.objects.prefetch_related(
            Prefetch(
                "annual_reports",
                queryset=AnnualProjectReport.objects.filter(
                    report__progress_report__endorsed=True
                )
                .select_related("report__progress_report")
                .order_by("-report__progress_report__year"),
                to_attr="prefetched_endorsed_aprs",
            )
        ).filter(pk=project.pk)

        fetched_project = qs.get()
        apr = ProjectsInventoryReportWriter._get_latest_apr(fetched_project)

        assert apr is not None
        assert apr.pk == newer_apr.pk
        assert apr.funds_disbursed == 200.0
