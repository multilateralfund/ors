from django.db import transaction
from django.urls import reverse
from rest_framework import serializers

from core.api.serializers import CountrySerializer
from core.api.serializers.agency import AgencySerializer
from core.api.serializers.project import ProjectClusterSerializer
from core.api.serializers.project import ProjectSectorSerializer
from core.api.serializers.project import ProjectSubSectorSerializer
from core.api.serializers.project import ProjectTypeSerializer
from core.models import (
    Agency,
    BPChemicalType,
    BPActivity,
    BPActivityValue,
    BusinessPlan,
    CommentType,
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


class BPActivityValueSerializer(serializers.ModelSerializer):
    bp_activity_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=BPActivity.objects.all().values_list("id", flat=True),
        write_only=True,
    )

    class Meta:
        model = BPActivityValue
        fields = [
            "id",
            "bp_activity_id",
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


class BPActivityExportSerializer(serializers.ModelSerializer):
    agency = serializers.SerializerMethodField()
    lvc_status = serializers.ChoiceField(choices=BPActivity.LVCStatus.choices)
    project_type = serializers.SlugRelatedField("code", read_only=True)
    status = serializers.ChoiceField(choices=BPActivity.Status.choices)
    bp_chemical_type = serializers.SlugRelatedField("name", read_only=True)
    chemical_detail = serializers.SerializerMethodField()
    country = serializers.SlugRelatedField("name", read_only=True)
    project_cluster = serializers.SlugRelatedField("name", read_only=True)

    sector = serializers.SlugRelatedField("name", read_only=True)
    subsector = serializers.SlugRelatedField("name", read_only=True)
    values = BPActivityValueSerializer(many=True)

    class Meta:
        model = BPActivity
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
        return "/".join(chem.name for chem in obj.substances.all())


class BPActivityDetailSerializer(serializers.ModelSerializer):
    country = CountrySerializer()
    lvc_status = serializers.ChoiceField(choices=BPActivity.LVCStatus.choices)
    project_type = ProjectTypeSerializer()
    status = serializers.ChoiceField(choices=BPActivity.Status.choices)
    bp_chemical_type = BPChemicalTypeSerializer()
    is_multi_year_display = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    project_cluster = ProjectClusterSerializer()

    substances = serializers.SlugRelatedField("name", many=True, read_only=True)
    comment_types = serializers.SlugRelatedField("name", many=True, read_only=True)

    sector = ProjectSectorSerializer()
    subsector = ProjectSubSectorSerializer()
    values = BPActivityValueSerializer(many=True)

    class Meta:
        model = BPActivity
        fields = [
            "id",
            "title",
            "required_by_model",
            "country",
            "lvc_status",
            "project_type",
            "bp_chemical_type",
            "project_cluster",
            "substances",
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
            "comment_types",
        ]

    def get_is_multi_year_display(self, obj):
        if obj.is_multi_year:
            return "Multi-Year"
        return "Individual"

    def get_status_display(self, obj):
        return obj.get_status_display()


class BPActivityListSerializer(BPActivityDetailSerializer):
    agency = serializers.SerializerMethodField()

    class Meta(BPActivityDetailSerializer.Meta):
        fields = ["agency"] + BPActivityDetailSerializer.Meta.fields

    def get_agency(self, obj):
        return obj.business_plan.agency.name


class BPActivityCreateSerializer(serializers.ModelSerializer):
    business_plan_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=BusinessPlan.objects.all().values_list("id", flat=True),
    )
    country_id = serializers.PrimaryKeyRelatedField(
        queryset=Country.objects.all().values_list("id", flat=True),
    )
    lvc_status = serializers.ChoiceField(choices=BPActivity.LVCStatus.choices)
    project_type_id = serializers.PrimaryKeyRelatedField(
        queryset=ProjectType.objects.all().values_list("id", flat=True),
    )
    status = serializers.ChoiceField(choices=BPActivity.Status.choices)
    bp_chemical_type_id = serializers.PrimaryKeyRelatedField(
        queryset=BPChemicalType.objects.all().values_list("id", flat=True),
    )

    substances = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Substance.objects.all().values_list("id", flat=True),
    )
    comment_types = serializers.PrimaryKeyRelatedField(
        required=False,
        many=True,
        queryset=CommentType.objects.all().values_list("id", flat=True),
    )

    sector_id = serializers.PrimaryKeyRelatedField(
        queryset=ProjectSector.objects.all().values_list("id", flat=True),
    )
    subsector_id = serializers.PrimaryKeyRelatedField(
        queryset=ProjectSubSector.objects.all().values_list("id", flat=True),
    )
    values = BPActivityValueSerializer(many=True)

    class Meta:
        model = BPActivity
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
            "comment_types",
            "values",
        ]

    def _create_bp_activity_values(self, bp_activity, activity_values):
        bp_activity.values.all().delete()

        for activity_value in activity_values:
            activity_value["bp_activity_id"] = bp_activity.id
        activity_value_serializer = BPActivityValueSerializer(
            data=activity_values, many=True
        )
        activity_value_serializer.is_valid(raise_exception=True)
        activity_value_serializer.save()

    @transaction.atomic
    def create(self, validated_data):
        if self.context.get("ignore_comment", False):
            validated_data.pop("comment_secretariat", "")
            validated_data.pop("comment_types", [])

        activity_values = validated_data.pop("values", [])
        bp_activity = super().create(validated_data)
        self._create_bp_activity_values(bp_activity, activity_values)

        return bp_activity


class BusinessPlanCreateSerializer(serializers.ModelSerializer):
    agency_id = serializers.PrimaryKeyRelatedField(
        queryset=Agency.objects.all().values_list("id", flat=True),
    )
    status = serializers.ChoiceField(
        choices=BusinessPlan.Status.choices, required=False
    )
    activities = BPActivityCreateSerializer(many=True, required=False)

    class Meta:
        model = BusinessPlan
        fields = [
            "id",
            "name",
            "year_start",
            "year_end",
            "agency_id",
            "status",
            "activities",
        ]

    def _create_bp_activities(self, business_plan, activities):
        for activity in activities:
            activity["business_plan_id"] = business_plan.id

        ignore_comment = self.context.get("ignore_comment", False)
        activity_serializer = BPActivityCreateSerializer(
            data=activities, many=True, context={"ignore_comment": ignore_comment}
        )
        activity_serializer.is_valid(raise_exception=True)
        activity_serializer.save()

    @transaction.atomic
    def create(self, validated_data):
        activities = validated_data.pop("activities", [])
        business_plan = super().create(validated_data)
        self._create_bp_activities(business_plan, activities)

        return business_plan


class BPFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessPlan
        fields = ["feedback_filename"]
