import json
import logging

from django.db import transaction

from core.models import AlternativeTechnology


logger = logging.getLogger(__name__)


@transaction.atomic
def import_alternative_technologies(file_path):
    """
    Import alternative technologies from file

    @param file_path = str (file path for import file)
    """
    with open(file_path, "r", encoding="utf8") as f:
        alternative_technologies_json = json.load(f)

    for alternative_technology_json in alternative_technologies_json:
        AlternativeTechnology.objects.update_or_create(
            name=alternative_technology_json["NAME"],
        )
