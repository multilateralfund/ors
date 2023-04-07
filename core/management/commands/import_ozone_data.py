from django.core.management import BaseCommand
from core.import_data.import_ozone_data import *


class Command(BaseCommand):
    help = "Import data from ozone json files"

    def handle(self, *args, **kwargs):
        import_all_data()
