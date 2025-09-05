from rest_framework import serializers

from core.models.project_enterprise import (
    Enterprise,
    ProjectEnterprise,
    ProjectEnterpriseOdsOdp,
)


class EnterpriseSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    code = serializers.CharField(read_only=True)

    class Meta:
        model = Enterprise
        fields = [
            "id",
            "code",
            "name",
            "country",
            "location",
            "application",
            "local_ownership",
            "export_to_non_a5",
            "remarks",
        ]


class ProjectEnterpriseOdsOdpSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    project_enterprise = serializers.PrimaryKeyRelatedField(
        queryset=ProjectEnterprise.objects.all(), required=False
    )

    class Meta:
        model = ProjectEnterpriseOdsOdp
        fields = [
            "id",
            "project_enterprise",
            "ods_substance",
            "ods_blend",
            "phase_out_mt",
            "ods_replacement",
            "ods_replacement_phase_in",
        ]

    def validate(self, attrs):
        if attrs.get("ods_substance") and attrs.get("ods_blend"):
            raise serializers.ValidationError(
                "Only one of ods_substance or ods_blend is required"
            )
        # validate partial updates
        instance = self.instance
        if not instance and attrs.get("id"):
            try:
                instance = ProjectEnterpriseOdsOdp.objects.get(id=attrs["id"])
            except ProjectEnterpriseOdsOdp.DoesNotExist:
                instance = None

        if instance:
            # set ods_substance while ods_blend is set
            if (
                attrs.get("ods_substance") is not None
                and instance.ods_blend
                and not ("ods_blend" in attrs and attrs["ods_blend"] is None)
            ):
                raise serializers.ValidationError(
                    "Cannot update ods_substance when ods_blend is set"
                )
            # set ods_blend while ods_substance is set
            if (
                attrs.get("ods_blend") is not None
                and instance.ods_substance
                and not ("ods_substance" in attrs and attrs["ods_substance"] is None)
            ):
                raise serializers.ValidationError(
                    "Cannot update ods_blend when ods_substance is set"
                )

        return super().validate(attrs)


class ProjectEnterpriseSerializer(serializers.ModelSerializer):

    ods_odp = ProjectEnterpriseOdsOdpSerializer(many=True, required=False)
    enterprise = EnterpriseSerializer(required=True)
    project_code = serializers.CharField(
        source="project.code", read_only=True
    )  # read-only field to display project code

    class Meta:
        model = ProjectEnterprise
        fields = [
            "id",
            "capital_cost_approved",
            "cost_effectiveness_approved",
            "enterprise",
            "ods_odp",
            "funds_approved",
            "funds_disbursed",
            "project",
            "project_code",
            "operating_cost_approved",
            "status",
        ]

    def create(self, validated_data):
        _ = validated_data.pop("request", None)
        ods_odp_data = validated_data.pop("ods_odp")
        enterprise_data = validated_data.pop("enterprise")
        if "id" in enterprise_data:
            enterprise = Enterprise.objects.get(id=enterprise_data["id"])
            for attr, value in enterprise_data.items():
                setattr(enterprise, attr, value)
            enterprise.save()
        else:
            enterprise = Enterprise.objects.create(**enterprise_data)
        project_enterprise = ProjectEnterprise.objects.create(
            **validated_data,
            enterprise=enterprise,
        )
        for ods_odp in ods_odp_data:
            ProjectEnterpriseOdsOdp.objects.create(
                project_enterprise=project_enterprise, **ods_odp
            )
        return project_enterprise

    def update(self, instance, validated_data):
        _ = validated_data.pop("request", None)
        ods_odp_data = validated_data.pop("ods_odp")
        enterprise_data = validated_data.pop("enterprise", None)
        if enterprise_data:
            enterprise = instance.enterprise
            for attr, value in enterprise_data.items():
                setattr(enterprise, attr, value)
            enterprise.save()
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
                    project_enterprise=instance, **ods_odp
                )
                remaining_ids.append(new_ods_odp.id)

        # Delete removed ODS/ODP entries
        ProjectEnterpriseOdsOdp.objects.filter(project_enterprise=instance).exclude(
            id__in=remaining_ids
        ).delete()
        return instance
