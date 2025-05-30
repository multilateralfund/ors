from django.core.management import BaseCommand
from core.import_data.import_excluded_usages import import_excluded_usages
from core.import_data.import_time_frames import import_time_frames
from core.import_data.import_adm_columns import import_adm_columns
from core.import_data.import_project_resources import import_project_resources
from core.import_data.import_countries import import_countries
from core.import_data.import_chemicals import (
    import_all_data as ozone_all_data,
    import_blend_components,
    import_blends,
    import_groups,
    import_substances,
)
from core.import_data.import_usages import import_usages
from core.import_data.import_bp_other_objects import import_bp_other_objects
from core.import_data.import_decisions import import_decisions


class Command(BaseCommand):
    help = """
        Import resources
        (groups, substances, blends, blend components, usages,
            countries, project_resources, time_frames, excluded_usages)
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
                "excluded_usages",
                "countries",
                "adm_columns",
                "project_resources",
                "time_frames",
                "bp_other_objects",
                "decisions",
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
        if resource in ["time_frames", "all"]:
            import_time_frames()
        if resource in ["usages", "all"]:
            import_usages()
        if resource in ["excluded_usages", "all"]:
            import_excluded_usages()
        if resource in ["adm_columns", "all"]:
            import_adm_columns()
        if resource in ["project_resources", "all"]:
            import_project_resources()
        if resource in ["bp_other_objects", "all"]:
            import_bp_other_objects()
        if resource in ["decisions", "all"]:
            import_decisions()  # only for testing
