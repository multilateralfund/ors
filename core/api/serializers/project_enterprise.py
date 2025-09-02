from rest_framework import serializers

from core.models.project_enterprise import ProjectEnterprise, ProjectEnterpriseOdsOdp


class ProjectEnterpriseOdsOdpSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    enterprise = serializers.PrimaryKeyRelatedField(
        queryset=ProjectEnterprise.objects.all(), required=False
    )

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

    ods_odp = ProjectEnterpriseOdsOdpSerializer(many=True, required=False)

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

    def create(self, validated_data):
        _ = validated_data.pop("request", None)
        ods_odp_data = validated_data.pop("ods_odp")
        project_enterprise = ProjectEnterprise.objects.create(**validated_data)
        for ods_odp in ods_odp_data:
            ProjectEnterpriseOdsOdp.objects.create(
                enterprise=project_enterprise, **ods_odp
            )
        return project_enterprise

    def update(self, instance, validated_data):
        _ = validated_data.pop("request", None)
        ods_odp_data = validated_data.pop("ods_odp")
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update ODS/ODP entries
        remaining_ids = []
        for ods_odp in ods_odp_data:
            if "id" in ods_odp:
                ods_odp_instance = ProjectEnterpriseOdsOdp.objects.get(id=ods_odp["id"])
                for attr, value in ods_odp.items():
                    setattr(ods_odp_instance, attr, value)
                ods_odp_instance.save()
                remaining_ids.append(ods_odp_instance.id)
            else:
                new_ods_odp = ProjectEnterpriseOdsOdp.objects.create(
                    enterprise=instance, **ods_odp
                )
                remaining_ids.append(new_ods_odp.id)

        # Delete removed ODS/ODP entries
        ProjectEnterpriseOdsOdp.objects.filter(enterprise=instance).exclude(
            id__in=remaining_ids
        ).delete()
        return instance
