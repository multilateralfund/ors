import json
import logging

from django.conf import settings
from django.db import transaction
from django.db.models import Q
from core.import_data.utils import PCR_DIR_LIST, get_object_by_code

from core.models.project import (
    Project,
    ProjectCluster,
    ProjectOdsOdp,
    ProjectSector,
)


logger = logging.getLogger(__name__)


SECTOR_CLUSTER_MAPPING = {
    "pcr2023": {
        "CFC phase out plan": "CFC Phase-out Plans",
        "CFCs/CTC/Halon Accelerated Phase-Out Plan": "Other ODS Sector Plans",
        "CTC phase out plan": "Other ODS Sector Plans",
        "Domestic Refrigeration": "CFC Phase-out Plans",
        "Foam": "CFC Phase-out Plans",
        "Halon": "Other ODS Sector Plans",
        "Methyl bromide": "Other ODS Sector Plans",
        "Accelerated Production CFC": "CFC Production Phase out Plans",
        "ODS phase out plan": "Other ODS Sector Plans",
        "Process Agent (Phase I)": "Other ODS Sector Plans",
        "Process Agent (Phase II)": "Other ODS Sector Plans",
        "Production CFC": "CFC Production Phase out Plans",
        "Production Methyl Bromide": "Other ODS Production Phase out Plans",
        "Production ODS": "Other ODS Production Phase out Plans",
        "Production TCA": "Other ODS Production Phase out Plans",
        "Refrigerant management plan": "CFC Phase-out Plans",
        "Refrigeration Servicing": "CFC Phase-out Plans",
        "Solvent": "Other ODS Sector Plans",
        "Tobacco Expansion": "Other ODS Sector Plans",
        "Tobacco": "Other ODS Sector Plans",
    },
    "hpmppcr2023": {
        "HCFC Phase Out Plan (Stage I)": "HPMP1",
        "HCFC Phase Out Plan (Stage II)": "HPMP2",
        "HCFC Phase Out Plan (Stage III)": "HPMP3",
        "Production HCFC (Stage I)": "HPPMP1",
        "HCFC Production (Stage I)": "HPPMP1",
        "HCFC Production (Stage II)": "HPPMP2",
        "HCFC Production (Stage III)": "HPPMP3",
    },
}


def parse_clusters_file(file_path, database_name):
    with open(file_path, "r", encoding="utf8") as f:
        json_data = json.load(f)

    for project_json in json_data:
        # get project by code
        project = get_object_by_code(
            Project, project_json["Code"], "code", project_json["Code"], with_log=False
        )
        # skip project if not created (invalid data)
        if not project:
            logger.warning(f"Project not found: {project_json['Code']}")
            continue

        # set cluster
        cluster_name = SECTOR_CLUSTER_MAPPING[database_name].get(
            project_json["MYASector"]
        )
        if not cluster_name:
            logger.error(
                f"Cluster not found for project {project_json['Code']}, {project_json['MYASector']}"
            )
        else:
            cluster = ProjectCluster.objects.find_by_name_or_code(cluster_name)
            if cluster:
                project.cluster = cluster
                project.save()
            else:
                logger.error(f"Cluster not found: {cluster_name}")


def set_substance_cluster(project):
    cluster_names = set()
    for ods_odp in project.ods_odp.all():
        chemical_name = None
        if ods_odp.ods_substance:
            chemical_name = ods_odp.ods_substance.name
        elif ods_odp.ods_blend:
            chemical_name = ods_odp.ods_blend.name
        if not chemical_name:
            continue
        if "HCFC" in chemical_name:
            cluster_names.add("HCFC Individual")
            continue
        if "CFC" in chemical_name:
            cluster_names.add("CFC Individual")
            continue
        if "HFC" in chemical_name:
            cluster_names.add("HFC Individual")
            continue

    if not cluster_names:
        return

    if len(cluster_names) > 1:
        logger.warning(
            f"Project {project.code} has multiple substance types: {cluster_names}"
        )
        return

    cluster_name = cluster_names.pop()
    cluster = ProjectCluster.objects.find_by_name_or_code(cluster_name)
    project.cluster = cluster
    project.save()


