from django.core.management import BaseCommand
from core.import_data.import_records_xlsx import import_records as rec_xlsx
from core.import_data.import_records_cp_db import (
    import_records_from_databases as rec_cp_db,
)


class Command(BaseCommand):
    help = """
        Import records
        params:
            - type = xlsx_files => from xlsx files
            - type = cp_db => from databases
    """

    def add_arguments(self, parser):
        parser.add_argument(
            "type",
            type=str,
            help="Records type",
            default="all",
            choices=["xlsx_files", "cp_db", "all"],
        )

    def handle(self, *args, **kwargs):
        rec_type = kwargs["type"]

        if rec_type in ["xlsx_files", "all"]:
            rec_xlsx()
        if rec_type in ["cp_db", "all"]:
            rec_cp_db()
