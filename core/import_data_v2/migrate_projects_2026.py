import logging
from datetime import datetime
import pandas as pd
import pytz

from django.db import transaction
from django.db.models import Q

from core.api.views.utils import log_project_history
from core.import_data.utils import (
    IMPORT_RESOURCES_V2_DIR,
)

from core.models import (
    Agency,
    Country,
    ProjectStatus,
    Substance,
    Blend,
    Meeting,
    Project,
    ProjectOdsOdp,
    MetaProject,
)
from core.api.serializers.project_v2 import HISTORY_DESCRIPTION_POST_EXCOM_UPDATE
from core.models.project_metadata import (
    ProjectCluster,
    ProjectType,
    ProjectSector,
    ProjectSubSector,
    ProjectSubmissionStatus,
)
from core.utils import post_approval_changes, get_project_sub_code
from core.import_data.utils import get_import_user

# pylint: disable=dangerous-default-value,too-many-statements,inconsistent-return-statements,broad-exception-caught,too-many-branches

logger = logging.getLogger(__name__)


def get_cluster_by_name(name):
    cluster = ProjectCluster.objects.filter(name__iexact=name.strip()).first()
    if not cluster:
        logger.warning(f"⚠️ Cluster with name '{name.strip()}' not found")
    return cluster


def get_type_by_name(name):
    project_type = ProjectType.objects.filter(name__iexact=name.strip()).first()
    if not type:
        logger.warning(f"⚠️ Type with name '{name.strip()}' not found")
    return project_type


def get_sector_by_name(name):
    TRANSLATED_SECTORS = {"Fumigation": "Fumigant"}
    if name.strip() in TRANSLATED_SECTORS:
        name = TRANSLATED_SECTORS[name.strip()]
    sector = ProjectSector.objects.filter(name__iexact=name.strip()).first()
    if not sector and name.strip():
        logger.warning(f"⚠️ Sector with name '{name.strip()}' not found")
    return sector


def get_substance_blend_ods_display_name(name, code):
    name = name.strip()
    ods_display_name = name
    TRANSLATE_ODS_ODP_NAMES = {
        "MB": "Methyl Bromide",
    }
    name = TRANSLATE_ODS_ODP_NAMES.get(name, name)
    substance = None
    blend = None
    substance = Substance.objects.filter(name__iexact=name).first()
    if not substance:
        logger.warning(
            f"⚠️ Substance with name '{name}' not found while processing ODS Phaseout Fields at legacy code {code}"
        )
        blend = Blend.objects.filter(name__iexact=name).first()
        if not blend:
            logger.warning(
                f"⚠️ Blend with name '{name}' not found while processing ODS Phaseout Fields at legacy code {code}"
            )
    return substance, blend, ods_display_name


def find_project_ods_odp_by_name(project_ods_odps, name):
    TRANSLATE_ODS_ODP_NAMES = {
        "MB": "Methyl Bromide",
    }
    if name.strip() in TRANSLATE_ODS_ODP_NAMES:
        name = TRANSLATE_ODS_ODP_NAMES[name.strip()]
    return project_ods_odps.filter(
        Q(ods_display_name=name.strip())
        | Q(ods_substance__name=name.strip())
        | Q(ods_blend__name=name.strip())
    ).first()


def get_subsectors_by_name(name):
    TRANSLATE_SUB_SECTORS = {
        "Industrial and commercial refrigeration": "Industrial and commercial refrigeration (ICR)",
        "Rgid PU": "Rigid PU",
        "Residencial air-conditioning": "Residential air-conditioning",
        "Other aerosols": "Other Aeresols",
        "Metered Dose Inhalers, other aerosols": "Metered dose inhalers",
        "Air conditioning compressor": "AC Compressor",
        "Air-conditioning compressor": "AC Compressor",
        "Air-Conditioning compressor": "AC Compressor",
        "End user, industrial refrigeration": "End User",
        "commercial air conditioning": "Commercial air-conditioning",
    }
    subsectors = []
    if name and str(name).strip():
        name = TRANSLATE_SUB_SECTORS.get(str(name).strip(), str(name).strip())
        subsector = ProjectSubSector.objects.filter(name__iexact=name).first()
        if not subsector:
            # now we can try to split by comma
            if name in ["Rigid PU, flexible", "Rigid PU, XPS"]:
                subsector_names = [name]
            else:
                subsector_names = [s.strip() for s in name.split(",")]
            for subsector_name in subsector_names:
                subsector_name = TRANSLATE_SUB_SECTORS.get(
                    str(subsector_name).strip(), str(subsector_name).strip()
                )
                subsector = ProjectSubSector.objects.filter(
                    name__iexact=subsector_name
                ).first()
                if subsector:
                    subsectors.append(subsector)
                else:
                    logger.warning(
                        f"""⚠️ Sub-sector with name '{subsector_name}' not found while processing
                         subsectors with original name '{name.strip()}'"""
                    )
        return subsectors


