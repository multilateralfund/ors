# pylint: disable=too-many-lines
from functools import partial
from itertools import pairwise

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
from core.models.project import OLD_FIELD_HELP_TEXT
from core.models.project_metadata import ProjectField


MIN_PROJECT_VERSION = 3


def trf_or_adj(project):
    return project.status.name == "Transferred" or project.adjustment is True


def not_trf_or_adj(project):
    return project.status.name != "Transferred" and project.adjustment is False


# pylint: disable-next=too-many-public-methods,too-many-lines
class ProjectsInventoryReportWriter(BaseWriter):
    ROW_HEIGHT = 35
    COLUMN_WIDTH = 20
    header_row_start_idx = 1
    METAPROJECT_FIELD_TITLES = {
        "end_date": "End date (MYA)",
    }

    def __init__(
        self,
        sheet,
        projects,
        project_fields=None,
        metaproject_fields=None,
    ):
        self.version_map = self.build_version_map(projects)
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
            headers.extend(self.funding_headers(i + 3))

        for i in range(7):
            headers.extend(self.adjustment_headers(i + 3))

        headers.extend(
            [
                {
                    "id": "fund_transferred",
                    "headerName": "Fund transferred",
                    "method": lambda project, _: self.calc_sum_total_fund(project),
                },
                {
                    "id": "psc_transferred",
                    "headerName": "PSC transferred",
                    "method": lambda project, _: self.calc_sum_support_cost_psc(
                        project
                    ),
                },
                {
                    "id": "actual_fund",
                    "headerName": "Actual funds",
                    "method": lambda project, _: project.total_fund or 0,
                },
                {
                    "id": "actual_psc",
                    "headerName": "Actual PSC",
                    "method": lambda project, _: project.support_cost_psc or 0,
                },
                {
                    "id": "apr_funds_disbursed",
                    "headerName": "Total Funds Disbursed",
                    "align": "right",
                    "method": lambda project, _: getattr(
                        self._get_latest_apr(project), "funds_disbursed", None
                    ),
                },
                {
                    "id": "apr_support_cost_disbursed",
                    "headerName": "Total Support Costs Disbursed",
                    "align": "right",
                    "method": lambda project, _: getattr(
                        self._get_latest_apr(project), "support_cost_disbursed", None
                    ),
                },
                {
                    "id": "interest",
                    "headerName": "Interest",
                    "method": lambda project, _: self.calc_sum_interest(project),
                },
            ]
        )

        headers.extend(
            self.build_headers(
                self.project_fields,
                include_names=[
                    "substance_type",
                ],
                title_overrides={
                    "substance_type": "Substance type",
                },
            )
        )

        headers.extend(
            self.build_headers(
                self.project_fields,
                include_names=[
                    "total_phase_out_odp_tonnes",
                    "total_phase_out_metric_tonnes",
                    "total_phase_out_co2_tonnes",
                ],
                id_suffix="ods_total",
            )
        )

        headers.extend(
            [
                {
                    "id": "apr_odp_actual",
                    "headerName": "Total ODP Actual",
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
                    "align": "right",
                    "method": lambda project, _: self._apr_phase_out_total(
                        self._get_latest_apr(project),
                        "consumption_phased_out_co2",
                        "production_phased_out_co2",
                    ),
                },
            ]
        )

        headers.extend(
            self.build_headers(
                self.project_fields,
                include_names=[
                    "project_duration",
                    "date_completion",
                ],
            )
        )

        headers.extend(self.ods_odp_headers(1))
        headers.extend(self.ods_odp_headers(2))
        headers.extend(self.ods_odp_headers(3))
        headers.extend(self.ods_odp_headers(4))

        headers.append(
            {
                "id": "extended_date_completion",
                "headerName": "Extended date of completion",
                "type": "date",
                "method": lambda project, _: self.get_extended_date_of_completion(
                    project
                ),
            },
        )

        headers.extend(
            self.build_headers(
                self.metaproject_fields,
                source="meta_project",
                include_names=["end_date"],
                title_overrides=self.METAPROJECT_FIELD_TITLES,
            )
        )

        headers.extend(
            [
                {
                    "id": "apr_date_completion_revised",
                    "headerName": "Date completion revised",
                    "type": "date",
                    "method": lambda project, _: getattr(
                        self._get_latest_apr(project), "date_planned_completion", None
                    ),
                },
                {
                    "id": "apr_date_completed",
                    "headerName": "Date completed",
                    "type": "date",
                    "method": lambda project, _: getattr(
                        self._get_latest_apr(project), "date_actual_completion", None
                    ),
                },
                {
                    "id": "apr_date_financially_completed",
                    "headerName": "Date financially completed",
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
                    "transfer_meeting": "Transfer meeting",
                    "transfer_decision": "Transfer decision",
                },
            )
        )

        headers.append(
            {
                "id": "transferred_from",
                "headerName": "Transferred from",
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
                self.metaproject_fields,
                source="meta_project",
                include_names=[
                    "number_of_production_lines_assisted",
                ],
            )
        )
        headers.extend(
            self.build_headers(
                self.project_fields,
                include_names=[
                    "number_of_production_lines_assisted_actual",
                    "ad_hoc_pcr",
                    "pcr_waived",
                    "total_phase_out_metric_tonnes",
                    "total_phase_out_odp_tonnes",
                    "total_phase_out_co2_tonnes",
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
                    "cost_effectiveness",
                ],
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
                    self.get_cell_value(project, header)
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
            return float(value or 0)
        if header_type == "int":
            return int(value or 0)
        if header_type == "bool":
            return "Yes" if value else "No"
        return value or ""

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
                "headerName": "Metacode",
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
                "headerName": "Legacy code",
                "column_width": self.COLUMN_WIDTH * 2,
                "method": lambda project, _: project.legacy_code,
            },
            {
                "id": "agency",
                "headerName": "Agency",
                "method": partial(get_value_fk, None),
            },
            {
                "id": "lead_agency",
                "headerName": "Lead agency",
                "method": partial(get_value_fk, None),
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
                "headerName": "Sector legacy",
                "method": lambda project, _: project.sector_legacy,
            },
            {
                "id": "subsectors_list",
                "headerName": "Sub-sector(s)",
                "column_width": self.COLUMN_WIDTH * 1.5,
                "method": lambda project, _: ", ".join(
                    subsector.name for subsector in project.subsectors.all()
                ),
            },
            {
                "id": "subsector_legacy",
                "headerName": "Subsector legacy",
                "method": lambda project, _: project.subsector_legacy,
            },
            {
                "id": "title",
                "headerName": "Title",
                "column_width": self.COLUMN_WIDTH * 5,
                "method": lambda project, _: project.title,
            },
            {
                "id": "description",
                "headerName": "Description",
                "column_width": self.COLUMN_WIDTH * 5,
                "method": lambda project, _: project.description,
            },
            {
                "id": "excom_provision",
                "headerName": "Executive Committee provision",
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
                "id": "metaproject_category",
                "headerName": "Category",
                "method": lambda project, _: (
                    project.meta_project.type if project.meta_project else ""
                ),
            },
            {
                "id": "funding_window",
                "headerName": "Funding window",
                "method": lambda project, _: (
                    project.funding_window.meeting.number
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
        include_names = set(include_names or [])
        exclude_names = set(exclude_names or [])
        title_overrides = title_overrides or {}

        if include_names and exclude_names:
            raise ValueError(
                "select_fields accepts either include_names or exclude_names, not both"
            )

        result = []
        for field in fields:
            if include_names and field.name not in include_names:
                continue
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
                header["method"] = get_value_date
            elif isinstance(field, DateTimeField):
                header["method"] = get_value_date
            elif isinstance(field, BooleanField):
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

            result.append(header)
        return result

    def get_version(self, p, version):
        key = (p.final_version.id, version)
        return self.version_map.get(key)

    def get_all_previous_versions(self, p):
        return self.all_versions.get(p.id, ())

    def calc_total_fund(self, project):
        prev_version = (
            self.get_version(project, project.version - 1)
            if project.version > MIN_PROJECT_VERSION
            else None
        )
        if prev_version:
            return (project.total_fund or 0) - (prev_version.total_fund or 0)
        return project.total_fund or 0

    def calc_support_cost_psc(self, project):
        prev_version = (
            self.get_version(project, project.version - 1)
            if project.version > MIN_PROJECT_VERSION
            else None
        )
        if prev_version:
            return (project.support_cost_psc or 0) - (
                prev_version.support_cost_psc or 0
            )
        return project.support_cost_psc or 0

    def calc_sum_total_fund(self, project):
        prev_versions = self.get_all_previous_versions(project)
        candidate_values = [
            (p.total_fund or 0) + (p.fund_transferred or 0)
            for p in prev_versions
            if trf_or_adj(p)
        ]
        return sum(candidate_values)

    def calc_sum_support_cost_psc(self, project):
        prev_versions = self.get_all_previous_versions(project)
        candidate_values = [
            (p.support_cost_psc or 0) + (p.psc_transferred or 0)
            for p in prev_versions
            if trf_or_adj(p)
        ]
        return sum(candidate_values)

    def calc_sum_interest(self, project):
        prev_versions = self.get_all_previous_versions(project)
        candidate_values = [p.interest or 0 for p in prev_versions]
        return sum(candidate_values)

    def get_extended_date_of_completion(self, project):
        v3 = self.get_version(project, 3)
        if v3 and v3.date_completion != project.date_completion:
            return v3.date_completion
        return None

    def funding_headers(self, version):
        if version < MIN_PROJECT_VERSION:
            return []

        idx = version - 2

        return [
            {
                "id": f"funds_approved_v{version}",
                "headerName": f"Project funding meeting {idx}",
                "method": lambda project, _: (
                    self.calc_total_fund(project) if not_trf_or_adj(project) else None
                ),
                "type": "number",
                "align": "right",
            },
            {
                "id": f"psc_v{version}",
                "headerName": f"PSC meeting {idx}",
                "method": lambda project, _: (
                    self.calc_support_cost_psc(project)
                    if not_trf_or_adj(project)
                    else None
                ),
                "type": "number",
                "align": "right",
            },
            {
                "id": f"post_excom_meeting_v{version}",
                "headerName": f"Meeting Approved {idx}",
                "method": lambda project, _: (
                    project.post_excom_meeting.number
                    if not_trf_or_adj(project) and project.post_excom_meeting
                    else None
                ),
            },
            {
                "id": f"date_approved_v{version}",
                "headerName": f"Date Approved {idx}",
                "type": "date",
                "method": lambda project, _: (
                    project.date_approved if not_trf_or_adj(project) else None
                ),
            },
        ]

    def adjustment_headers(self, version):
        if version < MIN_PROJECT_VERSION:
            return []

        idx = version - 2

        return [
            {
                "id": f"funds_adjustment_v{version}",
                "headerName": f"Fund Adjustments {idx}",
                "method": lambda project, _: (
                    self.calc_total_fund(project) if trf_or_adj(project) else None
                ),
                "type": "number",
                "align": "right",
            },
            {
                "id": f"psc_adjustment_v{version}",
                "headerName": f"Support Cost Adjustments {idx}",
                "method": lambda project, _: (
                    self.calc_support_cost_psc(project) if trf_or_adj(project) else None
                ),
                "type": "number",
                "align": "right",
            },
            {
                "id": f"adjustment_meeting_v{version}",
                "headerName": f"Adjustments Meeting {idx}",
                "method": lambda project, _: (
                    project.post_excom_meeting.number
                    if trf_or_adj(project) and project.post_excom_meeting
                    else None
                ),
            },
            {
                "id": f"adjustment_date_v{version}",
                "headerName": f"Adjustments Date {idx}",
                "type": "date",
                "method": lambda project, _: (
                    project.date_approved if trf_or_adj(project) else None
                ),
            },
        ]

    def ods_odp_headers(self, idx):
        return [
            {
                "id": f"ods_odp__ods_substance_{idx}",
                "headerName": f"ODS_Name{idx}",
                "method": lambda project, _: self.ods_odp_at_idx(
                    project,
                    idx - 1,
                    lambda ods_odp: (ods_odp.ods_substance or ods_odp.ods_blend).name,
                ),
            },
            {
                "id": f"ods_odp__odp_{idx}",
                "headerName": f"ODP{idx}",
                "method": lambda project, _: self.ods_odp_at_idx(
                    project, idx - 1, lambda ods_odp: ods_odp.odp
                ),
            },
            {
                "id": f"ods_odp__phase_out_mt_{idx}",
                "headerName": f"MT{idx}",
                "method": lambda project, _: self.ods_odp_at_idx(
                    project, idx - 1, lambda ods_odp: ods_odp.phase_out_mt
                ),
            },
            {
                "id": f"ods_odp__co2_mt_{idx}",
                "headerName": f"CO2-eq{idx}",
                "method": lambda project, _: self.ods_odp_at_idx(
                    project, idx - 1, lambda ods_odp: ods_odp.co2_mt
                ),
            },
        ]

    def ods_odp_at_idx(self, project, idx, func):
        ods_odps: list[ProjectOdsOdp] = list(project.ods_odp.all())

        if len(ods_odps) > idx:
            ods_odp = ods_odps[idx]
            if ods_odp.ods_substance or ods_odp.ods_blend:
                return func(ods_odp)

        return None
