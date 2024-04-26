from django.db import transaction
from rest_framework import serializers

from core.api.serializers.base import BaseCPWChemicalSerializer
from core.api.serializers.cp_usage import CPUsageSerializer
from core.models.country_programme import (
    CPRecord,
    CPUsage,
)
from core.models.country_programme_archive import CPRecordArchive


class CPRecordBaseSerializer(BaseCPWChemicalSerializer):
    record_usages = CPUsageSerializer(many=True)
    section = serializers.CharField(required=False, write_only=True)
    excluded_usages = serializers.SerializerMethodField()
    import_gwp = serializers.SerializerMethodField()
    import_quotas_gwp = serializers.SerializerMethodField()
    export_gwp = serializers.SerializerMethodField()
    export_quotas_gwp = serializers.SerializerMethodField()
    production_gwp = serializers.SerializerMethodField()
    import_odp = serializers.SerializerMethodField()
    import_quotas_odp = serializers.SerializerMethodField()
    export_odp = serializers.SerializerMethodField()
    export_quotas_odp = serializers.SerializerMethodField()
    production_odp = serializers.SerializerMethodField()

    class Meta:
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
            "import_gwp",
            "import_quotas_gwp",
            "export_gwp",
            "export_quotas_gwp",
            "production_gwp",
            "import_odp",
            "import_quotas_odp",
            "export_odp",
            "export_quotas_odp",
            "production_odp",
        ]

    def get_excluded_usages(self, obj):
        chemical = obj.substance if obj.substance else obj.blend
        return [usage.usage_id for usage in chemical.excluded_usages.all()]

    def get_import_gwp(self, obj):
        return obj.mt_convert_to_gwp(obj.imports)

    def get_import_quotas_gwp(self, obj):
        return obj.mt_convert_to_gwp(obj.import_quotas)

    def get_export_gwp(self, obj):
        return obj.mt_convert_to_gwp(obj.exports)

    def get_export_quotas_gwp(self, obj):
        return obj.mt_convert_to_gwp(obj.export_quotas)

    def get_production_gwp(self, obj):
        return obj.mt_convert_to_gwp(obj.production)

    def get_import_odp(self, obj):
        return obj.mt_convert_to_odp(obj.imports)

    def get_import_quotas_odp(self, obj):
        return obj.mt_convert_to_odp(obj.import_quotas)

    def get_export_odp(self, obj):
        return obj.mt_convert_to_odp(obj.exports)

    def get_export_quotas_odp(self, obj):
        return obj.mt_convert_to_odp(obj.export_quotas)

    def get_production_odp(self, obj):
        return obj.mt_convert_to_odp(obj.production)

    @transaction.atomic
    def create(self, validated_data):
        usages = validated_data.pop("record_usages")
        record = CPRecord.objects.create(**validated_data)
        for usage in usages:
            CPUsage.objects.create(country_programme_record=record, **usage)
        return record


class CPRecordSerializer(CPRecordBaseSerializer):
    class Meta(CPRecordBaseSerializer.Meta):
        model = CPRecord


class CPRecordArchiveSerializer(CPRecordBaseSerializer):
    class Meta(CPRecordBaseSerializer.Meta):
        model = CPRecordArchive
