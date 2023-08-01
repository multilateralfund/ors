"""Import all data: resources, records, projects."""

from django.core.management import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = __doc__

    def handle(self, *args, **kwargs):
        call_command("import_resources", "all")
        call_command("import_records", "all")
        call_command("import_projects", "all")
