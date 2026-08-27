"""
Repair APR rows whose metric-tonne phase-out values were lost when the reporting
year was opened.

`get_previous_year_project_reports()` carried the ODP and CO2 phase-out actuals
forward into each new reporting year but omitted the two MT fields, so agencies
found MT empty every year while its siblings persisted. The summary tables then
reported 0 for MT (the sums coerce NULL with `or 0`) while CO2 came out fine.

This command walks back through earlier reporting years to find the most recent
value each project actually reported, and fills it in.

It only writes rows whose MT value is NULL -- the state produced by the missing
carry-forward. A value of 0.0 is what an agency typed, and is left alone unless
--include-zeros is passed. Endorsed years are read from but never written to,
unless --include-endorsed is passed.

Nothing is written without an explicit run: use --dry-run first.
"""

from collections import defaultdict

from django.core.management import BaseCommand
from django.db import transaction

from core.models.annual_project_report import AnnualProgressReport
from core.models.annual_project_report import AnnualProjectReport

MT_FIELDS = ("consumption_phased_out_mt", "production_phased_out_mt")


class Command(BaseCommand):
    help = (
        "Backfill APR consumption/production_phased_out_mt from the most recent "
        "earlier reporting year that has a value. Use --dry-run to preview."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--year",
            type=int,
            nargs="+",
            default=None,
            help="Reporting year(s) to repair (default: all non-endorsed years).",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report what would change without writing anything.",
        )
        parser.add_argument(
            "--include-zeros",
            action="store_true",
            help=(
                "Also overwrite MT values that are 0.0. Off by default: 0.0 is a "
                "value an agency entered, NULL is the one the carry-forward lost."
            ),
        )
        parser.add_argument(
            "--include-endorsed",
            action="store_true",
            help="Allow writing to endorsed years (they are skipped by default).",
        )

    def handle(self, *args, **options):
        # pylint: disable=R0914,R0915
        dry_run = options["dry_run"]
        include_zeros = options["include_zeros"]
        include_endorsed = options["include_endorsed"]

        mode = "DRY RUN (no writes)" if dry_run else "LIVE (writing changes)"
        self.stdout.write(f"backfill_apr_phaseout_mt - {mode}")
        self.stdout.write("=" * 72)

        endorsed_years = set(
            AnnualProgressReport.objects.filter(endorsed=True).values_list(
                "year", flat=True
            )
        )

        target_years = options["year"]
        if target_years is None:
            target_years = list(
                AnnualProgressReport.objects.filter(endorsed=False)
                .values_list("year", flat=True)
                .order_by("year")
            )
        target_years = sorted(target_years)

        skipped = [y for y in target_years if y in endorsed_years]
        if skipped and not include_endorsed:
            self.stdout.write(
                self.style.WARNING(
                    f"Skipping endorsed year(s): {skipped} (use --include-endorsed)"
                )
            )
            target_years = [y for y in target_years if y not in endorsed_years]

        if not target_years:
            self.stdout.write(self.style.WARNING("No years to process."))
            return

        # One pass over every APR row, indexed by (project code, agency) exactly as
        # get_previous_year_project_reports() keys them, so the backfill and the
        # carry-forward agree on what "the same project" means.
        self.stdout.write("Loading all APR rows ...")
        by_key = defaultdict(dict)
        rows = AnnualProjectReport.objects.select_related(
            "project", "report__agency", "report__progress_report"
        ).only(
            "id",
            "consumption_phased_out_mt",
            "production_phased_out_mt",
            "project__code",
            "report__agency__id",
            "report__progress_report__year",
        )
        for apr in rows.iterator(chunk_size=2000):
            key = (apr.project.code, apr.report.agency_id)
            by_key[key][apr.report.progress_report.year] = apr

        self.stdout.write(f"  {len(by_key)} project/agency series loaded")

        # Ascending, so a year repaired earlier can feed the next one.
        grand_total = 0
        for year in target_years:
            self.stdout.write("")
            self.stdout.write(f"Year {year}:")

            to_update = []
            stats = {f: 0 for f in MT_FIELDS}
            no_source = {f: 0 for f in MT_FIELDS}
            examined = 0

            for series in by_key.values():
                apr = series.get(year)
                if apr is None:
                    continue
                examined += 1

                changed = False
                for field in MT_FIELDS:
                    current = getattr(apr, field)
                    needs_fill = current is None or (include_zeros and current == 0)
                    if not needs_fill:
                        continue

                    source = self._find_source(series, year, field)
                    if source is None:
                        no_source[field] += 1
                        continue

                    setattr(apr, field, source)
                    stats[field] += 1
                    changed = True

                if changed:
                    to_update.append(apr)

            self.stdout.write(f"  rows in year        : {examined}")
            for field in MT_FIELDS:
                self.stdout.write(
                    f"  {field:32}: {stats[field]:6} fillable, "
                    f"{no_source[field]:6} empty with no earlier value"
                )
            self.stdout.write(f"  rows to write       : {len(to_update)}")

            if to_update and not dry_run:
                with transaction.atomic():
                    AnnualProjectReport.objects.bulk_update(
                        to_update, list(MT_FIELDS), batch_size=500
                    )
                self.stdout.write(
                    self.style.SUCCESS(f"  wrote {len(to_update)} row(s)")
                )
            elif to_update:
                self.stdout.write(
                    self.style.WARNING(f"  would write {len(to_update)} row(s)")
                )

            grand_total += len(to_update)

        self.stdout.write("")
        self.stdout.write("=" * 72)
        verb = "Would update" if dry_run else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{verb} {grand_total} row(s) in total."))
        if dry_run:
            self.stdout.write("Re-run without --dry-run to apply.")

    @staticmethod
    def _find_source(series, year, field):
        """
        Most recent value for `field` strictly before `year`.

        Walks back rather than looking only at year-1, so a project that skipped a
        reporting year (or lost MT in several consecutive years) still recovers the
        last figure its agency actually reported.
        """
        for earlier in sorted((y for y in series if y < year), reverse=True):
            value = getattr(series[earlier], field)
            if value is not None:
                return value
        return None
