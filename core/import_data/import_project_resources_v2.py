import json
import logging
import pandas as pd

from django.db import transaction

from core.import_data.utils import (
    IMPORT_RESOURCES_DIR,
)

from core.models.group import Group
from core.models.project_metadata import (
    ProjectCluster,
    ProjectSpecificFields,
    ProjectField,
    ProjectSector,
    ProjectStatus,
    ProjectSubmissionStatus,
    ProjectSubSector,
    ProjectType,
)
from core.models.project import Project

logger = logging.getLogger(__name__)

# pylint: disable=C0301

SUBSTANCE_FIELDS = [
    "Substance - baseline technology",
    "Replacement technology/ies",
    "Phase out (CO2-eq t)",
    "Phase out (ODP t)",
    "Phase out (Mt)",
    "Ods type",
    "Sort order",
]

NEW_SUBSECTORS = [
    {
        "SEC": "OTH",
        "SUBSECTOR": "Policy paper",
        "SORT_SUBSECTOR": 99,
    },
    {
        "SEC": "KIP",
        "SUBSECTOR": "Preparation of project proposal",
        "SORT_SUBSECTOR": 99,
    },
    {
        "SEC": "FFI",
        "SUBSECTOR": "Servicing Fire Protections Systems",
        "SORT_SUBSECTOR": 99,
    },
    {
        "SEC": "AC",
        "SUBSECTOR": "Compressor",
        "SORT_SUBSECTOR": 99,
    },
]
OUTDATED_SUBSECTORS = {
    "Filling plant",
    "Demonstration",
    "Regulations",
    "Information exchange",
    "Technical assistance/support",
    "Training programme/workshop",
    "Flexible PU",
    "Several PU foam",
    "Polyol production",
    "Agency programme",
    "Ozone unit support",
    "Process conversion",
    "Project monitoring and coordination unit (PMU)",
    "Domestic/commercial refrigeration (refrigerant)",
    "Multiple-subsectors",
}


NEW_STATUSES = [
    {
        "STATUS": "N/A",
        "STATUS_CODE": "NA",
    },
    {
        "STATUS": "Unknow",
        "STATUS_CODE": "UNK",
    },
]


FIELDS_WITH_ACTUAL_VALUES = [
    "Total number of technicians trained",
    "Number of female technicians trained",
    "Total number of trainers trained",
    "Number of female trainers trained",
    "Total number of technicians certified",
    "Number of female technicians certified",
    "Number of training institutions newly assisted",
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
]


def import_project_clusters(file_path):
    """
    Import project clusters from file
    Please make sure that the file has the correct extention
        (xls, xlsx, xlsm, xlsb, odf, ods, odt)

    @param file_path = str (file path for import file)
    """

    df = pd.read_excel(file_path).fillna("")

    for index, row in df.iterrows():
        if row["Action"] == "Outdated":
            continue
        if row["Action"] == "Rename":
            ProjectCluster.objects.filter(name=row["Old name"]).update(name=row["Name"])

        production = False
        if row["Production"] == "Y":
            production = True
        elif row["Production"] == "Both":
            production = None

        # get annex groups
        annex_groups = []
        if row["Annex groups"]:
            annex_groups_name_alt = row["Annex groups"].split(",")
            annex_groups = Group.objects.filter(name__in=annex_groups_name_alt)
            if annex_groups.count() != len(annex_groups_name_alt):
                logger.warning(
                    f"⚠️ Some annex groups not found for cluster {row['Name']}"
                )
        cluster_data = {
            "name": row["Name"],
            "code": row["Acronym"],
            "category": row["Category"].upper(),
            "group": row["Dashboard group"],
            "production": production,
            "sort_order": index,
        }

        cluster, _ = ProjectCluster.objects.update_or_create(
            name=cluster_data["name"], defaults=cluster_data
        )
        if annex_groups:
            cluster.annex_groups.set(annex_groups)


def clean_up_project_statuses():
    """
    Clean up project statuses
    Remove outdated statuses and add new ones
    """
    # remove Unknown status only if there are no projects with this status

    if Project.objects.really_all().filter(status__code="UNK").exists():
        logger.warning(
            "⚠️ Cannot remove 'Unknown' status, there are projects with this status."
        )
    else:
        ProjectStatus.objects.filter(code="UNK").delete()

    # change the status 'New submission' into 'N/A' and delete status 'New submission'

    new_submission_status, _ = ProjectStatus.objects.update_or_create(
        name="N/A",
        defaults={
            "code": "NA",
        },
    )
    Project.objects.really_all().filter(status__code="NEWSUB").update(
        status=new_submission_status
    )
    ProjectStatus.objects.filter(code="NEWSUB").delete()

    # change the status 'Newly approved' into 'Ongoing' and delete status 'Newly approved'

    on_going_status = ProjectStatus.objects.filter(name="Ongoing").first()
    Project.objects.really_all().filter(status__code="NEW").update(
        status=on_going_status
    )
    ProjectStatus.objects.filter(code="NEW").delete()


