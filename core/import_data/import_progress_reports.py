import csv
import logging

from django.conf import settings

from core.import_data.utils import get_object_by_code
from core.import_data.utils import get_object_by_name
from core.import_data.utils import parse_date
from core.models import Agency
from core.models import Country
from core.models import Project
from core.models import Region
from core.models.project import ProjectProgressReport
from core.models.project import ProjectSector
from core.models.project import ProjectStatus
from core.models.project import ProjectType

logger = logging.getLogger(__name__)


def import_progress_reports():
    logger.info("⏳ importing progress reports")
    file_path = settings.IMPORT_DATA_DIR / "progress_report" / "tbProgress.csv"
    with file_path.open("r") as csvfile:
        reader = csv.DictReader(csvfile)
        for index, item in enumerate(reader):
            project = get_object_by_code(Project, item["code"], "code", index, logger)
            country = get_object_by_code(
                Country, item["country"], "iso3", index, logger
            )
            region = get_object_by_code(Region, item["region"], "abbr", index, logger)
            project_sector = get_object_by_code(
                ProjectSector,
                item["sector"],
                "code",
                index,
                logger,
            )
            project_type = get_object_by_code(
                ProjectType, item["type"], "code", index, logger
            )
            project_status = get_object_by_code(
                ProjectStatus, item["status"], "code", index, logger
            )
            latest_status = get_object_by_code(
                ProjectStatus, item["Latest Status"], "code", index, logger
            )
            agency = get_object_by_name(
                Agency,
                item["agency"],
                index,
                "agency",
                logger,
            )
            if not all(
                [
                    project,
                    country,
                    region,
                    project_sector,
                    project_type,
                    project_status,
                    latest_status,
                    agency,
                ]
            ):
                continue

            data = {
                "project": project,
                "project_type": project_type,
                "sector": project_sector,
                "status": project_status,
                "latest_status": latest_status,
                "agency": agency,
                "country": country,
                "region": region,
                "chemical": item["chemical"],
                "mtg": item["mtg"],
                "num": item["num"],
                "a_n": item["a_n"],
                "irdx": item["irdx"],
                "consumption_odp_out_proposal": item["consumption_odp_out_proposal"],
                "consumption_odp_out_actual": item["consumption_odp_out_actual"],
                "production_odp_out_proposal": item["production_odp_out_proposal"],
                "production_odp_out_actual": item["production_odp_out_actual"],
                "date_approved": parse_date(item["date_approved"], logger),
                "date_first_disbursement": parse_date(
                    item["date_first_disbursement"], logger
                ),
                "date_comp_proposal": parse_date(item["date_comp_proposal"], logger),
                "date_comp_actual": parse_date(item["date_comp_actual"], logger),
                "funds_approved": item["funds_approved"],
                "funds_adjustment": item["funds_adjustment"],
                "funds_net": item["funds_net"],
                "funds_disbursed": item["funds_disbursed"],
                "percent_disbursed": item["percent_disbursed"],
                "balance": item["balance"],
                "funds_obligated": item["funds_obligated"],
                "funds_current_year": item["funds_current_year"],
                "support_approved": item["support_approved"],
                "support_adjustment": item["support_adjustment"],
                "support_disbursed": item["support_disbursed"],
                "support_obligated": item["support_obligated"],
                "support_returned": item["support_returned(37only)"],
                "year_approved": item["year_approved"],
                "months_first_disbursement": item["months_first_disbursement"],
                "months_comp_proposal": item["months_comp_proposal"],
                "months_comp_plan": item["months_comp_plan"],
                "months_comp_actual": item["months_comp_actual"],
                "remarks_1": item["remarks_1"],
                "remarks_2": item["remarks_2"],
                "year_of_contribution": item["year_of_contribution"],
                "BP_allocation": item["BP_Allocation"],
                "category": item[
                    "multi-year/one-off phaseout/individual/rmp/rmp update"
                ],
                "meeting_of_report": item["meeting_of_report"],
            }
            ProjectProgressReport.objects.create(
                **{key: None if value == "" else value for key, value in data.items()}
            )

    logger.info("✔ progress reports imported")