def set_ind_clusters():
    # project type INS or subsector_legacy Ozone Unit Support => cluster to INS
    current_cluster = ProjectCluster.objects.find_by_name_or_code("INS")
    Project.objects.select_related("project_type").filter(
        cluster_id__isnull=True
    ).filter(
        Q(project_type__code="INS") | Q(subsector_legacy__iexact="ozone unit support")
    ).update(
        cluster=current_cluster
    )

    # project type TRA => cluster to TRA
    current_cluster = ProjectCluster.objects.find_by_name_or_code("TRA")
    Project.objects.select_related("project_type").filter(
        cluster_id__isnull=True,
        project_type__code="TRA",
    ).update(cluster=current_cluster)

    # check substances and set cluster
    projects = (
        Project.objects.prefetch_related("ods_odp")
        .filter(cluster_id__isnull=True)
        .all()
    )
    for project in projects:
        set_substance_cluster(project)

    # project_type=DEM, sector=FUM or sector_legacy=HAL => cluster to OOI
    ooi_cluster = ProjectCluster.objects.find_by_name_or_code("OOI")
    Project.objects.select_related("project_type", "sector").filter(
        cluster_id__isnull=True
    ).filter(
        Q(project_type__code="DEM", sector__code="FUM")
        | Q(project_type__code="DEM", sector_legacy="HAL")
    ).update(
        cluster=ooi_cluster
    )

    # sector=FOA or sector=REF and substance_type ="CFC" => cluster = CFCIND
    cfcind_cluster = ProjectCluster.objects.find_by_name_or_code("CFCIND")
    Project.objects.select_related("sector").filter(cluster_id__isnull=True).filter(
        Q(sector__code="FOA") | Q(sector__code="REF")
    ).filter(substance_type="CFC").update(cluster=cfcind_cluster)

    # sector=FOA or sector=REF and substance_type ="HCFC" => cluster = HCFCIND
    current_cluster = ProjectCluster.objects.find_by_name_or_code("HCFCIND")
    Project.objects.select_related("sector").filter(cluster_id__isnull=True).filter(
        Q(sector__code="FOA") | Q(sector__code="REF")
    ).filter(substance_type="HCFC").update(cluster=current_cluster)

    # sector=FOA or sector=REF and substance_type ="HFC" => cluster = HFCIND
    current_cluster = ProjectCluster.objects.find_by_name_or_code("HFCIND")
    Project.objects.select_related("sector").filter(cluster_id__isnull=True).filter(
        Q(sector__code="FOA") | Q(sector__code="REF")
    ).filter(substance_type="HFC").update(cluster=current_cluster)

    # project type=INV and sector in [FUM, FFI, PAG] => cluster = OOI
    Project.objects.select_related("project_type", "sector").filter(
        cluster_id__isnull=True,
        project_type__code="INV",
        sector__code__in=["FUM", "FFI", "PAG"],
    ).update(cluster=ooi_cluster)

    # project type=INV and sector=SOL and subsector in [TCA, CTC] => cluster = OOI
    Project.objects.select_related("project_type", "sector", "subsector").filter(
        cluster_id__isnull=True,
        project_type__code="INV",
        sector__code="SOL",
        subsector__code__in=["TCA", "CTC"],
    ).update(cluster=ooi_cluster)

    # project_type=INV and sector=SOL and substance in [Carbon Tetrachloride, Methyl chloroform]
    #  => cluster = OOI
    project_ids = (
        ProjectOdsOdp.objects.select_related("ods_substance")
        .filter(
            Q(ods_substance__name__iexact="carbon tetrachloride")
            | Q(ods_substance__name__iexact="methyl chloroform")
        )
        .values_list("project_id", flat=True)
    )
    Project.objects.select_related("project_type", "sector").filter(
        cluster_id__isnull=True,
        project_type__code="INV",
        sector__code="SOL",
        id__in=project_ids,
    ).update(cluster=ooi_cluster)

    # project type=INV and sector=SOL and subsector = 113 => cluster = CFCIND
    Project.objects.select_related("project_type", "sector", "subsector").filter(
        cluster_id__isnull=True,
        project_type__code="INV",
        sector__code="SOL",
        subsector__code="113",
    ).update(cluster=cfcind_cluster)

    # project_type =PRP and sector in(FUM,PAG) => cluster = OOI
    Project.objects.select_related("project_type", "sector").filter(
        cluster_id__isnull=True,
        project_type__code="PRP",
        sector__code__in=["FUM", "PAG"],
    ).update(cluster=ooi_cluster)


def set_ins_sectors():
    """
    All projects with Cluster INS will have sector GOV
    """
    sector = ProjectSector.objects.get(code="GOV")
    Project.objects.filter(cluster__code="INS", sector__isnull=True).update(
        sector=sector
    )


@transaction.atomic
def set_project_clusters():
    db_dir_path = settings.IMPORT_DATA_DIR / "pcr"

    logger.info("⏳ setting project clusters for multi year projects")
    for database_name in PCR_DIR_LIST:
        file_path = db_dir_path / database_name / "Import_ListofMYAProjects.json"
        parse_clusters_file(file_path, database_name)
    logger.info("✅ setting project clusters for multi year projects")

    logger.info("⏳ setting project clusters for individual projects")
    set_ind_clusters()
    logger.info("✅ setting project clusters for individual projects")
    set_ins_sectors()
