import logging
import os
import numpy as np
import pandas as pd
import traceback
from django.core.exceptions import ValidationError
from django.db.models import F
from drf_yasg import openapi
from rest_framework import status

from core.api.utils import PROJECT_SECTOR_TYPE_MAPPING
from core.import_data.mapping_names_dict import COUNTRY_NAME_MAPPING
from core.models import (
    Agency,
    BPActivity,
    BPChemicalType,
    BPHistory,
    Country,
    Project,
    ProjectCluster,
    ProjectSpecificFields,
    ProjectSector,
    ProjectSubSector,
    ProjectType,
    Substance,
)

# pylint: disable=E1101, R0913, R0914, R0915, W0718
logger = logging.getLogger(__name__)

IMPORT_PARAMETERS = [
    openapi.Parameter(
        "year_start",
        openapi.IN_QUERY,
        type=openapi.TYPE_INTEGER,
        required=True,
    ),
    openapi.Parameter(
        "year_end",
        openapi.IN_QUERY,
        type=openapi.TYPE_INTEGER,
        required=True,
    ),
    openapi.Parameter(
        "status",
        openapi.IN_QUERY,
        type=openapi.TYPE_STRING,
        required=True,
    ),
    openapi.Parameter(
        "meeting_id",
        openapi.IN_QUERY,
        type=openapi.TYPE_INTEGER,
        required=True,
    ),
    openapi.Parameter(
        "decision_id",
        openapi.IN_QUERY,
        type=openapi.TYPE_INTEGER,
    ),
]


def strip_str(name):
    # make string values lowercase and remove useless spaces
    return name.lower().strip()


def check_numeric_value(value):
    try:
        float(value)
    except ValueError:
        return False
    return True


def check_year_values(value_type, value, year, is_after, warning_messages):
    if not check_numeric_value(value):
        warning_messages.append(
            f"Value {value_type} for year {year} (After: {is_after}) "
            f"is not a number and we will set it to be '0'"
        )
        return 0

    return value


def get_error_messages(row, agencies, countries):
    error_messages = []
    not_found_error = "does not exist in KMS"

    agency = agencies.get(strip_str(row["Agency"]))
    country_name = COUNTRY_NAME_MAPPING.get(row["Country"], row["Country"])
    country = countries.get(strip_str(country_name))

    if not agency:
        error_messages.append(f"Agency '{row['Agency']}' {not_found_error}")

    if not country:
        error_messages.append(f"Country '{row['Country']}' {not_found_error}")

    return agency, country, error_messages


def check_cluster_type_sector_mapping(
    cluster, project_type, sector, types_mapping, sector_mapping
):
    error_messages = []
    if not cluster or not project_type:
        return error_messages
    entry_exists = types_mapping.get((cluster.id, project_type.id))
    if not entry_exists:
        error_messages.append(
            f"Project type '{project_type.name}' is not linked to the cluster "
            f"'{cluster.name}'"
        )

    if not sector:
        return error_messages
    entry_exists = sector_mapping.get((cluster.id, project_type.id, sector.id))
    if not entry_exists:
        error_messages.append(
            f"Sector '{sector.name}' is not linked to the project type "
            f"'{project_type.name}' in cluster '{cluster.name}'"
        )
        return error_messages
    return error_messages


def get_object(row, field_name, objs_dict, warning_messages):
    if not row[field_name]:
        return None

    ret_obj = objs_dict.get(strip_str(row[field_name]))
    if ret_obj:
        return ret_obj

    ret_obj = objs_dict.get("other")
    warning_messages.append(
        f"{field_name} '{row[field_name]}' does not exist "
        f"in KMS and will be set to 'Other'"
    )

    return ret_obj


def get_subsector(row, sector, subsectors, subsectors_links, warning_messages):
    if not row["Subsector"] or not sector:
        return None

    subsector_other_name = (
        "other" if sector.name == "Other" else f"other {strip_str(sector.name)}"
    )
    subsector_other = subsectors_links.get((sector.name, subsector_other_name))

    if not row["Subsector"] in subsectors:
        warning_messages.append(
            f"Subsector '{row['Subsector']}' does not exist in KMS "
            f"and will be set to 'Other'"
        )
        return subsector_other

    subsector = subsectors_links.get((sector.name, strip_str(row["Subsector"])))
    if not subsector:
        warning_messages.append(
            f"Subsector '{row['Subsector']}' is not linked to the sector "
            f"and we will set it to be 'Other'"
        )
        return subsector_other

    return subsector


