import json
import logging

from django.db import transaction

from core.import_data.utils import (
    IMPORT_PROJECTS_DIR,
    get_chemical_by_name_or_components,
    get_meeting_by_number,
    get_project_base_data,
    get_serial_number_from_code,
    parse_date,
    update_or_create_project,
)
from core.models.project import ProjectFund, ProjectOdsOdp
from core.models.substance import Substance


logger = logging.getLogger(__name__)

MAX_ODP_COIMT = 5
MAX_ALLOC_FUNDS_COUNT = 4
MAX_TRANS_FUNDS_COUNT = 8


def get_ods_substance(substance_name, proj_code, ods_type):
    ods_subs = Substance.objects.find_by_name(substance_name)
    if not ods_subs:
        logger.error(
            f"{ods_type} substance not found for project {proj_code}, {substance_name}"
        )
        return None

    return ods_subs


def create_project_ODS_ODP(project, project_json, fields_mapping):
    """
    Create project ods odp

    @param project: Project object
    @param project_json: project json data
    @param fields_mapping: fields mapping
    """

    for i in range(1, MAX_ODP_COIMT + 1):
        odp_field = f"{fields_mapping['odp']}{i}"
        ods_name_field = f"{fields_mapping['ods_name']}{i}"
        ods_repl_field = f"{fields_mapping['ods_replacement']}{i}"
        co2mt_field = f"{fields_mapping['co2mt']}{i}"

        if not project_json.get(odp_field):
            continue

        # get ods substance if exists
        ods, ods_type = get_chemical_by_name_or_components(
            project_json.get(ods_name_field)
        )
        if project_json.get(ods_name_field) and not ods:
            logger.info(
                "Chemical not found for project "
                f"{project_json['CODE']}, {project_json[ods_name_field]}"
            )

        # create project ods odp
        ods_odp_data = {
            "project": project,
            "ods_display_name": project_json.get(ods_name_field),
            "odp": project_json[odp_field],
            "co2_mt": project_json.get(co2mt_field),
            "ods_replacement": project_json.get(ods_repl_field),
            "sort_order": i,
            "ods_type": fields_mapping["ods_type"],
        }
        if ods_type == "substance":
            ods_odp_data["ods_substance"] = ods
        elif ods_type == "blend":
            ods_odp_data["ods_blend"] = ods

        ProjectOdsOdp.objects.update_or_create(
            project=project,
            sort_order=i,
            ods_type=ods_odp_data["ods_type"],
            defaults=ods_odp_data,
        )


def parse_project_ODS_ODP(project, project_json):
    """
    Parse project ods odp and create project ods odp objects

    @param project: Project object
    @param project_json: project json data
    """

    # import ods odp
    ods_fields = {
        "ods_name": "ODS_NAME",
        "odp": "ODP",
        "co2mt": "CO2MT",
        "ods_replacement": "ODS_REPLACEMENT",
        "ods_type": ProjectOdsOdp.ProjectOdsOdpType.GENERAL,
    }
    create_project_ODS_ODP(project, project_json, ods_fields)

    # import ods production
    ods_prod_fields = {
        "ods_name": "ODS_PRODUCTION",
        "odp": "ODP_PRODUCTION",
        "co2mt": "CO2MT_PRODUCTION",
        "ods_replacement": "ODS_ProRepla",
        "ods_type": ProjectOdsOdp.ProjectOdsOdpType.PRODUCTION,
    }
    create_project_ODS_ODP(project, project_json, ods_prod_fields)

    # import ods indirect
    ods_indirect_fields = {
        "ods_name": "ODS_INDIRECTNAME",
        "odp": "ODP_INDIRECT",
        "co2mt": "N/A",
        "ods_replacement": "ODS_INDIRECTREPLACE",
        "ods_type": ProjectOdsOdp.ProjectOdsOdpType.INDIRECT,
    }
    create_project_ODS_ODP(project, project_json, ods_indirect_fields)


