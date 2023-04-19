import logging
import pandas as pd

from django.conf import settings

from core.models import Substance

logger = logging.getLogger(__name__)


def parse_file(file_path):
    pass


def get_unknown_substances():
    file_path = (
        settings.IMPORT_DATA_DIR / "import_data/records/Argentina-2021_CP_Data.xls"
    )
    parse_file(file_path)


class Command(BaseCommand):
    help = "Get a list of unkown substances from xlsx files"

    def handle(self, *args, **kwargs):
        get_unknown_substances()