def get_country_by_name(name):
    TRANSLATE_COUNTRIES = {
        "Lao, PDR": "Lao PDR",
        "Moldova, Rep": "Moldova",
        "Timor Leste": "Timor-Leste",
        "Micronesia": "Micronesia (Federated States of)",
        "Guinea-Bissau": "Guinea Bissau",
        "": "",
    }
    if name.strip() in TRANSLATE_COUNTRIES:
        name = TRANSLATE_COUNTRIES[name.strip()]
    country = Country.objects.find_by_name(name)
    if not country:
        logger.warning(f"⚠️ Country with name '{name.strip()}' not found")
    return country


def get_agency_by_name(name):
    TRANSLATE_AGENCIES = {
        "IBRD": "World Bank",
    }
    if name.strip() in TRANSLATE_AGENCIES:
        name = TRANSLATE_AGENCIES[name.strip()]
    agency = Agency.objects.filter(name__iexact=name.strip()).first()
    if not agency:
        logger.warning(f"⚠️ Agency with name '{name.strip()}' not found")
    return agency


def get_status_by_name(name):
    status = ProjectStatus.objects.filter(name__iexact=name.strip()).first()
    if not status:
        logger.warning(f"⚠️ Status with name '{name.strip()}' not found")
    return status


def update_field(project, field_name, new_value, logging_message=True):
    current_value = getattr(project, field_name)
    if current_value != new_value:
        if logging_message:
            logger.warning(
                f"""⚠️ Updating field '{field_name}' for project with legacy
                    code '{project.legacy_code}' from '{current_value}' to '{new_value}'
            """
            )
        setattr(project, field_name, new_value)


def get_date(date_value):
    if pd.isna(date_value):
        return None
    return date_value


def create_missing_clusters_types_sectors_subsectors(dry_run=True):
    if not dry_run:
        ProjectSubSector.objects.get_or_create(name="Process Agents, Solvent")
        ProjectSubSector.objects.get_or_create(name="PMU")
        ProjectSubSector.objects.get_or_create(
            name="Metered Dose Inhalers, other aerosols"
        )
        ProjectSubSector.objects.get_or_create(name="Rigid PU, flexible")
        ProjectSubSector.objects.get_or_create(name="Rigid PU, XPS")
        ProjectSubSector.objects.get_or_create(
            name="End user, commercial air conditioning, commercial refrigeration"
        )
        ProjectSubSector.objects.get_or_create(name="Air-conditioning")
        ProjectSubSector.objects.get_or_create(name="Other AC components")