def get_bp_activity_data(
    row,
    year_start,
    agency,
    country,
    project_type,
    bp_chemical_type,
    project_cluster,
    sector,
    subsector,
    substances,
    warning_messages,
):
    # set warning messages
    if sector and sector.code in PROJECT_SECTOR_TYPE_MAPPING:
        if project_type.code not in PROJECT_SECTOR_TYPE_MAPPING[sector.code]:
            warning_messages.append("Type is not linked to the sector")

    substance_ids = [substance.id for substance in substances]
    for substance in substances:
        if substance.name == "Other substances":
            warning_messages.append(
                "Some substances do not exist in KMS and will be set to 'Other'"
            )
            break

    project_status = row["Project Status (A/P)"].strip()
    if project_status and project_status not in BPActivity.Status.values:
        warning_messages.append(
            f"Project Status '{project_status}' does not exist in KMS "
            f"and will be set to 'Undefined'"
        )
        project_status = BPActivity.Status.undefined

    country_status = row["HCFC Status"].strip()
    if country_status and country_status not in BPActivity.LVCStatus.values:
        warning_messages.append(
            f"HCFC Status '{country_status}' does not exist in KMS "
            f"and will be set to 'Undefined'"
        )
        country_status = BPActivity.LVCStatus.undefined

    amount_polyol = row["Amount of Polyol in Project (MT)"]
    if not check_numeric_value(amount_polyol):
        amount_polyol = 0
        warning_messages.append(
            "Amount of Polyol is not a number and we will set it to be '0'"
        )

    # get `initial_id` from `Activity ID` column
    activity_id = row["Activity ID"].rsplit("-", 1)
    initial_id = activity_id[1].lstrip("0") if len(activity_id) > 1 else None

    activity_data = {
        "initial_id": initial_id if initial_id else None,
        "title": row["Title"],
        "agency_id": agency.id if agency else None,
        "country_id": country.id if country else None,
        "lvc_status": country_status,
        "project_type_id": project_type.id if project_type else None,
        "project_type_code": project_type.code if project_type else "",
        "bp_chemical_type_id": bp_chemical_type.id if bp_chemical_type else None,
        "project_cluster_id": project_cluster.id if project_cluster else None,
        "substances": list(dict.fromkeys(substance_ids)),  # remove duplicates
        "amount_polyol": amount_polyol,
        "sector_id": sector.id if sector else None,
        "sector_code": sector.code if sector else "",
        "subsector_id": subsector.id if subsector else None,
        "required_by_model": row["Required by Model"],
        "status": project_status,
        "is_multi_year": bool(strip_str(row["Project Category (I/M)"]) == "m"),
        "remarks": row["Remarks"],
        "values": [],
    }
    for year in range(year_start, year_start + 4):
        if year == year_start + 3:
            year_value = year - 1
            is_after = True
            value_usd = row[f"Value ($000) after {year_value} adjusted"]
            value_odp = row[f"ODP after {year_value} adjusted"]
            value_mt = row[f"MT for HFC after {year_value} adjusted"]
            value_co2 = row[f"CO2-EQ after {year_value} adjusted"]
        else:
            year_value = year
            is_after = False
            value_usd = row[f"Value ($000) {year_value} adjusted"]
            value_odp = row[f"ODP {year_value} adjusted"]
            value_mt = row[f"MT for HFC {year_value} adjusted"]
            value_co2 = row[f"CO2-EQ {year_value} adjusted"]
        # if these values are not numbers we will set them to be '0'

        value_usd = check_year_values(
            "usd", value_usd, year_value, is_after, warning_messages
        )
        value_odp = check_year_values(
            "odp", value_odp, year_value, is_after, warning_messages
        )
        value_mt = check_year_values(
            "mt", value_mt, year_value, is_after, warning_messages
        )
        value_co2 = check_year_values(
            "CO₂", value_co2, year_value, is_after, warning_messages
        )

        activity_data["values"].append(
            {
                "year": year_value,
                "is_after": is_after,
                "value_usd": value_usd,
                "value_odp": value_odp,
                "value_mt": value_mt,
                "value_co2": value_co2,
            }
        )

    return activity_data


