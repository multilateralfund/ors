from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from core.models.country_programme import CPUsage
from core.models.usage import Usage


class CPUsageSerializer(serializers.ModelSerializer):
    usage = serializers.StringRelatedField()
    usage_id = serializers.PrimaryKeyRelatedField(
        required=True,
        queryset=Usage.objects.all().values_list("id", flat=True),
    )
    quantity = serializers.DecimalField(max_digits=25, decimal_places=15)
    quantity_gwp = serializers.SerializerMethodField()
    quantity_odp = serializers.SerializerMethodField()

    class Meta:
        model = CPUsage
        fields = [
            "usage",
            "usage_id",
            "quantity",
            "quantity_gwp",
            "quantity_odp",
        ]

    def get_quantity_gwp(self, obj):
        return obj.country_programme_record.mt_convert_to_gwp(obj.quantity)

    def get_quantity_odp(self, obj):
        return obj.country_programme_record.mt_convert_to_odp(obj.quantity)

    def to_internal_value(self, data):
        try:
            intenal_value = super().to_internal_value(data)
        except ValidationError as e:
            # add usage_id to error message
            row_id = data.get("usage_id", "general_error")
            if row_id != "general_error":
                row_id = f"usage_{row_id}"
            raport_error = {
                "row_id": row_id,
                "errors": e.detail,
            }
            raise ValidationError(raport_error) from e

        return intenal_value

class CPUsageDiffSerializer(CPUsageSerializer):
    quantity_old = serializers.SerializerMethodField()
    quantity_gwp_old = serializers.SerializerMethodField()
    quantity_odp_old = serializers.SerializerMethodField()

    class Meta(CPUsageSerializer.Meta):
        fields = CPUsageSerializer.Meta.fields + [
            "quantity_old",
            "quantity_gwp_old",
            "quantity_odp_old",
        ]

    def get_quantity_old(self, obj):
        return obj.quantity

    def get_quantity_gwp_old(self, obj):
        return obj.country_programme_record.mt_convert_to_gwp(obj.quantity)

    def get_quantity_odp_old(self, obj):
        return obj.country_programme_record.mt_convert_to_odp(obj.quantity)