def create_new_project(row, dry_run=True):
    # Implement logic to create a new project based on the row data
    # This is a placeholder function and should be expanded based on the actual requirements
    country = get_country_by_name(row["COUNTRY"])
    agency = get_agency_by_name(row["AGENCY"])
    cluster = get_cluster_by_name(row["Cluster"])
    project_type = get_type_by_name(row["Type"])
    sector = get_sector_by_name(row["Sector"])
    subsectors = get_subsectors_by_name(row["Subsector"])
    total_fund_approved = row["TOTAL_FUND_APPROVED"]
    total_psc_cost = row["TOTAL_13%SUPPORT_COST"]
    total_grant = row["TOTAL_GRANT"]
    date_comp_revised = get_date(row["DATE_COMP_REVISED"])
    status = get_status_by_name(row["STATUS_CODE"])
    category = None
    if cluster.category == "IND":
        category = "Individual"
    elif cluster.category == "MYA":
        category = "Multi-year agreement"
    else:
        logger.warning(
            f"⚠️ Cluster with name '{cluster.name}' has an unrecognized category '{cluster.category}'"
        )
    production = None
    if cluster.production:
        production = cluster.production
    else:
        production = False

    meeting_number = row["CODE"].split("/")[2]
    meeting = Meeting.objects.filter(number=meeting_number).first()
    if not meeting:
        logger.warning(
            f"""⚠️ Meeting with number '{meeting_number}' not found while 
            processing project with legacy code '{row['CODE']}'
            """
        )

    approved_submission_status = ProjectSubmissionStatus.objects.filter(
        name__iexact="Approved"
    ).first()
    project = Project(
        title=row["PROJECT_TITLE"],
        description=row["PROJECT_DESCRIPTION"],
        legacy_code=row["CODE"],
        agency=agency,
        country=country,
        cluster=cluster,
        project_type=project_type,
        project_type_legacy=row["TYPE"],
        sector=sector,
        sector_legacy=row["SEC"],
        subsector_legacy=row["SUBSECTOR"],
        funding_window=row["FUNDING_WINDOWS"],
        excom_provision=row["EXCOM_PROVISION"],
        additional_funding=row["HFC_PLUS"],
        total_fund_approved=total_fund_approved,
        total_psc_cost=total_psc_cost,
        total_grant=total_grant,
        date_completion=get_date(row["DATE_COMPLETION"]),
        date_actual=get_date(row["DATE_ACTUAL"]),
        project_end_date=get_date(row["DATE_ACTUAL"]),
        date_comp_revised=date_comp_revised,
        date_per_agreement=get_date(row["DATE_PER_AGREEMENT"]),
        status=status,
        remarks=row["REMARKS"],
        # computed filled fields
        category=category,
        production=production,
        version=3,
        submission_status=approved_submission_status,
        support_cost_psc=total_psc_cost,
        total_fund=total_fund_approved,
        meeting=meeting,
    )
    if not dry_run:
        project.save()
        if subsectors:
            project.subsectors.add(*subsectors)
        serial_number = Project.objects.get_next_serial_number(project.country.id)
        project.serial_number = serial_number
        project.save()
        post_approval_changes(project)
        project.save()
    return project


def process_current_invetory_sheet(dry_run=True):
    file_path = (
        IMPORT_RESOURCES_V2_DIR
        / "projects"
        / "migration_2026"
        / "2026.02.12. Inventory_EDW_Migration_ARPFeb8.xlsx"
    )

    df = pd.read_excel(file_path, sheet_name="Current Inventory", header=2).fillna("")
    df.replace({"NaT": None}, inplace=True)
    count = 0
    statuses = []
    for _, row in df.iterrows():
        if row["STATUS_CODE"] not in statuses:
            statuses.append(row["STATUS_CODE"])
        project = Project.objects.filter(legacy_code=row["CODE"]).first()
        if not project:
            if row["ID"]:
                count += 1
                logger.warning(f"⚠️ Project with legacy code '{row['CODE']}' not found")
                continue
            create_new_project(row, dry_run=dry_run)
        else:
            country_value = get_country_by_name(row["COUNTRY"])
            update_field(project, "country", country_value)
            agency = get_agency_by_name(row["AGENCY"])
            update_field(project, "agency", agency)
            update_field(project, "project_type_legacy", row["TYPE"])
            update_field(project, "sector_legacy", row["SEC"])
            update_field(project, "subsector_legacy", row["SUBSECTOR"])
            update_field(project, "title", row["PROJECT_TITLE"])
            update_field(
                project,
                "description",
                row["PROJECT_DESCRIPTION"],
                logging_message=False,
            )
            update_field(
                project, "funding_window", row["FUNDING_WINDOWS"], logging_message=False
            )
            update_field(
                project,
                "excom_provision",
                row["EXCOM_PROVISION"],
                logging_message=False,
            )
            update_field(project, "additional_funding", row["HFC_PLUS"])
            update_field(
                project,
                "total_fund_approved",
                get_date(row["TOTAL_FUND_APPROVED"]),
                logging_message=False,
            )
            update_field(
                project,
                "total_psc_cost",
                get_date(row["TOTAL_13%SUPPORT_COST"]),
                logging_message=False,
            )
            update_field(
                project,
                "total_grant",
                get_date(row["TOTAL_GRANT"]),
                logging_message=False,
            )
            update_field(
                project,
                "date_completion",
                get_date(row["DATE_COMPLETION"]),
                logging_message=False,
            )
            update_field(
                project,
                "date_actual",
                get_date(row["DATE_ACTUAL"]),
                logging_message=False,
            )
            update_field(
                project,
                "project_end_date",
                get_date(row["DATE_ACTUAL"]),
                logging_message=False,
            )
            update_field(
                project,
                "date_comp_revised",
                get_date(row["DATE_COMP_REVISED"]),
                logging_message=False,
            )
            update_field(
                project,
                "date_per_agreement",
                get_date(row["DATE_PER_AGREEMENT"]),
                logging_message=False,
            )
            status = get_status_by_name(row["STATUS_CODE"])
            update_field(project, "status", status, logging_message=False)
            update_field(project, "remarks", row["REMARKS"], logging_message=False)

            if cluster_object := get_cluster_by_name(row["Cluster"]):
                project.cluster = cluster_object
            if project_type := get_type_by_name(row["Type"]):
                project.project_type = project_type
            if sector := get_sector_by_name(row["Sector"]):
                project.sector = sector
            subsectors = get_subsectors_by_name(row["Subsector"])
            if subsectors:
                project.subsectors.add(*subsectors)
            if not dry_run:
                project.save()

    logger.info(
        f"Finished processing Current Inventory sheet. {count} projects not found."
    )


