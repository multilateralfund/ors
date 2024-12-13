import copy
from django.db import transaction
from rest_framework import serializers

from core.api.serializers.base import BaseCPWChemicalSerializer
from core.api.serializers.cp_usage import CPUsageSerializer
from core.model_views.country_programme import AllCPRecordsView
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


class DashboardsCPRecordSerializer(serializers.ModelSerializer):
    year = serializers.IntegerField(source="report_year")
    version = serializers.IntegerField(source="report_version")
    created_at = serializers.DateTimeField(source="report_created_at")
    lvc = serializers.BooleanField(source="country_is_lvc")
    group = serializers.CharField(source="substance_group_name")
    grou_id = serializers.IntegerField(source="substance_group_id")
    region = serializers.SerializerMethodField()
    data = serializers.SerializerMethodField()

    class Meta:
        model = AllCPRecordsView
        fields = [
            "country_id",
            "country_name",
            "region",
            "lvc",
            "version",
            "created_at",
            "year",
            "report_status",
            "substance_name",
            "substance_id",
            "group",
            "grou_id",
            "blend_name",
            "blend_id",
            "data",
            "remarks",
        ]

    def get_region(self, obj):
        return self.context["country_region_dict"].get(obj.country_id)

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
        usage_dict = copy.deepcopy(self.context["usages_dict"])
        existent_usages = self.context["existing_usages_dict"].get(
            (obj.id, obj.is_archive), []
        )
        for usage in existent_usages:
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
