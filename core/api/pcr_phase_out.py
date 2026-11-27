"""
The ODP phase-out and HFC phase-down of a PCR, computed from its approved projects
when the PCR is created. They can't be changed in the PCR.

- approved: the sum of the ODS/ODP entries of the approved version (V3) of the
  projects
- actual: the sum of the consumption and production phase-out reported in the
  latest endorsed APR of the projects
"""

from decimal import Decimal

from django.db.models import Prefetch

from core.api.export.projects_inventory_report import (
    project_apr_co2_actual,
    project_apr_odp_actual,
)
from core.models.annual_project_report import AnnualProjectReport

PHASE_OUT_FIELDS = [
    "phase_out_ods_approved",
    "phase_out_ods_actual",
    "phase_out_co2_eq_t_approved",
    "phase_out_co2_eq_t_actual",
]


def _sum(values):
    """The sum of the values, None if there is no value"""
    values = [Decimal(str(value)) for value in values if value is not None]
    return sum(values) if values else None


def _approved_projects(meta_project):
    return (
        meta_project.projects.for_pcr()
        .filter(submission_status__name="Approved")
        .prefetch_related(
            Prefetch(
                "annual_reports",
                queryset=AnnualProjectReport.objects.filter(
                    report__progress_report__endorsed=True
                )
                .select_related("report__progress_report")
                .order_by("-report__progress_report__year"),
                to_attr="prefetched_endorsed_aprs",
            )
        )
        .order_by("id")
    )


def get_pcr_phase_out(meta_project):
    """The phase-out values of a new PCR of the meta project, by PCR field name"""
    ods_odp_entries = []
    odp_actual = []
    co2_actual = []
    for project in _approved_projects(meta_project):
        version_3 = project.get_version(3)
        if version_3 is not None:
            ods_odp_entries.extend(version_3.ods_odp.all())
        odp_actual.append(project_apr_odp_actual(project))
        co2_actual.append(project_apr_co2_actual(project))
    return {
        "phase_out_ods_approved": _sum(entry.odp for entry in ods_odp_entries),
        "phase_out_ods_actual": _sum(odp_actual),
        "phase_out_co2_eq_t_approved": _sum(entry.co2_mt for entry in ods_odp_entries),
        "phase_out_co2_eq_t_actual": _sum(co2_actual),
    }
