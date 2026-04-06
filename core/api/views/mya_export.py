from typing import TYPE_CHECKING
import openpyxl
from django.db.models import F
from django.db.models import OuterRef
from django.db.models import Subquery

from core.api.export.base import WriteOnlyBase
from core.api.export.single_project_v2.helpers import format_iso_date
from core.api.utils import workbook_response
from core.api.export.base import configure_sheet_print
from core.models import MetaProject
from core.models import Project

if TYPE_CHECKING:
    from core.api.views import ProjectV2ViewSet
    from openpyxl.worksheet._write_only import WriteOnlyWorksheet


HEADERS = [
    {"headerName": "Metacode", "id": "umbrella_code"},
    {"headerName": "Country", "id": "country_name"},
    {"headerName": "Cluster", "id": "cluster_name"},
    {"headerName": "Lead agency", "id": "lead_agency_name"},
    {
        "headerName": "Start date (MYA)",
        "id": "start_date",
        "method": lambda r, h: format_iso_date(r[h["id"]]),
    },
    {
        "headerName": "End date (MYA)",
        "id": "end_date",
        "method": lambda r, h: format_iso_date(r[h["id"]]),
    },
    {"headerName": "Project duration (months)", "id": "project_duration"},
    {
        "headerName": "MYA Total agreed funding in principle (US $)",
        "id": "project_funding",
        "type": "number",
        "align": "right",
        "cell_format": "$###,###,##0.00#############",
    },
    {
        "headerName": "MYA Total support costs in principle (US $)",
        "id": "support_cost",
        "type": "number",
        "align": "right",
        "cell_format": "$###,###,##0.00#############",
    },
    {
        "headerName": "MYA Total agreed costs in principle (US $)",
        "id": "project_cost",
        "type": "number",
        "align": "right",
        "cell_format": "$###,###,##0.00#############",
    },
    {
        "headerName": "Phase-out (CO2-eq tonnes) (MYA)",
        "id": "phase_out_co2_eq_t",
    },
    {"headerName": "Phase-out (ODP tonnes) (MYA)", "id": "phase_out_odp"},
    {"headerName": "Phase-out (metric tonnes) (MYA)", "id": "phase_out_mt"},
    {
        "headerName": "Target in the last year (reduction in %)",
        "id": "target_reduction",
    },
    {
        "headerName": "Target in the last year (CO2-eq tonnes)",
        "id": "target_co2_eq_t",
    },
    {"headerName": "Target in the last year (ODP tonnes)", "id": "target_odp"},
    {
        "headerName": "Starting point for aggregate reductions in consumption or "
        "production (ODP tonnes)",
        "id": "starting_point_odp",
    },
    {
        "headerName": "Starting point for aggregate reductions in consumption or "
        "production (CO2-eq tonnes)",
        "id": "starting_point_co2_eq_t",
    },
    {"headerName": "Baseline (ODP tonnes)", "id": "baseline_odp"},
    {"headerName": "Baseline (CO2-eq tonnes)", "id": "baseline_co2_eq_t"},
    {
        "headerName": "Number of SMEs directly funded",
        "id": "number_of_smes_directly_funded",
    },
    {
        "headerName": "Number of non-SMEs directly funded",
        "id": "number_of_non_sme_directly_funded",
    },
    {
        "headerName": "Number of both SMEs and non-SMEs included in the project but "
        "not directly funded",
        "id": "number_of_both_sme_non_sme_not_directly_funded",
    },
    {
        "headerName": "Production sector: number of production lines assisted",
        "id": "number_of_production_lines_assisted",
    },
    {
        "headerName": "Cost effectiveness (US $/kg)",
        "id": "cost_effectiveness_kg",
        "type": "number",
        "align": "right",
        "cell_format": "$###,###,##0.00#############",
    },
    {
        "headerName": "Cost effectiveness (US $/CO2-eq tonnes) ",
        "id": "cost_effectiveness_co2",
        "type": "number",
        "align": "right",
        "cell_format": "$###,###,##0.00#############",
    },
]


class MyaExport:
    wb: "openpyxl.Workbook"
    sheet: "WriteOnlyWorksheet"
    view: "ProjectV2ViewSet"

    def __init__(self, view):
        self.view = view

    def setup_workbook(self):
        wb = openpyxl.Workbook(write_only=True)
        # delete default sheet
        sheet = wb.create_sheet("MYAs")
        configure_sheet_print(sheet, "landscape")
        self.wb = wb
        self.sheet = sheet

    def export_xls(self):
        self.setup_workbook()
        meta_project_ids = (
            self.view.filter_queryset(self.view.get_queryset())
            .exclude(meta_project__isnull=True)
            .order_by()
            .values_list("meta_project_id", flat=True)
            .distinct()
        )

        # self.sheet.append([h["headerName"] for h in HEADERS])

        first_project = Project.objects.filter(meta_project=OuterRef("pk")).order_by(
            "id"
        )[:1]

        meta_projects = MetaProject.objects.filter(id__in=meta_project_ids).values(
            *[h["id"] for h in HEADERS if h["id"]],
            country_name=F("country__name"),
            cluster_name=F("cluster__name"),
            lead_agency_name=Subquery(
                first_project.values("lead_agency__name")[:1],
            ),
        )

        writer = WriteOnlyBase(self.sheet, HEADERS)
        writer.write(meta_projects)
        # for mp in meta_projects:
        #     row = []
        #     for h in HEADERS:
        #         value = mp.get(h["id"]) if h["id"] else ""
        #         if isinstance(value, datetime):
        #             value = format_iso_date(value)
        #         row.append(value)
        #     self.sheet.append(row)
        return workbook_response("Mya.xlsx", self.wb)
