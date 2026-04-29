# pylint: disable=inconsistent-return-statements

import logging

from django.db.models import Q

from core.models import (
    Agency,
    Country,
    EnterpriseStatus,
    Substance,
    Blend,
    Meeting,
)
from core.models.project_metadata import (
    ProjectType,
    ProjectSector,
    ProjectSubSector,
)

logger = logging.getLogger(__name__)


def get_country_by_name(name):
    TRANSLATE_COUNTRIES = {
        "Lao, PDR": "Lao PDR",
        "Moldova, Rep": "Moldova",
        "Timor Leste": "Timor-Leste",
        "Micronesia": "Micronesia (Federated States of)",
        "Guinea-Bissau": "Guinea Bissau",
        "Macedonia, FYR": "North Macedonia",
        "": "",
    }
    if name.strip() in TRANSLATE_COUNTRIES:
        name = TRANSLATE_COUNTRIES[name.strip()]
    country = Country.objects.find_by_name(name)
    if not country:
        logger.warning(f"⚠️ Country with name '{name.strip()}' not found")
    return country


def get_agency_by_name(name, verbose=True):
    TRANSLATE_AGENCIES = {
        "IBRD": "World Bank",
    }
    if name.strip() in TRANSLATE_AGENCIES:
        name = TRANSLATE_AGENCIES[name.strip()]
    agency = Agency.objects.filter(name__iexact=name.strip()).first()
    if not agency and verbose:
        logger.warning(f"⚠️ Agency with name '{name.strip()}' not found")
    return agency


def get_sector_by_name_or_code(value, verbose=True):
    TRANSLATED_SECTORS = {
        "Fumigation": "Fumigant",
        "Air conditioning": "Air-Conditioning",
    }
    if value.strip() in TRANSLATED_SECTORS:
        value = TRANSLATED_SECTORS[value.strip()]
    sector = ProjectSector.objects.filter(
        Q(code__iexact=value.strip()) | Q(name__iexact=value.strip())
    ).first()
    if not sector and value.strip() and verbose:
        logger.warning(f"⚠️ Sector with name or code '{value.strip()}' not found")
    return sector


def get_subsector_by_name(name, verbose=True):
    subsector = ProjectSubSector.objects.filter(name__iexact=name.strip()).first()
    if not subsector and name.strip() and verbose:
        logger.warning(f"⚠️ Sub-sector with name '{name.strip()}' not found")
    return subsector


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


def get_type_by_name(name):
    project_type = ProjectType.objects.filter(name__iexact=name.strip()).first()
    if not type:
        logger.warning(f"⚠️ Type with name '{name.strip()}' not found")
    return project_type


def get_type_by_code(code):
    project_type = ProjectType.objects.filter(code__iexact=code.strip()).first()
    if not project_type and code.strip():
        logger.warning(f"⚠️ Type with code '{code.strip()}' not found")
    return project_type


def get_enterprise_status_by_name(name, verbose=True):
    TRANSLATE_STATUSES = {
        "new": "New",
        "On-going": "Ongoing",
        "closed": "Closed",
    }
    if name.strip() in TRANSLATE_STATUSES:
        name = TRANSLATE_STATUSES[name.strip()]
    status = EnterpriseStatus.objects.filter(name__iexact=name.strip()).first()
    if not status and name.strip() and verbose:
        logger.warning(f"⚠️ Enterprise Status with name '{name.strip()}' not found")
    return status


def get_meeting_by_number(number):
    if number:
        meeting = Meeting.objects.filter(number=number).first()
        if not meeting:
            logger.warning(f"⚠️ Meeting with number '{number}' not found")
        return meeting


def get_substance_blend_ods_display_name(name, code, verbose=True):
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
        if name and verbose:
            logger.warning(
                f"⚠️ Substance with name '{name}' not found while processing ODS Phaseout Fields at legacy code {code}"
            )
        blend = Blend.objects.filter(name__iexact=name).first()
        if not blend and name and verbose:
            logger.warning(
                f"⚠️ Blend with name '{name}' not found while processing ODS Phaseout Fields at legacy code {code}"
            )
    return substance, blend, ods_display_name
