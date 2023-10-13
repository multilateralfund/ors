import json
import logging

from django.db import transaction

from core.import_data.utils import IMPORT_RESOURCES_DIR, delete_old_data
from core.models.time_frame import TimeFrame


logger = logging.getLogger(__name__)


def parse_file(file_path):
    """
    Import columns from json file

    @param file_path = str (file path for import file)
    """
    with open(file_path, encoding="utf8") as f:
        json_data = json.load(f)

    time_frames = []
    for time_frame_json in json_data:
        time_frame_data = {
            "source_file": file_path,
            **time_frame_json,
        }
        time_frames.append(TimeFrame(**time_frame_data))

    TimeFrame.objects.bulk_create(time_frames)


@transaction.atomic
def import_time_frames():
    logger.info("⏳ importing time frames from")
    file_path = IMPORT_RESOURCES_DIR / "time_frames.json"
    delete_old_data(TimeFrame, file_path)
    parse_file(file_path)
    logger.info("✔ time frames imported")
