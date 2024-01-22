import json
import logging

from django.conf import settings
from django.db import transaction
from core.api.utils import SUBMISSION_STATUSE_CODES
from core.import_data.import_projects import create_project
from core.import_data.utils import PCR_DIR_LIST, get_object_by_code

from core.models.project import MetaProject, Project, ProjectCluster, ProjectSector
from core.utils import get_meta_project_code


logger = logging.getLogger(__name__)


def parse_meta_projects_file(file_path, database_name):
    """
    Import meta projects from json file

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
        # skip project if not exists
        if not project:
            logger.info(f"Project not found: {project_json['CODE']}")
            continue

        # create meta project
        meta_project_code = get_meta_project_code(
            project.country, project.cluster, project.serial_number
        )

        meta_project_json = {
            "type": project_type,
            "pcr_project_id": project_json["ProjectId"],
            "code": meta_project_code,
        }

        meta_project, _ = MetaProject.objects.update_or_create(
            pcr_project_id=meta_project_json["pcr_project_id"],
            type=meta_project_json["type"],
            defaults=meta_project_json,
        )

        # set metaproject for project
        project.meta_project = meta_project
        project.save()


def create_other_meta_project():
    """
    Create meta project for projects without meta project
    """
    projects = (
        Project.objects.filter(meta_project_id=None)
        .exclude(status__code__in=SUBMISSION_STATUSE_CODES)
        .select_related("country", "agency", "project_type")
        .prefetch_related("ods_odp__ods_substance", "ods_odp__ods_blend")
        .all()
    )

    # project type
    proj_type = MetaProject.MetaProjectType.INDINV

    for project in projects:
        meta_project_code = get_meta_project_code(
            project.country, project.cluster, project.serial_number
        )

        meta_project_json = {
            "type": proj_type,
            "code": meta_project_code,
        }
        meta_project, _ = MetaProject.objects.update_or_create(
            code=meta_project_json["code"],
            type=meta_project_json["type"],
            defaults=meta_project_json,
        )

        project.meta_project = meta_project
        project.save()


@transaction.atomic
def import_meta_projects():
    db_dir_path = settings.IMPORT_DATA_DIR / "pcr"
    for database_name in PCR_DIR_LIST:
        logger.info(f"⏳ importing pcr meta projects from {database_name}")
        parse_meta_projects_file(
            db_dir_path / database_name / "tbINVENTORY.json", database_name
        )
        logger.info(f"✔ pcr meta projects from {database_name} imported")

    create_other_meta_project()
    logger.info("✔ all meta projects imported")