def create_project_funds(project, project_json, fields_mapping):
    """
    Create project funds

    @param project: Project object
    @param project_json: project json data
    @param fields_mapping: fields mapping
    """

    if fields_mapping["fund_type"] == "allocated":
        max_count = MAX_ALLOC_FUNDS_COUNT
    else:
        max_count = MAX_TRANS_FUNDS_COUNT

    for i in range(1, max_count + 1):
        amount_field = f"{fields_mapping['amount']}{i}"
        support_psc_field = f"{fields_mapping['support_psc']}{i}"
        meeting_field = f"{fields_mapping['meeting']}{i}"
        interest_field = f"{fields_mapping['interest']}{i}"
        date_field = f"{fields_mapping['date']}{i}"

        # skip if amount field is empty
        if not project_json.get(amount_field):
            continue

        meeting_no = project_json.get(meeting_field)
        meeting = get_meeting_by_number(meeting_no, project_json["CODE"])
        if meeting_no and not meeting:
            continue

        # create project funds
        funds_data = {
            "project": project,
            "amount": project_json[amount_field],
            "support_psc": project_json[support_psc_field],
            "meeting": meeting,
            "interest": project_json.get(interest_field),
            "date": parse_date(project_json.get(date_field)),
            "fund_type": fields_mapping["fund_type"],
            "sort_order": i,
        }
        ProjectFund.objects.update_or_create(
            project=project,
            sort_order=i,
            fund_type=funds_data["fund_type"],
            defaults=funds_data,
        )


def parse_project_funds(project, project_json):
    """
    Parse project funds and create project funds objects

    @param project: Project object
    @param project_json: project json data
    """
    allocated_fund = {
        "amount": "FUND_ALLOCATED",
        "support_psc": "13%SUPPORT_COST",
        "meeting": "MEETING",
        "interest": "N/A",
        "date": "DATE_APPROVAL",
        "fund_type": "allocated",
    }
    create_project_funds(project, project_json, allocated_fund)

    transferred_fund = {
        "amount": "FUND_TRANSFERRED",
        "support_psc": "13%_TRANSFERRED",
        "meeting": "MEETING_TRANSFERRED",
        "interest": "INTEREST",
        "date": "DATE_TRANSFERRED",
        "fund_type": "transferred",
    }
    create_project_funds(project, project_json, transferred_fund)


def create_project(project_json):
    """
    Create project from project json data (tbINVENTORY.json)

    @param project_json: project json data

    @return: Project object
    """
    project_data = get_project_base_data(
        project_json, project_json["CODE"], is_submissions=False
    )

    if not project_data:
        return None

    # set substance type
    substance_type = "CFC"
    if project_json["HCFC"]:
        substance_type = "HCFC"
    if project_json["HFC"]:
        substance_type = "HFC"
    elif project_json["HFC_PLUS"]:
        substance_type = "HFC_PLUS"

    # set approval meeting no
    # code =  {Country or Region}/{Sector}/{MeetingNo where the project was approved}/{ProjectType}/{ProjectNumber}
    meeting_no = project_json["CODE"].split("/")[2]
    meeting = get_meeting_by_number(meeting_no, project_json["CODE"])
    if not meeting:
        return None

    # set serial number
    serial_number_legacy, additional_funding = get_serial_number_from_code(
        project_json["CODE"]
    )

    project_data.update(
        {
            "serial_number_legacy": serial_number_legacy,
            "additional_funding": additional_funding,
            "legacy_code": project_json["CODE"],
            "approval_meeting": meeting,
            "substance_type": substance_type,
            "application": project_json.get("APPLICATION"),
            "technology": project_json.get("TECHNOLOGY"),
            "plan": project_json.get("PLAN"),
            "impact": project_json.get("IMPACT"),
            "impact_co2mt": project_json.get("IMPACT_CO2MT"),
            "impact_production": project_json.get("IMPACT_PRODUCTION"),
            "impact_prod_co2mt": project_json.get("IMPACT_PROD_CO2MT"),
            "substance_phasedout": project_json.get("ODS_PHASEDOUT"),
            "ods_phasedout_co2mt": project_json.get("ODS_PHASEDOUT_CO2MT"),
            "hcfc_stage": project_json.get("HCFCStage"),
            "fund_disbursed": project_json.get("FUND_DISBURSED"),
            "fund_disbursed_psc": project_json.get("FUND_DISB1_13%"),
            "date_completion": parse_date(project_json.get("DATE_COMPLETION")),
            "date_actual": parse_date(project_json.get("DATE_ACTUAL")),
            "date_comp_revised": parse_date(project_json.get("DATE_COMP_REVISED")),
            "date_per_agreement": parse_date(project_json.get("DATE_PER_AGREEMENT")),
            "remarks": project_json.get("REMARKS"),
        }
    )

    # get or create project
    project = update_or_create_project(project_data)
    parse_project_ODS_ODP(project, project_json)
    parse_project_funds(project, project_json)

    return project


def parse_file(file_path):
    with open(file_path, "r", encoding="utf8") as f:
        json_data = json.load(f)

    for project_json in json_data:
        create_project(project_json)


@transaction.atomic
def import_projects():
    logger.info("⏳ importing projects")
    file_path = IMPORT_PROJECTS_DIR / "tbINVENTORY.json"

    parse_file(file_path)

    logger.info("✔ projects imported")
