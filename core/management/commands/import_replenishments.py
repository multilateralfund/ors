from django.core.management import BaseCommand

from core.import_data.import_replenishments import import_replenishments
from core.import_data.import_status_of_contributions import (
    import_status_of_contributions,
)
from core.models import Country


class Command(BaseCommand):
    help = """
        Import replenishments
        (replenishments, status of contributions, invoices, payments).
        
        Requires import of countries.
        """

    def add_arguments(self, parser):
        parser.add_argument(
            "resource",
            type=str,
            help="Resource to import",
            default="all",
            choices=[
                "all",
                "replenishments",
                "status_of_contributions",
            ],
        )

    def handle(self, *args, **kwargs):
        resource = kwargs["resource"]

        countries = {country.name: country for country in Country.objects.all()}

        if resource in ("all", "replenishments"):
            import_replenishments(countries)

        if resource in ("all", "status_of_contributions"):
            import_status_of_contributions(countries)
