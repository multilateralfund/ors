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
    imports_gwp = serializers.SerializerMethodField()
    import_quotas_gwp = serializers.SerializerMethodField()
    exports_gwp = serializers.SerializerMethodField()
    export_quotas_gwp = serializers.SerializerMethodField()
    production_gwp = serializers.SerializerMethodField()
    manufacturing_blends_gwp = serializers.SerializerMethodField()
    imports_odp = serializers.SerializerMethodField()
    import_quotas_odp = serializers.SerializerMethodField()
    exports_odp = serializers.SerializerMethodField()
    export_quotas_odp = serializers.SerializerMethodField()
    production_odp = serializers.SerializerMethodField()
    manufacturing_blends_odp = serializers.SerializerMethodField()

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
            "imports_gwp",
            "import_quotas_gwp",
            "exports_gwp",
            "export_quotas_gwp",
            "production_gwp",
            "manufacturing_blends_gwp",
            "imports_odp",
            "import_quotas_odp",
            "exports_odp",
            "export_quotas_odp",
            "production_odp",
            "manufacturing_blends_odp",
        ]

    def get_excluded_usages(self, obj):
        chemical = obj.substance if obj.substance else obj.blend
        return [usage.usage_id for usage in chemical.excluded_usages.all()]

    def get_imports_gwp(self, obj):
        return obj.mt_convert_to_gwp(obj.imports)

    def get_import_quotas_gwp(self, obj):
        return obj.mt_convert_to_gwp(obj.import_quotas)

    def get_exports_gwp(self, obj):
        return obj.mt_convert_to_gwp(obj.exports)

    def get_export_quotas_gwp(self, obj):
        return obj.mt_convert_to_gwp(obj.export_quotas)

    def get_production_gwp(self, obj):
        return obj.mt_convert_to_gwp(obj.production)

    def get_manufacturing_blends_gwp(self, obj):
        return obj.mt_convert_to_gwp(obj.manufacturing_blends)

    def get_imports_odp(self, obj):
        return obj.mt_convert_to_odp(obj.imports)

    def get_import_quotas_odp(self, obj):
        return obj.mt_convert_to_odp(obj.import_quotas)

    def get_exports_odp(self, obj):
        return obj.mt_convert_to_odp(obj.exports)

    def get_export_quotas_odp(self, obj):
        return obj.mt_convert_to_odp(obj.export_quotas)

    def get_production_odp(self, obj):
        return obj.mt_convert_to_odp(obj.production)

    def get_manufacturing_blends_odp(self, obj):
        return obj.mt_convert_to_odp(obj.manufacturing_blends)

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


class CPRecordReadOnlySerializer(CPRecordBaseSerializer):
    record_usages = serializers.SerializerMethodField()

    def get_record_usages(self, obj):
        if obj.id == 0:
            return []
        return CPUsageSerializer(obj.record_usages.all(), many=True).data

    class Meta(CPRecordBaseSerializer.Meta):
        model = CPRecord


class CPRecordArchiveSerializer(CPRecordBaseSerializer):
    class Meta(CPRecordBaseSerializer.Meta):
        model = CPRecordArchive
