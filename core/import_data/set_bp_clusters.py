import logging

from django.db import transaction
from django.db.models import Q

from core.import_data.set_project_clusters import SECTOR_CLUSTER_MAPPING
from core.models.project import (
    ProjectCluster,
    ProjectSector,
    ProjectType,
)
from core.models.business_plan import BPRecord

logger = logging.getLogger(__name__)

MYA_SECTOR_CLUSTER_MAPPING = {
    **SECTOR_CLUSTER_MAPPING["pcr2023"],
    **SECTOR_CLUSTER_MAPPING["hpmppcr2023"],
}


def set_mya_clusters():
    """
    Set the cluster a for the MYA bp records
    """
    bp_records = (
        BPRecord.objects.filter(
            is_multi_year=True,
            project_cluster__isnull=True,
            legacy_sector_and_subsector__isnull=False,
        )
        .select_related("sector", "subsector")
        .all()
    )
    bp_clusters_set = 0
    for bp_record in bp_records:
        cluster_name = None

        # check mapping fields
        bp_mapping_fields = [
            bp_record.sector.name if bp_record.sector else None,
            bp_record.subsector.name if bp_record.subsector else None,
            bp_record.legacy_sector_and_subsector,
        ]
        bp_mapping_fields = [field for field in bp_mapping_fields if field]
        if not bp_mapping_fields:
            # skip if no mapping fields
            continue

        # check if any of the mapping fields is in the mapping
        for sector_str, cluster in MYA_SECTOR_CLUSTER_MAPPING.items():
            for mapping_string in bp_mapping_fields:
                if mapping_string and mapping_string in sector_str:
                    cluster_name = cluster
                    break
            if cluster_name:
                break

        # set the cluster
        if cluster_name:
            cluster = ProjectCluster.objects.find_by_name_or_code(cluster_name)
            if cluster:
                bp_record.project_cluster = cluster
                bp_record.save()
                bp_clusters_set += 1
            else:
                logger.error(f"Cluster {cluster_name} not found")

    logger.info(f"✔ {bp_clusters_set} clusters set for MYA BP records")


def set_substances_cluster(record):
    cluster_names = []
    if not record.substances.exists():
        return

    if record.substances.filter(name__icontains="CFC").exists():
        cluster_names.append("CFC Individual")
    elif record.substances.filter(name__icontains="HCFC").exists():
        cluster_names.append("HCFC Individual")
    elif record.substances.filter(name__icontains="HFC").exists():
        cluster_names.append("HFC Individual")

    if not cluster_names:
        logger.error(f"No cluster found for record {record.id}")
        return

    if len(cluster_names) > 1:
        logger.error(f"Multiple clusters found for record {record.id}")
        return

    cluster = ProjectCluster.objects.find_by_name_or_code(cluster_names[0])
    if cluster:
        record.project_cluster = cluster
        record.save()
    else:
        logger.error(f"Cluster {cluster_names[0]} not found")


