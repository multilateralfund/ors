from rest_framework import serializers

from core.models.project_enterprise import ProjectEnterprise, ProjectEnterpriseOdsOdp


class ProjectEnterpriseOdsOdpSerializer(serializers.ModelSerializer):

    class Meta:
        model = ProjectEnterpriseOdsOdp
        fields = [
            "id",
            "enterprise",
            "ods_substance",
            "ods_blend",
            "phase_out_mt",
            "ods_replacement",
            "ods_replacement_phase_in",
        ]


class ProjectEnterpriseSerializer(serializers.ModelSerializer):

    ods_odp = ProjectEnterpriseOdsOdpSerializer(many=True, read_only=True)

    class Meta:
        model = ProjectEnterprise
        fields = [
            "id",
            "application",
            "capital_cost_approved",
            "code",
            "cost_effectiveness_approved",
            "enterprise",
            "export_to_non_a5",
            "ods_odp",
            "funds_approved",
            "funds_disbursed",
            "project",
            "location",
            "local_ownership",
            "operating_cost_approved",
            "remarks",
            "status",
        ]
