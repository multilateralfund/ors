from django.core.management import BaseCommand
from core.import_data.import_cp_format import import_cp_format


class Command(BaseCommand):
    help = """
        Import country programme formats
        """

    def handle(self, *args, **kwargs):
        import_cp_format()
