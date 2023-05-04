from django.core.management import BaseCommand
from core.import_data.import_proposals import import_proposals


class Command(BaseCommand):
    help = "Import project proposals"

    def handle(self, *args, **kwargs):
        import_proposals()
