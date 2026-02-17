import json
import logging

from django.db import transaction

from core.models.project_metadata import ProjectType


logger = logging.getLogger(__name__)


@transaction.atomic
def import_project_type(file_path):
    """
    Import project type from file

    @param file_path = str (file path for import file)
    """
    with open(file_path, "r", encoding="utf8") as f:
        types_json = json.load(f)

    # add other types that are not in the file
    for type_json in types_json:
        if type_json.get("ACTION", None) == "RENAME":
            ProjectType.objects.filter(name=type_json["OLD_NAME"]).update(
                name=type_json["TYPE_PRO"]
            )
        else:
            type_data = {
                "code": type_json["TYPE"],
                "name": type_json["TYPE_PRO"],
                "sort_order": type_json["SORT_TYPE"],
            }
            ProjectType.objects.update_or_create(
                name=type_data["name"], defaults=type_data
            )
