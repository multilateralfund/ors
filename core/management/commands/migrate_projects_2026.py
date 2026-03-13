from django.core.management import BaseCommand

from core.import_data_v2.migrate_projects_2026 import migrate_projects_2026


class Command(BaseCommand):
    help = """
        Script to handle the new projects migration of 2026
    """

    def add_arguments(self, parser):
        parser.add_argument(
            "option",
            type=str,
            help="Method to run",
            choices=[
                "create_missing_clusters_types_sectors_subsectors",
                "current_inventory",
                "set_new_code",
                "ods_phaseout_fields",
                "ods_production_fields",
                "funding_fields",
                "transfer_fields",
                "c_and_p",
            ],
        )
        parser.add_argument(
            "--dry-run",
            type=bool,
            help="Run the migration without saving any changes to the database",
        )

    def handle(self, *args, **kwargs):
        dry_run = kwargs["dry_run"]
        option = kwargs["option"]
        migrate_projects_2026(option, dry_run=dry_run)
