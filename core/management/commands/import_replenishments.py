from django.core.management import BaseCommand

from core.import_data.import_replenishments import import_replenishments


class Command(BaseCommand):
    help = """
        Import replenishments
        (replenishments, contributions, invoices, payments).
        
        Requires import of countries.
        """

    def handle(self, *args, **kwargs):
        import_replenishments()
