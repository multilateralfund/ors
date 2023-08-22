from django.core.management import BaseCommand
from core.import_data.import_multi_year_projects import import_multi_year_projects

from core.import_data.import_progress_reports import import_progress_reports
from core.import_data.import_proposals import import_proposals
from core.import_data.import_projects import import_projects


class Command(BaseCommand):
    help = """
        Import projects
        params:
            - type = proposals => project proposals xlsx files
            - type = projects => projects from tbInventory
            - type = multi_year_projects => multi year projects from MultiYear-Projects
            - type all => projects + proposals
    """

    def add_arguments(self, parser):
        parser.add_argument(
            "type",
            type=str,
            help="Import type",
            default="all",
            choices=[
                "proposals",
                "projects",
                "multi_year_projects",
                "progress",
                "all",
            ],
        )

    def handle(self, *args, **kwargs):
        imp_type = kwargs["type"]

        if imp_type in ["projects", "all"]:
            import_projects()
        if imp_type in ["proposals", "all"]:
            import_proposals()
        if imp_type in ["multi_year_projects", "all"]:
            import_multi_year_projects()
        if imp_type in ["progress", "all"]:
            import_progress_reports()
