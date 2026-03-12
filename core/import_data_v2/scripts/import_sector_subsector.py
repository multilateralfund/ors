import json
import logging

from django.db import transaction

from core.models import (
    BPActivity,
    ProjectSector,
    ProjectSubSector,
)

logger = logging.getLogger(__name__)


@transaction.atomic
def import_sector(file_path):
    """
    Import sectors and subsectors from file

    @param file_path = str (file path for import file)
    """

    with open(file_path, "r", encoding="utf8") as f:
        sectors_json = json.load(f)

    for sector_json in sectors_json:

        if sector_json.get("ACTION", None) == "RENAME":
            ProjectSector.objects.filter(name=sector_json["OLD_NAME"]).update(
                name=sector_json["SECTOR"]
            )
        sector_data = {
            "name": sector_json["SECTOR"].strip(),
            "code": sector_json["SEC"].strip(),
            "sort_order": sector_json["SORT_SECTOR"],
        }
        ProjectSector.objects.update_or_create(
            code=sector_data["code"], defaults=sector_data
        )


@transaction.atomic
def import_subsector(file_path):
    """
    Import sectors and subsectors from file
    Please make sure that the file has the correct extention
        (xls, xlsx, xlsm, xlsb, odf, ods, odt)

    @param file_path = str (file path for import file)
    """

    with open(file_path, "r", encoding="utf8") as f:
        subsectors_json = json.load(f)

    project_sub_sectors_updated_ids = []
    for subsector_json in subsectors_json:
        subsector_name = subsector_json["SUBSECTOR"].strip()
        project_sub_sector = None
        if subsector_json.get("ACTION", None) == "RENAME":
            project_sub_sector = ProjectSubSector.objects.filter(
                name=subsector_json["OLD_NAME"]
            ).first()
        if not project_sub_sector:
            project_sub_sector = ProjectSubSector.objects.filter(
                name=subsector_name
            ).first()

        if not project_sub_sector:
            project_sub_sector = ProjectSubSector.objects.create(name=subsector_name)

        project_sub_sector_code = subsector_json.get("CODE_SUBSECTOR", None)
        sort_order = subsector_json["SORT_SUBSECTOR"]
        obsolete = subsector_json.get("OBSOLETE", False)

        project_sub_sector.code = project_sub_sector_code
        project_sub_sector.sort_order = sort_order
        project_sub_sector.obsolete = obsolete
        project_sub_sector.save()

        project_sub_sectors_updated_ids.append(project_sub_sector.id)

        project_sub_sector.sectors.clear()
        for sector_code in subsector_json["SEC"]:
            sector = ProjectSector.objects.filter(code=sector_code).first()
            if not sector:
                logger.warning(
                    f"⚠️ {sector_code} sector not found => {subsector_json['SUBSECTOR']} not imported"
                )
                continue
            project_sub_sector.sectors.add(sector)

    for project_sub_sector in ProjectSubSector.objects.exclude(
        id__in=project_sub_sectors_updated_ids
    ):
        logger.warning(
            f"⚠️ {project_sub_sector.name} subsector not found in import file => marked as obsolete"
        )
        projects_with_sub_sector = project_sub_sector.projects.count()

        bp_with_sub_sector = BPActivity.objects.filter(
            subsector=project_sub_sector
        ).count()
        logger.warning(
            f"""⚠️ {project_sub_sector.name} subsector is used in
              {projects_with_sub_sector} projects and {bp_with_sub_sector} BP activities
            """
        )
        project_sub_sector.obsolete = True
        project_sub_sector.save()
