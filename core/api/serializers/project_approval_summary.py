from django.db.models import QuerySet, Sum, Q, F, Count
from django.db.models.functions import Coalesce
from rest_framework import serializers

from core.models import Project


def compute_fields(projects: QuerySet[Project]):
    return projects.aggregate(
        projects_count=Count("id"),
        hcfc=Coalesce(Sum("ods_odp__odp"), 0.0),
        hfc=Coalesce(Sum("ods_odp__co2_mt"), 0.0),
        project_funding=Coalesce(Sum("total_fund"), 0.0),
        project_support_cost=Coalesce(Sum("support_cost_psc"), 0.0),
        total=Coalesce(Sum(F("total_fund") + F("support_cost_psc")), 0.0),
    )


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
        return projects.values(
            agency_name=F("agency__name"), agency_type=F("agency__agency_type")
        ).annotate(
            projects_count=Count("id", distinct=True),
            hcfc=Sum("ods_odp__odp"),
            hfc=Sum("ods_odp__co2_mt"),
            project_funding=Sum("total_fund"),
            project_support_cost=Sum("support_cost_psc"),
            total=Sum(F("total_fund") + F("support_cost_psc")),
        )


class ApprovalSummarySerializer(serializers.BaseSerializer):
    instance: QuerySet[Project]

    def to_representation(self, projects: QuerySet[Project]):
        bilateral_cooperation = ApprovalSummaryBilateralCooperationSerializer(
            projects
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
                    status_project=F("status__name"),
                ),
                "count": projects.count(),
            },
            "bilateral_cooperation": bilateral_cooperation,
            "investment_project": investment_project,
            "work_programme_amendment": work_programme_amendment,
            "summary_by_parties_and_implementing_agencies": summary_by_parties_and_implementing_agencies,
            "grand_total": compute_fields(projects),
        }
