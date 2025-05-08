from django.core.management import BaseCommand

from core.import_data.import_project_resources_v2 import import_project_resources_v2


class Command(BaseCommand):
    help = """
        Import resources version 2 for the new project information
        After the first import is made, this second import
        is used for the new projects and resources
    """

    def add_arguments(self, parser):
        parser.add_argument(
            "resource",
            type=str,
            help="Resource to import",
            default="all",
            choices=[
                "all",
                "project_resources",
            ],
        )

    def handle(self, *args, **kwargs):
        resource = kwargs["resource"]

        if resource in ["project_resources", "all"]:
            import_project_resources_v2()
