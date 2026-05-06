from django.core.management import BaseCommand

from core.import_data_v2.import_enterprises import import_enterprises


class Command(BaseCommand):
    help = """
        Script to handle the import of enterprises
    """

    def add_arguments(self, parser):
        parser.add_argument(
            "--delete",
            action="store_true",
            help="Delete existing enterprises before importing new ones",
        )
        parser.add_argument(
            "--reset-index",
            action="store_true",
            help="Reset the primary key index after deleting enterprises",
        )

    def handle(self, *args, **kwargs):
        delete = kwargs["delete"]
        reset_index = kwargs["reset_index"]

        import_enterprises(delete=delete, reset_index=reset_index)
