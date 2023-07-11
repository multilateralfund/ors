from django.core.management import BaseCommand
from core.import_data.import_adm_columns import import_adm_columns
from core.import_data.import_agencies import import_agencies
from core.import_data.import_countries import import_countries
from core.import_data.import_ozone_data import (
    import_all_data as ozone_all_data,
    import_blend_components,
    import_blends,
    import_groups,
    import_substances,
)
from core.import_data.import_project_sectors import import_project_sectors
from core.import_data.import_usages import import_usages


class Command(BaseCommand):
    help = """
        Import resources
        (groups, substances, blends, blend components, usages,
            sectors, agencies, countries)
    """

    def add_arguments(self, parser):
        parser.add_argument(
            "resource",
            type=str,
            help="Resource to import",
            default="all",
            choices=[
                "all",
                "all_ozone_data",
                "groups",
                "substances",
                "blends",
                "blend_components",
                "usages",
                "sectors",
                "agencies",
                "countries",
                "adm_columns",
            ],
        )

    def handle(self, *args, **kwargs):
        resource = kwargs["resource"]

        if resource == "all_ozone_data":
            ozone_all_data()
            return

        if resource in ["groups", "all"]:
            import_groups()
        if resource in ["substances", "all"]:
            import_substances()
        if resource in ["blends", "all"]:
            import_blends()
        if resource in ["blend_components", "all"]:
            import_blend_components()
        if resource in ["countries", "all"]:
            import_countries()
        if resource in ["usages", "all"]:
            import_usages()
        if resource in ["sectors", "all"]:
            import_project_sectors()
        if resource in ["agencies", "all"]:
            import_agencies()
        if resource in ["adm_columns", "all"]:
            import_adm_columns()
