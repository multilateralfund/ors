import logging
import numpy as np
import pandas as pd

from django.db import transaction
from django.conf import settings

from core.import_data.utils import (
    COUNTRY_NAME_MAPPING,
    SUBSECTOR_NAME_MAPPING,
    delete_old_data,
    get_object_by_name,
    parse_string,
)
from core.models.agency import Agency
from core.models.country import Country
from core.models.project import Project, ProjectStatus, ProjectSubSector, ProjectType
from core.models.project_submission import (
    ProjectSubmission,
    SubmissionAmount,
)


logger = logging.getLogger(__name__)


def create_submission_amount(submission, row):
    """
    Create SubmissionAmount object
    @param submission: ProjectSubmission object
    @param row: row data
    """
    items = []
    for status in SubmissionAmount.SubmissionStatus:
        # set columns name
        if status == "grand_total":
            amount_name = status.upper()
            amount_13_name = "13%_GRAND_TOTAL"
            impact_name = "IMPACT_TOTAL"
            cost_name = "COST_EFF_TOTAL"
        elif status == "rsvd":
            amount_name = "GRAND_TOTAL_RVSD"
            amount_13_name = "13%_GRAND_TOTAL_RVSD"
            impact_name = "IMPACT_TOTAL_RVSD"
            cost_name = "COST_EFF_TOTAL_RVSD"
        else:
            amount_name = f"AMOUNT_{status.upper()}"
            amount_13_name = f"13%_{status.upper()}"
            impact_name = f"IMPACT_{status.upper()}"
            cost_name = f"COST_EFF_{status.upper()}"

        data = {
            "submission": submission,
            "status": status,
            "amount": row[amount_name],
            "amount_13": row[amount_13_name],
            "impact": row[impact_name],
            "cost_effectiveness": row[cost_name],
        }
        if data["amount"]:
            items.append(SubmissionAmount(**data))
    if items:
        SubmissionAmount.objects.bulk_create(items)


def parse_file(file_path, file_name, meeting_no):
    df = pd.read_excel(file_path).replace({np.nan: None})

    for index_row, row in df.iterrows():
        country_name = COUNTRY_NAME_MAPPING.get(row["COUNTRY"], row["COUNTRY"])
        country = get_object_by_name(
            Country, country_name, index_row, "country", logger
        )
        agency = get_object_by_name(Agency, row["AGENCY"], index_row, "agency", logger)
        # get subsector name from dict if exists else use the same name from the file
        subsect_name = SUBSECTOR_NAME_MAPPING.get(row["SUBSECTOR"], row["SUBSECTOR"])
        subsec = get_object_by_name(
            ProjectSubSector, subsect_name, index_row, "subsector", logger
        )

        proj_type = get_object_by_name(
            ProjectType, row["TYPE"], index_row, "type", logger
        )

        status_str = row["STATUS_CODE"] if row["STATUS_CODE"] else "NEW"
        project_status = get_object_by_name(
            ProjectStatus, status_str, index_row, "status", logger
        )

        # if country or agency or subsector does not exists then skip this row
        if not all([country, agency, subsec, proj_type, project_status]):
            continue

        # set substance type
        substance_type = "HCFC"
        if row["HFC"]:
            substance_type = "HFC"

        project_data = {
            "country": country,
            "subsector": subsec,
            "agency": agency,
            "project_type": proj_type,
            "title": row["PROJECT_TITLE"],
            "description": row["PROJECT_DESCRIPTION"],
            "approval_meeting_no": meeting_no,
            "project_duration": row["PROJECT_DURATION"],
            "products_manufactured": row["PRODUCTS_MANUFACTURED"],
            "excom_provision": row["EXCOM_PROVISION"],
            "impact": row["IMPACT"],
            "substance_type": substance_type,
            "capital_cost": row["CAPITAL_COST"],
            "operating_cost": row["OPERATING_COST"],
            "effectiveness_cost": row["COST_EFFECTIVENESS"],
            "date_completion": row["DATE_COMPLETION"],
            "umbrella_project": row["UMBRELLA_PROJECT"],
            "loan": row["LOAN"],
            "intersessional_approval": row["INTERSESSIONAL_APPROVAL"],
            "retroactive_finance": row["RETROACTIVE_FINANCE"],
            "local_ownership": row["LOCAL_OWNERSHIP"],
            "export_to": row["EXPORT_TO"],
            "national_agency": row["NATIONAL_AGENCY"],
            "status": project_status,
        }

        # get or create project
        project, _ = Project.objects.get_or_create(
            title=project_data["title"],
            country=project_data["country"],
            subsector=project_data["subsector"],
            agency=project_data["agency"],
            project_type=project_data["project_type"],
            approval_meeting_no=project_data["approval_meeting_no"],
            defaults=project_data,
        )

        submission_data = {
            "submission_number": row["PROJECT_NUMBER"],
            "category": parse_string(row["CATEGORY_DEFINITION"]),
            "programme_officer": row["PROGRAMME_OFFICER"],
            "impact_tranche": row["IMPACT_TRANCHE"],
            "funds_allocated": row["FUND_ALLOCATED1"],
            "support_cost_13": row["13%SUPPORT_COST1"],
            "date_approved": row["DATE_APPROVAL1"],
            "contingency_cost": row["CONTINGENCY_COST"],
            "project_cost": row["PROJECT COST"],
            "date_received": row["DATE_RECEIVED"],
            "revision_number": row["REVISION_NUMBER"],
            "date_of_revision": row["DATE_OF_REVISION"],
            "agency_remarks": row["AGENCY_REMARKS"],
            "comments": row["COMMENTS"],
            "withdrawn": row["WITHDRAWN"],
            "issue": row["ISSUE"],
            "issue_description": row["ISSUE_DESCRIPTION"],
            "incomplete": row["INCOMPLETE"],
            "reviewed_mfs": row["REVIEWED_MFS"],
            "correspondance_no": row["CORRESPONDANCE_NO"],
            "plus": row["PLUS"],
            "source_file": file_name,
            "project": project,
        }

        project_submission = ProjectSubmission.objects.create(**submission_data)

        create_submission_amount(project_submission, row)


@transaction.atomic
def import_proposals():
    files = [("tbProposalsNew90.xlsx", 90), ("tbProposalsNew91.xlsx", 91)]
    for file_name, meeting_no in files:
        logger.info(f"⏳ importing {file_name}")
        file_path = settings.IMPORT_DATA_DIR / "proposals" / file_name

        delete_old_data(ProjectSubmission, file_name, logger)
        parse_file(file_path, file_name, meeting_no)

    logger.info("✔ proposals imported")
