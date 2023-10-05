from django.db import transaction
from rest_framework import serializers
from core.api.serializers.adm import AdmRecordSerializer

from core.models.blend import Blend
from core.models.country import Country
from core.models.country_programme import (
    CPEmission,
    CPGeneration,
    CPPrices,
    CPRecord,
    CPReport,
    CPUsage,
)
from core.models.substance import Substance
from core.models.usage import Usage
from core.utils import IMPORT_DB_MAX_YEAR


# pylint: disable=W0223

CP_GENERATION_CHEMICAL = "HFC-23"


class BaseWChemicalSerializer(serializers.ModelSerializer):
    group = serializers.SerializerMethodField()
    chemical_name = serializers.SerializerMethodField()
    substance_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=Substance.objects.all().values_list("id", flat=True),
    )
    blend_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=Blend.objects.all().values_list("id", flat=True),
    )
    country_programme_report_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=CPReport.objects.all().values_list("id", flat=True),
        write_only=True,
    )
    display_name = serializers.SerializerMethodField()

    class Meta:
        fields = [
            "id",
            "country_programme_report_id",
            "display_name",
            "chemical_name",
            "substance_id",
            "blend_id",
            "group",
        ]

    def get_chemical_name(self, obj):
        return obj.substance.name if obj.substance else obj.blend.name

    def get_group(self, obj):
        if obj.blend:
            return "Blends"
        if obj.substance and obj.substance.group:
            return obj.substance.group.name_alt
        return None

    def get_display_name(self, obj):
        if obj.blend:
            return obj.blend.get_display_name()
        if obj.display_name:
            return obj.display_name
        return obj.substance.name

    def validate(self, attrs):
        if not attrs.get("substance_id") and not attrs.get("blend_id"):
            raise serializers.ValidationError(
                "Either substance_id or blend_id is required"
            )
        if attrs.get("substance_id") and attrs.get("blend_id"):
            raise serializers.ValidationError(
                "Only one of substance_id or blend_id is required"
            )

        return super().validate(attrs)


# countryProgramReport serializer
class CPReportSerializer(serializers.ModelSerializer):
    country = serializers.StringRelatedField()
    country_id = serializers.PrimaryKeyRelatedField(
        required=True,
        write_only=True,
        queryset=Country.objects.all().values_list("id", flat=True),
    )

    class Meta:
        model = CPReport
        fields = [
            "id",
            "name",
            "year",
            "country",
            "country_id",
            "comment",
        ]


class CPUsageSerializer(serializers.ModelSerializer):
    usage = serializers.StringRelatedField()
    usage_id = serializers.PrimaryKeyRelatedField(
        required=True,
        queryset=Usage.objects.all().values_list("id", flat=True),
    )
    quantity = serializers.DecimalField(max_digits=12, decimal_places=3)

    class Meta:
        model = CPUsage
        fields = [
            "usage",
            "usage_id",
            "quantity",
        ]


class CPRecordSerializer(BaseWChemicalSerializer):
    record_usages = CPUsageSerializer(many=True)
    section = serializers.CharField(required=False, write_only=True)
    excluded_usages = serializers.SerializerMethodField()

    class Meta:
        model = CPRecord
        fields = BaseWChemicalSerializer.Meta.fields + [
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


class CPPricesSerializer(BaseWChemicalSerializer):
    class Meta:
        model = CPPrices
        fields = BaseWChemicalSerializer.Meta.fields + [
            "previous_year_price",
            "current_year_price",
            "remarks",
        ]


class CPGenerationSerializer(serializers.ModelSerializer):
    chemical_name = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()
    country_programme_report_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=CPReport.objects.all().values_list("id", flat=True),
        write_only=True,
    )

    class Meta:
        model = CPGeneration
        fields = [
            "id",
            "chemical_name",
            "display_name",
            "all_uses",
            "feedstock",
            "destruction",
            "country_programme_report_id",
        ]

    def get_chemical_name(self, _):
        return CP_GENERATION_CHEMICAL

    def get_display_name(self, _):
        return CP_GENERATION_CHEMICAL


class CPEmissionSerializer(serializers.ModelSerializer):
    country_programme_report_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=CPReport.objects.all().values_list("id", flat=True),
        write_only=True,
    )

    class Meta:
        model = CPEmission
        fields = [
            "id",
            "facility",
            "total",
            "all_uses",
            "feedstock_gc",
            "destruction",
            "feedstock_wpc",
            "destruction_wpc",
            "generated_emissions",
            "remarks",
            "country_programme_report_id",
        ]


