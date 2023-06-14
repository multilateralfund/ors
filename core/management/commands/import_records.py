from django.core.management import BaseCommand
from core.import_data.import_records_xlsx import import_records as rec_xlsx
from core.import_data.import_item_attributes import (
    import_records_from_databases as rec_cp_db,
)
from core.import_data.import_admb import import_admb_items


class Command(BaseCommand):
    help = """
        Import records
        params:
            - type = xlsx_files => records from xlsx files
            - type = item_attributes => item_attributes from databases
            - type = admb_items => admb items from databases
    """

    def add_arguments(self, parser):
        parser.add_argument(
            "type",
            type=str,
            help="Records type",
            default="all",
            choices=["xlsx_files", "item_attributes", "admb_items", "all"],
        )

    def handle(self, *args, **kwargs):
        rec_type = kwargs["type"]

        if rec_type in ["xlsx_files", "all"]:
            rec_xlsx()
        if rec_type in ["item_attributes", "all"]:
            rec_cp_db()
        if rec_type in ["admb_items", "all"]:
            import_admb_items()
