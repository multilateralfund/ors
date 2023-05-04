import logging
import numpy as np
import pandas as pd

from django.db import transaction
from django.conf import settings

from core.import_data.utils import parse_string
from core.models.agency import Agency
from core.models.country import Country
from core.models.project_sector import ProjectSubSector
from core.models.project_submission import (
    ProjectSubmission,
    SubmissionOdsOdp,
    SubmissionAmount,
)


logger = logging.getLogger(__name__)
ODS_ODP_COUNT = 3  # Number of ODS/ODP tuples in the file


def get_object_by_name(cls, obj_name, index_row, obj_type_name):
    """
    get object by name
    @param cls: Class instance
    @param obj_name: string -> object name
    @param index_row: integer -> index row
    @param obj_type_name: string -> object type name

    @return: object
    """
    if not obj_name:
        return None
    obj = cls.objects.get_by_name(obj_name).first()
    if not obj:
        logger.info(
            f"[row: {index_row}]: This {obj_type_name} does not exists in data base: {obj_name}"
        )

    return obj


def create_submission_ods_odp(submission, row):
    """
    Create submission ods odp
    @param submission: ProjectSubmission object
    @param row: row data
    """
    items = []
    for i in range(1, ODS_ODP_COUNT + 1):
        data = {
            "ods_number": i,
            "ods_name": row[f"ODS_NAME{i}"],
            "odp": row[f"ODP{i}"],
            "ods_replacement": row[f"ODS_REPLACEMENT{i}"],
        }
        if data["ods_name"] and data["odp"] and data["ods_replacement"]:
            # if all fields are not empty then create the object
            items.append(SubmissionOdsOdp(**data))
    if items:
        SubmissionOdsOdp.objects.bulk_create(items)


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


@transaction.atomic
def parse_file(file_path, file_name):
    df = pd.read_excel(file_path).replace({np.nan: None})

    for index_row, row in df.iterrows():
        country = get_object_by_name(Country, row["COUNTRY"], index_row, "country")
        subsec = get_object_by_name(
            ProjectSubSector, row["SUBSECTOR"], index_row, "subsector"
        )
        agency = get_object_by_name(Agency, row["AGENCY"], index_row, "agency")

        if not country or not subsec or not agency:
            continue

        submission_data = {
            "project_number": row["PROJECT_NUMBER"],
            "country": country,
            "subsector": subsec,
            "agency": agency,
            "type": parse_string(row["TYPE"]),
            "category": parse_string(row["CATEGORY_DEFINITION"]),
            "programme_officer": row["PROGRAMME_OFFICER"],
            "title": row["PROJECT_TITLE"],
            "description": row["PROJECT_DESCRIPTION"],
            "products_manufactured": row["PRODUCTS_MANUFACTURED"],
            "impact": row["IMPACT"],
            "impact_tranche": row["IMPACT_TRANCHE"],
            "is_HCFC": row["HCFC"],
            "is_HFC": row["HFC"],
            "funds_allocated": row["FUND_ALLOCATED1"],
            "support_cost_13": row["13%SUPPORT_COST1"],
            "meeting1": row["MEETING1"],
            "date_approved": row["DATE_APPROVAL1"],
            "cost_effectivness": row["COST_EFFECTIVENESS"],
            "project_duration": row["PROJECT_DURATION"],
            "date_completion": row["DATE_COMPLETION"],
            "local_ownership": row["LOCAL_OWNERSHIP"],
            "capital_cost": row["CAPITAL_COST"],
            "operating_cost": row["OPERATING_COST"],
            "contingency_cost": row["CONTINGENCY_COST"],
            "project_cost": row["PROJECT COST"],
            "status_code": row["STATUS_CODE"],
            "date_received": row["DATE_RECEIVED"],
            "revision_number": row["REVISION_NUMBER"],
            "date_of_revision": row["DATE_OF_REVISION"],
            "agency_remarks": row["AGENCY_REMARKS"],
            "comments": row["COMMENTS"],
            "withdrawn": row["WITHDRAWN"],
            "issue": row["ISSUE"],
            "incomplete": row["INCOMPLETE"],
            "reviewed_mfs": row["REVIEWED_MFS"],
            "excom_provision": row["EXCOM_PROVISION"],
            "export_to": row["EXPORT_TO"],
            "umbrella_project": row["UMBRELLA_PROJECT"],
            "retroactive_finance": row["RETROACTIVE_FINANCE"],
            "loan": row["LOAN"],
            "intersessional_approval": row["INTERSESSIONAL_APPROVAL"],
            "national_agency": row["NATIONAL_AGENCY"],
            "issue_description": row["ISSUE_DESCRIPTION"],
            "correspondance_no": row["CORRESPONDANCE_NO"],
            "plus": row["PLUS"],
            "source": file_name,
        }

        project_submission = ProjectSubmission.objects.create(**submission_data)

        create_submission_ods_odp(project_submission, row)
        create_submission_amount(project_submission, row)


def drop_old_data(file_name):
    ProjectSubmission.objects.filter(source__iexact=file_name.lower()).all().delete()
    logger.info("✔ old data deleted")


def import_proposals():
    file_name = "tbProposalsNew90.xlsx"
    file_path = settings.IMPORT_DATA_DIR / "proposals" / file_name

    drop_old_data(file_name)
    parse_file(file_path, file_name)

    logger.info("✔ proposals imported")
