import logging
import json
import pandas as pd

from django.db import transaction

from core.models.project_metadata import (
    ProjectSpecificFields,
    ProjectField,
)

logger = logging.getLogger(__name__)

# pylint: disable=C0301

FIELDS_WITH_ACTUAL_VALUES = [
    "Total number of technicians trained",
    "Number of female technicians trained",
    "Total number of trainers trained",
    "Number of female trainers trained",
    "Total number of technicians certified",
    "Number of female technicians certified",
    "Number of training institutions newly  assisted",
    "Number of tools sets distributed",
    "Total number of customs officers trained",
    "Number of female customs officers trained",
    "Total number of NOU personnel supported",
    "Number of female NOU personnel supported",
    "Certification system for technicians established or further enhanced (yes or no)",
    "Operation of recovery and recycling scheme (yes or no)",
    "Operation of reclamation scheme (yes or no)",
    "Establishment or upgrade of Import/export licensing (yes or no)",
    "Establishment of quota systems (yes or no)",
    "Ban of equipment (number)",
    "Ban of substances (number)",
    "kWh/year saved",
    "MEPS developed for domestic refrigeration (yes/no)",
    "MEPS developed for commercial refrigeration (yes/no)",
    "MEPS developed for residential air-conditioning (yes/no)",
    "MEPS developed for commercial AC (yes/no)",
    "Capacity building programmes (checklist (yes/no) for technicians, end-users, operators, consultants, procurement officers and other Government entities)",
    "EE demonstration project included (yes/no)",
    "Quantity of controlled substances destroyed (M t)",
    "Quantity of controlled substances destroyed (CO2-eq t)",
    "Checklist of regulations or policies enacted",
    "Quantity of HFC-23 by-product (Generated)",
    "Quantity of HFC-23 by-product (by product generation rate)",
    "Quantity of HFC-23 by-product (Destroyed)",
    "Quantity of HFC-23 by-product (Emitted)",
    "Number of Production Lines assisted",
    "Number of enterprises assisted",
    "Number of enterprises",
    "Aggregated consumption",
    "Cost effectiveness (US$/ Kg)",
    "Cost effectiveness (US$/ CO2-eq)",
]


@transaction.atomic
def import_fields(file_path):
    """
    Import project type from file

    @param file_path = str (file path for import file)
    """

    ProjectField.objects.all().delete()
    with open(file_path, "r", encoding="utf8") as f:
        fields_json = json.load(f)

    # add other types that are not in the file
    ProjectField.objects.all().delete()
    for field_json in fields_json:

        field_data = {
            "import_name": field_json["IMPORT_NAME"],
            "label": field_json["LABEL"],
            "read_field_name": field_json["READ_FIELD_NAME"],
            "write_field_name": field_json["WRITE_FIELD_NAME"],
            "table": field_json["TABLE"],
            "data_type": field_json["DATA_TYPE"],
            "mlfs_only": field_json.get("MLFS_ONLY", False),
            "section": field_json["SECTION"],
            "is_actual": field_json.get("IS_ACTUAL", False),
            "sort_order": field_json["SORT_ORDER"],
            "editable_in_versions": ",".join(
                [str(version) for version in field_json["EDITABLE_IN_VERSIONS"]]
            ),
            "visible_in_versions": ",".join(
                [str(version) for version in field_json["VISIBLE_IN_VERSIONS"]]
            ),
        }

        ProjectField.objects.update_or_create(
            import_name=field_data["import_name"], defaults=field_data
        )


