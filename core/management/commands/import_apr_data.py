from pathlib import Path

from django.core.management.base import BaseCommand

from core.import_data.import_apr import import_apr_data


class Command(BaseCommand):
    help = "Import Annual Project Report data from Excel file"

    def add_arguments(self, parser):
        parser.add_argument(
            "file_path",
            type=str,
            help="Path to the Excel file containing APR data",
        )
        parser.add_argument(
            "year",
            type=int,
            help="Year of the APR to import",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Perform a dry run without saving changes",
        )

    def handle(self, *args, **options):
        file_path = Path(options["file_path"])
        year = options["year"]
        dry_run = options.get("dry_run", False)

        if not file_path.exists():
            self.stdout.write(self.style.ERROR(f"File not found: {file_path}"))
            return

        if dry_run:
            self.stdout.write(
                self.style.WARNING("Dry run mode - no changes will be saved!")
            )

        try:
            stats = import_apr_data(
                file_path=file_path,
                year=year,
                dry_run=dry_run,
            )

            self.stdout.write("\n" + "=" * 60)
            self.stdout.write(self.style.SUCCESS("IMPORT SUMMARY"))
            self.stdout.write("=" * 60)
            self.stdout.write(f"Total rows processed: {stats['total']}")
            self.stdout.write(
                self.style.SUCCESS(f"Successfully updated: {stats['updated']}")
            )
            self.stdout.write(
                self.style.SUCCESS(f"Successfully created: {stats['created']}")
            )
            self.stdout.write(
                self.style.WARNING(
                    f"Skipped (no legacy code or project code): {stats['no_legacy_code']}"
                )
            )
            self.stdout.write(
                self.style.WARNING(f"Skipped (project not found): {stats['not_found']}")
            )
            self.stdout.write(self.style.ERROR(f"Errors: {stats['errors']}"))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Import failed: {str(e)}"))
            raise
