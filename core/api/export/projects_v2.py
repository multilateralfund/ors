from core.api.export.base import BaseWriter
from core.api.export.single_project_v2.helpers import format_iso_date
from core.api.serializers.meta_project_fields import MetaProjectFieldSerializer
from core.models import BPActivity
from core.models import MetaProject

# pylint: disable=no-member


def export_activity_code(activity_data):
    try:
        activity = BPActivity.objects.get(id=activity_data["id"])
        return activity.get_display_internal_id
    except BPActivity.DoesNotExist:
        return ""


class ProjectV2Writer(BaseWriter):
    ROW_HEIGHT = 35
    COLUMN_WIDTH = 20
    header_row_start_idx = 1

    def __init__(self, sheet):
        headers = [
            {
                "id": "code",
                "headerName": "Code",
                "column_width": self.COLUMN_WIDTH * 2,
            },
            {
                "id": "code_legacy",
                "headerName": "Legacy code",
                "column_width": self.COLUMN_WIDTH * 2,
            },
            {
                "id": "metacode",
                "headerName": "Metacode",
            },
            {
                "id": "cluster",
                "headerName": "Cluster",
                "column_width": self.COLUMN_WIDTH * 2,
            },
            {
                "id": "metaproject_category",
                "headerName": "Metaproject category",
            },
            {
                "id": "bp_activity",
                "headerName": "BP activity",
                "method": lambda r, h: (
                    export_activity_code(r[h["id"]]) if r[h["id"]] else ""
                ),
            },
            {
                "id": "project_type",
                "headerName": "Project type",
            },
            {
                "id": "project_type_legacy",
                "headerName": "Legacy project type",
            },
            {
                "id": "agency",
                "headerName": "Agency",
            },
            {
                "id": "sector",
                "headerName": "Sector",
                "column_width": self.COLUMN_WIDTH * 1.5,
            },
            {
                "id": "sector_legacy",
                "headerName": "Legacy sector",
            },
            {
                "id": "subsectors_list",
                "headerName": "Subsectors",
                "column_width": self.COLUMN_WIDTH * 1.5,
            },
            {
                "id": "subsector_legacy",
                "headerName": "Legacy subsector",
            },
            {
                "id": "substance_type",
                "headerName": "Substance type",
            },
            {
                "id": "substances_list",
                "headerName": "Substances",
            },
            {
                "id": "status",
                "headerName": "Status",
                "column_width": self.COLUMN_WIDTH * 1.5,
            },
            {
                "id": "serial_number",
                "headerName": "Serial number",
            },
            {
                "id": "serial_number_legacy",
                "headerName": "Legacy serial number",
            },
            {
                "id": "country",
                "headerName": "Country",
            },
            {
                "id": "title",
                "headerName": "Title",
                "column_width": self.COLUMN_WIDTH * 5,
            },
        ]

        field_map = {
            "DecimalField": {
                "type": "number",
                "align": "right",
                "cell_format": "$###,###,##0.00#############",
            },
            "DateTimeField": {
                "method": lambda r, h: format_iso_date(
                    r["meta_project_fields"][h["id"]]
                ),
            },
        }

        for field_name in MetaProjectFieldSerializer.Meta.fields:
            field = getattr(MetaProject, field_name).field
            label = getattr(field, "help_text")
            header_def = {
                "id": field_name,
                "headerName": label,
                "method": lambda r, h: r["meta_project_fields"][h["id"]],
            }
            header_def.update(field_map.get(field.__class__.__name__, {}))
            headers.append(header_def)

        super().__init__(sheet, headers)
