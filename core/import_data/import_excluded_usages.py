import json
import logging

from django.db import transaction

from core.import_data.utils import (
    IMPORT_RESOURCES_DIR,
    delete_old_data,
    get_chemical_by_name_or_components,
)
from core.models.time_frame import TimeFrame
from core.models.usage import ExcludedUsage, Usage

logger = logging.getLogger(__name__)

USAGE_NAME_MAPPING = {
    "Solvent application": "Solvent",
}


def parse_file(file_path):
    """
    Import columns from json file

    @param file_path = str (file path for import file)
    """
    with open(file_path, encoding="utf8") as f:
        json_data = json.load(f)

    excluded_usages = []

    # set dict for time frames for quick lookup
    time_frames = TimeFrame.objects.all()
    time_frame_dict = {(tf.min_year, tf.max_year): tf for tf in time_frames}

    # set usage dict for quick lookup
    usages = Usage.objects.all()
    usage_dict = {}
    for usage in usages:
        usage_name = USAGE_NAME_MAPPING.get(usage.full_name, usage.full_name).lower()
        usage_dict[usage_name] = usage

    for _, section_data in json_data.items():
        for exc_usage_json in section_data:
            # get time frame
            min_year = exc_usage_json.pop("min_year", None)
            max_year = exc_usage_json.pop("max_year", None)
            time_frame = time_frame_dict.get((min_year, max_year), None)
            if not time_frame:
                logger.error(
                    f"Time frame not found for min_year: {min_year} and max_year: {max_year}"
                )
                continue
            # get chemical
            chemical_name = exc_usage_json.pop("substance_name", None)
            chemical, chemical_type = get_chemical_by_name_or_components(chemical_name)
            if not chemical:
                logger.error(f"Chemical not found for name: {chemical_name}")
                continue
            substance = chemical if chemical_type == "substance" else None
            blend = chemical if chemical_type == "blend" else None

            # get usage
            usage_name = exc_usage_json.pop("usage_name", None).lower()
            usage = usage_dict.get(usage_name, None)
            if not usage:
                logger.error(f"Usage not found for name: {usage_name}")
                continue

            excluded_usage_data = {
                "time_frame": time_frame,
                "substance": substance,
                "blend": blend,
                "usage": usage,
            }
            excluded_usages.append(ExcludedUsage(**excluded_usage_data))

    ExcludedUsage.objects.bulk_create(excluded_usages, batch_size=1000)


@transaction.atomic
def import_excluded_usages():
    logger.info("⏳ importing excluded usages")
    file_path = IMPORT_RESOURCES_DIR / "excluded_usages.json"
    delete_old_data(ExcludedUsage)
    parse_file(file_path)
    logger.info("✔ excluded usages imported")