class CPReportCreateSerializer(serializers.Serializer):
    name = serializers.CharField()
    year = serializers.IntegerField()
    country_id = serializers.PrimaryKeyRelatedField(
        queryset=Country.objects.all().values_list("id", flat=True),
    )
    section_a = CPRecordSerializer(many=True)
    section_b = CPRecordSerializer(many=True, required=False)
    section_c = CPPricesSerializer(many=True)
    section_d = CPGenerationSerializer(many=True, required=False)
    section_e = CPEmissionSerializer(many=True, required=False)
    section_f = serializers.DictField(
        required=False, help_text="Only one key (remarks) is allowed)"
    )
    adm_b = AdmRecordSerializer(many=True, required=False)
    adm_c = AdmRecordSerializer(many=True, required=False)
    adm_d = AdmRecordSerializer(many=True, required=False)

    class Meta:
        fields = [
            "name",
            "year",
            "country_id",
            "section_a",
            "section_b",
            "section_c",
            "section_d",
            "section_e",
            "section_f",
            "adm_b",
            "adm_c",
            "adm_d",
        ]

    def to_representation(self, instance):
        return CPReportSerializer(instance).data

    def validate(self, attrs):
        if attrs["year"] > IMPORT_DB_MAX_YEAR:
            if not all(
                [
                    attrs.get("section_b"),
                    attrs.get("section_d"),
                    attrs.get("section_e"),
                    attrs.get("section_f"),
                ]
            ):
                raise serializers.ValidationError(
                    f"Sections B, D, E and F are required for years after {IMPORT_DB_MAX_YEAR}"
                )
            if attrs["section_f"].get("remarks") is None:
                raise serializers.ValidationError(
                    f"Remarks are required for years after {IMPORT_DB_MAX_YEAR}"
                )
        else:
            if not all(
                [
                    attrs.get("adm_b"),
                    attrs.get("adm_c"),
                    attrs.get("adm_d"),
                ]
            ):
                raise serializers.ValidationError(
                    f"Adm B, C and D are required for years before {IMPORT_DB_MAX_YEAR}"
                )

        return super().validate(attrs)

    def _create_cp_records(self, cp_report, section_data, section):
        for record in section_data:
            record["country_programme_report_id"] = cp_report.id
            record["section"] = section
            record_serializer = CPRecordSerializer(data=record)
            record_serializer.is_valid(raise_exception=True)
            record_serializer.save()

    def _create_prices(self, cp_report, section_data):
        for price in section_data:
            price["country_programme_report_id"] = cp_report.id
            price_serializer = CPPricesSerializer(data=price)
            price_serializer.is_valid(raise_exception=True)
            price_serializer.save()

    def _create_generation(self, cp_report, section_data):
        for generation in section_data:
            generation["country_programme_report_id"] = cp_report.id
            generation_serializer = CPGenerationSerializer(data=generation)
            generation_serializer.is_valid(raise_exception=True)
            generation_serializer.save()

    def _create_emission(self, cp_report, section_data):
        for emission in section_data:
            emission["country_programme_report_id"] = cp_report.id
            emission_serializer = CPEmissionSerializer(data=emission)
            emission_serializer.is_valid(raise_exception=True)
            emission_serializer.save()

    def _add_remarks(self, cp_report, section_data):
        cp_report.comment = section_data.get("remarks", "")
        cp_report.save()

    def _create_adm_records(self, cp_report, section_data, section):
        for record in section_data:
            record["country_programme_report_id"] = cp_report.id
            record["section"] = section
            record_serializer = AdmRecordSerializer(data=record)
            record_serializer.is_valid(raise_exception=True)
            record_serializer.save()

    @transaction.atomic
    def create(self, validated_data):
        cp_report_data = {
            "name": validated_data.get("name"),
            "year": validated_data.get("year"),
            "country_id": validated_data.get("country_id"),
        }

        cp_report_serializer = CPReportSerializer(data=cp_report_data)
        cp_report_serializer.is_valid(raise_exception=True)
        cp_report = cp_report_serializer.save()

        self._create_cp_records(cp_report, validated_data.get("section_a", []), "A")
        self._create_prices(cp_report, validated_data.get("section_c", []))

        if cp_report_data["year"] > IMPORT_DB_MAX_YEAR:
            self._create_cp_records(cp_report, validated_data.get("section_b", []), "B")
            self._create_generation(cp_report, validated_data.get("section_d", []))
            self._create_emission(cp_report, validated_data.get("section_e", []))
            self._add_remarks(cp_report, validated_data.get("section_f", {}))
        else:
            self._create_adm_records(cp_report, validated_data.get("adm_b", []), "B")
            self._create_adm_records(cp_report, validated_data.get("adm_c", []), "C")
            self._create_adm_records(cp_report, validated_data.get("adm_d", []), "D")

        return cp_report
