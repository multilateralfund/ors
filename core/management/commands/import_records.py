from django.core.management import BaseCommand
from core.import_data.import_records_sectionB import import_records as rec_sectonB
from core.import_data.import_records_cp_db import (
    import_records_from_databases as rec_cp_db,
)


class Command(BaseCommand):
    help = """
        Import records
        params:
            - type = sectionb => from xlsx sectionB
            - type = cp_db => from databases
    """

    def add_arguments(self, parser):
        parser.add_argument("type", type=str, help="Records type", default="all")

    def handle(self, *args, **kwargs):
        rec_type = kwargs["type"]

        if rec_type in ["sectionb", "all"]:
            rec_sectonB()
        if rec_type in ["cp_db", "all"]:
            rec_cp_db()