def process_set_new_code(dry_run=True):
    file_path = (
        IMPORT_RESOURCES_V2_DIR
        / "projects"
        / "migration_2026"
        / "2026.02.12. Inventory_EDW_Migration_ARPFeb8.xlsx"
    )

    df = pd.read_excel(file_path, sheet_name="Current Inventory", header=2).fillna("")
    df.replace({"NaT": None}, inplace=True)
    for _, row in df.iterrows():
        project = Project.objects.filter(legacy_code=row["CODE"]).first()
        if not project:
            logger.warning(f"⚠️ Project with legacy code '{row['CODE']}' not found")
            continue

        new_project_code = get_project_sub_code(
            project.country,
            project.cluster,
            project.agency,
            project.project_type,
            project.sector,
            project.meeting,
            project.serial_number,
            project.metacode,
        )
        if project.code != new_project_code:
            logger.warning(
                f"""⚠️ Updating project code for project with legacy code '{project.legacy_code}' 
                from '{project.code}' to '{new_project_code}'
                """
            )
            project.code = new_project_code
            if not dry_run:
                project.save()


def process_ods_phaseout_fields_sheet(dry_run=True, legacy_codes_to_ignore=[]):
    file_path = (
        IMPORT_RESOURCES_V2_DIR
        / "projects"
        / "migration_2026"
        / "2026.02.12. Inventory_EDW_Migration_ARPFeb8.xlsx"
    )

    df = pd.read_excel(file_path, sheet_name="ODS Phaseout fields", header=1).fillna("")

    for _, row in df.iterrows():
        if row["CODE"] in legacy_codes_to_ignore:
            logger.info(f"Skipping project with legacy code '{row['CODE']}'")
            continue
        project = Project.objects.filter(legacy_code=row["CODE"]).first()
        if not project:
            substance, blend, ods_display_name = get_substance_blend_ods_display_name(
                row["ODS_NAME"], row["CODE"]
            )
            logger.warning(f"⚠️ Project with legacy code '{row['CODE']}' not found")
            continue
        existing_project_ods_odp = find_project_ods_odp_by_name(
            ProjectOdsOdp.objects.filter(project=project), row["ODS_NAME"]
        )
        if existing_project_ods_odp:
            existing_project_ods_odp.ods_replacement = row["ODS_REPLACEMENT"]
            existing_project_ods_odp.co2_mt = row["CO2MT"] or None
            existing_project_ods_odp.odp = row["ODP"] or None
            existing_project_ods_odp.phase_out_mt = row["Mt"] or None
            if not dry_run:
                existing_project_ods_odp.save()
        else:
            substance, blend, ods_display_name = get_substance_blend_ods_display_name(
                row["ODS_NAME"], row["CODE"]
            )
            new_project_ods_odp = ProjectOdsOdp(
                project=project,
                ods_display_name=ods_display_name,
                ods_substance=substance,
                ods_blend=blend,
                ods_replacement=row["ODS_REPLACEMENT"],
                co2_mt=row["CO2MT"] or None,
                odp=row["ODP"] or None,
                phase_out_mt=row["Mt"] or None,
            )
            if not dry_run:
                new_project_ods_odp.save()


