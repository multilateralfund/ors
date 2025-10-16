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
                "import_project_clusters",
                "import_project_type",
                "import_sector",
                "import_subsector",
                "import_project_submission_statuses",
                "clean_up_project_statuses",
                "import_cluster_type_sector_links",
                "import_fields",
                "import_project_specific_fields",
                "generate_new_cluster_type_sector_file",
            ],
        )

    def handle(self, *args, **kwargs):
        resource = kwargs["resource"]
        import_project_resources_v2(resource)
