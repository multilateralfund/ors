# pylint: disable=too-many-lines
from functools import partial
from itertools import pairwise
from operator import attrgetter
from typing import Iterable
import datetime

from openpyxl.cell import WriteOnlyCell
from openpyxl.comments import Comment
from openpyxl.styles import Alignment
from openpyxl.styles import Border
from openpyxl.styles import DEFAULT_FONT
from openpyxl.styles import Font
from openpyxl.styles import PatternFill
from openpyxl.styles import Side

from django.db.models import JSONField
from django.db.models.fields import BooleanField
from django.db.models.fields import CharField
from django.db.models.fields import DateField
from django.db.models.fields import DateTimeField
from django.db.models.fields.related import ForeignKey
from django.db.models.fields.related import ManyToManyField
from django.db.models.fields.reverse_related import ForeignObjectRel
from django.utils import timezone

from core.api.export.base import BaseWriter
from core.api.export.projects_v2_dump import get_choice_value
from core.api.export.projects_v2_dump import get_field_value
from core.api.export.projects_v2_dump import get_value_boolean
from core.api.export.projects_v2_dump import get_value_component_field
from core.api.export.projects_v2_dump import get_value_date
from core.api.export.projects_v2_dump import get_value_fk
from core.api.export.projects_v2_dump import get_value_m2m
from core.models import MetaProject
from core.models import Project
from core.models import ProjectOdsOdp
from core.models import Substance
from core.models.project import OLD_FIELD_HELP_TEXT
from core.models.project_metadata import ProjectField
from core.models.utils import SUBSTANCE_GROUP_ID_TO_CATEGORY
from core.models.utils import SubstancesType

MIN_PROJECT_VERSION = 3


def tz_naive(value: datetime.datetime | datetime.date | None):

    # Convert date to datetime at midnight if it's not already a datetime
    if isinstance(value, datetime.date) and not isinstance(value, datetime.datetime):
        value = datetime.datetime.combine(value, datetime.time.min)

    if isinstance(value, datetime.datetime) and timezone.is_aware(value):
        return timezone.localtime(value).replace(tzinfo=None)

    return value


def trf_or_adj(project: Project | None):
    if project:
        return project.adjustment or project.fund_transferred or project.psc_transferred
    return None


def not_trf_or_adj(project: Project | None):
    if project and not project.adjustment:
        return not (project.fund_transferred or project.psc_transferred)
    return None