def process_ods_production_fields_sheet(dry_run=True, legacy_codes_to_ignore=[]):
    file_path = (
        IMPORT_RESOURCES_V2_DIR
        / "projects"
        / "migration_2026"
        / "2026.02.12. Inventory_EDW_Migration_ARPFeb8.xlsx"
    )

    df = pd.read_excel(file_path, sheet_name="ODS Production fields", header=1).fillna(
        ""
    )

    for _, row in df.iterrows():
        if row["CODE"] in legacy_codes_to_ignore:
            logger.info(
                f"""Skipping project with legacy code '{row['CODE']}' as it is
                in the ignore list extracted from C+P sheets
                """
            )
            continue
        project = Project.objects.filter(legacy_code=row["CODE"]).first()

        if not project:
            substance, blend, ods_display_name = get_substance_blend_ods_display_name(
                row["ODS_PRODUCTION"], row["CODE"]
            )
            logger.warning(
                f"⚠️ Project with legacy code '{row['CODE']}' not found while processing ODS Phaseout Fields sheet"
            )
            continue

        existing_project_ods_odp = find_project_ods_odp_by_name(
            ProjectOdsOdp.objects.filter(project=project), row["ODS_PRODUCTION"]
        )
        if existing_project_ods_odp:
            existing_project_ods_odp.ods_replacement = row["ODS_REPLACEMENT"]
            existing_project_ods_odp.co2_mt = row["CO2MT"] or None
            existing_project_ods_odp.odp = row["ODP"] or None
            if not dry_run:
                existing_project_ods_odp.save()
        else:
            substance, blend, ods_display_name = get_substance_blend_ods_display_name(
                row["ODS_PRODUCTION"], row["CODE"]
            )
            new_project_ods_odp = ProjectOdsOdp(
                project=project,
                ods_display_name=ods_display_name,
                ods_substance=substance,
                ods_blend=blend,
                ods_replacement=row["ODS_REPLACEMENT"],
                co2_mt=row["CO2MT"] or None,
                odp=row["ODP"] or None,
            )
            if not dry_run:
                new_project_ods_odp.save()

        if not dry_run:
            project.production = True
            project.save()


def extract_consumption_and_production_projects_to_ignore_list():
    file_path = (
        IMPORT_RESOURCES_V2_DIR
        / "projects"
        / "migration_2026"
        / "2026.02.12. Inventory_EDW_Migration_ARPFeb8.xlsx"
    )
    legacy_codes_to_ignore = []
    df = pd.read_excel(file_path, sheet_name="C+P Production", header=3).fillna("")

    for _, row in df.iterrows():
        if row["Legacy Code"] and row["Legacy Code"] not in legacy_codes_to_ignore:
            legacy_codes_to_ignore.append(row["Legacy Code"])

    df = pd.read_excel(file_path, sheet_name="C+P Consumption", header=3).fillna("")

    for _, row in df.iterrows():
        if row["Legacy Code"] and row["Legacy Code"] not in legacy_codes_to_ignore:
            legacy_codes_to_ignore.append(row["Legacy Code"])
    logger.info(
        f"Extracted {len(legacy_codes_to_ignore)} legacy codes to ignore from C+P sheets"
    )
    return legacy_codes_to_ignore


def process_funding_fields_sheet(dry_run=True, legacy_codes_to_ignore=[]):
    file_path = (
        IMPORT_RESOURCES_V2_DIR
        / "projects"
        / "migration_2026"
        / "2026.02.12. Inventory_EDW_Migration_ARPFeb8.xlsx"
    )
    df = pd.read_excel(file_path, sheet_name="Funding fields", header=2).fillna("")
    ids_already_updated = []
    import_user = get_import_user()
    for _, row in df.iterrows():
        if row["CODE"] in legacy_codes_to_ignore:
            logger.info(
                f"""Skipping project with legacy code '{row['CODE']}' as it
                  is in the ignore list extracted from C+P sheets
                  """
            )
            continue
        project = Project.objects.filter(legacy_code=row["CODE"]).first()
        if not project:
            logger.warning(
                f"⚠️ Project with legacy code '{row['CODE']}' not found while processing Funding Fields sheet"
            )
            continue
        meeting = Meeting.objects.filter(number=row["MEETING"]).first()
        if not meeting:
            logger.warning(
                f"""⚠️ Meeting with name '{row['MEETING']}' not found while processing 
                Funding Fields sheet for project with legacy code '{row['CODE']}'
                """
            )
            continue
        if project.id in ids_already_updated:
            # we create a post-excom update
            if not dry_run:
                project.increase_version(import_user)
                log_project_history(
                    project,
                    import_user,
                    HISTORY_DESCRIPTION_POST_EXCOM_UPDATE,
                )
            project.date_approved = get_date(row["DATE_APPROVAL"])
            project.post_excom_meeting = meeting
            project.total_fund += row["FUND_ALLOCATED"]
            project.support_cost_psc += row["SUPPORT_COST_13"]
            if not dry_run:
                project.save()
        else:
            project.date_approved = get_date(row["DATE_APPROVAL"])
            project.meeting = meeting
            project.total_fund_approved = row["FUND_ALLOCATED"]
            project.total_psc_cost = row["SUPPORT_COST_13"]
            project.total_fund = row["FUND_ALLOCATED"]
            project.support_cost_psc = row["SUPPORT_COST_13"]
            if not dry_run:
                project.save()
        ids_already_updated.append(project.id)


