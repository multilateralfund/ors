from typing import List

from rest_framework import serializers

from core.models import Project


def compute_fields():
    return {
        "hcfc": "",
        "hfc": "",
        "project": "",
        "support": "",
        "total": "",
    }


class ApprovalSummaryBilateralCooperationSerializer(serializers.BaseSerializer):
    instance: List[Project]

    def to_representation(self, projects: List[Project]):
        return {
            "phase_out_plan": compute_fields(),
            "destruction": compute_fields(),
            "hfc_phase_down": compute_fields(),
            "energy_efficiency": compute_fields(),
            "total": compute_fields(),
        }


class ApprovalSummaryInvestmentProjectSerializer(serializers.BaseSerializer):
    instance: List[Project]

    def to_representation(self, projects: List[Project]):
        return {
            "phase_out_plan": compute_fields(),
            "hfc_phase_down": compute_fields(),
            "energy_efficiency": compute_fields(),
            "total": compute_fields(),
        }


class ApprovalSummaryWorkProgrammeAmendmentSerializer(serializers.BaseSerializer):
    instance: List[Project]

    def to_representation(self, projects: List[Project]):
        return {
            "phase_out_plan": compute_fields(),
            "destruction": compute_fields(),
            "several": compute_fields(),
            "hfc_phase_down": compute_fields(),
            "energy_efficiency": compute_fields(),
            "total": compute_fields(),
        }


class ApprovalSummaryByPartiesAndImplementingAgenciesSerializer(
    serializers.BaseSerializer
):
    instance: List[Project]

    def to_representation(self, projects: List[Project]):
        placeholder = {
            "name": "Placeholder agency",
            "type": "agency",
            "value": compute_fields(),
        }
        return [
            placeholder,
        ]


class ApprovalSummarySerializer(serializers.BaseSerializer):
    instance: List[Project]

    def to_representation(self, projects: List[Project]):
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
            "bilateral_cooperation": bilateral_cooperation,
            "investment_project": investment_project,
            "work_programme_amendment": work_programme_amendment,
            "summary_by_parties_and_implementing_agencies": summary_by_parties_and_implementing_agencies,
        }