def set_ind_clusters():
    ooi_cluster = ProjectCluster.objects.find_by_name_or_code("OOI")
    cfcind_cluster = ProjectCluster.objects.find_by_name_or_code("CFCIND")
    hcfcind_cluster = ProjectCluster.objects.find_by_name_or_code("HCFCIND")

    # project type INS or subsector_legacy Ozone unit support
    # => cluster = GOV & project_type = INS & sector = NOU
    gov_cluster = ProjectCluster.objects.find_by_name_or_code("GOV")
    current_proj_type = ProjectType.objects.find_by_name("INS")
    current_sector = ProjectSector.objects.find_by_name("NOU")
    BPRecord.objects.select_related("project_type").filter(
        project_cluster__isnull=True,
        legacy_project_type__isnull=False,
    ).filter(
        Q(project_type__code="INS")
        | Q(legacy_sector_and_subsector__icontains="ozone unit support")
    ).update(
        project_cluster=gov_cluster,
        project_type=current_proj_type,
        sector=current_sector,
    )

    # project type TRA => cluster to TRA
    current_cluster = ProjectCluster.objects.find_by_name_or_code("TRA")
    BPRecord.objects.select_related("project_type").filter(
        project_cluster__isnull=True,
        project_type__code="TRA",
    ).update(
        project_cluster=current_cluster,
    )

    # check substances and set cluster
    bp_records = (
        BPRecord.objects.filter(
            project_cluster__isnull=True,
        )
        .prefetch_related("substances")
        .all()
    )
    for record in bp_records:
        set_substances_cluster(record)

    # project_type=DEM, sector=FUM => cluster to OOI
    BPRecord.objects.select_related("project_type", "sector").filter(
        project_cluster__isnull=True,
        project_type__code="DEM",
        sector__code="FUM",
    ).update(project_cluster=ooi_cluster)

    # sector=FOA or sector=REF and substance_type ="CFC" => cluster = CFCIND
    BPRecord.objects.select_related("sector", "bp_chemical_type").filter(
        project_cluster__isnull=True,
        sector__code__in=["FOA", "REF"],
        bp_chemical_type__name="CFC",
    ).update(project_cluster=cfcind_cluster)

    # sector=FOA or sector=REF and substance_type ="HCFC" => cluster = HCFCIND
    BPRecord.objects.select_related("sector", "bp_chemical_type").filter(
        project_cluster__isnull=True,
        sector__code__in=["FOA", "REF"],
        bp_chemical_type__name="HCFC",
    ).update(project_cluster=hcfcind_cluster)

    # sector=FOA or sector=REF and substance_type ="HFC" => cluster = HFCIND
    hfcind_cluster = ProjectCluster.objects.find_by_name_or_code("HFCIND")
    BPRecord.objects.select_related("sector", "bp_chemical_type").filter(
        project_cluster__isnull=True,
        sector__code__in=["FOA", "REF"],
        bp_chemical_type__name="HFC",
    ).update(project_cluster=hfcind_cluster)

    # project type=INV and sector in [FUM, FFI, PAG] => cluster = OOI
    BPRecord.objects.select_related("project_type", "sector").filter(
        project_cluster__isnull=True,
        project_type__code="INV",
        sector__code__in=["FUM", "FFI", "PAG"],
    ).update(project_cluster=ooi_cluster)

    # project type=INV and sector=SOL and subsector in [TCA, CTC] => cluster = OOI
    BPRecord.objects.select_related("project_type", "sector", "subsector").filter(
        project_cluster__isnull=True,
        project_type__code="INV",
        sector__code="SOL",
        subsector__code__in=["TCA", "CTC"],
    ).update(project_cluster=ooi_cluster)

    # project_type=INV and sector=SOL and substance in [Carbon Tetrachloride, Methyl chloroform]
    #  => cluster = OOI
    BPRecord.objects.select_related("project_type", "sector").filter(
        project_cluster__isnull=True,
        project_type__code="INV",
        sector__code="SOL",
    ).prefetch_related("substances").all()

    for record in bp_records:
        if record.substances.filter(
            Q(name__iexact="Carbon Tetrachloride") | Q(name__iexact="Methyl chloroform")
        ).exists():
            record.project_cluster = ooi_cluster
            record.save()

    # project type=INV and sector=SOL and subsector = 113 => cluster = CFCIND
    BPRecord.objects.select_related("project_type", "sector", "subsector").filter(
        project_cluster__isnull=True,
        project_type__code="INV",
        sector__code="SOL",
        subsector__code="113",
    ).update(project_cluster=cfcind_cluster)

    # project_type =PRP and sector in (FUM,PAG) => cluster = OOI
    BPRecord.objects.select_related("project_type", "sector").filter(
        project_cluster__isnull=True,
        project_type__code="PRP",
        sector__code__in=["FUM", "PAG"],
    ).update(project_cluster=ooi_cluster)

    # sector in {SOL,ARS} & chemical_type = CFC => cluster = CFCIND
    BPRecord.objects.select_related("bp_chemical_type", "sector", "sector").filter(
        project_cluster__isnull=True,
        sector__code__in=["SOL", "ARS"],
        bp_chemical_type__name="CFC",
    ).update(project_cluster=cfcind_cluster)

    # sector in {SOL,ARS} & substance_type = HCFC => cluster = HCFCIND
    BPRecord.objects.select_related("bp_chemical_type", "sector").filter(
        project_cluster__isnull=True,
        sector__code__in=["SOL", "ARS"],
        bp_chemical_type__name="HCFC",
    ).update(project_cluster=hcfcind_cluster)

    # sector = FUM & ods substance = "Methyl Bromide" => cluster = OOI
    BPRecord.objects.select_related("sector").filter(
        project_cluster__isnull=True,
        sector__code="FUM",
    ).prefetch_related("substances").all()

    for record in bp_records:
        if record.substances.filter(name__iexact="Methyl Bromide").exists():
            record.project_cluster = ooi_cluster
            record.save()

    # sector = SOL => cluster = CFCIND
    BPRecord.objects.select_related("sector").filter(
        project_cluster__isnull=True,
        sector__code="SOL",
    ).update(project_cluster=cfcind_cluster)

    # sector = DES => cluster = Disposal
    current_cluster = ProjectCluster.objects.find_by_name_or_code("Disposal")
    BPRecord.objects.select_related("sector").filter(
        project_cluster__isnull=True,
        sector__code="DES",
    ).update(project_cluster=current_cluster)

    # sector in {CAP, PreCAP} => project_type = TAS & cluster = AGC
    current_cluster = ProjectCluster.objects.find_by_name_or_code("AGC")
    current_proj_type = ProjectType.objects.find_by_name("TAS")
    BPRecord.objects.select_related("sector").filter(
        project_cluster__isnull=True,
        sector__code__in=["CAP", "PreCAP"],
    ).update(project_cluster=current_cluster, project_type=current_proj_type)

    # cluster = AGC, title contains "Core unit"
    # => sector = Core Unit & project_type = Project Support
    current_sector = ProjectSector.objects.find_by_name("Core Unit")
    current_proj_type = ProjectType.objects.find_by_name("Project Support")
    BPRecord.objects.select_related("project_cluster").filter(
        project_cluster__name="AGC",
        title__icontains="Core unit",
    ).update(sector=current_sector, project_type=current_proj_type)

    # cluster = AGC, title contains "Compliance Assistance"
    # => sector = CAP & project_type = TAS
    current_sector = ProjectSector.objects.find_by_name("CAP")
    current_proj_type = ProjectType.objects.find_by_name("TAS")
    BPRecord.objects.select_related("project_cluster").filter(
        project_cluster__name="AGC",
        title__icontains="Compliance Assistance",
    ).update(sector=current_sector, project_type=current_proj_type)

    # sector = FUM => cluster= OOI
    BPRecord.objects.select_related("sector").filter(
        project_cluster__isnull=True,
        sector__code="FUM",
    ).update(project_cluster=ooi_cluster)


@transaction.atomic
def set_business_plan_clusters():
    set_mya_clusters()
    set_ind_clusters()
    logger.info("✔ Business plan clusters set")