def process_transfer_fields_sheet(dry_run=True, legacy_codes_to_ignore=[]):
    file_path = (
        IMPORT_RESOURCES_V2_DIR
        / "projects"
        / "migration_2026"
        / "2026.02.12. Inventory_EDW_Migration_ARPFeb8.xlsx"
    )
    df = pd.read_excel(file_path, sheet_name="Transfer fields", header=1).fillna("")
    transfer_status = ProjectStatus.objects.filter(name__iexact="Transferred").first()
    ids_already_updated = []
    import_user = get_import_user()
    for _, row in df.iterrows():
        if row["CODE"] in legacy_codes_to_ignore:
            continue
        project = Project.objects.filter(legacy_code=row["CODE"]).first()
        if not project:
            logger.warning(
                f"⚠️ Project with legacy code '{row['CODE']}' not found while processing Transfer Fields sheet"
            )
            continue
        try:
            meeting = Meeting.objects.filter(number=row["MEETING"]).first()
            if not meeting:
                logger.warning(
                    f"""⚠️ Meeting with name '{row['MEETING']}' not found while processing
                      Transfer Fields sheet for project with legacy code '{row['CODE']}'
                      """
                )
                continue
        except ValueError:
            meeting = None

        if project.status != transfer_status:
            if not dry_run:
                project.increase_version(import_user)
                log_project_history(
                    project,
                    import_user,
                    HISTORY_DESCRIPTION_POST_EXCOM_UPDATE,
                )
            if row["DATE"] and isinstance(row["DATE"], datetime):
                unaware_time = get_date(row["DATE"])
                project.date_created = pytz.utc.localize(unaware_time)
            try:
                project.total_fund += row["FUND_TRANSFERRED"] or 0
            except TypeError:
                project.total_fund = row["FUND_TRANSFERRED"] or 0
            try:
                project.support_cost_psc += row["SUPPORT_13_TRANSFERRED"] or 0
            except TypeError:
                project.support_cost_psc = row["SUPPORT_13_TRANSFERRED"] or 0
            project.post_excom_meeting = meeting
            if not dry_run:
                try:
                    project.save()
                except Exception as e:
                    logger.error(
                        f"⚠️ Error saving project with legacy code '{row['CODE']}': {e}"
                    )
        else:
            if project.id in ids_already_updated:
                if not dry_run:
                    project.increase_version(import_user)
                    log_project_history(
                        project,
                        import_user,
                        HISTORY_DESCRIPTION_POST_EXCOM_UPDATE,
                    )
                project.transfer_meeting = meeting
                try:
                    project.fund_transferred += row["FUND_TRANSFERRED"] or 0
                except TypeError:
                    project.fund_transferred = row["FUND_TRANSFERRED"] or 0
                try:
                    project.psc_transferred += row["SUPPORT_13_TRANSFERRED"] or 0
                except TypeError:
                    project.psc_transferred = row["SUPPORT_13_TRANSFERRED"] or 0
                if not dry_run:
                    project.save()
            else:
                project.transfer_meeting = meeting
                try:
                    project.fund_transferred += row["FUND_TRANSFERRED"] or 0
                except TypeError:
                    project.fund_transferred = row["FUND_TRANSFERRED"] or 0
                try:
                    project.psc_transferred += row["SUPPORT_13_TRANSFERRED"] or 0
                except TypeError:
                    project.psc_transferred = row["SUPPORT_13_TRANSFERRED"] or 0
                if not dry_run:
                    project.save()
        ids_already_updated.append(project.id)