@transaction.atomic
def import_project_specific_fields(file_path):
    """
    Import project clusters from file
    Please make sure that the file has the correct extention
        (xls, xlsx, xlsm, xlsb, odf, ods, odt)

    @param file_path = str (file path for import file)
    """

    def _clean_up_field_name(field_name, mya=False):
        """
        Clean up field name
        """
        mya_clean_up = {
            "Cost effectiveness (US$/ CO2-ep) (MYA)": "Cost effectiveness (US$/ CO2-eq) (MYA)",
            "Cost effectiveness (US$/ CO2-ep)": "Cost effectiveness (US$/ CO2-eq) (MYA)",
            "Cost effectiveness (US$/ CO2-eq)": "Cost effectiveness (US$/ CO2-eq) (MYA)",
            "Aggregated consumption": "Aggregated consumption (MYA)",
            "Cost effectiveness (US$/ Kg)": "Cost effectiveness (US$/ Kg) (MYA)",
            "Number of enterprises assisted": "Number of enterprises assisted (MYA)",
            "Number of enterprises": "Number of enterprises (MYA)",
            "Number of Production Lines assisted": "Number of Production Lines assisted (MYA)",
        }

        individual_field_clean_up = {
            "Cost effectiveness (US$/ CO2-ep)": "Cost effectiveness (US$/ CO2-eq)",
            "Cost effectiveness (US$/ CO2-ep) (MYA)": "Cost effectiveness (US$/ CO2-eq)",
            "Phase out (Mt) (MYA)": "Phase out (Mt)",
            "Phase out (M t)": "Phase out (Mt)",
            "Phase out (CO2-eq t) (MYA)": "Phase out (CO2-eq t)",
            "Cost effectiveness (US$/ CO2-eq)": "Cost effectiveness (US$/ CO2-eq)",
            "Phase out (ODP t) (MYA)": "Phase out (ODP t)",
        }
        if mya:
            if field_name in mya_clean_up:
                return mya_clean_up[field_name]
        else:
            if field_name in individual_field_clean_up:
                return individual_field_clean_up[field_name]
        return field_name.strip().replace("  ", " ")

    df = pd.read_excel(file_path).fillna("")

    for _, row in df.iterrows():
        if row["Project type name"].strip() == "Project preparation":
            row["Project type name"] = "Preparation"
        if row["Sector name"].strip() == "Control Submstance Monitoring":
            row["Sector name"] = "Control Substance Monitoring"
        if row["Sector name"].strip() == "Compliance Assistance Program":
            row["Sector name"] = "Compliance Assistance Programme"
        if row["Sector name"] == "Other Sector":
            continue
        try:
            cluster_sector_type = ProjectSpecificFields.objects.get(
                cluster__name__iexact=row["Cluster name"].strip(),
                type__name__iexact=row["Project type name"].strip(),
                sector__name__iexact=row["Sector name"].strip(),
            )
        except ProjectSpecificFields.DoesNotExist:
            logger.warning(
                f"⚠️ {row['Cluster name']}/{row['Project type name']}/{row['Sector name']} not found."
            )
            continue

        cluster_sector_type.fields.clear()

        # particular fields start from row 22
        # Extract MYA fields separately as some names are dupliated in the impact section
        field_names_excluding_mya = [
            _clean_up_field_name(row[field_index].strip())
            for field_index in range(22, 49)
            if row[field_index] != ""
        ]

        # search for fields that also have an actual field that is not in the file
        # and add them to the list of fields to be added (for Impact fields)
        actual_field_names = [
            f"{field_name} actual"
            for field_name in field_names_excluding_mya
            if field_name in FIELDS_WITH_ACTUAL_VALUES
        ]
        field_names_excluding_mya.extend(actual_field_names)
        project_fields = ProjectField.objects.exclude(section="MYA").filter(
            import_name__in=field_names_excluding_mya
        )

        missing_fields = set(field_names_excluding_mya) - set(
            project_fields.values_list("import_name", flat=True)
        )

        for missing_field in missing_fields:
            logger.warning(
                f"⚠️ {missing_field} field not found =>"
                + f"{row['Cluster name']}/{row['Project type name']}/{row['Sector name']}"
            )
        cluster_sector_type.fields.add(*project_fields)

        mya_field_names = [
            _clean_up_field_name(row[field_index].strip(), mya=True)
            for field_index in range(49, len(row) - 1)
            if row[field_index] != ""
        ]
        project_fields = ProjectField.objects.filter(
            import_name__in=mya_field_names, section="MYA"
        )
        missing_fields = set(mya_field_names) - set(
            project_fields.values_list("import_name", flat=True)
        )
        for missing_field in missing_fields:
            logger.warning(
                f"⚠️ {missing_field} field not found =>"
                + f"{row['Cluster name']}/{row['Project type name']}/{row['Sector name']}"
            )

        cluster_sector_type.fields.add(*project_fields)
