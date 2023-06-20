from django.core.management import BaseCommand

from core.import_data.import_admb import import_admb_items
from core.import_data.import_admc import import_admc_items
from core.import_data.import_admde import import_admde_items
from core.import_data.import_item_attributes import (
    import_records_from_databases as rec_cp_db,
)
from core.import_data.import_records_section_AB import import_records as rec_xlsx_sec_AB
from core.import_data.import_records_section_C import import_records as rec_xlsx_sec_C
from core.import_data.import_records_section_D import import_records as rec_xlsx_sec_D
from core.import_data.import_records_section_E import import_records as rec_xlsx_sec_E


class Command(BaseCommand):
    help = """
        Import records
        params:
            - type = xlsx_files => records from xlsx files
            - type = section_ab => records from section A and B (xlsx files)
            - type = section_c => records from section C (xlsx files)
            - type = section_d => records from section D (xlsx files)
            - type = section_e => records from section E (xlsx files)
            - type = cp_db_records => records from country programme databases
            - type = item_attributes => item_attributes from databases
            - type = admb_items => admb items from databases
            - type = admc_items => admc items from databases
            - type = admde_items => admde items from databases
    """

    def add_arguments(self, parser):
        parser.add_argument(
            "type",
            type=str,
            help="Records type",
            default="all",
            choices=[
                "xlsx_files",
                "section_ab",
                "section_c",
                "section_d",
                "section_e",
                "cp_db_records",
                "item_attributes",
                "admb_items",
                "admc_items",
                "admde_items",
                "all",
            ],
        )

    def handle(self, *args, **kwargs):
        rec_type = kwargs["type"]

        if rec_type in ["section_ab", "xlsx_files", "all"]:
            rec_xlsx_sec_AB()
        if rec_type in ["section_c", "xlsx_files", "all"]:
            rec_xlsx_sec_C()
        if rec_type in ["section_d", "xlsx_files", "all"]:
            rec_xlsx_sec_D()
        if rec_type in ["section_e", "xlsx_files", "all"]:
            rec_xlsx_sec_E()
        if rec_type in ["item_attributes", "all"]:
            rec_cp_db()
        if rec_type in ["admb_items", "cp_db_records", "all"]:
            import_admb_items()
        if rec_type in ["admc_items", "cp_db_records", "all"]:
            import_admc_items()
        if rec_type in ["admde_items", "cp_db_records", "all"]:
            import_admde_items()