def process_c_and_p_consumption_sheet(dry_run=True):
    file_path = (
        IMPORT_RESOURCES_V2_DIR
        / "projects"
        / "migration_2026"
        / "2026.02.12. Inventory_EDW_Migration_ARPFeb8.xlsx"
    )
    df = pd.read_excel(file_path, sheet_name="C+P Consumption", header=3).fillna("")
    legacy_codes_already_updated = []
    for _, row in df.iterrows():
        project = Project.objects.filter(
            legacy_code=row["Legacy Code"], production=False
        ).first()
        if not project:
            logger.warning(
                f"⚠️ Project with legacy code '{row['Legacy Code']}' not found while processing C+P Consumption sheet"
            )
            continue
        # copy project from the production one:
        if row["Legacy Code"] not in legacy_codes_already_updated:
            agency = get_agency_by_name(row["Agency"])
            cluster = get_cluster_by_name(row["Cluster"])
            project_type = get_type_by_name(row["Type"])
            sector = get_sector_by_name(row["Sector"])
            project.production = False
            if agency:
                project.agency = agency
            if cluster:
                project.cluster = cluster
            if project_type:
                project.project_type = project_type
            if sector:
                project.sector = sector
            project.total_fund = row["total_fund.1"]
            project.support_cost_psc = row["support_cost_psc.1"]
            if not dry_run:
                project.save()

        if row["Legacy Code"] not in legacy_codes_already_updated:
            ProjectOdsOdp.objects.filter(project=project).delete()

        legacy_codes_already_updated.append(row["Legacy Code"])
        existing_project_ods_odp = find_project_ods_odp_by_name(
            ProjectOdsOdp.objects.filter(project=project),
            row["Substance - baseline technology"],
        )
        if existing_project_ods_odp:
            existing_project_ods_odp.ods_replacement = row["Replacement technology/ies"]
            existing_project_ods_odp.co2_mt = row["total_phase_out_co2_tonnes"] or None
            existing_project_ods_odp.odp = row["total_phase_out_odp_tonnes"] or None
        else:
            substance, blend, ods_display_name = get_substance_blend_ods_display_name(
                row["Substance - baseline technology"], row["Legacy Code"]
            )
            new_project_ods_odp = ProjectOdsOdp(
                project=project,
                ods_display_name=ods_display_name,
                ods_substance=substance,
                ods_blend=blend,
                ods_replacement=row["Replacement technology/ies"],
                co2_mt=row["total_phase_out_co2_tonnes"] or None,
                odp=row["total_phase_out_odp_tonnes"] or None,
            )
            if not dry_run:
                new_project_ods_odp.save()


def process_c_and_p_production_sheet(dry_run=True):
    file_path = (
        IMPORT_RESOURCES_V2_DIR
        / "projects"
        / "migration_2026"
        / "2026.02.12. Inventory_EDW_Migration_ARPFeb8.xlsx"
    )
    df = pd.read_excel(file_path, sheet_name="C+P Production", header=3).fillna("")
    legacy_codes_already_updated = []
    for _, row in df.iterrows():
        project = Project.objects.filter(legacy_code=row["Legacy Code"]).first()
        if not project:
            logger.warning(
                f"⚠️ Project with legacy code '{row['Legacy Code']}' not found while processing C+P Production sheet"
            )
            continue
        # copy project from the consumption one:
        if row["Legacy Code"] not in legacy_codes_already_updated:

            project_exists = Project.objects.filter(
                legacy_code=row["Legacy Code"], production=True
            ).exists()
            if not dry_run and not project_exists:
                new_project = project.copy_project()
                new_project.production = True
                serial_number = Project.objects.get_next_serial_number(
                    new_project.country.id
                )
                new_project.serial_number = serial_number
                new_project.save()
                project = new_project
            else:
                project = Project.objects.filter(
                    legacy_code=row["Legacy Code"], production=True
                ).first()

            agency = get_agency_by_name(row["Agency"])
            cluster = get_cluster_by_name(row["Cluster"])
            project_type = get_type_by_name(row["Type"])
            sector = get_sector_by_name(row["Sector"])
            project.production = True
            if agency:
                project.agency = agency
            if cluster:
                project.cluster = cluster
            if project_type:
                project.project_type = project_type
            if sector:
                project.sector = sector
            project.total_fund = row["total_fund.1"]
            project.support_cost_psc = row["support_cost_psc.1"]
            if not dry_run:
                project.save()
            if not project_exists:
                post_approval_changes(new_project)
        if row["Legacy Code"] not in legacy_codes_already_updated:
            ProjectOdsOdp.objects.filter(project=project).delete()
        legacy_codes_already_updated.append(row["Legacy Code"])
        existing_project_ods_odp = find_project_ods_odp_by_name(
            ProjectOdsOdp.objects.filter(project=project),
            row["Substance - baseline technology"],
        )
        if existing_project_ods_odp:
            existing_project_ods_odp.ods_replacement = row["Replacement technology/ies"]
            existing_project_ods_odp.co2_mt = row["total_phase_out_co2_tonnes"] or None
            existing_project_ods_odp.odp = row["total_phase_out_odp_tonnes"] or None
        else:
            substance, blend, ods_display_name = get_substance_blend_ods_display_name(
                row["Substance - baseline technology"], row["Legacy Code"]
            )
            new_project_ods_odp = ProjectOdsOdp(
                project=project,
                ods_display_name=ods_display_name,
                ods_substance=substance,
                ods_blend=blend,
                ods_replacement=row["Replacement technology/ies"],
                co2_mt=row["total_phase_out_co2_tonnes"] or None,
                odp=row["total_phase_out_odp_tonnes"] or None,
            )
            if not dry_run:
                new_project_ods_odp.save()


