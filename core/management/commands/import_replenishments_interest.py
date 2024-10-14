from django.core.management import BaseCommand

from core.import_data.import_replenishments_ferm import import_only_external_income
from core.models import Country


class Command(BaseCommand):
    help = """
        Import only replenishments interest from consolidated data file.
        Requires import of countries.
        """

    def handle(self, *args, **kwargs):
        if not Country.objects.exists():
            raise ValueError("Import countries first")

        countries = {country.name: country for country in Country.objects.all()}

        import_only_external_income(countries)
