import json
import logging

from django.db import transaction

from core.models.project_metadata import (
    ProjectCluster,
    ProjectSpecificFields,
    ProjectSector,
    ProjectType,
)

logger = logging.getLogger(__name__)


@transaction.atomic
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
