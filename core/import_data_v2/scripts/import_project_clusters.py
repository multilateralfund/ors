import logging
import pandas as pd

from django.db import transaction

from core.models.group import Group
from core.models.project_metadata import ProjectCluster


logger = logging.getLogger(__name__)


@transaction.atomic
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
