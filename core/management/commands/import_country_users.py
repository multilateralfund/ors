from django.core.management import BaseCommand

from core.import_data.import_country_users import import_country_users


class Command(BaseCommand):
    help = "Import country users"

    def handle(self, *args, **kwargs):
        import_country_users()
