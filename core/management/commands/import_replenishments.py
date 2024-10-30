from django.core.management import BaseCommand

from core.import_data.import_replenishments import import_replenishments
from core.import_data.import_replenishments_ferm import import_ferm_interest_disputed
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
                "ferm_interest_disputed",
            ],
        )

    def handle(self, *args, **kwargs):
        if not Country.objects.exists():
            raise ValueError("Import countries first")

        resource = kwargs["resource"]

        countries = {country.name: country for country in Country.objects.all()}

        if resource in ("all", "replenishments"):
            import_replenishments(countries)

        if resource in ("all", "status_of_contributions"):
            import_status_of_contributions(countries)

        if resource in ("all", "ferm_interest_disputed"):
            import_ferm_interest_disputed(countries)
