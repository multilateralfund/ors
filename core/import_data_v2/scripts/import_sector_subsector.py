import json
import logging

from django.db import transaction

from core.models.project_metadata import (
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

    for subsector_json in subsectors_json:
        subsector_name = subsector_json["SUBSECTOR"].strip()
        if subsector_json.get("ACTION", None) == "RENAME":
            project_sub_sector = ProjectSubSector.objects.filter(
                name=subsector_json["OLD_NAME"]
            )
            if subsector_json.get("OLD_SEC", None):
                project_sub_sector = project_sub_sector.filter(
                    sector__code=subsector_json["OLD_SEC"]
                )
            project_sub_sector.update(name=subsector_name)

        # get sector
        sector = ProjectSector.objects.filter(code=subsector_json["SEC"]).first()
        if not sector:
            logger.warning(
                f"⚠️ {subsector_json['SEC']} sector not found => {subsector_json['SUBSECTOR']} not imported"
            )
            continue

        # set subsector data
        subsector_code = (
            subsector_json["CODE_SUBSECTOR"].strip()
            if subsector_json.get("CODE_SUBSECTOR")
            else None
        )
        subsector_data = {
            "name": subsector_json["SUBSECTOR"].strip(),
            "code": subsector_code,
            "sector": sector,
            "sort_order": subsector_json["SORT_SUBSECTOR"],
        }

        project_sub_sector = ProjectSubSector.objects.filter(
            name=subsector_data["name"]
        )
        if project_sub_sector.exists():
            project_sub_sector.update(
                name=subsector_data["name"],
                code=subsector_data["code"],
                sector=subsector_data["sector"],
                sort_order=subsector_data["sort_order"],
            )
        else:
            ProjectSubSector.objects.create(
                name=subsector_data["name"],
                code=subsector_data["code"],
                sector=subsector_data["sector"],
                sort_order=subsector_data["sort_order"],
            )