def import_project_type(file_path):
    """
    Import project type from file

    @param file_path = str (file path for import file)
    """
    with open(file_path, "r", encoding="utf8") as f:
        types_json = json.load(f)

    # add other types that are not in the file
    for type_json in types_json:
        if type_json.get("ACTION", None) == "RENAME":
            ProjectType.objects.filter(name=type_json["OLD_NAME"]).update(
                name=type_json["TYPE_PRO"]
            )
        else:
            type_data = {
                "code": type_json["TYPE"],
                "name": type_json["TYPE_PRO"],
                "sort_order": type_json["SORT_TYPE"],
            }
            ProjectType.objects.update_or_create(
                name=type_data["name"], defaults=type_data
            )


def import_sector(file_path):
    """
    Import sectors and subsectors from file

    @param file_path = str (file path for import file)
    """

    with open(file_path, "r", encoding="utf8") as f:
        sectors_json = json.load(f)

    for sector_json in sectors_json:

        if sector_json.get("ACTION", None) == "RENAME":
            ProjectSector.objects.filter(name=sector_json["OLD_NAME"]).update(
                name=sector_json["SECTOR"]
            )
        sector_data = {
            "name": sector_json["SECTOR"].strip(),
            "code": sector_json["SEC"].strip(),
            "sort_order": sector_json["SORT_SECTOR"],
        }
        ProjectSector.objects.update_or_create(
            code=sector_data["code"], defaults=sector_data
        )


def import_subsector(file_path):
    """
    Import sectors and subsectors from file
    Please make sure that the file has the correct extention
        (xls, xlsx, xlsm, xlsb, odf, ods, odt)

    @param file_path = str (file path for import file)
    """

    with open(file_path, "r", encoding="utf8") as f:
        subsectors_json = json.load(f)

    for subsector_json in subsectors_json:
        subsector_name = subsector_json["SUBSECTOR"].strip()
        if subsector_json.get("ACTION", None) == "RENAME":
            project_sub_sector = ProjectSubSector.objects.filter(
                name=subsector_json["OLD_NAME"]
            )
            if subsector_json.get("OLD_SEC", None):
                project_sub_sector = project_sub_sector.filter(
                    sector__code=subsector_json["OLD_SEC"]
                )
            project_sub_sector.update(name=subsector_name)

        # get sector
        sector = ProjectSector.objects.filter(code=subsector_json["SEC"]).first()
        if not sector:
            logger.warning(
                f"⚠️ {subsector_json['SEC']} sector not found => {subsector_json['SUBSECTOR']} not imported"
            )
            continue

        # set subsector data
        subsector_code = (
            subsector_json["CODE_SUBSECTOR"].strip()
            if subsector_json.get("CODE_SUBSECTOR")
            else None
        )
        subsector_data = {
            "name": subsector_json["SUBSECTOR"].strip(),
            "code": subsector_code,
            "sector": sector,
            "sort_order": subsector_json["SORT_SUBSECTOR"],
        }

        project_sub_sector = ProjectSubSector.objects.filter(
            name=subsector_data["name"]
        )
        if project_sub_sector.exists():
            project_sub_sector.update(
                name=subsector_data["name"],
                code=subsector_data["code"],
                sector=subsector_data["sector"],
                sort_order=subsector_data["sort_order"],
            )
        else:
            ProjectSubSector.objects.create(
                name=subsector_data["name"],
                code=subsector_data["code"],
                sector=subsector_data["sector"],
                sort_order=subsector_data["sort_order"],
            )


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


def import_project_submission_statuses(file_path):
    """
    Import project submission statuses from file

    @param file_path = str (file path for import file)
    """

    with open(file_path, "r", encoding="utf8") as f:
        statuses_json = json.load(f)

    for status_json in statuses_json:
        status_data = {
            "name": status_json["STATUS"],
            "code": status_json["STATUS_CODE"],
        }
        ProjectSubmissionStatus.objects.update_or_create(
            name=status_data["name"], defaults=status_data
        )


