import json
import logging
import pandas as pd

from django.db import transaction

from core.import_data.utils import (
    IMPORT_RESOURCES_DIR,
)

from core.models.project_metadata import (
    ProjectCluster,
    ProjectClusterTypeSectorFields,
    ProjectField,
    ProjectSector,
    ProjectSubSector,
    ProjectType,
)

logger = logging.getLogger(__name__)

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
        "STATUS": "New Submission",
        "STATUS_CODE": "NEWSUB",
    },
    {
        "STATUS": "Unknow",
        "STATUS_CODE": "UNK",
    },
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

        cluster_data = {
            "name": row["Name"],
            "code": row["Acronym"],
            "category": row["Category"].upper(),
            "sort_order": index,
        }
        ProjectCluster.objects.update_or_create(
            name=cluster_data["name"], defaults=cluster_data
        )


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
        type_data = {
            "code": type_json["TYPE"],
            "name": type_json["TYPE_PRO"],
            "sort_order": type_json["SORT_TYPE"],
        }
        ProjectType.objects.update_or_create(name=type_data["name"], defaults=type_data)


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


def import_cluster_type_sector_fields(file_path):
    """
    Import project clusters from file
    Please make sure that the file has the correct extention
        (xls, xlsx, xlsm, xlsb, odf, ods, odt)

    @param file_path = str (file path for import file)
    """

    def _clean_up_field_name(field_name):
        """
        Clean up field name
        """
        if field_name == "Phase out (M t)":
            return "Phase out (Mt)"
        return field_name.strip().replace("  ", " ")

    df = pd.read_excel(file_path).fillna("")

    for _, row in df.iterrows():
        try:
            cluster_sector_type = ProjectClusterTypeSectorFields.objects.get(
                cluster__name__iexact=row["Cluster name"].strip(),
                type__name__iexact=row["Project type name"].strip(),
                sector__name__iexact=row["Sector name"].strip(),
            )
        except ProjectClusterTypeSectorFields.DoesNotExist:
            logger.warning(
                f"⚠️ {row['Cluster name']}/{row['Project type name']}/{row['Sector name']} not found."
            )
            continue

        # particular fields start from row 22
        field_names = [
            _clean_up_field_name(row[field_index].strip())
            for field_index in range(22, len(row) - 1)
            if row[field_index] != ""
        ]
        project_fields = ProjectField.objects.filter(import_name__in=field_names)
        missing_fields = set(field_names) - set(
            project_fields.values_list("import_name", flat=True)
        )

        for missing_field in missing_fields:
            logger.warning(
                f"⚠️ {missing_field} field not found =>"
                + f"{row['Cluster name']}/{row['Project type name']}/{row['Sector name']}"
            )

        cluster_sector_type.fields.add(*project_fields)


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
            type_obj = ProjectType.objects.filter(name=type_json["type"]).first()
            if not type_obj:
                logger.warning(
                    f"⚠️ {type_json['type']} type not found => {cluster_json['cluster']} not imported"
                )
                continue
            for sector_name in type_json["sectors"]:
                sector = ProjectSector.objects.filter(name=sector_name).first()
                if not sector:
                    logger.warning(
                        f"⚠️ {sector_name} sector not found => {cluster_json['cluster']} not imported"
                    )
                    continue
                ProjectClusterTypeSectorFields.objects.update_or_create(
                    cluster=cluster,
                    type=type_obj,
                    sector=sector,
                )


def import_fields(file_path):
    """
    Import project type from file

    @param file_path = str (file path for import file)
    """
    with open(file_path, "r", encoding="utf8") as f:
        fields_json = json.load(f)

    # add other types that are not in the file
    for field_json in fields_json:

        field_data = {
            "import_name": field_json["IMPORT_NAME"],
            "label": field_json["LABEL"],
            "read_field_name": field_json["READ_FIELD_NAME"],
            "write_field_name": field_json["WRITE_FIELD_NAME"],
            "table": field_json["TABLE"],
            "data_type": field_json["DATA_TYPE"],
            "section": field_json["SECTION"],
        }

        ProjectField.objects.update_or_create(
            read_field_name=field_data["read_field_name"], defaults=field_data
        )


@transaction.atomic
def import_project_resources_v2():

    file_path = (
        IMPORT_RESOURCES_DIR / "projects_v2" / "project_clusters_06_05_2025.xlsx"
    )
    import_project_clusters(file_path)
    logger.info("✔ project clusters imported")

    file_path = IMPORT_RESOURCES_DIR / "projects_v2" / "tbTypeOfProject_06_05_2025.json"
    import_project_type(file_path)
    logger.info("✔ project types imported")

    file_path = IMPORT_RESOURCES_DIR / "projects_v2" / "tbSector_06_05_2025.json"
    import_sector(file_path)
    logger.info("✔ sectors imported")

    file_path = IMPORT_RESOURCES_DIR / "projects_v2" / "tbSubsector_06_05_2025.json"
    import_subsector(file_path)
    logger.info("✔ subsectors imported")

    file_path = IMPORT_RESOURCES_DIR / "projects_v2" / "ClusterTypeSectorLinks.json"
    import_cluster_type_sector_links(file_path)
    logger.info("✔ cluster type sector links imported")

    file_path = IMPORT_RESOURCES_DIR / "projects_v2" / "Fields_06_05_2025.json"
    import_fields(file_path)
    logger.info("✔ fields imported")

    file_path = IMPORT_RESOURCES_DIR / "projects_v2" / "cluster_type_sector_fields.xlsx"
    import_cluster_type_sector_fields(file_path)
    logger.info("✔ cluster type sector fields imported")
