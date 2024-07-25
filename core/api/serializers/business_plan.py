import itertools

from django.db import transaction
from django.urls import reverse
from rest_framework import serializers

from core.api.serializers import CountrySerializer
from core.api.serializers.agency import AgencySerializer
from core.api.serializers.project import ProjectSectorSerializer
from core.api.serializers.project import ProjectSubSectorSerializer
from core.api.serializers.project import ProjectTypeSerializer
from core.models import (
    Agency,
    Blend,
    BPChemicalType,
    BPRecord,
    BPRecordValue,
    BusinessPlan,
    Country,
    ProjectSector,
    ProjectSubSector,
    ProjectType,
    Substance,
)


class BPChemicalTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = BPChemicalType
        fields = [
            "id",
            "name",
        ]


class BPRecordValueSerializer(serializers.ModelSerializer):
    bp_record_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=BPRecord.objects.all().values_list("id", flat=True),
        write_only=True,
    )

    class Meta:
        model = BPRecordValue
        fields = [
            "id",
            "bp_record_id",
            "year",
            "value_usd",
            "value_odp",
            "value_mt",
        ]


class BusinessPlanSerializer(serializers.ModelSerializer):
    agency = AgencySerializer()
    status = serializers.ChoiceField(
        choices=BusinessPlan.Status.choices, required=False
    )
    feedback_filename = serializers.CharField(read_only=True)
    feedback_file_download_url = serializers.SerializerMethodField(read_only=True)
    updated_by = serializers.StringRelatedField(
        read_only=True, source="updated_by.username"
    )

    class Meta:
        model = BusinessPlan
        fields = [
            "id",
            "name",
            "status",
            "year_start",
            "year_end",
            "agency",
            "feedback_filename",
            "feedback_file_download_url",
            "updated_at",
            "updated_by",
        ]

    def get_feedback_file_download_url(self, obj):
        return reverse("business-plan-file-download", args=(obj.id,))


class BPRecordExportSerializer(serializers.ModelSerializer):
    agency = serializers.SerializerMethodField()
    lvc_status = serializers.ChoiceField(choices=BPRecord.LVCStatus.choices)
    project_type = serializers.SlugRelatedField("code", read_only=True)
    status = serializers.ChoiceField(choices=BPRecord.Status.choices)
    bp_chemical_type = serializers.SlugRelatedField("name", read_only=True)
    chemical_detail = serializers.SerializerMethodField()
    country = serializers.SlugRelatedField("name", read_only=True)
    project_cluster = serializers.SlugRelatedField("name", read_only=True)

    sector = serializers.SlugRelatedField("name", read_only=True)
    subsector = serializers.SlugRelatedField("name", read_only=True)
    values = BPRecordValueSerializer(many=True)

    class Meta:
        model = BPRecord
        fields = [
            "id",
            "business_plan_id",
            "agency",
            "title",
            "required_by_model",
            "country",
            "lvc_status",
            "project_type",
            "legacy_project_type",
            "bp_chemical_type",
            "project_cluster",
            "chemical_detail",
            "amount_polyol",
            "sector",
            "subsector",
            "legacy_sector_and_subsector",
            "status",
            "is_multi_year",
            "reason_for_exceeding",
            "remarks",
            "remarks_additional",
            "values",
        ]

    def get_agency(self, obj):
        return obj.business_plan.agency.name

    def get_chemical_detail(self, obj):
        return "/".join(
            chem.name
            for chem in itertools.chain(
                obj.substances.all(),
                obj.blends.all(),
            )
        )


class BPRecordDetailSerializer(serializers.ModelSerializer):
    country = CountrySerializer()
    lvc_status = serializers.ChoiceField(choices=BPRecord.LVCStatus.choices)
    project_type = ProjectTypeSerializer()
    status = serializers.ChoiceField(choices=BPRecord.Status.choices)
    bp_chemical_type = BPChemicalTypeSerializer()
    is_multi_year_display = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()

    substances = serializers.SlugRelatedField("name", many=True, read_only=True)
    blends = serializers.SlugRelatedField(slug_field="name", many=True, read_only=True)

    sector = ProjectSectorSerializer()
    subsector = ProjectSubSectorSerializer()
    values = BPRecordValueSerializer(many=True)

    class Meta:
        model = BPRecord
        fields = [
            "id",
            "title",
            "required_by_model",
            "country",
            "lvc_status",
            "project_type",
            "bp_chemical_type",
            "substances",
            "blends",
            "amount_polyol",
            "sector",
            "subsector",
            "legacy_sector_and_subsector",
            "status",
            "is_multi_year",
            "reason_for_exceeding",
            "remarks",
            "remarks_additional",
            "values",
            "is_multi_year_display",
            "status_display",
            "comment_secretariat",
        ]

    def get_is_multi_year_display(self, obj):
        if obj.is_multi_year:
            return "Multi-Year"
        return "Individual"

    def get_status_display(self, obj):
        return obj.get_status_display()