def parse_bp_file(file, year_start, from_validate=False):
    df = pd.read_excel(file, dtype=str).replace({np.nan: ""})

    # get all objects from db at once
    agencies = {strip_str(agency.name): agency for agency in Agency.objects.all()}
    countries = {strip_str(country.name): country for country in Country.objects.all()}
    project_types = {
        strip_str(project_type.name): project_type
        for project_type in ProjectType.objects.all()
    }
    bp_chemical_types = {
        strip_str(bp_chemical_type.name): bp_chemical_type
        for bp_chemical_type in BPChemicalType.objects.all()
    }
    project_clusters = {
        strip_str(project_cluster.name): project_cluster
        for project_cluster in ProjectCluster.objects.all()
    }
    sectors = {strip_str(sector.name): sector for sector in ProjectSector.objects.all()}
    subsectors_links = {
        (subsector.sector.name, strip_str(subsector.name)): subsector
        for subsector in ProjectSubSector.objects.select_related("sector")
    }
    subsectors = [
        strip_str(subsector.name) for subsector in ProjectSubSector.objects.all()
    ]
    substance_dict = {
        strip_str(substance.name): substance for substance in Substance.objects.all()
    }

    types_mapping = {
        (
            project_specific_field.cluster.id,
            project_specific_field.type.id,
        ): project_specific_field
        for project_specific_field in ProjectSpecificFields.objects.select_related(
            "cluster", "type"
        )
    }
    sector_mapping = {
        (
            project_specific_field.cluster.id,
            project_specific_field.type.id,
            project_specific_field.sector.id,
        ): project_specific_field
        for project_specific_field in ProjectSpecificFields.objects.select_related(
            "cluster", "type", "sector"
        )
    }

    activities = []
    errors = []
    warnings = []
    for index, row in df.iterrows():
        # parse every row in Excel, get objects by their name
        # get error messages
        agency, country, error_messages = get_error_messages(row, agencies, countries)
        for error_message in error_messages:
            if not from_validate:
                # raise when first error is found and stop parsing entire file
                raise ValidationError("Data error")
            errors.append(
                {
                    "error_type": "data error",
                    "row_number": index + 2,
                    "activity_id": row["Activity ID"],
                    "error_message": error_message,
                }
            )

        # get 'Other' if value is not found in db, set `None` if field is blank
        warning_messages = []
        project_type = get_object(row, "Type", project_types, warning_messages)
        bp_chemical_type = get_object(
            row, "Chemical", bp_chemical_types, warning_messages
        )
        project_cluster = get_object(row, "Cluster", project_clusters, warning_messages)
        sector = get_object(row, "Sector", sectors, warning_messages)
        subsector = get_subsector(
            row, sector, subsectors, subsectors_links, warning_messages
        )

        substance_names = (
            row["Chemical Detail"].split("/") if row["Chemical Detail"] else []
        )
        substances = [
            substance_dict.get(strip_str(name), substance_dict.get("other substances"))
            for name in substance_names
        ]

        agency, country, error_messages = get_error_messages(row, agencies, countries)
        error_messages = check_cluster_type_sector_mapping(
            project_cluster, project_type, sector, types_mapping, sector_mapping
        )

        for error_message in error_messages:
            if not from_validate:
                # raise when first error is found and stop parsing entire file
                raise ValidationError("Data error")
            errors.append(
                {
                    "error_type": "data error",
                    "row_number": index + 2,
                    "activity_id": row["Activity ID"],
                    "error_message": error_message,
                }
            )

        # return activity data in serializer format (with object IDs instead of names)
        activity_data = get_bp_activity_data(
            row,
            year_start,
            agency,
            country,
            project_type,
            bp_chemical_type,
            project_cluster,
            sector,
            subsector,
            substances,
            warning_messages,
        )
        activities.append(activity_data)

        for warning_message in warning_messages:
            warnings.append(
                {
                    "warning_type": "data warning",
                    "row_number": index + 2,
                    "activity_id": row["Activity ID"],
                    "warning_message": warning_message,
                }
            )
    activities_ids = [
        activity["initial_id"] for activity in activities if activity["initial_id"]
    ]
    projects = (
        Project.objects.really_all()
        .exclude(bp_activity__id__in=activities_ids)
        .filter(bp_activity__id__isnull=False)
        .select_related("bp_activity")
    )
    for project in projects:
        errors.append(
            {
                "error_type": "data error",
                "row_number": "-",
                "activity_id": "N/A",
                "error_message": (
                    f"Activity with ID {project.bp_activity.id} "
                    "is already linked to a project and cannot be removed"
                ),
            }
        )
    return activities, errors, warnings


