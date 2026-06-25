"""
Run sync_apr_from_projects synchronously from the CLI, for a controlled,
observable backfill of APR denormalized fields from current Project data.

The admin UI normally dispatches this as a Celery task (POST .../sync). This
command runs the very same task function in-process so it can be driven directly
on the app container, with a --dry-run preview and an immediate summary.

sync_apr_from_projects only writes rows whose denorm values actually changed and
early-returns (no writes) for ENDORSED years, so it is safe to re-run.
"""

from django.core.management import BaseCommand

from core.tasks import sync_apr_from_projects


class Command(BaseCommand):
    help = (
        "Synchronously resync APR denormalized fields from current Project data "
        "for the given year(s). Use --dry-run to preview counts without writing."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--year",
            type=int,
            nargs="+",
            required=True,
            help="One or more reporting years to resync.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Compute and report what would change without writing anything.",
        )

    def handle(self, *args, **options):
        years = options["year"]
        dry_run = options["dry_run"]

        mode = "DRY RUN (no writes)" if dry_run else "LIVE (writing changes)"
        self.stdout.write(f"resync_apr_from_projects - {mode}")
        self.stdout.write("=" * 72)

        for year in years:
            self.stdout.write("")
            self.stdout.write(f"Year {year}:")
            result = sync_apr_from_projects(year, dry_run=dry_run)
            for key in (
                "updated_count",
                "changed_count",
                "added_count",
                "deleted_count",
                "agencies_count",
            ):
                if key in result:
                    self.stdout.write(f"  {key:<15}: {result[key]}")
            message = result.get("message")
            if message:
                style = self.style.SUCCESS if not dry_run else self.style.WARNING
                self.stdout.write("  " + style(message))
