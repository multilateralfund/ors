import os
import numpy as np
import pandas as pd
from constance import config
from django.core.exceptions import ValidationError
from django.db.models import F
from rest_framework import status

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
from core.tasks import send_mail_bp_create, send_mail_bp_update

# pylint: disable=E1101, R0913, R0914, R0915, W0718


def strip_str(name):
    return name.lower().strip()


def check_numeric_value(value):
    try:
        float(value)
    except ValueError:
        return False
    return True


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
):
    error_messages = []
    warning_messages = []
    not_a_number_warning = "is not a number and we will set it to be '0'"
    set_other_warning = "does not exist in our system and we will set it to be 'Other'"
    not_found_error = "does not exist in our system"

    if not agency:
        error_messages.append(f"Agency '{row['Agency']}' {not_found_error}")

    if not country:
        error_messages.append(f"Country '{row['Country']}' {not_found_error}")

    country_status = row["Country Status"]
    if country_status not in BPActivity.LVCStatus.values:
        error_messages.append(f"Country Status '{country_status}' {not_found_error}")

    project_status = row["Project Status (A/P)"]
    if project_status not in BPActivity.Status.values:
        error_messages.append(f"Project status '{project_status}' {not_found_error}")

    for field_name, obj in [
        ("Type", project_type),
        ("Substance", bp_chemical_type),
        ("Cluster", project_cluster),
        ("Sector", sector),
        ("Subsector", subsector),
    ]:
        if obj.name == "Other":
            warning_messages.append(
                f"{field_name} '{row[field_name]}' {set_other_warning}"
            )

    substance_ids = [substance.id for substance in substances]
    for substance in substances:
        if substance.name == "Other substances":
            warning_messages.append(
                "Some substances do not exist in our system and we will set them to be 'Other'"
            )
            break

    amount_polyol = row["Amount of Polyol in Project (MT)"]
    if not check_numeric_value(amount_polyol):
        amount_polyol = 0
        warning_messages.append(f"Amount of Polyol {not_a_number_warning}")

    sort_order = row["Sort Order"].rsplit("-", 1)
    initial_id = sort_order[1].lstrip("0") if len(sort_order) > 1 else 0

    activity_data = {
        "initial_id": initial_id if initial_id != "None" else 0,
        "title": row["Title"],
        "agency_id": agency.id if agency else None,
        "country_id": country.id if country else None,
        "lvc_status": country_status,
        "project_type_id": project_type.id,
        "project_type_code": project_type.code,
        "bp_chemical_type_id": bp_chemical_type.id,
        "project_cluster_id": project_cluster.id,
        "substances": list(dict.fromkeys(substance_ids)),
        "amount_polyol": amount_polyol,
        "sector_id": sector.id,
        "sector_code": sector.code,
        "subsector_id": subsector.id,
        "required_by_model": row["Required by Model"],
        "status": project_status,
        "is_multi_year": bool(row["Project Category (I/M)"].lower() == "m"),
        "reason_for_exceeding": row["Reason for exceeding 35% of baseline"],
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
        else:
            year_value = year
            is_after = False
            value_usd = row[f"Value {year_value} ($)"]
            value_odp = row[f"ODP {year_value}"]
            value_mt = row[f"MT for HFC {year_value}"]

        if not check_numeric_value(value_usd):
            value_usd = 0
            warning_messages.append(
                f"Value usd for year {year_value} (After: {is_after}) {not_a_number_warning}"
            )

        if not check_numeric_value(value_odp):
            value_odp = 0
            warning_messages.append(
                f"Value odp for year {year_value} (After: {is_after}) {not_a_number_warning}"
            )

        if not check_numeric_value(value_mt):
            value_mt = 0
            warning_messages.append(
                f"Value mt for year {year_value} (After: {is_after}) {not_a_number_warning}"
            )

        activity_data["values"].append(
            {
                "year": year_value,
                "is_after": is_after,
                "value_usd": value_usd,
                "value_odp": value_odp,
                "value_mt": value_mt,
            }
        )

    return activity_data, error_messages, warning_messages


def parse_bp_file(file, year_start, from_validate=False):
    df = pd.read_excel(file, dtype=str).replace({np.nan: ""})

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
        strip_str(subsector.name): subsector
        for subsector in ProjectSubSector.objects.all()
    }
    substance_dict = {
        strip_str(substance.name): substance for substance in Substance.objects.all()
    }

    activities = []
    errors = []
    warnings = []
    for index, row in df.iterrows():
        agency = agencies.get(strip_str(row["Agency"]))
        country_name = COUNTRY_NAME_MAPPING.get(row["Country"], row["Country"])
        country = countries.get(strip_str(country_name))
        project_type = project_types.get(
            strip_str(row["Type"]), project_types.get("other")
        )
        bp_chemical_type = bp_chemical_types.get(
            strip_str(row["Substance"]), bp_chemical_types.get("other")
        )
        project_cluster = project_clusters.get(
            strip_str(row["Cluster"]), project_clusters.get("other")
        )
        sector = sectors.get(strip_str(row["Sector"]), sectors.get("other"))
        subsector = subsectors.get(strip_str(row["Subsector"]), subsectors.get("other"))
        substance_names = (
            row["Substance Detail"].split("/") if row["Substance Detail"] else []
        )
        substances = [
            substance_dict.get(strip_str(name), substance_dict.get("other substances"))
            for name in substance_names
        ]

        activity_data, error_messages, warning_messages = get_bp_activity_data(
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
        )
        activities.append(activity_data)

        for error_message in error_messages:
            if not from_validate:
                raise ValidationError("Data error")

            errors.append(
                {
                    "error_type": "data error",
                    "row_number": index + 2,
                    "activtiy_id": row["Sort Order"],
                    "error_message": error_message,
                }
            )

        for warning_message in warning_messages:
            warnings.append(
                {
                    "warning_type": "data warning",
                    "row_number": index + 2,
                    "activtiy_id": row["Sort Order"],
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

        if config.SEND_MAIL:
            send_mail_bp_create.delay(instance.id)  # send mail to MLFS

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

        # set name
        if not new_instance.name:
            new_instance.name = f"{new_instance.status} {new_instance.year_start} - {new_instance.year_end}"

        # set updated by user
        new_instance.updated_by = self.request.user
        new_instance.save()
        current_obj.delete()

        # create new history for update event
        self.create_history(new_instance, "Updated by user")

        if config.SEND_MAIL:
            send_mail_bp_update.delay(new_instance.id)  # send mail to MLFS

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
            return status.HTTP_400_BAD_REQUEST, "Data error"
        except Exception:
            return status.HTTP_400_BAD_REQUEST, (
                "The file you uploaded does not respect the required "
                "Excel template, so the upload cannot be performed."
            )

        return status.HTTP_200_OK, {
            "activities": activities,
            "errors": errors,
            "warnings": warnings,
        }
