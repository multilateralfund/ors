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
    ProjectCluster,
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
    not_found_error = "does not exist in our system"

    agency = agencies.get(strip_str(row["Agency"]))
    country_name = COUNTRY_NAME_MAPPING.get(row["Country"], row["Country"])
    country = countries.get(strip_str(country_name))

    if not agency:
        error_messages.append(f"Agency '{row['Agency']}' {not_found_error}")

    if not country:
        error_messages.append(f"Country '{row['Country']}' {not_found_error}")

    return agency, country, error_messages


def get_object(row, field_name, objs_dict, warning_messages):
    if not row[field_name]:
        return None

    ret_obj = objs_dict.get(strip_str(row[field_name]))
    if ret_obj:
        return ret_obj

    ret_obj = objs_dict.get("other")
    warning_messages.append(
        f"{field_name} '{row[field_name]}' does not exist "
        f"in our system and we will set it to be 'Other'"
    )

    return ret_obj


def get_subsector(row, sector, subsectors, warning_messages):
    if not row["Subsector"] or not sector:
        return None

    subsector = subsectors.get((sector.name, strip_str(row["Subsector"])))
    subsector_other_name = (
        "other" if sector.name == "Other" else f"other {strip_str(sector.name)}"
    )
    subsector_other = subsectors.get((sector.name, subsector_other_name))
    if not subsector:
        warning_messages.append(
            f"Subsector '{row['Subsector']}' does not exist in our system "
            f"or it is not linked to the sector and we will set it to be 'Other'"
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
                "Some substances do not exist in our system and we will set them to be 'Other'"
            )
            break

    project_status = row["Project Status (A/P)"].strip()
    if project_status and project_status not in BPActivity.Status.values:
        warning_messages.append(
            f"Project Status '{project_status}' does not exist in our system "
            f"and we will set it to be 'Undefined'"
        )
        project_status = BPActivity.Status.undefined

    country_status = row["Country Status"].strip()
    if country_status and country_status not in BPActivity.LVCStatus.values:
        warning_messages.append(
            f"Country Status '{country_status}' does not exist in our system "
            f"and we will set it to be 'Undefined'"
        )
        country_status = BPActivity.LVCStatus.undefined

    amount_polyol = row["Amount of Polyol in Project (MT)"]
    if not check_numeric_value(amount_polyol):
        amount_polyol = 0
        warning_messages.append(
            "Amount of Polyol is not a number and we will set it to be '0'"
        )

    # get `initial_id` from `Sort Order` column
    sort_order = row["Sort Order"].rsplit("-", 1)
    initial_id = sort_order[1].lstrip("0") if len(sort_order) > 1 else 0

    activity_data = {
        "initial_id": initial_id if initial_id else 0,
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
        "remarks_additional": row["Remarks (Additional)"],
        "comment_secretariat": row["Comment"],
        "values": [],
    }

    for year in range(year_start, year_start + 4):
        if year == year_start + 3:
            year_value = year - 1
            is_after = True
            value_usd = row[f"Value after {year_value} ($)"]
            value_odp = row[f"ODP after {year_value}"]
            value_mt = row[f"MT for HFC after {year_value}"]
            value_co2 = row[f"CO₂-eq after {year_value}"]
        else:
            year_value = year
            is_after = False
            value_usd = row[f"Value {year_value} ($)"]
            value_odp = row[f"ODP {year_value}"]
            value_mt = row[f"MT for HFC {year_value}"]
            value_co2 = row[f"CO₂-eq {year_value}"]

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
    subsectors = {
        (subsector.sector.name, strip_str(subsector.name)): subsector
        for subsector in ProjectSubSector.objects.select_related("sector")
    }
    substance_dict = {
        strip_str(substance.name): substance for substance in Substance.objects.all()
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
                    "activity_id": row["Sort Order"],
                    "error_message": error_message,
                }
            )

        # get 'Other' if value is not found in db, set `None` if field is blank
        warning_messages = []
        project_type = get_object(row, "Type", project_types, warning_messages)
        bp_chemical_type = get_object(
            row, "Substance", bp_chemical_types, warning_messages
        )
        project_cluster = get_object(row, "Cluster", project_clusters, warning_messages)
        sector = get_object(row, "Sector", sectors, warning_messages)
        subsector = get_subsector(row, sector, subsectors, warning_messages)

        substance_names = (
            row["Substance Detail"].split("/") if row["Substance Detail"] else []
        )
        substances = [
            substance_dict.get(strip_str(name), substance_dict.get("other substances"))
            for name in substance_names
        ]

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
                    "activity_id": row["Sort Order"],
                    "warning_message": warning_message,
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
        serializer = self.get_serializer(data=data)
        errors = self.validate_bp(serializer, current_obj)
        if errors:
            return status.HTTP_400_BAD_REQUEST, errors

        # create new bp instance and activities
        self.perform_create(serializer)
        new_instance = serializer.instance

        # inherit all history
        BPHistory.objects.filter(business_plan=current_obj).update(
            business_plan=new_instance
        )

        # set initial_id
        new_instance.activities.filter(initial_id__isnull=True).update(
            initial_id=F("id")
        )

        # set name
        if not new_instance.name:
            new_instance.name = f"{new_instance.status} {new_instance.year_start} - {new_instance.year_end}"

        # set updated by user, inherit other fields
        new_instance.updated_at = new_instance.created_at
        new_instance.updated_by = self.request.user
        new_instance.created_at = current_obj.created_at
        new_instance.created_by = current_obj.created_by
        new_instance.save()
        current_obj.delete()

        # create new history for update event
        self.create_history(new_instance, "Updated by user")

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
