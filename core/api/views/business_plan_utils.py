import numpy as np
import pandas as pd
from constance import config
from rest_framework import status

from core.models import (
    Agency,
    BPChemicalType,
    CommentType,
    Country,
    ProjectCluster,
    ProjectSector,
    ProjectSubSector,
    ProjectType,
    Substance,
)
from core.tasks import send_mail_bp_create, send_mail_bp_update


def get_bp_activity_data(
    row,
    year_start,
    agencies,
    countries,
    project_types,
    bp_chemical_types,
    project_clusters,
    sectors,
    subsectors,
    substances,
    comment_types,
):
    agency = agencies.get(row["Agency"])
    country = countries.get(row["Country"])
    project_type = project_types.get(row["Type"])
    bp_chemical_type = bp_chemical_types.get(row["Chemical"])
    project_cluster = project_clusters.get(row["Cluster"])
    sector = sectors.get(row["Sector"])
    subsector = subsectors.get(row["Subsector"])

    substance_names = row["HCFC Chemical Detail"].split("/") if row["HCFC Chemical Detail"] else []
    substance_ids = [substances.get(name) for name in substance_names]
    comment_type_names = row["Comment types"].split(",") if row["Comment types"] else []
    comment_type_ids = [comment_types.get(name) for name in comment_type_names]

    activity_data = {
        "title": row["Title"],
        "agency_id": agency.id if agency else None,
        "country_id": country.id if country else None,
        "lvc_status": row["HCFC Status"],
        "project_type_id": project_type.id if project_type else None,
        "project_type_code": project_type.code if project_type else "",
        "legacy_project_type": row["Legacy Type"],
        "bp_chemical_type_id": bp_chemical_type.id if bp_chemical_type else None,
        "project_cluster_id": project_cluster.id if project_cluster else None,
        "substances": substance_ids,
        "amount_polyol": row["Amount of Polyol in Project (MT)"],
        "sector_id": sector.id if sector else None,
        "sector_code": sector.code if sector else "",
        "subsector_id": subsector.id if subsector else None,
        "legacy_sector_and_subsector": row["Legacy Sector and Subsector"],
        "required_by_model": row["Required by Model"],
        "status": row["A-Appr. P-Plan'd"],
        "is_multi_year": True if row["Is Multi Year"] == "Yes" else False,
        "reason_for_exceeding": row["Reason for exceeding 35% of baseline"],
        "remarks": row["Remarks"],
        "remarks_additional": row["Remarks (Additional)"],
        "comment_secretariat": row["Comment"],
        "comment_types": comment_type_ids,
        "values": [
            {
                "year": year_start + 2,
                "is_after": True,
                "value_usd": row[f"Value ($000) After {year_start + 2}"],
                "value_odp": row[f"ODP After {year_start + 2}"],
                "value_mt": row[f"MT After {year_start + 2} for HFC"],
            },
        ],
    }

    for year in range(year_start, year_start + 3):
        activity_data["values"].append(
            {
                "year": year,
                "is_after": False,
                "value_usd": row[f"Value ($000) {year}"],
                "value_odp": row[f"ODP {year}"],
                "value_mt": row[f"MT {year} for HFC"],
            }
        )

    return activity_data


def parse_bp_file(filename, year_start):
    df = pd.read_excel(filename, dtype=str).replace({np.nan: ""})

    agencies = {agency.name: agency for agency in Agency.objects.all()}
    countries = {country.name: country for country in Country.objects.all()}
    project_types = {project_type.code: project_type for project_type in ProjectType.objects.all()}
    bp_chemical_types = {bp_chemical_type.name: bp_chemical_type for bp_chemical_type in BPChemicalType.objects.all()}
    project_clusters = {project_cluster.name: project_cluster for project_cluster in ProjectCluster.objects.all()}
    sectors = {sector.name: sector for sector in ProjectSector.objects.all()}
    subsectors = {subsector.name: subsector for subsector in ProjectSubSector.objects.all()}

    substances = {substance.name: substance.id for substance in Substance.objects.all()}
    comment_types = {comment_type.name: comment_type.id for comment_type in CommentType.objects.all()}

    activities = []
    for _, row in df.iterrows():
        activities.append(
            get_bp_activity_data(
                row,
                year_start,
                agencies,
                countries,
                project_types,
                bp_chemical_types,
                project_clusters,
                sectors,
                subsectors,
                substances,
                comment_types,
            )
        )

    return activities


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
            # TODO format errors
            return serializer.errors

        # validate bp and activities data
        if not self.check_activity_values(serializer.initial_data):
            return {"general_error": "BP activity values year not in business plan interval"}

        if current_obj:
            if not self.check_readonly_fields(
                serializer.initial_data, current_obj
            ):
                return {"general_error": "Business plan readonly fields changed"}
        return {}

    def create_bp(self, data):
        # validate data
        serializer = BusinessPlanCreateSerializer(data=data)
        errors = self.validate_bp(serializer)
        if errors:
            return status.HTTP_400_BAD_REQUEST, errors

        self.perform_create(serializer)
        instance = serializer.instance

        # set initial_id
        instance.activities.update(initial_id=F("id"))

        # set name
        if not instance.name:
            instance.name = f"{instance.status} {instance.year_start} - {instance.year_end}"

        # set created by user
        instance.created_by = self.request.user
        instance.save()

        self.create_history(instance, "Created by user")

        if config.SEND_MAIL:
            send_mail_bp_create.delay(instance.id)  # send mail to MLFS

        return status.HTTP_201_CREATED, serializer.data

    def update_bp(self, data, current_obj):
        # validate data
        serializer = BusinessPlanCreateSerializer(data=data)
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

    def import_bp(self, files, year_start, year_end, status):
        if not files:
            return status.HTTP_400_BAD_REQUEST, "File not provided"

        filename, file = next(files.items())
        extension = os.path.splitext(filename)[-1]
        if extension not in (".xls", ".xlsx"):
            return status.HTTP_400_BAD_REQUEST, "File extension is not valid"

        try:
            activities = parse_bp_file(filename, year_start)
        except Exception:
            return status.HTTP_400_BAD_REQUEST, (
                "The file you uploaded does not respect the required "
                "Excel template, so the upload cannot be performed."
            )

        return status.HTTP_200_OK, {
            "year_start": year_start,
            "year_end": year_end,
            "status": status,
            "activities": activities,
        }
