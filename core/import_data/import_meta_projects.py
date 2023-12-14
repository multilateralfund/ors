import json
import logging

from django.conf import settings
from django.db import transaction
from core.api.utils import SUBMISSION_STATUSE_CODES
from core.import_data.import_projects import create_project
from core.import_data.utils import PCR_DIR_LIST, get_object_by_code

from core.models.project import MetaProject, Project, ProjectCluster
from core.utils import get_meta_project_code


logger = logging.getLogger(__name__)


SECTOR_CLUSTER_MAPPING = {
    "pcr2023": {
        "CFC phase out plan": "CFC Phase-out Plans",
        "CFCs/CTC/Halon Accelerated Phase-Out Plan": "Other ODS Sector Plans",
        "CTC phase out plan": "Other ODS Sector Plans",
        "Domestic Refrigeration": "CFC Phase-out Plans",
        "Foam": "CFC Phase-out Plans",
        "Halon": "Other ODS Sector Plans",
        "Methyl bromide": "Other ODS Sector Plans",
        "Accelerated Production CFC": "CFC Production Phase out Plans",
        "ODS phase out plan": "Other ODS Sector Plans",
        "Process Agent (Phase I)": "Other ODS Sector Plans",
        "Process Agent (Phase II)": "Other ODS Sector Plans",
        "Production CFC": "CFC Production Phase out Plans",
        "Production Methyl Bromide": "Other ODS Production Phase out Plans",
        "Production ODS": "Other ODS Production Phase out Plans",
        "Production TCA": "Other ODS Production Phase out Plans",
        "Refrigerant management plan": "CFC Phase-out Plans",
        "Refrigeration Servicing": "CFC Phase-out Plans",
        "Solvent": "Other ODS Sector Plans",
        "Tobacco Expansion": "Other ODS Sector Plans",
        "Tobacco": "Other ODS Sector Plans",
    },
    "hpmppcr2023": {
        "HCFC Phase Out Plan (Stage I)": "HPMP1",
        "HCFC Phase Out Plan (Stage II)": "HPMP2",
        "HCFC Phase Out Plan (Stage III)": "HPMP3",
        "Production HCFC (Stage I)": "HPPMP1",
        "HCFC Production (Stage I)": "HPPMP1",
        "HCFC Production (Stage II)": "HPPMP2",
        "HCFC Production (Stage III)": "HPPMP3",
    },
}


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

        meta_project, _ = MetaProject.objects.update_or_create(
            pcr_project_id=meta_project_json["pcr_project_id"],
            type=meta_project_json["type"],
            defaults=meta_project_json,
        )

        # set metaproject for project
        project.meta_project = meta_project
        project.save()


def parse_clusters_file(file_path, database_name):
    with open(file_path, "r", encoding="utf8") as f:
        json_data = json.load(f)

    for project_json in json_data:
        # get project by code
        project = get_object_by_code(
            Project, project_json["Code"], "code", project_json["Code"], with_log=False
        )
        # skip project if not created (invalid data)
        if not project:
            continue

        # set cluster
        cluster_name = SECTOR_CLUSTER_MAPPING[database_name].get(
            project_json["MYASector"]
        )
        if not cluster_name:
            logger.error(
                f"Cluster not found for project {project_json['Code']}, {project_json['MYASector']}"
            )
        else:
            cluster = ProjectCluster.objects.find_by_name_or_code(cluster_name)
            if cluster:
                project.cluster = cluster
                project.save()
            else:
                logger.error(f"Cluster not found: {cluster_name}")

        # set meta project code
        if project.meta_project:
            meta_project_code = get_meta_project_code(
                project.country, project.cluster, project.serial_number
            )
            project.meta_project.code = meta_project_code
            project.meta_project.save()


def set_ind_cluster(project):
    cluster = None
    if project.project_type.code == "INS":
        project.cluster = ProjectCluster.objects.find_by_name_or_code("INS")
        project.save()
        return

    cluster_names = set()
    for ods_odp in project.ods_odp.all():
        chemical_name = None
        if ods_odp.ods_substance:
            chemical_name = ods_odp.ods_substance.name
        elif ods_odp.ods_blend:
            chemical_name = ods_odp.ods_blend.name
        if not chemical_name:
            continue
        if "HCFC" in chemical_name:
            cluster_names.add("HCFC Individual")
            continue
        if "CFC" in chemical_name:
            cluster_names.add("CFC Individual")
            continue
        if "HFC" in chemical_name:
            cluster_names.add("HFC Individual")
            continue

    if not cluster_names:
        return

    if len(cluster_names) > 1:
        logger.warning(
            f"Project {project.code} has multiple substance types: {cluster_names}"
        )
        return

    cluster_name = cluster_names.pop()
    cluster = ProjectCluster.objects.find_by_name_or_code(cluster_name)
    if cluster:
        project.cluster = cluster
        project.save()
    else:
        logger.error(f"Cluster not found: {cluster_name}")


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
    for project in projects:
        set_ind_cluster(project)
        meta_project_code = get_meta_project_code(
            project.country, project.cluster, project.serial_number
        )

        # project type
        proj_type = MetaProject.MetaProjectType.INDINV

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
        parse_clusters_file(
            db_dir_path / database_name / "Import_ListofMYAProjects.json", database_name
        )
        logger.info(f"✔ pcr meta projects from {database_name} imported")

    create_other_meta_project()
    logger.info("✔ all meta projects imported")
