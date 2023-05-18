from django.core.management import BaseCommand
from django.core.management.base import CommandParser
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
            ],
        )

    def handle(self, *args, **kwargs):
        resource = kwargs["resource"]

        if resource == "all_ozone_data":
            ozone_all_data()
            return

        if resource == "groups" or resource == "all":
            import_groups()
        if resource == "substances" or resource == "all":
            import_substances()
        if resource == "blends" or resource == "all":
            import_blends()
        if resource == "blend_components" or resource == "all":
            import_blend_components()
        if resource == "countries" or resource == "all":
            import_countries()
        if resource == "usages" or resource == "all":
            import_usages()
        if resource == "sectors" or resource == "all":
            import_project_sectors()
        if resource == "agencies" or resource == "all":
            import_agencies()
