import json
import logging

from django.db import transaction

from core.models.base import CommentType
from core.import_data.utils import IMPORT_RESOURCES_DIR

logger = logging.getLogger(__name__)


def parse_comment_types_file(file_path):
    """
    Parse comment types json file and import types
    @param file_path string
    """
    with open(file_path, "r", encoding="utf-8") as f:
        json_list = json.load(f)

    new_comment_types = []
    existing_types = CommentType.objects.values_list("name", flat=True)
    for type_data in json_list:
        name = type_data["name"]
        if name not in existing_types:
            new_comment_types.append(CommentType(name=name))

    CommentType.objects.bulk_create(new_comment_types)


@transaction.atomic
def import_comment_types():
    parse_comment_types_file(IMPORT_RESOURCES_DIR / "comment_types.json")
    logger.info("✔ comment types imported")