class BusinessPlanUtils:
    @staticmethod
    def check_activity_values(initial_data):
        for activity in initial_data.get("activities", []):
            for activity_value in activity.get("values", []):
                if (
                    initial_data["year_start"] > activity_value["year"]
                    or activity_value["year"] > initial_data["year_end"]
                ):
                    return False
        return True

    @staticmethod
    def check_readonly_fields(initial_data, current_obj):
        if (
            initial_data["year_start"] != current_obj.year_start
            or initial_data["year_end"] != current_obj.year_end
            or initial_data["status"] != current_obj.status
        ):
            return False
        return True

    def create_history(self, business_plan, event):
        BPHistory.objects.create(
            business_plan=business_plan,
            updated_by=self.request.user,
            event_description=event,
        )

    def validate_bp(self, serializer, current_obj=None):
        if not serializer.is_valid():
            logger.warning(serializer.errors)
            return serializer.errors

        # validate bp and activities data
        if not self.check_activity_values(serializer.initial_data):
            return {
                "general_error": "BP activity values year not in business plan interval"
            }

        if current_obj:
            if not self.check_readonly_fields(serializer.initial_data, current_obj):
                return {"general_error": "Business plan readonly fields changed"}

        return {}

    def create_bp(self, data):
        # validate data
        serializer = self.get_serializer(data=data)
        errors = self.validate_bp(serializer)
        if errors:
            return status.HTTP_400_BAD_REQUEST, errors

        self.perform_create(serializer)
        instance = serializer.instance

        # set initial_id
        instance.activities.update(initial_id=F("id"))

        # set name
        if not instance.name:
            instance.name = (
                f"{instance.status} {instance.year_start} - {instance.year_end}"
            )

        # set created by user
        instance.created_by = self.request.user
        instance.save()

        self.create_history(instance, "Created by user")

        return status.HTTP_201_CREATED, serializer.data

    def update_bp(self, data, current_obj):
        # validate data
        serializer = self.get_serializer(data=data, instance=current_obj)
        errors = self.validate_bp(serializer, current_obj)
        if errors:
            return status.HTTP_400_BAD_REQUEST, errors
        serializer.save(from_import=True)

        # set initial_id
        current_obj.activities.filter(initial_id__isnull=True).update(
            initial_id=F("id")
        )

        # set name if it wasn't set yet; this is to preserve previous behavior
        if not current_obj.name:
            current_obj.name = f"{current_obj.status} {current_obj.year_start} - {current_obj.year_end}"

        # create new history for update event
        self.create_history(current_obj, "Updated by user")

        return status.HTTP_200_OK, serializer.data

    def import_bp(self, files, year_start, from_validate=False):
        if not files:
            return status.HTTP_400_BAD_REQUEST, "File not provided"

        filename, file = next(files.items())
        extension = os.path.splitext(filename)[-1]
        if extension not in (".xls", ".xlsx"):
            return status.HTTP_400_BAD_REQUEST, "File extension is not valid"

        try:
            activities, errors, warnings = parse_bp_file(
                file, year_start, from_validate
            )
        except ValidationError:
            # will be raised when `from_validate=False` and first error is found
            # to stop parsing the entire file
            return status.HTTP_400_BAD_REQUEST, "Data error"
        except Exception:
            # probably only `KeyError`s when file header is incorrect
            logger.warning(
                f"BP {year_start}-{year_start + 2} import template error: "
                f"{traceback.format_exc()}"
            )
            return status.HTTP_400_BAD_REQUEST, (
                "The file you uploaded does not respect the required "
                "Excel template, so the upload cannot be performed."
            )

        return status.HTTP_200_OK, {
            "activities": activities,
            "errors": errors,
            "warnings": warnings,
        }
