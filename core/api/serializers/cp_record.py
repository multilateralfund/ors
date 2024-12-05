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


class CPRecordEkimetricsSerializer(serializers.ModelSerializer):
    country_name = serializers.CharField(source="country_programme_report.country.name")
    country_id = serializers.IntegerField(source="country_programme_report.country.id")
    year = serializers.IntegerField(source="country_programme_report.year")
    lvc = serializers.BooleanField(source="country_programme_report.country.is_lvc")
    group = serializers.SerializerMethodField()
    group_id = serializers.SerializerMethodField()
    substance_name = serializers.SerializerMethodField()
    blend_name = serializers.SerializerMethodField()
    data = serializers.SerializerMethodField()

    class Meta:
        model = CPRecord
        fields = [
            "country_name",
            "country_id",
            "year",
            "lvc",
            "group",
            "group_id",
            "substance_name",
            "substance_id",
            "blend_name",
            "blend_id",
            "data",
        ]

    def get_group(self, obj):
        if obj.blend:
            return "Blends (Mixture of Controlled Substances)"

        if obj.substance and obj.substance.group:
            return obj.substance.group.name_alt

        return None

    def get_group_id(self, obj):
        if obj.substance and obj.substance.group:
            return obj.substance.group_id

        return None

    def get_substance_name(self, obj):
        return obj.substance.name if obj.substance else None

    def get_blend_name(self, obj):
        return obj.blend.name if obj.blend else None

    def _get_values_dict(self, obj, attr_key, attr_name, value):
        return [
            {
                attr_key: attr_name,
                "measurement_type": "mt",
                "value": value,
            },
            {
                attr_key: attr_name,
                "measurement_type": "odp",
                "value": obj.mt_convert_to_odp(value),
            },
            {
                attr_key: attr_name,
                "measurement_type": "gwp",
                "value": obj.mt_convert_to_gwp(value),
            },
        ]

    def _get_usages_data(self, obj):
        usage_dict = self.context["usages_dict"]
        for usage in obj.record_usages.all():
            usage_dict[usage.usage_id]["quantity"] = usage.quantity

        final_list = []
        for _, usage_data in usage_dict.items():
            final_list.extend(
                self._get_values_dict(
                    obj, "sector_name", usage_data["name"], usage_data["quantity"]
                )
            )
        return final_list

    def _get_metrics_data(self, obj):
        metric_list = []
        for attribute in [
            "imports",
            "import_quotas",
            "exports",
            "export_quotas",
            "production",
            "manufacturing_blends",
        ]:
            attr_value = getattr(obj, attribute)
            metric_list.extend(
                self._get_values_dict(obj, "data_type", attribute, attr_value)
            )
        return metric_list

    def get_data(self, obj):
        return {
            "sectors": self._get_usages_data(obj),
            "metrics": self._get_metrics_data(obj),
        }
