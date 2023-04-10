from django.core.management import BaseCommand
from core.import_data.import_countries import import_countries


class Command(BaseCommand):
    help = "Import countries"

    def handle(self, *args, **kwargs):
        import_countries()
