from django.core.management import BaseCommand

from core.import_data.import_cp_format import import_cp_format

class Command(BaseCommand):
    help = """
        Import cp format
        """

    def handle(self, *args, **kwargs):

        import_cp_format()

        self.stdout.write(self.style.SUCCESS("Successfully imported CP format"))
