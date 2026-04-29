import logging
import pandas as pd
import re

from datetime import datetime
from dateutil import parser
from decimal import Decimal

from django.db import connection, transaction

from core.import_data.utils import (
    IMPORT_RESOURCES_V2_DIR,
)
from core.models import (
    Enterprise,
    EnterpriseOdsOdp,
    EnterpriseStatus,
    ProjectSector,
    ProjectSubSector,
)
from core.import_data_v2.utils import (
    get_country_by_name,
    get_agency_by_name,
    get_sector_by_name_or_code,
    get_subsector_by_name,
    get_type_by_code,
    get_enterprise_status_by_name,
    get_meeting_by_number,
    get_substance_blend_ods_display_name,
)

# pylint: disable=bare-except,broad-exception-caught,disable=line-too-long,too-many-locals,too-many-branches,too-many-statements,too-many-nested-blocks

logger = logging.getLogger(__name__)


def parse_date(value):
    if not value or value in ["", None, "none"]:
        return None
    try:
        return parser.parse(str(value))
    except (ValueError, OverflowError):
        return None


def extract_decimal(value):
    """Extract first decimal number from a string."""
    if not value or value in ["", None, "none"]:
        return None
    if isinstance(value, (int, float, Decimal)):
        return Decimal(str(value))

    # Extract first number (with optional decimals)
    match = re.search(r"-?\d+\.?\d*", str(value).strip())
    if match:
        try:
            return Decimal(match.group())
        except:
            return None
    return None


def extract_integer(value):
    """Extract first integer number from a string."""
    if not value or value in ["", None, "none"]:
        return None
    if isinstance(value, int):
        return value

    # Extract first integer number
    match = re.search(r"-?\d+", str(value).strip())
    if match:
        try:
            return int(match.group())
        except:
            return None
    return None


@transaction.atomic
def delete_enterprises(reset_index):
    enterprises = Enterprise.objects.all()
    count = enterprises.count()

    enterprises.delete()
    logger.info(f"Deleted {count} enterprises")

    if reset_index:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT setval(pg_get_serial_sequence('core_enterprise', 'id'), 1, false);"
            )
        logger.info("Reset enterprise ID sequence")


@transaction.atomic
def create_enterprise_statuses():
    statuses = [
        "New",
        "Ongoing",
        "Closed",
        "Reduced",
        "Completed",
        "Transferred",
        "Cancelled",
    ]
    for status in statuses:
        EnterpriseStatus.objects.get_or_create(name=status)
    logger.info(f"Ensured enterprise statuses exist: {', '.join(statuses)}")


