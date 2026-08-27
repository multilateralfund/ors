"""
The metric-tonne phase-out actuals must survive a new reporting year, and the
rows that already lost them must be repairable.
"""

from io import StringIO

import pytest
from django.core.management import call_command

from core.api.tests.factories import AnnualAgencyProjectReportFactory
from core.api.tests.factories import AnnualProgressReportFactory
from core.api.tests.factories import AnnualProjectReportFactory
from core.api.tests.factories import ProjectFactory
from core.api.utils import get_previous_year_project_reports
from core.models import AnnualProjectReport

pytestmark = pytest.mark.django_db


def _report_for(agency, year, endorsed=False):
    return AnnualAgencyProjectReportFactory(
        progress_report=AnnualProgressReportFactory(year=year, endorsed=endorsed),
        agency=agency,
    )


def _apr(report, project, **kwargs):
    return AnnualProjectReportFactory(report=report, project=project, **kwargs)


class TestPhaseoutCarriedForward:
    """
    The MT fields were omitted from the carry-forward while ODP and CO2 were
    included, so agencies found MT blank every year and the summary tables
    reported 0 for MT while CO2 came out fine.
    """

    def test_mt_is_carried_forward_alongside_odp_and_co2(self, agency):
        project = ProjectFactory(agency=agency)
        _apr(
            _report_for(agency, 2024),
            project,
            consumption_phased_out_odp=10,
            consumption_phased_out_mt=111,
            consumption_phased_out_co2=1000,
            production_phased_out_odp=5,
            production_phased_out_mt=222,
            production_phased_out_co2=500,
        )

        carried = get_previous_year_project_reports(agency.id, 2025)

        assert carried[(project.code, agency.id)]["consumption_phased_out_mt"] == 111
        assert carried[(project.code, agency.id)]["production_phased_out_mt"] == 222


class TestBackfillPhaseoutMT:
    """`backfill_apr_phaseout_mt` repairs rows the carry-forward already lost."""

    def _run(self, *args):
        out = StringIO()
        call_command("backfill_apr_phaseout_mt", *args, stdout=out)
        return out.getvalue()

    def test_fills_a_null_year_from_the_year_before(self, agency):
        project = ProjectFactory(agency=agency)
        _apr(
            _report_for(agency, 2024),
            project,
            consumption_phased_out_mt=111,
            production_phased_out_mt=222,
        )
        lost = _apr(
            _report_for(agency, 2025),
            project,
            consumption_phased_out_mt=None,
            production_phased_out_mt=None,
        )

        self._run("--year", "2025")

        lost.refresh_from_db()
        assert lost.consumption_phased_out_mt == 111
        assert lost.production_phased_out_mt == 222

    def test_dry_run_writes_nothing(self, agency):
        project = ProjectFactory(agency=agency)
        _apr(_report_for(agency, 2024), project, consumption_phased_out_mt=111)
        lost = _apr(_report_for(agency, 2025), project, consumption_phased_out_mt=None)

        output = self._run("--year", "2025", "--dry-run")

        lost.refresh_from_db()
        assert lost.consumption_phased_out_mt is None
        assert "would write" in output.lower()

    def test_leaves_an_agency_entered_zero_alone(self, agency):
        """0.0 is a value someone typed; NULL is the one the carry-forward lost."""
        project = ProjectFactory(agency=agency)
        _apr(_report_for(agency, 2024), project, consumption_phased_out_mt=111)
        deliberate = _apr(
            _report_for(agency, 2025), project, consumption_phased_out_mt=0
        )

        self._run("--year", "2025")

        deliberate.refresh_from_db()
        assert deliberate.consumption_phased_out_mt == 0

    def test_include_zeros_overwrites_it(self, agency):
        project = ProjectFactory(agency=agency)
        _apr(_report_for(agency, 2024), project, consumption_phased_out_mt=111)
        zeroed = _apr(_report_for(agency, 2025), project, consumption_phased_out_mt=0)

        self._run("--year", "2025", "--include-zeros")

        zeroed.refresh_from_db()
        assert zeroed.consumption_phased_out_mt == 111

    def test_walks_back_past_a_year_that_also_lost_the_value(self, agency):
        """Two consecutive lost years still recover the last reported figure."""
        project = ProjectFactory(agency=agency)
        _apr(_report_for(agency, 2023), project, consumption_phased_out_mt=111)
        _apr(_report_for(agency, 2024), project, consumption_phased_out_mt=None)
        lost = _apr(_report_for(agency, 2025), project, consumption_phased_out_mt=None)

        self._run("--year", "2025")

        lost.refresh_from_db()
        assert lost.consumption_phased_out_mt == 111

    def test_skips_endorsed_years_unless_asked(self, agency):
        project = ProjectFactory(agency=agency)
        _apr(_report_for(agency, 2024), project, consumption_phased_out_mt=111)
        endorsed = _apr(
            _report_for(agency, 2025, endorsed=True),
            project,
            consumption_phased_out_mt=None,
        )

        output = self._run("--year", "2025")

        endorsed.refresh_from_db()
        assert endorsed.consumption_phased_out_mt is None
        assert "endorsed" in output.lower()

        self._run("--year", "2025", "--include-endorsed")

        endorsed.refresh_from_db()
        assert endorsed.consumption_phased_out_mt == 111

    def test_leaves_a_project_with_no_earlier_value_untouched(self, agency):
        project = ProjectFactory(agency=agency)
        orphan = _apr(
            _report_for(agency, 2025), project, consumption_phased_out_mt=None
        )

        self._run("--year", "2025")

        orphan.refresh_from_db()
        assert orphan.consumption_phased_out_mt is None
        assert AnnualProjectReport.objects.filter(
            consumption_phased_out_mt__isnull=True
        ).exists()
