import logging

from django.db import transaction

from core.import_data.utils import (
    IMPORT_RESOURCES_V2_DIR,
)
from core.import_data_v2.scripts.import_project_type import import_project_type
from core.import_data_v2.scripts.generate_new_cluster_type_sector_file import (
    generate_new_cluster_type_sector_file,
)
from core.import_data_v2.scripts.import_cluster_type_sector_links import (
    import_cluster_type_sector_links,
)
from core.import_data_v2.scripts.import_fields import (
    import_fields,
    import_project_specific_fields,
)
from core.import_data_v2.scripts.import_project_clusters import (
    import_project_clusters,
)
from core.import_data_v2.scripts.clean_up_project_statuses import (
    clean_up_project_statuses,
    import_project_submission_statuses,
)
from core.import_data_v2.scripts.import_sector_subsector import (
    import_sector,
    import_subsector,
)
from core.import_data_v2.scripts.clean_up_countries import (
    clean_up_countries,
)
from core.import_data_v2.scripts.import_modules import import_modules

logger = logging.getLogger(__name__)


@transaction.atomic
def import_project_resources_v2(option):

    if option in ["all", "import_project_clusters"]:
        file_path = (
            IMPORT_RESOURCES_V2_DIR / "projects" / "project_clusters_06_05_2025.xlsx"
        )
        import_project_clusters(file_path)
        logger.info("✔ project clusters imported")

    if option in ["all", "import_project_type"]:
        file_path = (
            IMPORT_RESOURCES_V2_DIR / "projects" / "tbTypeOfProject_06_05_2025.json"
        )
        import_project_type(file_path)
        logger.info("✔ project types imported")

    if option in ["all", "import_sector"]:
        file_path = IMPORT_RESOURCES_V2_DIR / "projects" / "tbSector_15_10_2025.json"
        import_sector(file_path)
        logger.info("✔ sectors imported")

    if option in ["all", "import_subsector"]:
        file_path = IMPORT_RESOURCES_V2_DIR / "projects" / "tbSubsector_06_05_2025.json"
        import_subsector(file_path)
        logger.info("✔ subsectors imported")

    if option in ["all", "import_project_submission_statuses"]:
        file_path = (
            IMPORT_RESOURCES_V2_DIR / "projects" / "project_submission_statuses.json"
        )
        import_project_submission_statuses(file_path)
        logger.info("✔ project submission statuses imported")

    if option in ["all", "clean_up_project_statuses"]:
        clean_up_project_statuses()
        logger.info("✔ project statuses cleaned up")

    if option in ["all", "import_cluster_type_sector_links"]:
        file_path = IMPORT_RESOURCES_V2_DIR / "projects" / "ClusterTypeSectorLinks.json"
        import_cluster_type_sector_links(file_path)
        logger.info("✔ cluster type sector links imported")

    if option in ["all", "import_fields"]:
        file_path = IMPORT_RESOURCES_V2_DIR / "projects" / "Fields_24_10_2025.json"
        import_fields(file_path)
        logger.info("✔ fields imported")

    if option in ["all", "import_project_specific_fields"]:
        file_path = (
            IMPORT_RESOURCES_V2_DIR
            / "projects"
            / "project_specific_fields_27_10_2025.xlsx"
        )
        import_project_specific_fields(file_path)
        logger.info("✔ cluster type sector fields imported")
    if option in ["all", "import_modules"]:
        import_modules()
        logger.info("✔ modules imported")
    if option in [
        "all",
        "clean_up_countries",
    ]:
        clean_up_countries()
        logger.info("✔ countries cleaned up")

    if option == "generate_new_cluster_type_sector_file":
        # use to generate new ClusterTypeSectorLinks.json file
        file_path = (
            IMPORT_RESOURCES_V2_DIR
            / "projects"
            / "project_specific_fields_27_10_2025.xlsx"
        )
        generate_new_cluster_type_sector_file(file_path)
        logger.info("✔ new cluster type sector file generated")
