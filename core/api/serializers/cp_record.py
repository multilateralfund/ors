from django.db import transaction
from rest_framework import serializers

from core.api.serializers.base import BaseCPWChemicalSerializer
from core.api.serializers.cp_usage import CPUsageSerializer
from core.models.country_programme import (
    CPRecord,
    CPUsage,
)


class CPRecordSerializer(BaseCPWChemicalSerializer):
    record_usages = CPUsageSerializer(many=True)
    section = serializers.CharField(required=False, write_only=True)
    excluded_usages = serializers.SerializerMethodField()

    class Meta:
        model = CPRecord
        fields = BaseCPWChemicalSerializer.Meta.fields + [
            "section",
            "imports",
            "import_quotas",
            "exports",
            "export_quotas",
            "production",
            "manufacturing_blends",
            "banned_date",
            "remarks",
            "record_usages",
            "excluded_usages",
        ]

    def get_excluded_usages(self, obj):
        chemical = obj.substance if obj.substance else obj.blend
        return [usage.usage_id for usage in chemical.excluded_usages.all()]

    @transaction.atomic
    def create(self, validated_data):
        usages = validated_data.pop("record_usages")
        record = CPRecord.objects.create(**validated_data)
        for usage in usages:
            CPUsage.objects.create(country_programme_record=record, **usage)
        return record
