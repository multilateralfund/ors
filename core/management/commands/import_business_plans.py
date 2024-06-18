from django.core.management import BaseCommand
from core.import_data.import_business_plans import import_business_plans
from core.import_data.set_bp_clusters import set_business_plan_clusters


class Command(BaseCommand):
    help = """
        Import business plans
        """

    def handle(self, *args, **kwargs):
        import_business_plans()
        set_business_plan_clusters()
