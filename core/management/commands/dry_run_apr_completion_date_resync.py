"""
Read-only impact report for the change to
AnnualProjectReport.date_of_completion_per_agreement_or_decisions.

The derivation moved from "latest project version's date_completion" to mirroring
the master/inventory report's MetaProject split: the "Extended Date"
(MetaProject.extended_date_of_completion) when present, otherwise the
"MYA Completion Date" (MetaProject.end_date).

Stored APR rows keep the OLD value in
`date_of_completion_per_agreement_or_decisions_denorm` until a real
`sync_apr_from_projects` run rewrites them. This command computes the NEW value
in memory and diffs it against the stored value WITHOUT writing anything, so the
production impact can be reviewed before any resync.

It deliberately reports separately on:
  - "blanked out": rows that had a date and would become empty (the main risk);
  - "newly populated": rows that were empty and would gain a date;
  - "changed value": rows where both old and new are set but differ.

Note: a real `sync_apr_from_projects` skips ENDORSED years entirely. By default
this command reports on ALL years (to show the full data divergence) and flags
which years are endorsed (and therefore protected from a real resync). Pass
--exclude-endorsed to mirror what a real sync would actually touch.
"""

from collections import defaultdict

from django.core.management import BaseCommand

from core.models.annual_project_report import AnnualProjectReport
from core.models.annual_project_report import AnnualProgressReport


class Command(BaseCommand):
    help = (
        "Read-only dry run: report how many APR rows would change their "
        "date_of_completion_per_agreement_or_decisions under the new "
        "MetaProject-based derivation. Writes nothing."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--year",
            type=int,
            nargs="+",
            default=None,
            help="Restrict to one or more reporting years (default: all years).",
        )
        parser.add_argument(
            "--exclude-endorsed",
            action="store_true",
            help=(
                "Skip endorsed years, mirroring what a real sync_apr_from_projects "
                "would actually touch."
            ),
        )
        parser.add_argument(
            "--show-samples",
            type=int,
            default=10,
            help="Print up to N example diffs per change category (default: 10).",
        )

    def handle(self, *args, **options):
        years = options["year"]
        exclude_endorsed = options["exclude_endorsed"]
        show_samples = options["show_samples"]

        endorsed_years = set(
            AnnualProgressReport.objects.filter(endorsed=True).values_list(
                "year", flat=True
            )
        )

        qs = AnnualProjectReport.objects.select_related(
            "project__meta_project",
            "report__progress_report",
        )
        if years:
            qs = qs.filter(report__progress_report__year__in=years)
        if exclude_endorsed:
            qs = qs.exclude(report__progress_report__year__in=endorsed_years)

        # Per-year tallies.
        stats = defaultdict(
            lambda: {
                "examined": 0,
                "unchanged": 0,
                "blanked_out": 0,
                "newly_populated": 0,
                "changed_value": 0,
            }
        )
        samples = defaultdict(list)  # category -> list of sample strings

        for apr in qs.iterator(chunk_size=2000):
            year = apr.report.progress_report.year
            bucket = stats[year]
            bucket["examined"] += 1

            old = apr.date_of_completion_per_agreement_or_decisions_denorm
            # The new property reads only project.meta_project, so it is accurate
            # without the version prefetch the full sync sets up.
            new = apr.date_of_completion_per_agreement_or_decisions

            if old == new:
                bucket["unchanged"] += 1
                continue

            if old is not None and new is None:
                category = "blanked_out"
            elif old is None and new is not None:
                category = "newly_populated"
            else:
                category = "changed_value"

            bucket[category] += 1
            if len(samples[(year, category)]) < show_samples:
                samples[(year, category)].append(
                    f"    {apr.project.code or apr.project_id}: {old} -> {new}"
                )

        self._print_report(stats, samples, endorsed_years, exclude_endorsed)

    def _print_report(self, stats, samples, endorsed_years, exclude_endorsed):
        if not stats:
            self.stdout.write("No APR rows matched the given filters.")
            return

        totals = defaultdict(int)
        self.stdout.write("")
        self.stdout.write(
            "Impact of new date_of_completion_per_agreement_or_decisions derivation"
        )
        self.stdout.write("(read-only; nothing was written)")
        self.stdout.write("=" * 72)

        for year in sorted(stats):
            b = stats[year]
            endorsed = year in endorsed_years
            flag = " [ENDORSED - protected from real sync]" if endorsed else ""
            self.stdout.write("")
            self.stdout.write(f"Year {year}{flag}")
            self.stdout.write(f"  examined        : {b['examined']}")
            self.stdout.write(f"  unchanged       : {b['unchanged']}")
            self.stdout.write(
                self.style.WARNING(f"  blanked out     : {b['blanked_out']}")
            )
            self.stdout.write(f"  newly populated : {b['newly_populated']}")
            self.stdout.write(f"  changed value   : {b['changed_value']}")

            for category in ("blanked_out", "newly_populated", "changed_value"):
                lines = samples.get((year, category))
                if lines:
                    self.stdout.write(f"  e.g. {category} (old -> new):")
                    for line in lines:
                        self.stdout.write(line)

            for key in b:
                totals[key] += b[key]

        self.stdout.write("")
        self.stdout.write("-" * 72)
        self.stdout.write("TOTAL (all reported years)")
        self.stdout.write(f"  examined        : {totals['examined']}")
        self.stdout.write(f"  unchanged       : {totals['unchanged']}")
        self.stdout.write(
            self.style.WARNING(f"  blanked out     : {totals['blanked_out']}")
        )
        self.stdout.write(f"  newly populated : {totals['newly_populated']}")
        self.stdout.write(f"  changed value   : {totals['changed_value']}")

        if not exclude_endorsed and endorsed_years:
            self.stdout.write("")
            self.stdout.write(
                "Note: endorsed years above are flagged but would NOT be rewritten "
                "by a real sync_apr_from_projects (it early-returns for endorsed "
                "years). Re-run with --exclude-endorsed to see only what a real "
                "sync would change."
            )
