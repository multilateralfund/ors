from django.core.management import BaseCommand
from core.import_data.import_business_plans import import_business_plans


class Command(BaseCommand):
    help = """
        Import business plans
        """

    def handle(self, *args, **kwargs):
        import_business_plans()
