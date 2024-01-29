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
    ProjectType,
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
    # legacy_code = CPR/PRO/13/INV/76 = CLuster = OOI
    ooi_cluster = ProjectCluster.objects.find_by_name_or_code("OOI")
    Project.objects.select_related("sector").filter(
        code="CPR/PRO/13/INV/76",
    ).update(cluster=ooi_cluster)

    # legacy_code in {NER/KIP/91/TAS/47, NER/KIP/91/INV/46} => cluster = KIP1
    current_cluster = ProjectCluster.objects.find_by_name_or_code("KIP1")
    Project.objects.select_related("sector").filter(
        code__in=["NER/KIP/91/TAS/47", "NER/KIP/91/INV/46"],
    ).update(cluster=current_cluster)

    # legacy_code = TLS/PHA/59/PRP/02 => substance_type = CFC
    Project.objects.select_related("sector").filter(
        code="TLS/PHA/59/PRP/02",
    ).update(substance_type="CFC")

    # legacy_code = MAR/PHA/88/TAS/33 => cluster = HCFCIND
    hcfcind_cluster = ProjectCluster.objects.find_by_name_or_code("HCFCIND")
    Project.objects.select_related("sector").filter(
        code="MAR/PHA/88/TAS/33",
    ).update(cluster=hcfcind_cluster)

    # legacy_code in {OMA/PHA/57/TAS/20, TRI/PHA/51/TAS/22} => cluster = CFCIND
    cfcind_cluster = ProjectCluster.objects.find_by_name_or_code("CFCIND")
    Project.objects.select_related("sector").filter(
        code__in=["OMA/PHA/57/TAS/20", "TRI/PHA/51/TAS/22"],
    ).update(cluster=cfcind_cluster)

    # project type INS or subsector_legacy Ozone unit support => cluster to INS
    current_cluster = ProjectCluster.objects.find_by_name_or_code("INS")
    Project.objects.select_related("project_type").filter(
        cluster_id__isnull=True
    ).filter(
        Q(project_type__code="INS")
        | Q(subsector_legacy__icontains="ozone unit support")
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
    Project.objects.select_related("project_type", "sector").filter(
        cluster_id__isnull=True
    ).filter(
        Q(project_type__code="DEM", sector__code="FUM")
        | Q(project_type__code="DEM", sector_legacy="HAL")
    ).update(
        cluster=ooi_cluster
    )

    # sector=FOA or sector=REF and substance_type ="CFC" => cluster = CFCIND
    Project.objects.select_related("sector").filter(cluster_id__isnull=True).filter(
        Q(sector__code="FOA") | Q(sector__code="REF")
    ).filter(substance_type="CFC").update(cluster=cfcind_cluster)

    # sector=FOA or sector=REF and substance_type ="HCFC" => cluster = HCFCIND
    Project.objects.select_related("sector").filter(cluster_id__isnull=True).filter(
        Q(sector__code="FOA") | Q(sector__code="REF")
    ).filter(substance_type="HCFC").update(cluster=hcfcind_cluster)

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

    # cluster INS => cluster = GOV & project_type = INS & sector = NOU
    ins_cluster = ProjectCluster.objects.find_by_name_or_code("INS")
    gov_cluster = ProjectCluster.objects.find_by_name_or_code("GOV")
    current_proj_type = ProjectType.objects.find_by_name("INS")
    current_sector = ProjectSector.objects.find_by_name("NOU")
    Project.objects.select_related().filter(
        cluster_id=ins_cluster.id,
    ).update(
        cluster=gov_cluster,
        project_type=current_proj_type,
        sector=current_sector,
    )

    # legacy_sector in {SOL,ARS} & substance_type = CFC => cluster = CFCIND
    Project.objects.select_related().filter(
        cluster_id__isnull=True,
        sector_legacy__in=["SOL", "ARS"],
        substance_type="CFC",
    ).update(cluster=cfcind_cluster)

    # legacy_sector in {SOL,ARS} & substance_type = HCFC => cluster = HCFCIND
    Project.objects.select_related().filter(
        cluster_id__isnull=True,
        sector_legacy__in=["SOL", "ARS"],
        substance_type="HCFC",
    ).update(cluster=hcfcind_cluster)

    # legacy_sector = FUM => cluster = OOI & substance_type = Methyl Bromide
    Project.objects.select_related().filter(
        cluster_id__isnull=True,
        sector_legacy="FUM",
    ).update(cluster=ooi_cluster, substance_type="Methyl Bromide")

    # legacy_sector = HAL => cluster = OOI & sector = FFI
    current_sector = ProjectSector.objects.find_by_name("FFI")
    Project.objects.select_related().filter(
        cluster_id__isnull=True,
        sector_legacy="HAL",
    ).update(cluster=ooi_cluster, sector=current_sector)

    # legacy_subsector = Methyl Bromide => cluster = OOI & substance_type = Methyl Bromide
    Project.objects.select_related().filter(
        cluster_id__isnull=True,
        subsector_legacy__iexact="Methyl Bromide",
    ).update(cluster=ooi_cluster, substance_type="Methyl Bromide")

    # lecacy_sector = KIP => cluster = HCFCIND
    Project.objects.select_related().filter(
        cluster_id__isnull=True,
        sector_legacy="KIP",
    ).update(cluster=hcfcind_cluster)

    # legacy_sector = PHA & substance_type = HCFC => cluster = HCFCIND
    Project.objects.select_related().filter(
        cluster_id__isnull=True,
        sector_legacy="PHA",
        substance_type="HCFC",
    ).update(cluster=hcfcind_cluster)

    # legacy_sector = PHA & substance_type = CFC & legacy_subsector = CFC phaseout plan
    # & project_type = PRP or title contains "Verification"
    # => cluster = CFCIND
    Project.objects.select_related("project_type").filter(
        cluster_id__isnull=True,
        sector_legacy="PHA",
        substance_type="CFC",
        subsector_legacy__iexact="CFC phaseout plan",
    ).filter(
        Q(project_type__code="PRP") | Q(title__icontains="Verification"),
    ).update(
        cluster=cfcind_cluster
    )

    # legacy_sector = SOL => cluster = CFCIND
    Project.objects.select_related().filter(
        cluster_id__isnull=True,
        sector_legacy="SOL",
    ).update(cluster=cfcind_cluster)

    # legacy_sector = DES => cluster = Disposal
    current_cluster = ProjectCluster.objects.find_by_name_or_code("Disposal")
    Project.objects.select_related().filter(
        cluster_id__isnull=True,
        sector_legacy="DES",
    ).update(cluster=current_cluster)

    # legacy_sector = SEV lecacy_subsector = Agency Programme => cluster = Agency
    current_cluster = ProjectCluster.objects.find_by_name_or_code("Agency")
    Project.objects.select_related().filter(
        cluster_id__isnull=True,
        sector_legacy="SEV",
        subsector_legacy__icontains="Agency Programme",
    ).update(cluster=current_cluster)

    # cluster = AGC, title contains "Core unit"
    # => sector = Core Unit & project_type =  Project Support
    current_sector = ProjectSector.objects.find_by_name("Core Unit")
    current_proj_type = ProjectType.objects.find_by_name("Project Support")
    Project.objects.select_related("cluster").filter(
        cluster__code="AGC",
        title__icontains="Core unit",
    ).update(sector=current_sector, project_type=current_proj_type)

    # cluster = AGC, title contains "Compliance Assistance"
    # => sector = CAP & project_type = TAS
    current_sector = ProjectSector.objects.find_by_name("CAP")
    current_proj_type = ProjectType.objects.find_by_name("TAS")
    Project.objects.select_related("cluster").filter(
        cluster__code="AGC",
        title__icontains="Compliance Assistance",
    ).update(sector=current_sector, project_type=current_proj_type)

    # legacy_sector = PHA & legacy_subsector = Preparation of project proposal
    # => cluster = CFCIND
    Project.objects.select_related().filter(
        cluster_id__isnull=True,
        sector_legacy="PHA",
        subsector_legacy__iexact="Preparation of project proposal",
    ).update(cluster=cfcind_cluster)

    # legacy_sector = SEV & title contains "Enabling Activities" => cluster = HFCIND
    current_cluster = ProjectCluster.objects.find_by_name_or_code("HFCIND")
    Project.objects.select_related().filter(
        cluster_id__isnull=True,
        sector_legacy="SEV",
        title__icontains="Enabling Activities",
    ).update(cluster=current_cluster)

    # legacy_sector = SEV & title contains "Survey" & substance_type = HCFC
    # => cluster = HCFCIND
    Project.objects.select_related().filter(
        cluster_id__isnull=True,
        sector_legacy="SEV",
        title__icontains="Survey",
        substance_type="HCFC",
    ).update(cluster=hcfcind_cluster)

    # legacy_sector = SEV & title contains "Survey" & substance_type = HFC => cluster = HFCIND
    Project.objects.select_related().filter(
        cluster_id__isnull=True,
        sector_legacy="SEV",
        title__icontains="Survey",
        substance_type="HFC",
    ).update(cluster=current_cluster)

    # sector in {CAP, PreCAP} => project_type = TAS & cluster = AGC
    current_proj_type = ProjectType.objects.find_by_name("TAS")
    current_cluster = ProjectCluster.objects.find_by_name_or_code("AGC")
    Project.objects.select_related("sector").filter(
        cluster_id__isnull=True,
        sector__code__in=["CAP", "PCAP"],
    ).update(project_type=current_proj_type, cluster=current_cluster)


def set_ins_sectors():
    """
    All projects with Cluster INS will have sector GOV
    """
    # cluster = ins => sector = gov ????
    sector = ProjectSector.objects.get(code="GOV")
    Project.objects.filter(cluster__code="GOV", sector__isnull=True).update(
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
