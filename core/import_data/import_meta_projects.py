import json
import logging

from django.conf import settings
from django.db import transaction
from core.api.utils import SUBMISSION_STATUSE_CODES
from core.import_data.utils import PCR_DIR_LIST, get_object_by_code

from core.models.project import MetaProject, Project, ProjectStatus
from core.utils import get_meta_project_code


logger = logging.getLogger(__name__)


def set_correct_status():
    """
    Some projects have the wrong status. This function sets the correct status
    """
    closed_projects_codes = [
        "CPR/SEV/30/TAS/346",
        "EGY/REF/36/PRP/84",
        "JOR/FOA/07/INV/05",
        "KEN/SEV/44/INS/39",
        "KUW/REF/76/DEM/32",
        "PNG/REF/21/PRP/03",
    ]
    closed_status = ProjectStatus.objects.get(code="CLO")
    if not closed_status:
        logger.error("Project status CLO not found")
        return
    Project.objects.filter(code__in=closed_projects_codes).update(status=closed_status)


def create_metaproj_for_custproj(project_codes, meta_type, code):
    metaproject_data = {
        "pcr_project_id": None,
        "type": meta_type,
        "code": code,
    }
    meta_proj, _ = MetaProject.objects.update_or_create(
        code=metaproject_data["code"], defaults=metaproject_data
    )
    Project.objects.filter(code__in=project_codes).update(meta_project=meta_proj)


def create_custom_metaprojects():
    """
    create metaprojects for specific projects
    """

    myahcfc_type = MetaProject.MetaProjectType.MYAHCFC
    indinv_type = MetaProject.MetaProjectType.INDINV
    projects_list = {
        myahcfc_type: {
            "NER/KIP/47": ["NER/KIP/91/TAS/47", "NER/KIP/91/INV/46"],
            "IND/ARS/69": ["IND/ARS/17/DEM/50", "IND/ARS/19/DEM/69"],
        },
        indinv_type: {
            "ARG/PHA/157": ["ARG/PHA/55/PRP/157", "ARG/PHA/64/PRP/165"],
            "COL/PAG/64": ["COL/PAG/47/INV/64", "COL/PAG/48/INV/66"],
            "CPR/FOA/46": ["CPR/FOA/10/INV/46", "CPR/FOA/13/INV/74"],
            "ECU/SEV/20": ["ECU/SEV/20/INV/20", "ECU/SEV/21/INV/21"],
            "ECU/PHA/55": [
                "ECU/PHA/55/PRP/40",
                "ECU/PHA/59/PRP/44",
                "ECU/PHA/59/PRP/45",
            ],
            "GLO/REF/06": ["GLO/REF/06/TRA/18", "GLO/REF/10/TRA/45"],
            "SRL/PHA/57": ["SRL/PHA/57/PRP/36", "SRL/REF/61/PRP/39"],
        },
    }

    for meta_type, projects in projects_list.items():
        for code, project_codes in projects.items():
            create_metaproj_for_custproj(project_codes, meta_type, code)


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

        # skip project if already has meta project
        if project.meta_project:
            continue

        # create meta project
        meta_project_code = get_meta_project_code(
            project.country, project.cluster, project.serial_number_legacy
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


def create_transf_meta_project():
    """
    Create meta project for transferred projects
    Set same meta prokect for the transferred project and another one
     -> based on legacy sector, legacy subsector and legacy project type
     -> if there are multiple projects after filtering => filter by title too
     -> if there are no projects after filtering => log a warning and create just one meta project

    """
    transf_status = ProjectStatus.objects.get(code="TRF")
    proj_type = MetaProject.MetaProjectType.INDINV
    projects = Project.objects.filter(
        code__isnull=False, status=transf_status, meta_project_id=None
    ).all()
    for project in projects:
        # create meta project
        meta_project_code = get_meta_project_code(
            project.country, project.cluster, project.serial_number_legacy
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

        # get the completed project
        completed_project = Project.objects.filter(
            code__isnull=False,
            country=project.country,
            sector_legacy__iexact=project.sector_legacy,
            subsector_legacy__iexact=project.subsector_legacy,
            project_type_legacy__iexact=project.project_type_legacy,
            meta_project_id=None,
        ).exclude(pk=project.pk)
        if completed_project.count() > 1:
            completed_project = completed_project.filter(title__iexact=project.title)

        if completed_project.count() == 0:
            logger.warning(
                f"Transferred project {project.code} has no completed project"
            )
            continue

        if completed_project.count() > 1:
            similar_projects = ", ".join([p.code for p in completed_project.all()])
            logger.warning(
                f"Transferred project {project.code} has multiple completed projects: {similar_projects}"
            )
            continue

        completed_project = completed_project.first()
        completed_project.meta_project = meta_project
        completed_project.save()


def create_other_meta_project():
    """
    Create meta project for projects without meta project
    """
    projects = (
        Project.objects.filter(meta_project_id=None)
        .exclude(status__code__in=SUBMISSION_STATUSE_CODES)
        .select_related("country", "cluster")
        .all()
    )

    # project type
    proj_type = MetaProject.MetaProjectType.INDINV

    for project in projects:
        if project.meta_project:
            # there might be some projects that were updated in the previous step
            continue
        meta_project_code = get_meta_project_code(
            project.country, project.cluster, project.serial_number_legacy
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

        # check if thist project is a transferred project


@transaction.atomic
def import_meta_projects():
    set_correct_status()
    create_custom_metaprojects()
    db_dir_path = settings.IMPORT_DATA_DIR / "pcr"
    for database_name in PCR_DIR_LIST:
        logger.info(f"⏳ importing pcr meta projects from {database_name}")
        parse_meta_projects_file(
            db_dir_path / database_name / "tbINVENTORY.json", database_name
        )

    logger.info("⏳ creating meta projects for transferred projects")
    create_transf_meta_project()
    logger.info("⏳ creating meta projects for other projects")
    create_other_meta_project()
    logger.info("✔ all meta projects imported")
