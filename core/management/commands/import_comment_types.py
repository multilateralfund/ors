from django.core.management import BaseCommand
from core.import_data.import_comment_types import import_comment_types


class Command(BaseCommand):
    help = "Import comment types"

    def handle(self, *args, **kwargs):
        import_comment_types()
