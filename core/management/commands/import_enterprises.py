from django.core.management import BaseCommand

from core.import_data_v2.import_enterprises import import_enterprises


class Command(BaseCommand):
    help = """
        Script to handle the import of enterprises
    """

    def handle(self, *args, **kwargs):
        import_enterprises()
