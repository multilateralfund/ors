import logging
import numpy as np
import pandas as pd

from django.db import transaction
from django.conf import settings

from core.import_data.utils import (
    delete_old_data,
    get_meeting_by_number,
    get_project_base_data,
    parse_string,
    update_or_create_project,
)
from core.models.project import Project, SubmissionAmount


logger = logging.getLogger(__name__)


def create_submission_amount(project, row):
    """
    Create SubmissionAmount object
    @param project: Project object
    @param row: row data
    """
    items = []
    for status in SubmissionAmount.SubmissionStatus:
        # set columns name
        if status == "grand_total":
            amount_name = status.upper()
            amount_psc_name = "13%_GRAND_TOTAL"
            impact_name = "IMPACT_TOTAL"
            cost_name = "COST_EFF_TOTAL"
        elif status == "rsvd":
            amount_name = "GRAND_TOTAL_RVSD"
            amount_psc_name = "13%_GRAND_TOTAL_RVSD"
            impact_name = "IMPACT_TOTAL_RVSD"
            cost_name = "COST_EFF_TOTAL_RVSD"
        else:
            amount_name = f"AMOUNT_{status.upper()}"
            amount_psc_name = f"13%_{status.upper()}"
            impact_name = f"IMPACT_{status.upper()}"
            cost_name = f"COST_EFF_{status.upper()}"

        data = {
            "project": project,
            "status": status,
            "amount": row[amount_name],
            "amount_psc": row[amount_psc_name],
            "impact": row[impact_name],
            "cost_effectiveness": row[cost_name],
        }
        if data["amount"]:
            items.append(SubmissionAmount(**data))
    if items:
        SubmissionAmount.objects.bulk_create(items)


def parse_file(file_path, file_name, meeting):
    df = pd.read_excel(file_path).replace({np.nan: None})

    for index_row, row in df.iterrows():
        project_data = get_project_base_data(row, index_row)

        if not project_data:
            continue

        # set substance type
        substance_type = "HCFC"
        if row["HFC"]:
            substance_type = "HFC"

        project_data.update(
            {
                "approval_meeting": meeting,
                "project_duration": row["PROJECT_DURATION"],
                "substance_type": substance_type,
                "capital_cost": row["CAPITAL_COST"],
                "national_agency": row["NATIONAL_AGENCY"],
                "serial_number_legacy": row["PROJECT_NUMBER"],
                "submission_number": row["PROJECT_NUMBER"],
                "submission_category": parse_string(row["CATEGORY_DEFINITION"]),
                "programme_officer": row["PROGRAMME_OFFICER"],
                "tranche": row["IMPACT_TRANCHE"],
                "funds_allocated": row["FUND_ALLOCATED1"],
                "support_cost_psc": row["13%SUPPORT_COST1"],
                "date_approved": row["DATE_APPROVAL1"],
                "contingency_cost": row["CONTINGENCY_COST"],
                "project_cost": row["PROJECT COST"],
                "date_received": row["DATE_RECEIVED"],
                "revision_number": row["REVISION_NUMBER"],
                "date_of_revision": row["DATE_OF_REVISION"],
                "agency_remarks": row["AGENCY_REMARKS"],
                "submission_comments": row["COMMENTS"],
                "withdrawn": row["WITHDRAWN"],
                "issue": row["ISSUE"],
                "issue_description": row["ISSUE_DESCRIPTION"],
                "incomplete": row["INCOMPLETE"],
                "reviewed_mfs": row["REVIEWED_MFS"],
                "correspondance_no": row["CORRESPONDANCE_NO"],
                "plus": row["PLUS"],
            }
        )
        project = update_or_create_project(project_data)
        if not project.source_file:
            project.source_file = file_name
            project.save()

        create_submission_amount(project, row)


@transaction.atomic
def import_proposals():
    files = [("tbProposalsNew90.xlsx", 90), ("tbProposalsNew91.xlsx", 91)]
    for file_name, meeting_no in files:
        logger.info(f"⏳ importing {file_name}")
        file_path = settings.IMPORT_DATA_DIR / "proposals" / file_name

        delete_old_data(Project, file_name)
        meeting = get_meeting_by_number(meeting_no, file_name)
        if not meeting:
            logger.error(f"❌ meeting {meeting_no} not found")
            continue
        parse_file(file_path, file_name, meeting)

    logger.info("✔ proposals imported")