def fill_total_phase_out_values_in_project(dry_run=True):
    projects = Project.objects.really_all().filter(submission_status__name="Approved")
    for project in projects:
        ods_odps = project.ods_odp.all()
        if not project.total_phase_out_metric_tonnes:
            project.total_phase_out_metric_tonnes = sum(
                ods_odps.filter(phase_out_mt__isnull=False).values_list(
                    "phase_out_mt", flat=True
                )
            )
        if not project.total_phase_out_odp_tonnes:
            project.total_phase_out_odp_tonnes = sum(
                ods_odps.filter(odp__isnull=False).values_list("odp", flat=True)
            )
        if not project.total_phase_out_co2_tonnes:
            project.total_phase_out_co2_tonnes = sum(
                ods_odps.filter(co2_mt__isnull=False).values_list("co2_mt", flat=True)
            )
        if not dry_run:
            project.save()


def fill_project_end_date_mya_with_date_per_agreement(dry_run=True):
    meta_projects = MetaProject.objects.all()
    for meta_project in meta_projects:
        all_data_per_agreement = set(
            meta_project.projects.filter(date_per_agreement__isnull=False).values_list(
                "date_per_agreement", flat=True
            )
        )
        if len(all_data_per_agreement) == 1:
            date_per_agreement = all_data_per_agreement.pop()
            if date_per_agreement:
                if (
                    meta_project.end_date
                    and meta_project.end_date != date_per_agreement
                ):
                    logger.warning(
                        f"""⚠️ MetaProject with id '{meta_project.id}' has an end_date different than
                        date_per_agreement while trying to fill project_end_date
                    """
                    )
                else:
                    meta_project.end_date = date_per_agreement
                    if not dry_run:
                        meta_project.save()
            else:
                logger.warning(
                    f"""⚠️ MetaProject with id '{meta_project.id}' has a null date_per_agreement in
                    its projects while trying to fill project_end_date
                    """
                )
        elif len(all_data_per_agreement) > 1:
            logger.warning(
                f"""⚠️ MetaProject with id '{meta_project.id}' has multiple different
                date_per_agreement values in its projects while trying to fill project_end_date
                """
            )


@transaction.atomic
def migrate_projects_2026(option, dry_run=True):
    consumption_and_production_projects_legacy_codes = (
        extract_consumption_and_production_projects_to_ignore_list()
    )
    if option == "create_missing_clusters_types_sectors_subsectors":
        create_missing_clusters_types_sectors_subsectors(dry_run=dry_run)
    if option == "current_inventory":
        process_current_invetory_sheet(dry_run=dry_run)
    elif option == "set_new_code":
        process_set_new_code(dry_run=dry_run)
    elif option == "ods_phaseout_fields":
        process_ods_phaseout_fields_sheet(
            dry_run=dry_run,
            legacy_codes_to_ignore=consumption_and_production_projects_legacy_codes,
        )
    elif option == "ods_production_fields":
        process_ods_production_fields_sheet(
            dry_run=dry_run,
            legacy_codes_to_ignore=consumption_and_production_projects_legacy_codes,
        )
    elif option == "funding_fields":
        process_funding_fields_sheet(
            dry_run=dry_run,
            legacy_codes_to_ignore=consumption_and_production_projects_legacy_codes,
        )
    elif option == "transfer_fields":
        process_transfer_fields_sheet(
            dry_run=dry_run,
            legacy_codes_to_ignore=consumption_and_production_projects_legacy_codes,
        )
    elif option == "c_and_p":
        process_c_and_p_consumption_sheet(dry_run=dry_run)
        process_c_and_p_production_sheet(dry_run=dry_run)
    elif option == "fill_total_phase_out_values_in_project":
        fill_total_phase_out_values_in_project(dry_run=dry_run)
    elif option == "fill_project_end_date_mya_with_date_per_agreement":
        fill_project_end_date_mya_with_date_per_agreement(dry_run=dry_run)
