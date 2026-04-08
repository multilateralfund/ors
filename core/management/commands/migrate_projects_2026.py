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
                "fill_total_phase_out_values_in_project",
                "fill_project_end_date_mya_with_date_per_agreement",
                "funding_fields",
                "transfer_fields",
                "import_interest",
                "import_hfc_plus",
                "process_master_data_sheet",
                "c_and_p",
            ],
        )
        parser.add_argument(
            "--second-option",
            type=str,
            help="Second parameter for the method to run, if needed",
            choices=[
                None,
                "set_cluster_type_sector_subsector",
                "set_new_code",
                "check_code_metacode",
                "check_category_changed",
            ],
            nargs="?",
        )
        parser.add_argument(
            "--dry-run",
            type=bool,
            help="Run the migration without saving any changes to the database",
        )
        parser.add_argument(
            "--run-only-transfered",
            type=bool,
            help="Run only the transfer_fields method for projects with status Transferred",
        )

    def handle(self, *args, **kwargs):
        dry_run = kwargs["dry_run"]
        option = kwargs["option"]
        only_transfered = kwargs["run_only_transfered"]
        second_parameter = kwargs["second_option"]
        migrate_projects_2026(
            option,
            second_parameter=second_parameter,
            dry_run=dry_run,
            only_transfered=only_transfered,
        )
