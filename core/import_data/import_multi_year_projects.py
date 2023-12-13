import json
import logging

from dateutil.parser import parse
from django.conf import settings
from django.db import transaction


from core.import_data.utils import (
    get_country_by_name,
    get_meeting_by_number,
    get_object_by_name,
    get_project_type_by_code,
    get_sector_by_code,
    get_serial_number_from_code,
    update_or_create_project,
)
from core.models.agency import Agency
from core.models.project import ProjectStatus

logger = logging.getLogger(__name__)


def parse_file(file_path):
    with open(file_path, "r", encoding="utf8") as f:
        json_data = json.load(f)

    unk_status = get_object_by_name(
        ProjectStatus, "Unknow", "UNK", "project status", use_offset=False
    )

    for project_json in json_data:
        country = get_country_by_name(
            project_json["Country"], project_json["Code"], use_offset=False
        )
        agency = get_object_by_name(
            Agency,
            project_json["Agency"],
            project_json["Code"],
            "agency",
            use_offset=False,
        )

        project_type = get_project_type_by_code(
            project_json["Type"],
            project_json["Code"],
        )

        sector = get_sector_by_code(
            project_json["Sector"],
            project_json["Code"],
        )

        # set approval meeting no
        if "Mtg" not in project_json:
            # code =  {Country or Region}/{Sector}/{MeetingNo}/{ProjectType}/{ProjectNumber}
            meeting_no = project_json["Code"].split("/")[2]
        else:
            meeting_no = project_json["Mtg"]
        meeting = get_meeting_by_number(meeting_no, project_json["Code"])

        # skip project with missing data
        if not all([country, agency, project_type, meeting, sector]):
            continue

        # extract subsector name and stage
        # HCFC Phase Out Plan (Stage I) -> HCFC Phase Out Plan, 1
        # HCFC Phase Out Plan (Stage II) -> HCFC Phase Out Plan, 2
        if "(" in project_json["MYA Sector"]:
            subs_name, stage = project_json["MYA Sector"].split("(")
        else:
            subs_name = project_json["MYA Sector"]
            stage = ""
        subs_name = subs_name.strip()
        stage = stage.count("I")

        # set serial number
        serial_number = serial_number = get_serial_number_from_code(
            project_json["Code"]
        )

        date_agree = project_json.get("Date Completion Per Agreement")
        date_decision = project_json.get("Date Completion Per Decision")

        project_data = {
            "country": country,
            "agency": agency,
            "code": project_json["Code"],
            "mya_code": project_json.get("MYA Code"),
            "project_type": project_type,
            "sector": sector,
            "serial_number": serial_number,
            "mya_subsector": subs_name,
            "title": project_json["Project Title"],
            "stage": stage,
            "date_per_agreement": parse(date_agree) if date_agree else None,
            "date_per_decision": parse(date_decision) if date_decision else None,
            "approval_meeting": meeting,
            "status": unk_status,
        }

        update_or_create_project(project_data, update_status=False)


@transaction.atomic
def import_multi_year_projects():
    logger.info("⏳ importing multi year projects")
    file_path = settings.IMPORT_DATA_DIR / "progress_report" / "MultiYear-Projects.json"

    parse_file(file_path)

    logger.info("✔ projects multi year projects")