@transaction.atomic
def import_enterprises(delete, reset_index):
    file_path = (
        IMPORT_RESOURCES_V2_DIR
        / "enterprises"
        / "Enterprises_DB_and_Templates_Combined_final_Dec_2025.xlsx"
    )
    df = pd.read_excel(file_path, sheet_name="Enterprise Combined", header=1).fillna("")
    df.replace({"NaT": None}, inplace=True)

    if delete:
        delete_enterprises(reset_index=reset_index)

    create_enterprise_statuses()
    for i, row in df.iterrows():
        try:
            country = get_country_by_name(row["Country"])
            if not country:
                logger.warning(
                    f"⚠️ Row {i}: Country with name '{row['Country']}' not found for enterprise '{row['Enterprise']}'"
                )
            agency = get_agency_by_name(row["Agency"], verbose=False)
            if not agency and row["Agency"].strip():
                logger.warning(
                    f"⚠️ Row {i}: Agency with name '{row['Agency']}' not found for enterprise '{row['Enterprise']}'"
                )

            sector = get_sector_by_name_or_code(row["Sector"], verbose=False)
            if not sector and row["Sector"].strip():
                sector = ProjectSector.objects.create(name=row["Sector"], obsolete=True)
                logger.warning(
                    f"⚠️ Row {i}: Sector with name '{row['Sector']}' not found for enterprise '{row['Enterprise']}'"
                )

            subsector = get_subsector_by_name(row["Sub-sector"], verbose=False)
            if not subsector and row["Sub-sector"].strip():
                subsector = ProjectSubSector.objects.create(
                    name=row["Sub-sector"].strip(), obsolete=True
                )
                logger.warning(
                    f"⚠️ Row {i}: Sub-sector with name '{row['Sub-sector']}' not found for enterprise '{row['Enterprise']}'"
                )
            project_type = get_type_by_code(row["Type"])
            if not project_type and row["Type"].strip():
                logger.warning(
                    f"⚠️ Row {i}: Project Type with code '{row['Type']}' not found for enterprise '{row['Enterprise']}'"
                )

            try:
                status = get_enterprise_status_by_name(row["Status"])
                if not status and row["Status"].strip():
                    logger.warning(
                        f"⚠️ Row {i}: Enterprise Status with name '{row['Status']}' not found for enterprise '{row['Enterprise']}'"
                    )
            except Exception as e:
                logger.warning(
                    f"⚠️ Row {i}: Error processing Enterprise Status '{row['Status']}' for enterprise '{row['Enterprise']}': {str(e)}"
                )
                status = None

            meeting = get_meeting_by_number(row["Meeting"])
            if not meeting and row["Meeting"]:
                logger.warning(
                    f"⚠️ Row {i}: Meeting with number '{row['Meeting']}' not found for enterprise '{row['Enterprise']}'"
                )

            corrected_values = {}
            for column in [
                "Planned completion date",
                "Actual completion date",
                "Date of approval",
                "Date of report",
                "Date of revision",
            ]:
                if row[column] in ["", None, "none"]:
                    corrected_values[column] = None
                elif isinstance(row[column], str):
                    try:
                        corrected_values[column] = parse_date(row[column])
                    except ValueError:
                        logger.warning(
                            f"⚠️ Row {i}: '{column}' value '{row[column]}' is not in a valid date format (YYYY-MM-DD) for enterprise '{row['Enterprise']}'"
                        )
                        corrected_values[column] = None
                elif row[column] and not isinstance(row[column], datetime):
                    logger.warning(
                        f"⚠️ Row {i}: '{column}' value '{row[column]}' is not a valid date for enterprise '{row['Enterprise']}'"
                    )
                    corrected_values[column] = None
                else:
                    corrected_values[column] = row[column] or None

            corrected_values["Project duration"] = (
                extract_integer(row["Project duration"])
                if row["Project duration"]
                else None
            )

            corrected_values["Revision number"] = (
                extract_integer(row["Revision number"])
                if row["Revision number"]
                else None
            )

            for column in [
                "Chemical Phased out (mt)",
                "Impact: (Total ODP tonnes)",
                "Capital cost approved (US $)",
                "Operating cost approved (US $)",
                "Cost-effectiveness approved (US $/kg)",
                "Funds disbursed (US $)",
                "Capital cost disbursed (US $)",
                "Operating cost disbursed (US $)",
                "Cost effectiveness actual (US $/kg)",
                "Funds transferred (US $)",
                "Chemical Phased in1 (mt)",
                "Consumption1 (mt)",
                "Chemical Phased in2 (mt)",
                "Consumption2 (mt)",
                "Chemical Phased in3 (mt)",
                "Consumption3 (mt)",
                "Chemical Phased in4 (mt)",
                "Consumption4 (mt)",
            ]:
                if row[column] is None:
                    corrected_values[column] = None
                elif isinstance(row[column], str) and row[column].strip().lower() in [
                    "-",
                    "",
                    "none",
                    "not applicable",
                    "n/a",
                    "not available",
                    "n.a.",
                    "no second alternative",
                    "on going",
                ]:
                    corrected_values[column] = None
                else:
                    corrected_values[column] = extract_decimal(row[column])
                    if corrected_values[column] is None and row[column]:
                        logger.warning(
                            f"⚠️ Row {i}: '{column}' value '{row[column]}' is not a valid number for enterprise '{row['Enterprise']}'"
                        )

            try:
                enterprise = Enterprise.objects.create(
                    legacy_code=row["Legacy Code"],
                    name=row["Enterprise"].strip(),
                    location=row["Location"].strip() if row["Location"] else None,
                    city=row["City"],
                    stage=row["Stage"],
                    country=country,
                    agency=agency,
                    sector=sector,
                    subsector=subsector,
                    application=row["Application"],
                    project_type=project_type,
                    planned_completion_date=corrected_values["Planned completion date"],
                    actual_completion_date=corrected_values["Actual completion date"],
                    status=status,
                    project_duration=corrected_values["Project duration"],
                    local_ownership=row["Local ownership"],
                    export_to_non_a5=row["Export to non-A5"],
                    revision_number=corrected_values["Revision number"],
                    meeting=meeting,
                    date_of_approval=row["Date of approval"] or None,
                    chemical_phased_out=corrected_values["Chemical Phased out (mt)"]
                    or None,
                    impact=corrected_values["Impact: (Total ODP tonnes)"] or None,
                    funds_approved=row["Funds approved (US $)"] or None,
                    capital_cost_approved=corrected_values[
                        "Capital cost approved (US $)"
                    ],
                    operating_cost_approved=corrected_values[
                        "Operating cost approved (US $)"
                    ],
                    cost_effectiveness_approved=corrected_values[
                        "Cost-effectiveness approved (US $/kg)"
                    ],
                    funds_disbursed=corrected_values["Funds disbursed (US $)"],
                    capital_cost_disbursed=corrected_values[
                        "Capital cost disbursed (US $)"
                    ],
                    operating_cost_disbursed=corrected_values[
                        "Operating cost disbursed (US $)"
                    ],
                    cost_effectiveness_actual=corrected_values[
                        "Cost effectiveness actual (US $/kg)"
                    ],
                    co_financing_planned=row["Co-financing planned (US $)"],
                    co_financing_actual=row["Co-financing actual (US $)"],
                    funds_transferred=corrected_values["Funds transferred (US $)"],
                    agency_remarks=row["Agency remarks"],
                    secretariat_remarks=row["Secretariat remarks"],
                    excom_provision=row["ExCom provision"],
                    date_of_report=corrected_values["Date of report"] or None,
                    date_of_revision=corrected_values["Date of revision"] or None,
                )
                enterprise.generate_code()
                enterprise.save()

                for i in range(1, 5):
                    try:
                        substance_to_check = str(row[f"Chemical Name{i}"])
                    except KeyError:
                        substance_to_check = ""
                    if substance_to_check.strip().lower() in [
                        "",
                        "none",
                        "not applicable",
                        "n/a",
                        "-",
                    ]:
                        substance_to_check = ""
                    substance, blend, ods_display_name = (
                        get_substance_blend_ods_display_name(
                            substance_to_check, enterprise.legacy_code, verbose=False
                        )
                    )

                    for value in [
                        substance,
                        blend,
                        ods_display_name,
                        corrected_values[f"Chemical Phased in{i} (mt)"],
                        corrected_values[f"Consumption{i} (mt)"],
                        row[f"Selected alternative{i}"],
                    ]:
                        if value is not None and str(value).strip().lower() not in [
                            "",
                            "none",
                            "not applicable",
                            "n/a",
                            "-",
                            0,
                        ]:
                            break
                    else:
                        continue  # Skip creating EnterpriseOdsOdp if all values are empty or not applicable
                    EnterpriseOdsOdp.objects.create(
                        enterprise=enterprise,
                        ods_substance=substance,
                        ods_display_name=ods_display_name,
                        ods_blend=blend,
                        consumption=corrected_values[f"Consumption{i} (mt)"] or None,
                        selected_alternative=row[f"Selected alternative{i}"],
                        chemical_phased_in_mt=corrected_values[
                            f"Chemical Phased in{i} (mt)"
                        ]
                        or None,
                    )

            except Exception as e:
                logger.error(
                    f"❌ Row {i}: Error saving enterprise '{row['Enterprise']}': {str(e)}"
                )
                break
        except Exception as e:
            logger.error(
                f"❌ Row {i}: Error processing enterprise '{row['Enterprise']}': {str(e)}"
            )
            continue
