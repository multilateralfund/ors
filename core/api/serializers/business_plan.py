from django.shortcuts import get_object_or_404
from django.urls import reverse
from rest_framework import serializers

from core.api.serializers import CountrySerializer
from core.api.serializers.agency import AgencySerializer
from core.api.serializers.base import BulkCreateListSerializer
from core.api.serializers.project import ProjectClusterSerializer
from core.api.serializers.project import ProjectSectorSerializer
from core.api.serializers.project import ProjectSubSectorSerializer
from core.api.serializers.project import ProjectTypeSerializer
from core.api.utils import PROJECT_SECTOR_TYPE_MAPPING
from core.models import (
    Agency,
    BPChemicalType,
    BPActivity,
    BPActivityValue,
    BusinessPlan,
    CommentType,
    Country,
    ProjectCluster,
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
    bp_activity_id = serializers.IntegerField(required=False, write_only=True)

    class Meta:
        model = BPActivityValue
        fields = [
            "id",
            "bp_activity_id",
            "year",
            "is_after",
            "value_usd",
            "value_odp",
            "value_mt",
        ]
        list_serializer_class = BulkCreateListSerializer

    def create(self, validated_data):
        return BPActivityValue(**validated_data)


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
            "version",
            "is_latest",
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
    comment_types = serializers.SlugRelatedField("name", many=True, read_only=True)

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
            "comment_secretariat",
            "comment_types",
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

    substances = serializers.SlugRelatedField(
        "id",
        many=True,
        read_only=True,
        help_text="List of substances IDs",
    )
    substances_display = serializers.SlugRelatedField(
        "name",
        many=True,
        read_only=True,
        help_text="List of substances names",
        source="substances",
    )
    comment_types = serializers.SlugRelatedField("name", many=True, read_only=True)

    sector = ProjectSectorSerializer()
    subsector = ProjectSubSectorSerializer()
    values = BPActivityValueSerializer(many=True)

    is_updated = serializers.BooleanField(read_only=True)

    class Meta:
        model = BPActivity
        fields = [
            "id",
            "initial_id",
            "is_updated",
            "title",
            "required_by_model",
            "country",
            "country_id",
            "lvc_status",
            "project_type",
            "project_type_id",
            "bp_chemical_type",
            "bp_chemical_type_id",
            "project_cluster",
            "project_cluster_id",
            "substances",
            "substances_display",
            "amount_polyol",
            "sector",
            "sector_id",
            "subsector",
            "subsector_id",
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
    business_plan_id = serializers.IntegerField(required=False)
    country_id = serializers.IntegerField()
    lvc_status = serializers.ChoiceField(choices=BPActivity.LVCStatus.choices)
    project_type_id = serializers.IntegerField()
    status = serializers.ChoiceField(choices=BPActivity.Status.choices)
    bp_chemical_type_id = serializers.IntegerField()
    project_cluster_id = serializers.IntegerField()

    substances = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Substance.objects.all().values_list("id", flat=True),
    )
    comment_types = serializers.PrimaryKeyRelatedField(
        required=False,
        many=True,
        queryset=CommentType.objects.all().values_list("id", flat=True),
    )

    sector_id = serializers.IntegerField()
    subsector_id = serializers.IntegerField()
    values = BPActivityValueSerializer(many=True)

    is_updated = serializers.BooleanField(read_only=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.country_ids = Country.objects.values_list("id", flat=True)
        self.bp_chemical_type_ids = BPChemicalType.objects.values_list("id", flat=True)
        self.project_cluster_ids = ProjectCluster.objects.values_list("id", flat=True)
        self.subsector_ids = ProjectSubSector.objects.values_list("id", flat=True)

    def validate(self, attrs):
        # check only once if project sector and type exist
        sector = get_object_or_404(ProjectSector, id=attrs.get("sector_id"))
        project_type = get_object_or_404(ProjectType, id=attrs.get("project_type_id"))

        if sector.code in PROJECT_SECTOR_TYPE_MAPPING:
            if project_type.code not in PROJECT_SECTOR_TYPE_MAPPING[sector.code]:
                raise serializers.ValidationError("Invalid sector - type combination")

        return super().validate(attrs)

    def validate_country_id(self, country_id):
        if country_id not in self.country_ids:
            raise serializers.ValidationError("Country not found")
        return country_id

    def validate_bp_chemical_type_id(self, bp_chemical_type_id):
        if bp_chemical_type_id not in self.bp_chemical_type_ids:
            raise serializers.ValidationError("BPChemicalType not found")
        return bp_chemical_type_id

    def validate_project_cluster_id(self, project_cluster_id):
        if project_cluster_id not in self.project_cluster_ids:
            raise serializers.ValidationError("ProjectCluster not found")
        return project_cluster_id

    def validate_subsector_id(self, subsector_id):
        if subsector_id not in self.subsector_ids:
            raise serializers.ValidationError("SubSector not found")
        return subsector_id

    def validate_values(self, values):
        is_after_count = 0
        for value in values:
            if value.get("is_after"):
                is_after_count += 1

        if is_after_count > 1:
            raise serializers.ValidationError(
                "Multiple values with is_after=true found"
            )

        return values

    class Meta:
        model = BPActivity
        fields = [
            "id",
            "initial_id",
            "is_updated",
            "business_plan_id",
            "title",
            "required_by_model",
            "country_id",
            "lvc_status",
            "project_type_id",
            "bp_chemical_type_id",
            "project_cluster_id",
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
        list_serializer_class = BulkCreateListSerializer

    def create(self, validated_data):
        data = validated_data.copy()
        data.pop("values", [])
        data.pop("substances", [])
        data.pop("comment_types", [])

        return BPActivity(**data)


class BusinessPlanCreateSerializer(serializers.ModelSerializer):
    agency_id = serializers.PrimaryKeyRelatedField(
        queryset=Agency.objects.all().values_list("id", flat=True),
    )
    status = serializers.ChoiceField(choices=BusinessPlan.Status.choices, required=True)
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

    def _create_bp_activity_values(self, activity_values):
        activity_value_serializer = BPActivityValueSerializer(
            data=activity_values, many=True
        )
        activity_value_serializer.is_valid(raise_exception=True)
        activity_value_serializer.save()

    def _create_bp_activities(self, business_plan, activities):
        ignore_comment = self.context.get("ignore_comment", False)
        for activity in activities:
            activity["business_plan_id"] = business_plan.id
            if ignore_comment:
                activity.pop("comment_secretariat", "")
                activity.pop("comment_types", [])

        activity_serializer = BPActivityCreateSerializer(data=activities, many=True)
        activity_serializer.is_valid(raise_exception=True)
        activity_serializer.save()

        activity_values = []
        for instance, activity_data in zip(
            activity_serializer.instance, activities, strict=True
        ):
            substances = activity_data.get("substances", [])
            comment_types = activity_data.get("comment_types", [])
            instance.substances.set(substances)
            instance.comment_types.set(comment_types)

            for activity_value in activity_data.get("values", []):
                activity_value["bp_activity_id"] = instance.id
                activity_values.append(activity_value)

        self._create_bp_activity_values(activity_values)

    def create(self, validated_data):
        activities = validated_data.pop("activities", [])
        business_plan = super().create(validated_data)
        self._create_bp_activities(business_plan, activities)

        return business_plan


class BPFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessPlan
        fields = ["feedback_filename"]
