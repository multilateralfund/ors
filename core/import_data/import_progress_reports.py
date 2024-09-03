import csv
import functools
import json
import logging

from django.conf import settings
from django.db import models

from core.import_data.utils import delete_old_data
from core.import_data.utils import get_object_by_code
from core.import_data.utils import parse_date
from core.import_data.utils import parse_noop
from core.models import Project
from core.models.project import ProjectProgressReport
from core.models.project import ProjectStatus

logger = logging.getLogger(__name__)


FIELD_MAPPING = {
    "assessment_of_progress": "Assessment of Progress",
    "latest_progress": "Latest Progress",
    "support_returned": "support_returned(37only)",
    "latest_planned_date": "Latest_Planned_Date",
    "disbursements_to_final": "Disbursements made to final beneficiaries from FECO/ MEP",
    "BP_year": "BP_Year",
    "BP_allocation": "BP_Allocation",
    "category": "multi-year/one-off phaseout/individual/rmp/rmp update",
}

FIELDS = (
    "assessment_of_progress",
    "latest_progress",
    "mtg",
    "num",
    "a_n",
    "o_t",
    "irdx",
    "chemical",
    "consumption_odp_out_proposal",
    "consumption_odp_out_actual",
    "production_odp_out_proposal",
    "production_odp_out_actual",
    "date_approved",
    "date_first_disbursement",
    "date_comp_proposal",
    "date_comp_plan",
    "date_comp_actual",
    "date_comp_financial",
    "funds_approved",
    "funds_adjustment",
    "funds_net",
    "funds_disbursed",
    "percent_disbursed",
    "balance",
    "funds_obligated",
    "funds_current_year",
    "support_approved",
    "support_adjustment",
    "support_disbursed",
    "support_balance",
    "support_obligated",
    "support_returned",
    "year_approved",
    "year_of_contribution",
    "months_first_disbursement",
    "months_comp_proposal",
    "months_comp_plan",
    "months_comp_actual",
    "remarks_1",
    "remarks_2",
    "date_comp_plan_22",
    "date_comp_plan_28",
    "date_comp_plan_31",
    "date_comp_plan_34",
    "date_comp_plan_37",
    "date_comp_plan_40",
    "date_comp_plan_43",
    "date_comp_plan_46",
    "date_comp_plan_52",
    "latest_planned_date",
    "BP_year",
    "BP_allocation",
    "MY_consumption_performance_target",
    "MY_actual_consumption",
    "MY_production_performance_target",
    "MY_actual_production",
    "MY_annual_target_met",
    "MY_verification_completed",
    "MY_verification_report",
    "category",
)


@functools.cache
def country_ids():
    file_path = settings.IMPORT_DATA_DIR / "progress_report" / "tbCountryID.json"
    with file_path.open("r") as f:
        country_list = json.load(f)

    return {country["CTR"]: country["COUNTRY"] for country in country_list}


def import_progress_reports():
    logger.info("⏳ importing progress reports")
    file_path = settings.IMPORT_DATA_DIR / "progress_report" / "tbProgress.csv"

    delete_old_data(ProjectProgressReport, file_path)
    parsers = {
        field.name: parse_date if isinstance(field, models.DateField) else parse_noop
        for field in ProjectProgressReport._meta.local_fields
    }

    with file_path.open("r") as csvfile:
        reader = csv.DictReader(csvfile)
        for index, item in enumerate(reader):
            project = get_object_by_code(Project, item["code"], "legacy_code", index)
            project_status = get_object_by_code(
                ProjectStatus, item["status"], "code", index
            )
            latest_status = get_object_by_code(
                ProjectStatus, item["Latest Status"], "code", index
            )

            if not all([project, project_status, latest_status]):
                continue

            data = {
                "source_file": file_path,
                "project": project,
                "status": project_status,
                "latest_status": latest_status,
            }

            for field in FIELDS:
                value = item[FIELD_MAPPING.get(field, field)]
                parse_func = parsers[field]
                data[field] = parse_func(value)

            ProjectProgressReport.objects.create(**data)

    logger.info("✔ progress reports imported")