def import_cluster_type_sector_links(file_path):
    """
    Import links between cluster, type and sector from file

    @param file_path = str (file path for import file)
    """
    with open(file_path, "r", encoding="utf8") as f:
        data = json.load(f)

    for cluster_json in data:
        cluster = ProjectCluster.objects.filter(name=cluster_json["cluster"]).first()
        if not cluster:
            logger.warning(
                f"⚠️ {cluster_json['cluster']} cluster not found => {cluster_json['cluster']} not imported"
            )
            continue
        for type_json in cluster_json["types"]:
            type_name = type_json["type"]
            if type_name == "Project Support":
                type_name = "Project support"
            type_obj = ProjectType.objects.filter(name=type_name).first()
            if not type_obj:
                logger.warning(
                    f"⚠️ {type_name} type not found => {cluster_json['cluster']} not imported"
                )
                continue
            for sector_name in type_json["sectors"]:
                if sector_name == "Control Submstance Monitoring":
                    sector_name = "Control Substance Monitoring"
                if sector_name == "Compliance Assistance Program":
                    sector_name = "Compliance Assistance Programme"
                sector = ProjectSector.objects.filter(name=sector_name).first()
                if not sector:
                    logger.warning(
                        f"⚠️ {sector_name} sector not found => {cluster_json['cluster']} not imported"
                    )
                    continue
                ProjectSpecificFields.objects.update_or_create(
                    cluster=cluster,
                    type=type_obj,
                    sector=sector,
                )


def generate_new_cluster_type_sector_file(file_path):
    """
    Generate new cluster type sector file based on the current data in the database

    @param file_path = str (file path for import file)
    """
    combinations = {}  # {cluster: {type: [sectors]}}
    df = pd.read_excel(file_path).fillna("")

    for _, row in df.iterrows():
        if row["Project type name"].strip() == "Project preparation":
            row["Project type name"] = "Preparation"

        if row["Sector name"].strip() == "Other Sector":
            continue

        combinations.setdefault(row["Cluster name"].strip(), {})
        combinations[row["Cluster name"].strip()].setdefault(
            row["Project type name"].strip(), []
        )
        combinations[row["Cluster name"].strip()][
            row["Project type name"].strip()
        ].append(row["Sector name"].strip())

    new_data = []
    for cluster_name, types in combinations.items():
        new_data.append(
            {
                "cluster": cluster_name,
                "types": [
                    {
                        "type": type_name,
                        "sectors": sorted(list(set(sector_names))),  # remove duplicates
                    }
                    for type_name, sector_names in types.items()
                ],
            }
        )

    with open("new_ClusterTypeSectorLinks.json", "w", encoding="utf8") as f:
        json.dump(new_data, f, indent=4)


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
def import_project_resources_v2(option):

    if option in ["all", "import_project_clusters"]:
        file_path = (
            IMPORT_RESOURCES_DIR / "projects_v2" / "project_clusters_06_05_2025.xlsx"
        )
        import_project_clusters(file_path)
        logger.info("✔ project clusters imported")

    if option in ["all", "import_project_type"]:
        file_path = (
            IMPORT_RESOURCES_DIR / "projects_v2" / "tbTypeOfProject_06_05_2025.json"
        )
        import_project_type(file_path)
        logger.info("✔ project types imported")

    if option in ["all", "import_sector"]:
        file_path = IMPORT_RESOURCES_DIR / "projects_v2" / "tbSector_15_10_2025.json"
        import_sector(file_path)
        logger.info("✔ sectors imported")

    if option in ["all", "import_subsector"]:
        file_path = IMPORT_RESOURCES_DIR / "projects_v2" / "tbSubsector_06_05_2025.json"
        import_subsector(file_path)
        logger.info("✔ subsectors imported")

    if option in ["all", "import_project_submission_statuses"]:
        file_path = (
            IMPORT_RESOURCES_DIR / "projects_v2" / "project_submission_statuses.json"
        )
        import_project_submission_statuses(file_path)
        logger.info("✔ project submission statuses imported")

    if option in ["all", "clean_up_project_statuses"]:
        clean_up_project_statuses()
        logger.info("✔ project statuses cleaned up")

    if option in ["all", "import_cluster_type_sector_links"]:
        file_path = IMPORT_RESOURCES_DIR / "projects_v2" / "ClusterTypeSectorLinks.json"
        import_cluster_type_sector_links(file_path)
        logger.info("✔ cluster type sector links imported")

    if option in ["all", "import_fields"]:
        file_path = IMPORT_RESOURCES_DIR / "projects_v2" / "Fields_24_10_2025.json"
        import_fields(file_path)
        logger.info("✔ fields imported")

    if option in ["all", "import_project_specific_fields"]:
        file_path = (
            IMPORT_RESOURCES_DIR
            / "projects_v2"
            / "project_specific_fields_27_10_2025.xlsx"
        )
        import_project_specific_fields(file_path)
        logger.info("✔ cluster type sector fields imported")

    if option == "generate_new_cluster_type_sector_file":
        # use to generate new ClusterTypeSectorLinks.json file
        file_path = (
            IMPORT_RESOURCES_DIR
            / "projects_v2"
            / "project_specific_fields_27_10_2025.xlsx"
        )
        generate_new_cluster_type_sector_file(file_path)
        logger.info("✔ new cluster type sector file generated")
