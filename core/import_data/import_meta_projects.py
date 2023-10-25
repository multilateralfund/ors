import json
import logging

from django.conf import settings
from django.db import transaction
from core.import_data.import_projects import create_project
from core.import_data.utils import PCR_DIR_LIST, get_object_by_code

from core.models.project import MetaProject, Project


logger = logging.getLogger(__name__)


def parse_file(file_path, database_name):
    """
    Import columns from json file

    @param file_path = str (file path for import file)
    """
    with open(file_path, encoding="utf8") as f:
        json_data = json.load(f)

    # set projects type
    if database_name == "pcr2023":
        project_type = MetaProject.MetaProjectType.MYACFC
    else:
        project_type = MetaProject.MetaProjectType.MYAHCFC

    for project_json in json_data:
        if not project_json["ProjectId"]:
            continue

        # get project by code
        project = get_object_by_code(
            Project, project_json["CODE"], "code", project_json["CODE"], with_log=False
        )
        # create project if not exists
        if not project:
            project = create_project(project_json)
        # skip project if not created (invalid data)
        if not project:
            continue

        # create meta project
        meta_project_json = {
            "type": project_type,
            "pcr_project_id": project_json["ProjectId"],
        }

        meta_project, _ = MetaProject.objects.get_or_create(**meta_project_json)

        # set metaproject for project
        project.meta_project = meta_project
        project.save()


@transaction.atomic
def import_meta_projects():
    db_dir_path = settings.IMPORT_DATA_DIR / "pcr"
    for database_name in PCR_DIR_LIST:
        logger.info(f"⏳ importing pcr meta projects from {database_name}")
        parse_file(db_dir_path / database_name / "tbINVENTORY.json", database_name)
        logger.info(f"✔ pcr meta projects from {database_name} imported")
