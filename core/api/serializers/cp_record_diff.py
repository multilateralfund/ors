from rest_framework import serializers

from core.api.serializers.cp_emission import CPEmissionSerializer
from core.api.serializers.cp_generation import CPGenerationSerializer
from core.api.serializers.cp_price import CPPricesSerializer
from core.api.serializers.cp_record import CPRecordSerializer
from core.api.serializers.cp_usage import CPUsageSerializer


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


class CPRecordDiffSerializer(CPRecordSerializer):
    record_usages = CPUsageDiffSerializer(many=True)

    imports_old = serializers.SerializerMethodField()
    import_quotas_old = serializers.SerializerMethodField()
    exports_old = serializers.SerializerMethodField()
    export_quotas_old = serializers.SerializerMethodField()
    production_old = serializers.SerializerMethodField()

    imports_gwp_old = serializers.SerializerMethodField()
    import_quotas_gwp_old = serializers.SerializerMethodField()
    exports_gwp_old = serializers.SerializerMethodField()
    export_quotas_gwp_old = serializers.SerializerMethodField()
    production_gwp_old = serializers.SerializerMethodField()

    imports_odp_old = serializers.SerializerMethodField()
    import_quotas_odp_old = serializers.SerializerMethodField()
    exports_odp_old = serializers.SerializerMethodField()
    export_quotas_odp_old = serializers.SerializerMethodField()
    production_odp_old = serializers.SerializerMethodField()

    class Meta(CPRecordSerializer.Meta):
        fields = CPRecordSerializer.Meta.fields + [
            "imports_old",
            "import_quotas_old",
            "exports_old",
            "export_quotas_old",
            "production_old",
            "imports_gwp_old",
            "import_quotas_gwp_old",
            "exports_gwp_old",
            "export_quotas_gwp_old",
            "production_gwp_old",
            "imports_odp_old",
            "import_quotas_odp_old",
            "exports_odp_old",
            "export_quotas_odp_old",
            "production_odp_old",
        ]

    def get_cp_record_ar(self, obj):
        if obj.substance_id:
            return self.context["substances_old"][str(obj.substance_id)]
        return self.context["blends_old"][str(obj.blend_id)]

    def get_imports_old(self, obj):
        return self.get_cp_record_ar(obj).imports

    def get_import_quotas_old(self, obj):
        return self.get_cp_record_ar(obj).import_quotas

    def get_exports_old(self, obj):
        return self.get_cp_record_ar(obj).exports

    def get_export_quotas_old(self, obj):
        return self.get_cp_record_ar(obj).export_quotas

    def get_production_old(self, obj):
        return self.get_cp_record_ar(obj).production

    def get_imports_gwp_old(self, obj):
        cp_record_ar = self.get_cp_record_ar(obj)
        return obj.mt_convert_to_gwp(cp_record_ar.imports)

    def get_import_quotas_gwp_old(self, obj):
        cp_record_ar = self.get_cp_record_ar(obj)
        return obj.mt_convert_to_gwp(cp_record_ar.import_quotas)

    def get_exports_gwp_old(self, obj):
        cp_record_ar = self.get_cp_record_ar(obj)
        return obj.mt_convert_to_gwp(cp_record_ar.exports)

    def get_export_quotas_gwp_old(self, obj):
        cp_record_ar = self.get_cp_record_ar(obj)
        return obj.mt_convert_to_gwp(cp_record_ar.export_quotas)

    def get_production_gwp_old(self, obj):
        cp_record_ar = self.get_cp_record_ar(obj)
        return obj.mt_convert_to_gwp(cp_record_ar.production)

    def get_imports_odp_old(self, obj):
        cp_record_ar = self.get_cp_record_ar(obj)
        return obj.mt_convert_to_odp(cp_record_ar.imports)

    def get_import_quotas_odp_old(self, obj):
        cp_record_ar = self.get_cp_record_ar(obj)
        return obj.mt_convert_to_odp(cp_record_ar.import_quotas)

    def get_exports_odp_old(self, obj):
        cp_record_ar = self.get_cp_record_ar(obj)
        return obj.mt_convert_to_odp(cp_record_ar.exports)

    def get_export_quotas_odp_old(self, obj):
        cp_record_ar = self.get_cp_record_ar(obj)
        return obj.mt_convert_to_odp(cp_record_ar.export_quotas)

    def get_production_odp_old(self, obj):
        cp_record_ar = self.get_cp_record_ar(obj)
        return obj.mt_convert_to_odp(cp_record_ar.production)


