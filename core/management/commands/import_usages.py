from django.core.management import BaseCommand
from core.import_data.import_usages import import_usages


class Command(BaseCommand):
    help = "Import usages"

    def handle(self, *args, **kwargs):
        import_usages()