class BPRecordCreateSerializer(serializers.ModelSerializer):
    business_plan_id = serializers.PrimaryKeyRelatedField(
        queryset=BusinessPlan.objects.all().values_list("id", flat=True),
    )
    country_id = serializers.PrimaryKeyRelatedField(
        queryset=Country.objects.all().values_list("id", flat=True),
    )
    lvc_status = serializers.ChoiceField(choices=BPRecord.LVCStatus.choices)
    project_type_id = serializers.PrimaryKeyRelatedField(
        queryset=ProjectType.objects.all().values_list("id", flat=True),
    )
    status = serializers.ChoiceField(choices=BPRecord.Status.choices)
    bp_chemical_type_id = serializers.PrimaryKeyRelatedField(
        queryset=BPChemicalType.objects.all().values_list("id", flat=True),
    )

    substances = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Substance.objects.all().values_list("id", flat=True),
    )
    blends = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Blend.objects.all().values_list("id", flat=True),
    )

    sector_id = serializers.PrimaryKeyRelatedField(
        queryset=ProjectSector.objects.all().values_list("id", flat=True),
    )
    subsector_id = serializers.PrimaryKeyRelatedField(
        queryset=ProjectSubSector.objects.all().values_list("id", flat=True),
    )
    values = BPRecordValueSerializer(many=True)

    class Meta:
        model = BPRecord
        fields = [
            "id",
            "business_plan_id",
            "title",
            "required_by_model",
            "country_id",
            "lvc_status",
            "project_type_id",
            "bp_chemical_type_id",
            "substances",
            "blends",
            "amount_polyol",
            "sector_id",
            "subsector_id",
            "legacy_sector_and_subsector",
            "status",
            "is_multi_year",
            "reason_for_exceeding",
            "remarks",
            "remarks_additional",
            "comment_secretariat",
            "values",
        ]

    def _create_bp_record_values(self, bp_record, record_values):
        bp_record.values.all().delete()

        for record_value in record_values:
            record_value["bp_record_id"] = bp_record.id
        record_value_serializer = BPRecordValueSerializer(data=record_values, many=True)
        record_value_serializer.is_valid(raise_exception=True)
        record_value_serializer.save()

    @transaction.atomic
    def create(self, validated_data):
        record_values = validated_data.pop("values", [])
        bp_record = super().create(validated_data)
        self._create_bp_record_values(bp_record, record_values)

        return bp_record

    @transaction.atomic
    def update(self, instance, validated_data):
        record_values = validated_data.pop("values", [])
        bp_record = super().update(instance, validated_data)
        self._create_bp_record_values(bp_record, record_values)

        return bp_record


class BusinessPlanCreateSerializer(serializers.ModelSerializer):
    agency_id = serializers.PrimaryKeyRelatedField(
        queryset=Agency.objects.all().values_list("id", flat=True),
    )
    status = serializers.ChoiceField(
        choices=BusinessPlan.Status.choices, required=False
    )
    records = BPRecordCreateSerializer(many=True, required=False)

    class Meta:
        model = BusinessPlan
        fields = [
            "id",
            "name",
            "year_start",
            "year_end",
            "agency_id",
            "status",
            "records",
        ]

    def _create_bp_records(self, business_plan, records):
        for record in records:
            record["business_plan_id"] = business_plan.id
        record_serializer = BPRecordCreateSerializer(data=records, many=True)
        record_serializer.is_valid(raise_exception=True)
        record_serializer.save()

    @transaction.atomic
    def create(self, validated_data):
        records = validated_data.pop("records", [])
        business_plan = super().create(validated_data)
        self._create_bp_records(business_plan, records)

        return business_plan


class BPFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessPlan
        fields = ["feedback_filename"]
