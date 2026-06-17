# pylint:disable=abstract-method,arguments-renamed

from decimal import Decimal
from decimal import ROUND_HALF_UP

from django.db.models import Count
from django.db.models import F
from django.db.models import Q
from django.db.models import QuerySet
from django.db.models import Sum
from django.db.models.functions import Coalesce
from rest_framework import serializers

from core.models import Project


def _round_decimal(value, places):
    quantize_value = Decimal("1").scaleb(-places)
    return Decimal(str(value)).quantize(quantize_value, rounding=ROUND_HALF_UP)


def _format_summary_values(values):
    if "hcfc" in values:
        values["hcfc"] = float(_round_decimal(values.get("hcfc") or 0, 1))

    if "hfc" in values:
        scaled_hfc = (values.get("hfc") or 0) / 1000
        values["hfc"] = int(_round_decimal(scaled_hfc, 0))

    return values


def compute_fields(projects: QuerySet[Project]):
    project_values = projects.aggregate(
        projects_count=Count("id"),
        project_funding=Coalesce(Sum("total_fund"), 0.0),
        project_support_cost=Coalesce(Sum("support_cost_psc"), 0.0),
    )
    ods_values = projects.aggregate(
        hcfc=Coalesce(Sum("ods_odp__odp"), 0.0),
        hfc=Coalesce(Sum("ods_odp__co2_mt"), 0.0),
    )
    values = {**project_values, **ods_values}
    values["total"] = (values["project_funding"] or 0) + (
        values["project_support_cost"] or 0
    )

    return _format_summary_values(values)


def grand_total(values):
    return {
        "project_funding": sum(v["project_funding"] for v in values),
        "project_support_cost": sum(v["project_support_cost"] for v in values),
        "total": sum(v["total"] for v in values),
    }


class ApprovalSummaryBilateralCooperationSerializer(serializers.BaseSerializer):
    instance: QuerySet[Project]

    def to_representation(self, projects: QuerySet[Project]):

        result = {
            "phase_out_plan": compute_fields(
                projects.filter(cluster__code__startswith="HPMP")
            ),
            "destruction": compute_fields(projects.filter(cluster__code="DISP")),
            "hfc_phase_down": compute_fields(
                projects.filter(cluster__code__startswith="KIP")
            ),
            "energy_efficiency": compute_fields(projects.filter(cluster__code="EE")),
        }

        result["total"] = grand_total(result.values())
        return result


class ApprovalSummaryInvestmentProjectSerializer(serializers.BaseSerializer):
    instance: QuerySet[Project]

    def to_representation(self, projects: QuerySet[Project]):
        result = {
            "phase_out_plan": compute_fields(
                projects.filter(
                    project_type__code="INV",
                    cluster__code__startswith="HPMP",
                )
            ),
            "hfc_phase_down": compute_fields(
                projects.filter(
                    project_type__code="INV",
                    cluster__code__startswith="KIP",
                )
            ),
            "energy_efficiency": compute_fields(
                projects.filter(
                    project_type__code="INV",
                    cluster__code="EE",
                )
            ),
        }

        result["total"] = grand_total(result.values())
        return result


class ApprovalSummaryWorkProgrammeAmendmentSerializer(serializers.BaseSerializer):
    instance: QuerySet[Project]

    def to_representation(self, projects: QuerySet[Project]):
        non_inv_projects = projects.exclude(project_type__code="INV")
        result = {
            "phase_out_plan": compute_fields(
                non_inv_projects.filter(cluster__code__startswith="HPMP")
            ),
            "destruction": compute_fields(
                non_inv_projects.filter(cluster__code="DISP")
            ),
            "hfc_phase_down": compute_fields(
                non_inv_projects.filter(cluster__code__startswith="KIP")
            ),
            "energy_efficiency": compute_fields(
                non_inv_projects.filter(cluster__code="EE")
            ),
            "several": compute_fields(
                non_inv_projects.exclude(
                    Q(project_type__code="INV")
                    | Q(cluster__code="DISP")
                    | Q(cluster__code="EE")
                    | Q(cluster__code__startswith="HPMP")
                    | Q(cluster__code__startswith="KIP")
                )
            ),
        }

        result["total"] = grand_total(result.values())
        return result


class ApprovalSummaryByPartiesAndImplementingAgenciesSerializer(
    serializers.BaseSerializer
):
    instance: QuerySet[Project]

    def to_representation(self, projects: QuerySet[Project]):
        agency_annotations = {
            "agency_name": F("agency__name"),
            "agency_type": F("agency__agency_type"),
        }
        project_values = projects.values(**agency_annotations).annotate(
            projects_count=Count("id"),
            project_funding=Sum("total_fund"),
            project_support_cost=Sum("support_cost_psc"),
        )
        ods_values = projects.values(**agency_annotations).annotate(
            hcfc=Sum("ods_odp__odp"),
            hfc=Sum("ods_odp__co2_mt"),
        )

        def agency_key(row):
            return row["agency_name"], row["agency_type"]

        ods_by_agency = {
            agency_key(row): {"hcfc": row["hcfc"], "hfc": row["hfc"]}
            for row in ods_values
        }

        result = []
        for agency in project_values:
            project_funding = agency["project_funding"] or 0
            project_support_cost = agency["project_support_cost"] or 0
            summary = {
                **agency,
                **ods_by_agency.get(agency_key(agency), {}),
                "total": project_funding + project_support_cost,
            }
            result.append(_format_summary_values(summary))

        return result


class ApprovalSummarySerializer(serializers.BaseSerializer):
    instance: QuerySet[Project]

    def to_representation(self, projects: QuerySet[Project]):
        bilateral_cooperation = ApprovalSummaryBilateralCooperationSerializer(
            projects.filter(agency__agency_type="National")
        ).data
        investment_project = ApprovalSummaryInvestmentProjectSerializer(projects).data
        work_programme_amendment = ApprovalSummaryWorkProgrammeAmendmentSerializer(
            projects
        ).data
        summary_by_parties_and_implementing_agencies = (
            ApprovalSummaryByPartiesAndImplementingAgenciesSerializer(projects).data
        )
        return {
            "projects": {
                "data": projects.values(
                    "id",
                    "code",
                    "version",
                    status_submission=F("submission_status__name"),
                    project_cluster=F("cluster__name"),
                    type=F("project_type__name"),
                    project_sector=F("sector__name"),
                ),
                "count": projects.count(),
            },
            "bilateral_cooperation": bilateral_cooperation,
            "investment_project": investment_project,
            "work_programme_amendment": work_programme_amendment,
            "summary_by_parties_and_implementing_agencies": summary_by_parties_and_implementing_agencies,
            "grand_total": compute_fields(projects),
        }