# pylint: disable-next=too-many-public-methods,too-many-lines
class ProjectsInventoryReportWriter(BaseWriter):
    ROW_HEIGHT = 35
    COLUMN_WIDTH = 20
    header_row_start_idx = 1

    def __init__(
        self,
        sheet,
        projects,
        project_fields=None,
        metaproject_fields=None,
    ):
        self.version_map = self.build_version_map(projects)
        self.mya_type_revised_completion_dates = (
            self.build_mya_type_revised_completion_dates(projects)
        )
        self.all_versions: dict[int, list[Project]] = {}
        self.project_fields = (
            project_fields if project_fields is not None else self.get_project_fields()
        )
        self.metaproject_fields = (
            metaproject_fields
            if metaproject_fields is not None
            else self.get_metaproject_fields()
        )
        self.project_field_names = {
            f["write_field_name"]: f["label"]
            for f in ProjectField.objects.all().values("write_field_name", "label")
        }

        for (final_version_id, _), p in self.version_map.items():
            if p.id != final_version_id:
                self.all_versions.setdefault(final_version_id, []).append(p)

        headers = self.get_base_headers()

        for i in range(3):
            headers.extend(self.funding_headers(i + 3, i + 1))

        for i in range(7):
            headers.extend(self.adjustment_headers(i, i + 1))

        headers.extend(
            [
                {
                    "id": "fund_transferred",
                    "headerName": "Total Fund Adjustments",
                    "type": "number",
                    "cell_format": "#,##0;-#,##0;;@",
                    "align": "right",
                    "method": lambda project, _: self.calc_sum_total_fund_transferred(
                        project
                    ),
                },
                {
                    "id": "psc_transferred",
                    "headerName": "Total Support Cost Adjustments",
                    "type": "number",
                    "cell_format": "#,##0;-#,##0;;@",
                    "align": "right",
                    "method": lambda project, _: self.calc_sum_total_psc_transferred(
                        project
                    ),
                },
                {
                    "id": "actual_fund",
                    "headerName": "Total Funds Approved",
                    "type": "number",
                    "cell_format": "#,##0;-#,##0;;@",
                    "align": "right",
                    "method": lambda project, _: self._p_actual_fund(project),
                },
                {
                    "id": "actual_psc",
                    "headerName": "Total Support Costs Approved",
                    "type": "number",
                    "cell_format": "#,##0;-#,##0;;@",
                    "align": "right",
                    "method": lambda project, _: self._p_actual_psc(project),
                },
                {
                    "id": "apr_funds_disbursed",
                    "headerName": "Total Funds Disbursed",
                    "type": "number",
                    "cell_format": "#,##0;-#,##0;;@",
                    "align": "right",
                    "method": lambda project, _: getattr(
                        self._get_latest_apr(project), "funds_disbursed", None
                    ),
                },
                {
                    "id": "apr_support_cost_disbursed",
                    "headerName": "Total Support Costs Disbursed",
                    "type": "number",
                    "cell_format": "#,##0;-#,##0;;@",
                    "align": "right",
                    "method": lambda project, _: getattr(
                        self._get_latest_apr(project), "support_cost_disbursed", None
                    ),
                },
                {
                    "id": "interest",
                    "headerName": "Interest",
                    "type": "number",
                    "cell_format": "#,##0;-#,##0;;@",
                    "align": "right",
                    "method": lambda project, _: self.calc_sum_interest(project),
                },
            ]
        )

        headers.extend(
            [
                {
                    "id": "substance_type",
                    "headerName": "Substance",
                    "method": lambda project, _: self._get_substance(project),
                },
            ]
        )

        headers.extend(
            self.build_headers(
                self.project_fields,
                include_names=[
                    "total_phase_out_odp_tonnes",
                    "total_phase_out_metric_tonnes",
                    "total_phase_out_co2_tonnes",
                ],
                title_overrides={
                    "total_phase_out_odp_tonnes": "Total ODP Approved",
                    "total_phase_out_metric_tonnes": "Total MT Approved",
                    "total_phase_out_co2_tonnes": "Total CO2-eq Approved",
                },
                header_overrides={
                    "total_phase_out_odp_tonnes": {
                        "cell_format": "#,##0.0;-#,##0.0;;@"
                    },
                    "total_phase_out_metric_tonnes": {
                        "cell_format": "#,##0.0;-#,##0.0;;@"
                    },
                    "total_phase_out_co2_tonnes": {"cell_format": "#,##0;-#,##0;;@"},
                },
            )
        )

        headers.extend(
            [
                {
                    "id": "apr_odp_actual",
                    "headerName": "Total ODP Actual",
                    "cell_format": "#,##0.0;-#,##0.0;;@",
                    "align": "right",
                    "method": lambda project, _: self._apr_phase_out_total(
                        self._get_latest_apr(project),
                        "consumption_phased_out_odp",
                        "production_phased_out_odp",
                    ),
                },
                {
                    "id": "apr_mt_actual",
                    "headerName": "Total MT Actual",
                    "cell_format": "#,##0.0;-#,##0.0;;@",
                    "align": "right",
                    "method": lambda project, _: self._apr_phase_out_total(
                        self._get_latest_apr(project),
                        "consumption_phased_out_mt",
                        "production_phased_out_mt",
                    ),
                },
                {
                    "id": "apr_co2_actual",
                    "headerName": "Total CO2-eq Actual",
                    "cell_format": "#,##0;-#,##0;;@",
                    "align": "right",
                    "method": lambda project, _: self._apr_phase_out_total(
                        self._get_latest_apr(project),
                        "consumption_phased_out_co2",
                        "production_phased_out_co2",
                    ),
                },
            ]
        )

        headers.extend(self.ods_odp_headers(1))
        headers.extend(self.ods_odp_headers(2))
        headers.extend(self.ods_odp_headers(3))
        headers.extend(self.ods_odp_headers(4))

        headers.extend(
            self.build_headers(
                self.project_fields,
                include_names=[
                    "project_duration",
                    "date_completion",
                ],
                title_overrides={
                    "project_duration": "Duration (Months)",
                    "date_completion": "Approved Date Completion",
                },
                header_overrides={
                    "date_completion": {
                        "cell_format": "MMM-YYYY",
                    },
                },
            )
        )

        headers.extend(
            [
                {
                    "id": "mya_end_date",
                    "headerName": "MYA Completion Date",
                    "type": "date",
                    "cell_format": "MMM-YYYY",
                    "method": lambda project, _: (
                        tz_naive(project.meta_project.end_date)
                        if project.meta_project
                        and project.meta_project.type == MetaProject.MetaProjectType.MYA
                        else None
                    ),
                },
                {
                    "id": "extended_date",
                    "headerName": "Extended date",
                    "type": "date",
                    "cell_format": "MMM-YYYY",
                    "method": lambda project, _: self._get_extended_date(project),
                },
            ]
        )

        headers.extend(
            [
                {
                    "id": "apr_date_completed",
                    "headerName": "Date Completed",
                    "type": "date",
                    "cell_format": "MMM-YYYY",
                    "method": lambda project, _: getattr(
                        self._get_latest_apr(project), "date_actual_completion", None
                    ),
                },
                {
                    "id": "apr_date_financially_completed",
                    "headerName": "Date Financially Completed",
                    "type": "date",
                    "method": lambda project, _: getattr(
                        self._get_latest_apr(project), "date_financial_completion", None
                    ),
                },
            ]
        )

        headers.extend(
            self.build_headers(
                self.project_fields,
                include_names=["transfer_meeting", "transfer_decision"],
                title_overrides={
                    "transfer_meeting": "Transfer Meeting",
                    "transfer_decision": "Transfer Decision",
                },
                header_overrides={
                    "transfer_meeting": {
                        "method": partial(get_value_fk, None, attr_name="number")
                    }
                },
            )
        )

        headers.append(
            {
                "id": "transferred_from",
                "headerName": "Agency Transferred From",
                "method": lambda project, _: (
                    project.transferred_from.agency.name
                    if project.transferred_from
                    else None
                ),
            },
        )

        headers.append(
            {
                "id": "apr_remarks",
                "headerName": "Remarks",
                "method": lambda project, _: getattr(
                    self._get_latest_apr(project), "current_year_remarks", None
                ),
            },
        )

        headers.extend(
            self.build_headers(
                self.metaproject_fields,
                source="meta_project",
                include_names=[
                    "number_of_non_sme_directly_funded",
                ],
            )
        )
        headers.extend(
            self.build_headers(
                self.project_fields,
                include_names=[
                    "number_of_non_sme_directly_funded_actual",
                ],
            )
        )
        headers.extend(
            self.build_headers(
                self.metaproject_fields,
                source="meta_project",
                include_names=[
                    "number_of_smes_directly_funded",
                ],
            )
        )
        headers.extend(
            self.build_headers(
                self.project_fields,
                include_names=[
                    "number_of_smes_directly_funded_actual",
                ],
            )
        )
        headers.extend(
            self.build_headers(
                self.metaproject_fields,
                source="meta_project",
                include_names=[
                    "number_of_both_sme_non_sme_not_directly_funded",
                ],
            )
        )
        headers.extend(
            self.build_headers(
                self.project_fields,
                include_names=[
                    "number_of_both_sme_non_sme_not_directly_funded_actual",
                ],
            )
        )
        headers.extend(
            self.build_headers(
                self.project_fields,
                include_names=[
                    "number_of_production_lines_assisted",
                    "number_of_production_lines_assisted_actual",
                    "ad_hoc_pcr",
                    "pcr_waived",
                    "total_number_of_technicians_trained",
                    "total_number_of_technicians_trained_actual",
                    "number_of_female_technicians_trained",
                    "number_of_female_technicians_trained_actual",
                    "total_number_of_trainers_trained",
                    "total_number_of_trainers_trained_actual",
                    "number_of_female_trainers_trained",
                    "number_of_female_trainers_trained_actual",
                    "total_number_of_technicians_certified",
                    "total_number_of_technicians_certified_actual",
                    "number_of_female_technicians_certified",
                    "number_of_female_technicians_certified_actual",
                    "number_of_training_institutions_newly_assisted",
                    "number_of_training_institutions_newly_assisted_actual",
                    "number_of_toolkits_and_equipment_distributed",
                    "number_of_toolkits_and_equipment_distributed_actual",
                    "total_number_of_customs_officers_trained",
                    "total_number_of_customs_officers_trained_actual",
                    "number_of_female_customs_officers_trained",
                    "number_of_female_customs_officers_trained_actual",
                    "total_number_of_nou_personnel_supported",
                    "total_number_of_nou_personnel_supported_actual",
                    "number_of_female_nou_personnel_supported",
                    "number_of_female_nou_personnel_supported_actual",
                    "establishment_of_technician_certification",
                    "establishment_of_technician_certification_actual",
                    "establishment_of_recovery_and_recycling_scheme",
                    "establishment_of_recovery_and_recycling_scheme_actual",
                    "establishment_of_reclamation_scheme",
                    "establishment_of_reclamation_scheme_actual",
                    "upgrade_of_imp_exp_licensing",
                    "upgrade_of_imp_exp_licensing_actual",
                    "upgrade_of_quota_system",
                    "upgrade_of_quota_system_actual",
                    "number_of_bans_on_equipment",
                    "number_of_bans_on_equipment_actual",
                    "number_of_bans_on_substances",
                    "number_of_bans_on_substances_actual",
                    "energy_savings",
                    "energy_savings_actual",
                    "meps_developed_domestic_refrigeration",
                    "meps_developed_domestic_refrigeration_actual",
                    "meps_developed_commercial_refrigeration",
                    "meps_developed_commercial_refrigeration_actual",
                    "meps_developed_residential_ac",
                    "meps_developed_residential_ac_actual",
                    "meps_developed_commercial_ac",
                    "meps_developed_commercial_ac_actual",
                    "capacity_building_programmes",
                    "capacity_building_programmes_actual",
                    "ee_demonstration_project",
                    "ee_demonstration_project_actual",
                    "end_users",
                    "end_users_actual",
                    "quantity_controlled_substances_destroyed_mt",
                    "quantity_controlled_substances_destroyed_mt_actual",
                    "quantity_controlled_substances_destroyed_co2_eq_t",
                    "quantity_controlled_substances_destroyed_co2_eq_t_actual",
                    "quantity_hfc_23_by_product_generated",
                    "quantity_hfc_23_by_product_generated_actual",
                    "hfc_23_by_product_generation_rate",
                    "hfc_23_by_product_generation_rate_actual",
                    "quantity_hfc_23_by_product_destroyed",
                    "quantity_hfc_23_by_product_destroyed_actual",
                    "quantity_hfc_23_by_product_emitted",
                    "quantity_hfc_23_by_product_emitted_actual",
                    "destruction_technology",
                    "production_control_type",
                ],
            )
        )

        headers.extend(
            self.build_headers(
                self.metaproject_fields,
                source="meta_project",
                include_names=[
                    "cost_effectiveness_kg",
                ],
                title_overrides={
                    "cost_effectiveness_kg": "Cost effectiveness (US $/kg) (MYA)"
                },
            )
        )

        headers.extend(
            self.build_headers(
                self.project_fields,
                include_names=[
                    "cost_effectiveness_actual",
                    "cost_effectiveness_co2",
                    "cost_effectiveness_co2_actual",
                ],
            )
        )

        super().__init__(sheet, headers)

    def _get_extended_date(self, project):
        meta_project = project.meta_project

        mp_date = tz_naive(meta_project.end_date if meta_project else None)
        p_date = tz_naive(project.final_version.project_end_date)

        if meta_project and meta_project.type == MetaProject.MetaProjectType.IND:
            return p_date

        mya_type_revised_date = self.mya_type_revised_completion_dates.get(
            (project.meta_project_id, project.project_type_id)
        )
        if mya_type_revised_date:
            return mya_type_revised_date

        if not mp_date:
            return p_date

        if not p_date:
            return mp_date

        if mp_date > p_date:
            return mp_date

        return p_date

    def _get_substance(self, project):
        for ods_odp in project.ods_odp.all():
            substance_type = self._substance_type_from_ods_odp(ods_odp)
            if substance_type:
                return substance_type

        legacy_sector = project.sector_legacy
        if not legacy_sector and project.legacy_code:
            parts = project.legacy_code.split("/")
            legacy_sector = parts[1] if len(parts) > 1 else None

        return (
            self._substance_type_from_legacy_sector(legacy_sector)
            or project.substance_type
        )

    def _substance_type_from_ods_odp(self, ods_odp):
        if ods_odp.ods_substance:
            return self._substance_type_from_substance(ods_odp.ods_substance)
        if ods_odp.ods_display_name:
            substance = Substance.objects.find_by_name(ods_odp.ods_display_name)
            return self._substance_type_from_substance(substance)
        return None

    @staticmethod
    def _substance_type_from_substance(substance):
        if not substance or not substance.group:
            return None
        category = SUBSTANCE_GROUP_ID_TO_CATEGORY.get(substance.group.group_id)
        return ProjectsInventoryReportWriter._substance_type_from_category(category)

    @staticmethod
    def _substance_type_from_legacy_sector(legacy_sector):
        if legacy_sector == "FUM":
            return SubstancesType.METBR.value
        if legacy_sector == "HAL":
            return SubstancesType.HALON.value
        return None

    @staticmethod
    def _substance_type_from_category(category):
        if category == "MBR":
            return SubstancesType.METBR.value
        return category

    @staticmethod
    def _get_latest_apr(project):
        aprs = getattr(project, "prefetched_endorsed_aprs", None)
        return next(iter(aprs), None) if aprs else None

    @staticmethod
    def _apr_phase_out_total(apr, consumption_field, production_field):
        if apr is None:
            return None
        consumption = getattr(apr, consumption_field, None)
        production = getattr(apr, production_field, None)
        if consumption is None and production is None:
            return None
        return (consumption or 0) + (production or 0)

    @staticmethod
    def build_version_map(projects):
        version_map = {}
        for project in projects:
            version_map[(project.id, project.version)] = project
            for archived_project in project.archive_projects.all():
                version_map[(project.id, archived_project.version)] = archived_project
        return version_map

    @staticmethod
    def build_mya_type_revised_completion_dates(projects):
        result = {}
        for project in projects:
            if (
                project.category != Project.Category.MYA
                or not project.meta_project_id
                or not project.project_type_id
                or not project.date_comp_revised
            ):
                continue

            key = (project.meta_project_id, project.project_type_id)
            current = result.get(key)
            if current is None or project.date_comp_revised > current:
                result[key] = project.date_comp_revised

        return result

    def write(self, data):
        self.set_dimensions()
        self.sheet.freeze_panes = f"B{self.header_row_end_idx + 1}"
        self.write_headers()
        self.write_data(data)

    def write_headers(self):
        header_row = []
        for header in self.headers.values():
            name = header.get("headerName") or header.get("display_name")
            comment = name if header.get("type") == "date" else None
            header_row.append(self._make_header_cell(name, comment=comment))
        self.sheet.append(header_row)

    def write_data(self, data):
        for project in data:
            self.sheet.append(
                [
                    self._make_record_cell(project, header)
                    for header in self.headers.values()
                ]
            )

    def set_dimensions(self):
        for header in self.headers.values():
            self.sheet.column_dimensions[header["column_letter"]].width = header.get(
                "column_width", self.COLUMN_WIDTH
            )

    def get_cell_value(self, project, header):
        header_type = header.get("type")
        if method := header.get("method"):
            value = method(project, header)
        else:
            value = getattr(project, header["id"], None)

        if header_type == "number":
            return float(value or 0) or None
        if header_type == "int":
            return int(value or 0) or None
        if header_type == "bool":
            return "Yes" if value else "No"
        return value or ""

    def _make_record_cell(self, project, header):
        value = self.get_cell_value(project, header)

        if value is None:
            return value

        cell_format = header.get("cell_format")
        align = header.get("align")

        if not cell_format and align != "right":
            return value

        cell = WriteOnlyCell(self.sheet, value=value)
        if cell_format:
            cell.number_format = cell_format
        elif align == "right":
            cell.number_format = "###,###,##0.00#############"
        return cell

    def _make_header_cell(self, value, comment=None):
        cell = WriteOnlyCell(self.sheet, value=value)
        cell.font = Font(name=DEFAULT_FONT.name, bold=True, color=None)
        cell.border = Border(
            left=Side(style="thin"),
            right=Side(style="thin"),
            top=Side(style="thin"),
            bottom=Side(style="thin"),
        )
        cell.alignment = Alignment(
            horizontal="center", vertical="center", wrap_text=True
        )
        cell.fill = PatternFill(
            start_color="CCCCCC", end_color="CCCCCC", fill_type="solid"
        )
        if comment:
            cell.comment = Comment(comment, "")
        return cell

    def get_base_headers(self):
        return [
            {"id": "id", "headerName": "id", "method": lambda project, _: project.id},
            {
                "id": "country",
                "headerName": "Country",
                "method": partial(get_value_fk, None),
            },
            {
                "id": "metacode",
                "headerName": "Meta Code",
                "method": lambda project, _: project.metacode,
            },
            {
                "id": "code",
                "headerName": "Code",
                "column_width": self.COLUMN_WIDTH * 2,
                "method": lambda project, _: project.code,
            },
            {
                "id": "code_legacy",
                "headerName": "Legacy Code",
                "column_width": self.COLUMN_WIDTH * 2,
                "method": lambda project, _: project.legacy_code,
            },
            {
                "id": "project_category",
                "headerName": "Category",
                "method": lambda project, _: {
                    "Individual": "IND",
                    "Multi-year agreement": "MYA",
                }.get(project.category, project.category),
            },
            {
                "id": "agency",
                "headerName": "Agency",
                "method": partial(get_value_fk, None),
            },
            {
                "id": "lead_agency",
                "headerName": "Lead Agency",
                "method": partial(get_value_fk, None),
            },
            {
                "id": "status",
                "headerName": "Status",
                "method": partial(get_value_fk, None, attr_name="code"),
            },
            {
                "id": "cluster",
                "headerName": "Cluster",
                "column_width": self.COLUMN_WIDTH * 2,
                "method": partial(get_value_fk, None),
            },
            {
                "id": "project_type",
                "headerName": "Type",
                "method": partial(get_value_fk, None, attr_name="code"),
            },
            {
                "id": "sector",
                "headerName": "Sector",
                "column_width": self.COLUMN_WIDTH * 1.5,
                "method": partial(get_value_fk, None),
            },
            {
                "id": "sector_legacy",
                "headerName": "Sector Legacy",
                "method": lambda project, _: project.sector_legacy,
            },
            {
                "id": "subsectors_list",
                "headerName": "Subsector",
                "column_width": self.COLUMN_WIDTH * 1.5,
                "method": lambda project, _: ", ".join(
                    subsector.name for subsector in project.subsectors.all()
                ),
            },
            {
                "id": "subsector_legacy",
                "headerName": "Subsector Legacy",
                "method": lambda project, _: project.subsector_legacy,
            },
            {
                "id": "title",
                "headerName": "Project Title",
                "column_width": self.COLUMN_WIDTH * 5,
                "method": lambda project, _: project.title,
            },
            {
                "id": "description",
                "headerName": "Project Description",
                "column_width": self.COLUMN_WIDTH * 5,
                "method": lambda project, _: project.description,
            },
            {
                "id": "excom_provision",
                "headerName": "ExCom Provision",
                "column_width": self.COLUMN_WIDTH * 5,
                "method": lambda project, _: project.excom_provision,
            },
            {
                "id": "products_manufactured",
                "headerName": "Product manufactured",
                "column_width": self.COLUMN_WIDTH * 3,
                "method": lambda project, _: project.products_manufactured,
            },
            {
                "id": "tranche",
                "headerName": "Tranche number",
                "method": lambda project, _: project.tranche,
            },
            {
                "id": "funding_window",
                "headerName": "Funding window",
                "method": lambda project, _: (
                    getattr(project.funding_window.decision, "number", "")
                    if project.funding_window
                    else ""
                ),
            },
            {
                "id": "production",
                "headerName": "Production",
                "type": "bool",
                "method": lambda project, _: project.production,
            },
            {
                "id": "bp_activity",
                "headerName": "Business plan activity",
                "method": lambda project, _: (
                    project.bp_activity.get_display_internal_id
                    if project.bp_activity
                    else ""
                ),
            },
            {
                "id": "additional_funding",
                "headerName": "Additional funding",
                "type": "bool",
                "method": lambda project, _: project.additional_funding,
            },
        ]

    @staticmethod
    def unpack_field(field):
        return field[0] if isinstance(field, tuple) else field

    @classmethod
    def get_fk_fields(cls, fields):
        return [
            cls.unpack_field(f).name
            for f in fields
            if isinstance(cls.unpack_field(f), ForeignKey)
        ]

    @classmethod
    def get_m2m_fields(cls, fields):
        return [
            cls.unpack_field(f).name
            for f in fields
            if isinstance(cls.unpack_field(f), ManyToManyField)
        ]

    @staticmethod
    def select_fields(
        fields, include_names=None, exclude_names=None, title_overrides=None
    ):
        include_names = include_names or []
        exclude_names = set(exclude_names or [])
        title_overrides = title_overrides or {}

        if include_names and exclude_names:
            raise ValueError(
                "select_fields accepts either include_names or exclude_names, not both"
            )

        result = []
        if include_names:
            fields_by_name = {field.name: field for field in fields}
            for field_name in include_names:
                field = fields_by_name.get(field_name)
                title = title_overrides.get(field.name)
                result.append((field, title) if title else field)
            return result

        for field in fields:
            if exclude_names and field.name in exclude_names:
                continue

            title = title_overrides.get(field.name)
            result.append((field, title) if title else field)
        return result

    @classmethod
    def get_metaproject_fields(cls):
        fields = [
            field
            for field in MetaProject._meta.get_fields()
            if not isinstance(field, ForeignObjectRel)
        ]
        return fields

    @classmethod
    def get_project_fields(cls):
        old_fields_included = [
            "additional_funding",
            "date_comp_revised",
        ]
        exclude_fields = [
            "serial_number_legacy",
            "serial_number",
            "total_fund_transferred",
            "total_psc_transferred",
        ]
        want_order = [
            "sector",
            "subsectors",
        ]

        result = []
        order = []

        for f in Project._meta.get_fields():
            if f.name in exclude_fields:
                continue

            if isinstance(f, ForeignObjectRel):
                continue

            is_old = getattr(f, "help_text", None) == OLD_FIELD_HELP_TEXT
            skip_old = is_old and f.name not in old_fields_included
            if skip_old:
                continue

            result.append(f)
            order.append(f.name)

        for before, after in pairwise(want_order):
            idx_before = order.index(before)
            idx_after = order.index(after)
            order.insert(idx_before + 1, order.pop(idx_after))
            result.insert(idx_before + 1, result.pop(idx_after))
        return result

    # pylint: disable-next=too-many-arguments
    def build_headers(
        self,
        fields,
        source=None,
        include_names=None,
        exclude_names=None,
        title_overrides=None,
        header_overrides=None,
        id_suffix=None,
    ):
        result = []
        fields = self.select_fields(
            fields,
            include_names=include_names,
            exclude_names=exclude_names,
            title_overrides=title_overrides,
        )

        field_names = getattr(self, "project_field_names", {})

        for field_def in fields:
            if isinstance(field_def, tuple):
                field, title = field_def
            else:
                field = field_def
                title = field_names.get(field.name, field.name)

            header = {
                "id": f"{field.name}_{id_suffix}" if id_suffix else field.name,
                "headerName": title,
                "method": get_field_value,
                "source": source,
            }
            if isinstance(field, DateField):
                header["method"] = partial(get_value_date, date_format=None)
            elif isinstance(field, DateTimeField):
                header["method"] = partial(get_value_date, date_format=None)
            if isinstance(field, BooleanField):
                header["method"] = get_value_boolean
            elif isinstance(field, CharField) and field.choices:
                header["method"] = partial(get_choice_value, dict(field.choices))
            elif isinstance(field, JSONField):
                continue
            elif isinstance(field, ForeignKey):
                if field.name == "component":
                    header["method"] = get_value_component_field
                elif field.name == "bp_activity":
                    header["method"] = partial(
                        get_value_fk, field, attr_name="get_display_internal_id"
                    )
                else:
                    header["method"] = partial(get_value_fk, field)
            elif isinstance(field, ManyToManyField):
                header["method"] = partial(get_value_m2m, field)

            if header_overrides:
                header.update(header_overrides.get(field.name, {}))

            result.append(header)
        return result

    def get_version(self, p, version) -> Project | None:
        key = (p.final_version.id, version)
        return self.version_map.get(key)

    def get_trf_or_adj_version(self, p, idx) -> Project | None:
        projects = self.get_all_trf_or_adj_previous_versions(p)

        if len(projects) > idx:
            return projects[idx]

        return None

    def get_all_previous_versions(self, p) -> Iterable[Project]:
        return sorted(self.all_versions.get(p.id, ()), key=lambda p: p.version)

    def get_all_trf_or_adj_previous_versions(self, p: Project) -> list[Project]:
        projects = [p for p in self.get_all_previous_versions(p) if trf_or_adj(p)]

        if trf_or_adj(p):
            projects.append(p)

        return projects

    def _p_fund_approved(self, project):
        if project is None or project.fund_transferred:
            return None

        total_fund = project.total_fund or 0

        if project.version > 3:
            prev_version = self.get_version(project, project.version - 1)
            prev_total_fund = prev_version.total_fund or 0 if prev_version else 0
            return total_fund - prev_total_fund

        return total_fund

    def _p_psc_approved(self, project):
        if project is None or project.psc_transferred:
            return None

        support_cost_psc = project.support_cost_psc or 0

        if project.version > 3:
            prev_version = self.get_version(project, project.version - 1)
            prev_support_cost_psc = (
                prev_version.support_cost_psc or 0 if prev_version else 0
            )
            return support_cost_psc - prev_support_cost_psc

        return support_cost_psc

    def _p_fund_transferred(self, project):
        if project is None:
            return None

        get_value = (
            attrgetter("total_fund")
            if project.adjustment
            else attrgetter("fund_transferred")
        )

        cur_value = get_value(project) or 0

        prev_version = self.get_version(project, project.version - 1)
        prev_value = (get_value(prev_version) or 0) if prev_version else 0

        return cur_value - prev_value

    def _p_psc_transferred(self, project):
        if project is None:
            return None

        get_value = (
            attrgetter("support_cost_psc")
            if project.adjustment
            else attrgetter("psc_transferred")
        )

        cur_value = get_value(project) or 0

        prev_version = self.get_version(project, project.version - 1)
        prev_value = (get_value(prev_version) or 0) if prev_version else 0

        return cur_value - prev_value

    def _p_actual_fund(self, project):
        if project.status.name == "Transferred":
            tf = project.fund_transferred or 0
            result = (project.total_fund or 0) + tf
            return result or 0
        return project.total_fund or 0

    def _p_actual_psc(self, project):
        if project.status.name == "Transferred":
            tpsc = project.psc_transferred or 0
            result = (project.support_cost_psc or 0) + tpsc
            return result
        return project.support_cost_psc or 0

    def calc_total_fund(self, project):
        if project is None:
            return None

        result = None
        if project.status.name == "Transferred":
            if project.version == 3:
                return project.total_fund or 0
            if project.version > 3:
                prev_version = self.get_version(project, project.version - 1)
                if prev_version:
                    tf = project.fund_transferred or 0
                    prev_tf = prev_version.fund_transferred or 0
                    result = ((project.total_fund or 0) + tf) - (
                        (prev_version.total_fund or 0) + prev_tf
                    )
                    return result
            tf = project.fund_transferred or 0
            result = (project.total_fund or 0) + tf
            return result
        if project.version == 3:
            result = project.total_fund or 0
        elif project.version > 3:
            prev_version = self.get_version(project, project.version - 1)
            if prev_version:
                result = (project.total_fund or 0) - (prev_version.total_fund or 0)
        return result

    def calc_support_cost_psc(self, project):
        if project is None:
            return None

        result = None
        if project.status.name == "Transferred":
            if project.version == 3:
                return project.support_cost_psc or 0
            if project.version > 3:
                prev_version = self.get_version(project, project.version - 1)
                if prev_version:
                    tpsc = project.psc_transferred or 0
                    prev_tpsc = prev_version.psc_transferred or 0
                    result = ((project.support_cost_psc or 0) + tpsc) - (
                        (prev_version.support_cost_psc or 0) + prev_tpsc
                    )
                    return result
            tpsc = project.psc_transferred or 0
            result = (project.support_cost_psc or 0) + tpsc
            return result
        if project.version == 3:
            result = project.support_cost_psc or 0
        elif project.version > 3:
            prev_version = self.get_version(project, project.version - 1)
            if prev_version:
                result = (project.support_cost_psc or 0) - (
                    prev_version.support_cost_psc or 0
                )
        return result

    def calc_sum_total_fund_transferred(self, project):
        prev_versions = self.get_all_trf_or_adj_previous_versions(project)
        candidate_values = [(self._p_fund_transferred(p) or 0) for p in prev_versions]
        return sum(candidate_values)

    def calc_sum_total_psc_transferred(self, project):
        prev_versions = self.get_all_trf_or_adj_previous_versions(project)
        candidate_values = [(self._p_psc_transferred(p) or 0) for p in prev_versions]
        return sum(candidate_values)

    def calc_sum_interest(self, project):
        prev_versions = self.get_all_previous_versions(project) + [project]
        candidate_values = [p.interest or 0 for p in prev_versions]
        return sum(candidate_values)

    def _p_meeting_approved(self, project):
        if project is None:
            return None

        if project.version == 3:
            return project.meeting.number if project.meeting else None

        return project.post_excom_meeting.number if project.post_excom_meeting else None

    def _p_adjustment_meeting(self, project):
        if project is None:
            return None

        meeting = project.post_excom_meeting or project.transfer_meeting

        if meeting:
            return meeting.number

        return None

    def funding_headers(self, version, idx):
        if version < MIN_PROJECT_VERSION:
            return []

        return [
            {
                "id": f"funds_approved_v{version}",
                "headerName": f"Funds Approved {idx}",
                "method": lambda project, _: (
                    self._p_fund_approved(self.get_version(project, version))
                    if not_trf_or_adj(self.get_version(project, version))
                    else None
                ),
                "type": "number",
                "align": "right",
                "cell_format": "#,##0;-#,##0;;@",
            },
            {
                "id": f"psc_v{version}",
                "headerName": f"Support Costs Approved {idx}",
                "method": lambda project, _: (
                    self._p_psc_approved(self.get_version(project, version))
                    if not_trf_or_adj(self.get_version(project, version))
                    else None
                ),
                "type": "number",
                "align": "right",
                "cell_format": "#,##0;-#,##0;;@",
            },
            {
                "id": f"post_excom_meeting_v{version}",
                "headerName": f"Meeting Approved {idx}",
                "method": lambda project, _: (
                    self._p_meeting_approved(self.get_version(project, version))
                    if not_trf_or_adj(self.get_version(project, version))
                    else None
                ),
            },
            {
                "id": f"date_approved_v{version}",
                "headerName": f"Date Approved {idx}",
                "type": "date",
                "cell_format": "MMM-YYYY",
                "method": lambda project, _: (
                    self.get_version(project, version).date_approved
                    if not_trf_or_adj(self.get_version(project, version))
                    else None
                ),
            },
        ]

    def adjustment_headers(self, v_idx, idx):
        return [
            {
                "id": f"funds_adjustment_v{idx}",
                "headerName": f"Fund Adjustments {idx}",
                "method": lambda project, _: self._p_fund_transferred(
                    self.get_trf_or_adj_version(project, v_idx)
                ),
                "type": "number",
                "align": "right",
                "cell_format": "#,##0;-#,##0;;@",
            },
            {
                "id": f"psc_adjustment_v{idx}",
                "headerName": f"Support Cost Adjustments {idx}",
                "method": lambda project, _: self._p_psc_transferred(
                    self.get_trf_or_adj_version(project, v_idx)
                ),
                "type": "number",
                "align": "right",
                "cell_format": "#,##0;-#,##0;;@",
            },
            {
                "id": f"adjustment_meeting_v{idx}",
                "headerName": f"Adjustments Meeting {idx}",
                "method": lambda project, _: self._p_adjustment_meeting(
                    self.get_trf_or_adj_version(project, v_idx)
                ),
            },
            {
                "id": f"adjustment_date_v{idx}",
                "headerName": f"Adjustments Date {idx}",
                "type": "date",
                "cell_format": "MMM-YYYY",
                "method": lambda project, _: (
                    self.get_trf_or_adj_version(project, v_idx).date_approved
                    if self.get_trf_or_adj_version(project, v_idx)
                    else None
                ),
            },
        ]

    def ods_odp_headers(self, idx):
        return [
            {
                "id": f"ods_odp__ods_substance_{idx}",
                "headerName": f"ODS Name {idx}",
                "method": lambda project, _: self.ods_odp_at_idx(
                    project,
                    idx - 1,
                    lambda ods_odp: ods_odp.ods_display_name,
                ),
            },
            {
                "id": f"ods_odp__odp_{idx}",
                "headerName": f"ODP {idx}",
                "cell_format": "#,##0.0;-#,##0.0;;@",
                "method": lambda project, _: self.ods_odp_at_idx(
                    project, idx - 1, lambda ods_odp: ods_odp.odp
                ),
            },
            {
                "id": f"ods_odp__phase_out_mt_{idx}",
                "headerName": f"MT {idx}",
                "cell_format": "#,##0.0;-#,##0.0;;@",
                "method": lambda project, _: self.ods_odp_at_idx(
                    project, idx - 1, lambda ods_odp: ods_odp.phase_out_mt
                ),
            },
            {
                "id": f"ods_odp__co2_mt_{idx}",
                "headerName": f"CO2-eq {idx}",
                "cell_format": "#,##0;-#,##0;;@",
                "method": lambda project, _: self.ods_odp_at_idx(
                    project, idx - 1, lambda ods_odp: ods_odp.co2_mt
                ),
            },
            {
                "id": f"ods_odp__ods_replacement_text_{idx}",
                "headerName": f"ODS Replacement {idx}",
                "method": lambda project, _: self.ods_odp_at_idx(
                    project, idx - 1, lambda ods_odp: ods_odp.ods_replacement_text
                ),
            },
        ]

    def ods_odp_at_idx(self, project, idx, func):
        ods_odps: list[ProjectOdsOdp] = list(project.ods_odp.all())

        if len(ods_odps) > idx:
            ods_odp = ods_odps[idx]
            return func(ods_odp)

        return None