class CPPricesDiffSerializer(CPPricesSerializer):
    previous_year_price_old = serializers.SerializerMethodField()
    current_year_price_old = serializers.SerializerMethodField()
    remarks_old = serializers.SerializerMethodField()

    class Meta(CPPricesSerializer.Meta):
        fields = CPPricesSerializer.Meta.fields + [
            "previous_year_price_old",
            "current_year_price_old",
            "remarks_old",
        ]

    def get_cp_prices_ar(self, obj):
        if obj.substance_id:
            return self.context["substances_old"][str(obj.substance_id)]
        return self.context["blends_old"][str(obj.blend_id)]

    def get_previous_year_price_old(self, obj):
        return self.get_cp_prices_ar(obj).previous_year_price

    def get_current_year_price_old(self, obj):
        return self.get_cp_prices_ar(obj).current_year_price

    def get_remarks_old(self, obj):
        return self.get_cp_prices_ar(obj).remarks


class CPGenerationDiffSerializer(CPGenerationSerializer):
    all_uses_old = serializers.SerializerMethodField()
    feedstock_old = serializers.SerializerMethodField()
    destruction_old = serializers.SerializerMethodField()

    class Meta(CPGenerationSerializer.Meta):
        fields = CPGenerationSerializer.Meta.fields + [
            "all_uses_old",
            "feedstock_old",
            "destruction_old",
        ]

    def get_cp_generation_ar(self):
        return self.context["cp_generation_ar"][0]

    def get_all_uses_old(self, obj):
        return self.get_cp_generation_ar().all_uses

    def get_feedstock_old(self, obj):
        return self.get_cp_generation_ar().feedstock

    def get_destruction_old(self, obj):
        return self.get_cp_generation_ar().destruction


class CPEmissionDiffSerializer(CPEmissionSerializer):
    total_old = serializers.SerializerMethodField()
    all_uses_old = serializers.SerializerMethodField()
    feedstock_gc_old = serializers.SerializerMethodField()
    destruction_old = serializers.SerializerMethodField()
    feedstock_wpc_old = serializers.SerializerMethodField()
    destruction_wpc_old = serializers.SerializerMethodField()
    generated_emissions_old = serializers.SerializerMethodField()
    remarks_old = serializers.SerializerMethodField()

    class Meta(CPEmissionSerializer.Meta):
        fields = CPEmissionSerializer.Meta.fields + [
            "total_old",
            "all_uses_old",
            "feedstock_gc_old",
            "destruction_old",
            "feedstock_wpc_old",
            "destruction_wpc_old",
            "generated_emissions_old",
            "remarks_old",
        ]

    def get_cp_emission_ar(self, obj):
        return self.context[obj.facility]

    def get_total_old(self, obj):
        return self.get_cp_emission_ar(obj).total

    def get_all_uses_old(self, obj):
        return self.get_cp_emission_ar(obj).all_uses

    def get_feedstock_gc_old(self, obj):
        return self.get_cp_emission_ar(obj).feedstock_gc

    def get_destruction_old(self, obj):
        return self.get_cp_emission_ar(obj).destruction

    def get_feedstock_wpc_old(self, obj):
        return self.get_cp_emission_ar(obj).feedstock_wpc

    def get_destruction_wpc_old(self, obj):
        return self.get_cp_emission_ar(obj).destruction_wpc

    def get_generated_emissions_old(self, obj):
        return self.get_cp_emission_ar(obj).generated_emissions

    def get_remarks_old(self, obj):
        return self.get_cp_emission_ar(obj).remarks
