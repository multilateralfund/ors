from rest_framework import serializers

from core.models import (
    Blend,
    Substance,
    Group,
)
from core.models.project import Project
from core.models.enterprise import (
    Enterprise,
    EnterpriseOdsOdp,
    EnterpriseStatus,
)


class EnterpriseOdsOdpSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    enterprise = serializers.PrimaryKeyRelatedField(
        queryset=Enterprise.objects.all(), required=False
    )

    class Meta:
        model = EnterpriseOdsOdp
        fields = [
            "id",
            "enterprise",
            "ods_substance",
            "ods_blend",
            "ods_display_name",
            "consumption",
            "selected_alternative",
            "chemical_phased_in_mt",
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
                instance = EnterpriseOdsOdp.objects.get(id=attrs["id"])
            except EnterpriseOdsOdp.DoesNotExist:
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


class EnterpriseSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    code = serializers.CharField(read_only=True)
    ods_odp = EnterpriseOdsOdpSerializer(many=True, required=False)

    class Meta:
        model = Enterprise
        fields = [
            "id",
            "country",
            "agency",
            "legacy_code",
            "code",
            "name",
            "location",
            "city",
            "stage",
            "sector",
            "subsector",
            "application",
            "project_type",
            "planned_completion_date",
            "actual_completion_date",
            "status",
            "project_duration",
            "local_ownership",
            "export_to_non_a5",
            "revision_number",
            "meeting",
            "date_of_approval",
            "chemical_phased_out",
            "impact",
            "funds_approved",
            "capital_cost_approved",
            "operating_cost_approved",
            "cost_effectiveness_approved",
            "funds_disbursed",
            "capital_cost_disbursed",
            "operating_cost_disbursed",
            "cost_effectiveness_actual",
            "co_financing_planned",
            "co_financing_actual",
            "funds_transferred",
            "agency_remarks",
            "secretariat_remarks",
            "excom_provision",
            "date_of_report",
            "date_of_revision",
            "ods_odp",
        ]

    def create(self, validated_data):
        user = self.context["request"].user
        _ = validated_data.pop("request", None)
        ods_odp_data = validated_data.pop("ods_odp", [])
        enterprise = Enterprise.objects.create(**validated_data)
        for ods_odp in ods_odp_data:
            EnterpriseOdsOdp.objects.create(enterprise=enterprise, **ods_odp)
        return enterprise

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
                ods_odp_instance = EnterpriseOdsOdp.objects.get(id=ods_odp["id"])
                for attr, value in ods_odp.items():
                    setattr(ods_odp_instance, attr, value)
                ods_odp_instance.save()
                remaining_ids.append(ods_odp_instance.id)
            else:
                new_ods_odp = EnterpriseOdsOdp.objects.create(
                    enterprise=instance, **ods_odp
                )
                remaining_ids.append(new_ods_odp.id)

        # Delete removed ODS/ODP entries
        EnterpriseOdsOdp.objects.filter(enterprise=instance).exclude(
            id__in=remaining_ids
        ).delete()
        return instance


class EnterpriseStatusSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = EnterpriseStatus
        fields = [
            "id",
            "name",
        ]
