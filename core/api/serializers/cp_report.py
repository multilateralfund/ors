from django.db import transaction
from rest_framework import serializers

from core.api.serializers.adm import AdmRecordSerializer
from core.api.serializers.cp_emission import CPEmissionSerializer
from core.api.serializers.cp_generation import CPGenerationSerializer
from core.api.serializers.cp_price import CPPricesSerializer
from core.api.serializers.cp_record import CPRecordSerializer
from core.models.country import Country
from core.models.country_programme import CPReport
from core.models.country_programme_archive import CPReportArchive
from core.utils import IMPORT_DB_MAX_YEAR

# pylint: disable=W0223


class CPReportBaseSerializer(serializers.ModelSerializer):
    country = serializers.StringRelatedField()
    country_id = serializers.PrimaryKeyRelatedField(
        required=True,
        queryset=Country.objects.all().values_list("id", flat=True),
    )
    status = serializers.ChoiceField(
        choices=CPReport.CPReportStatus.choices, required=False
    )
    event_description = serializers.CharField(required=False)
    version = serializers.FloatField(read_only=True)
    created_by = serializers.StringRelatedField(
        read_only=True, source="created_by.username"
    )
    last_updated_by = serializers.StringRelatedField(
        read_only=True, source="last_updated_by.username"
    )

    class Meta:
        fields = [
            "id",
            "name",
            "year",
            "status",
            "version",
            "country",
            "country_id",
            "comment",
            "created_at",
            "created_by",
            "last_updated_by",
            "event_description",
        ]


class CPReportSerializer(CPReportBaseSerializer):
    class Meta(CPReportBaseSerializer.Meta):
        model = CPReport


class CPReportArchiveSerializer(CPReportBaseSerializer):
    final_version_id = serializers.SerializerMethodField()

    class Meta(CPReportBaseSerializer.Meta):
        model = CPReportArchive
        fields = CPReportBaseSerializer.Meta.fields + ["final_version_id"]

    def get_final_version_id(self, obj):
        cp_report_final = CPReport.objects.filter(
            country_id=obj.country_id,
            year=obj.year,
        ).first()
        return cp_report_final.id if cp_report_final else None


class CPReportGroupSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    count = serializers.IntegerField()
    group = serializers.CharField()
    reports = CPReportSerializer(many=True, read_only=True)

    class Meta:
        fields = [
            "id",
            "count",
            "group",
            "reports",
        ]


class CPReportCreateSerializer(serializers.Serializer):
    name = serializers.CharField()
    year = serializers.IntegerField()
    country_id = serializers.PrimaryKeyRelatedField(
        queryset=Country.objects.all().values_list("id", flat=True),
    )
    status = serializers.ChoiceField(
        choices=CPReport.CPReportStatus.choices, required=False
    )
    event_description = serializers.CharField(required=False)
    section_a = CPRecordSerializer(many=True, required=False)
    section_b = CPRecordSerializer(many=True, required=False)
    section_c = CPPricesSerializer(many=True, required=False)
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
            "event_description",
            "status",
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

    # waiting for the decision on the validation rules
    # def validate(self, attrs):
    #     if attrs["year"] > IMPORT_DB_MAX_YEAR:
    #         if not all(
    #             [
    #                 attrs.get("section_b"),
    #                 attrs.get("section_d"),
    #                 attrs.get("section_e"),
    #                 attrs.get("section_f"),
    #             ]
    #         ):
    #             raise serializers.ValidationError(
    #                 f"Sections B, D, E and F are required for years after {IMPORT_DB_MAX_YEAR}"
    #             )
    #         if attrs["section_f"].get("remarks") is None:
    #             raise serializers.ValidationError(
    #                 f"Remarks are required for years after {IMPORT_DB_MAX_YEAR}"
    #             )
    #     else:
    #         if not all(
    #             [
    #                 attrs.get("adm_b"),
    #                 attrs.get("adm_c"),
    #                 attrs.get("adm_d"),
    #             ]
    #         ):
    #             raise serializers.ValidationError(
    #                 f"Adm B, C and D are required for years before {IMPORT_DB_MAX_YEAR}"
    #             )

    #     return super().validate(attrs)

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
            "status": validated_data.get("status", CPReport.CPReportStatus.DRAFT),
            "country_id": validated_data.get("country_id"),
            "event_description": validated_data.get(
                "event_description", "Created by user"
            ),
        }

        cp_report_serializer = CPReportSerializer(data=cp_report_data)
        cp_report_serializer.is_valid(raise_exception=True)

        # add user
        request_user = self.context["user"]
        cp_report_serializer.validated_data["created_by"] = request_user
        cp_report_serializer.validated_data["last_updated_by"] = request_user

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
