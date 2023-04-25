from django.core.management import BaseCommand
from core.import_data.import_records import import_records


class Command(BaseCommand):
    help = "Import records"

    def handle(self, *args, **kwargs):
        import_records()
