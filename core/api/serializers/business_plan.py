import copy

from django.urls import reverse
from rest_framework import serializers

from core.api.serializers import CountrySerializer
from core.api.serializers.agency import AgencySerializer
from core.api.serializers.base import Many2ManyListField
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
from core.models.business_plan import BPFile

# pylint: disable=R0902


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


class BusinessPlanSerializer(serializers.ModelSerializer):
    agency = AgencySerializer()
    status = serializers.ChoiceField(
        choices=BusinessPlan.Status.choices, required=False
    )
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
            "updated_at",
            "updated_by",
        ]


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
    display_internal_id = serializers.SerializerMethodField()

    class Meta:
        model = BPActivity
        fields = [
            "id",
            "display_internal_id",
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

    def get_display_internal_id(self, obj):
        agency_code = obj.business_plan.agency.name
        country_code = obj.country.abbr or obj.country.name
        # add 0 padding to internal_id to make it 9 digits
        internal_id = str(obj.initial_id).zfill(9)
        return f"{agency_code}-{country_code}-{internal_id}"


class BPActivityDetailSerializer(serializers.ModelSerializer):
    country = CountrySerializer()
    lvc_status = serializers.ChoiceField(choices=BPActivity.LVCStatus.choices)
    project_type = ProjectTypeSerializer()
    project_type_code = serializers.SerializerMethodField()
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
    sector_code = serializers.SerializerMethodField()
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
            "project_type_code",
            "bp_chemical_type",
            "bp_chemical_type_id",
            "project_cluster",
            "project_cluster_id",
            "substances",
            "substances_display",
            "amount_polyol",
            "sector",
            "sector_id",
            "sector_code",
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

    def get_project_type_code(self, obj):
        return obj.project_type.code

    def get_sector_code(self, obj):
        return obj.sector.code if obj.sector else ""


class BPActivityListSerializer(BPActivityDetailSerializer):
    agency = serializers.SerializerMethodField()

    class Meta(BPActivityDetailSerializer.Meta):
        fields = ["agency"] + BPActivityDetailSerializer.Meta.fields

    def get_agency(self, obj):
        return obj.business_plan.agency.name


class BPActivityCreateSerializer(serializers.ModelSerializer):
    # don't use `PrimaryKeyRelatedField`; makes 1 query / item when `many=True`
    # FKs will be manually validated
    business_plan_id = serializers.IntegerField(required=False)
    country_id = serializers.IntegerField()
    lvc_status = serializers.ChoiceField(choices=BPActivity.LVCStatus.choices)
    project_type_id = serializers.IntegerField()
    project_type_code = serializers.CharField(write_only=True)
    status = serializers.ChoiceField(choices=BPActivity.Status.choices)
    bp_chemical_type_id = serializers.IntegerField()
    project_cluster_id = serializers.IntegerField()

    # Many2Many represented as list of integers and manually validated
    substances = Many2ManyListField(child=serializers.IntegerField())
    comment_types = Many2ManyListField(child=serializers.IntegerField(), required=False)

    sector_id = serializers.IntegerField()
    sector_code = serializers.CharField(write_only=True)
    subsector_id = serializers.IntegerField()
    values = BPActivityValueSerializer(many=True)

    is_updated = serializers.BooleanField(read_only=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # get all related obj IDs only once for validation
        self.country_ids = Country.objects.values_list("id", flat=True)
        self.project_type_ids = ProjectType.objects.values_list("id", flat=True)
        self.bp_chemical_type_ids = BPChemicalType.objects.values_list("id", flat=True)
        self.project_cluster_ids = ProjectCluster.objects.values_list("id", flat=True)
        self.sector_ids = ProjectSector.objects.values_list("id", flat=True)
        self.subsector_ids = ProjectSubSector.objects.values_list("id", flat=True)
        self.substance_ids = Substance.objects.values_list("id", flat=True)
        self.comment_type_ids = CommentType.objects.values_list("id", flat=True)

    def validate(self, attrs):
        sector_code = attrs.get("sector_code")
        if sector_code in PROJECT_SECTOR_TYPE_MAPPING:
            if (
                attrs.get("project_type_code")
                not in PROJECT_SECTOR_TYPE_MAPPING[sector_code]
            ):
                raise serializers.ValidationError("Invalid sector - type combination")

        return super().validate(attrs)

    def validate_country_id(self, country_id):
        if country_id not in self.country_ids:
            raise serializers.ValidationError("Country not found")
        return country_id

    def validate_project_type_id(self, project_type_id):
        if project_type_id not in self.project_type_ids:
            raise serializers.ValidationError("ProjectType not found")
        return project_type_id

    def validate_bp_chemical_type_id(self, bp_chemical_type_id):
        if bp_chemical_type_id not in self.bp_chemical_type_ids:
            raise serializers.ValidationError("BPChemicalType not found")
        return bp_chemical_type_id

    def validate_project_cluster_id(self, project_cluster_id):
        if project_cluster_id not in self.project_cluster_ids:
            raise serializers.ValidationError("ProjectCluster not found")
        return project_cluster_id

    def validate_sector_id(self, sector_id):
        if sector_id not in self.sector_ids:
            raise serializers.ValidationError("Sector not found")
        return sector_id

    def validate_subsector_id(self, subsector_id):
        if subsector_id not in self.subsector_ids:
            raise serializers.ValidationError("SubSector not found")
        return subsector_id

    def validate_substances(self, substances):
        for substance_id in substances:
            if substance_id not in self.substance_ids:
                raise serializers.ValidationError("Substance not found")
        return substances

    def validate_comment_types(self, comment_types):
        for comment_type_id in comment_types:
            if comment_type_id not in self.comment_type_ids:
                raise serializers.ValidationError("CommentType not found")
        return comment_types

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
            "project_type_code",
            "bp_chemical_type_id",
            "project_cluster_id",
            "substances",
            "amount_polyol",
            "sector_id",
            "sector_code",
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

    # don't call `save()` here
    def create_m2m_substances(self, bp_activity, substance_ids):
        through_objs = []
        for substance_id in substance_ids:
            through_objs.append(
                BPActivity.substances.through(
                    substance_id=substance_id, bpactivity_id=bp_activity.id
                )
            )
        return through_objs

    # don't call `save()` here
    def create_m2m_comment_types(self, bp_activity, comment_type_ids):
        through_objs = []
        for comment_type_id in comment_type_ids:
            through_objs.append(
                BPActivity.comment_types.through(
                    commenttype_id=comment_type_id, bpactivity_id=bp_activity.id
                )
            )
        return through_objs

    def _create_bp_activities(self, business_plan, activities):
        ignore_comment = self.context.get("ignore_comment", False)
        activity_objs = []
        activities_copy = copy.deepcopy(activities)
        for activity in activities_copy:
            # set `business_plan_id` for each activity
            activity["business_plan_id"] = business_plan.id
            # remove Many2Many fields
            activity.pop("values", [])
            activity.pop("substances", [])
            activity.pop("comment_types", [])
            activity.pop("project_type_code", "")
            activity.pop("sector_code", "")
            if ignore_comment:
                activity.pop("comment_secretariat", "")

            activity_objs.append(BPActivity(**activity))

        # bulk create all activities for this bp
        activity_objs = BPActivity.objects.bulk_create(activity_objs, batch_size=1000)

        activity_values = []
        m2m_substances = []
        m2m_comment_types = []
        for instance, activity_data in zip(activity_objs, activities, strict=True):
            # set Many2Many fields after all activities are created
            substance_ids = activity_data.get("substances", [])
            m2m_substances += self.create_m2m_substances(instance, substance_ids)
            if not ignore_comment:
                comment_type_ids = activity_data.get("comment_types", [])
                m2m_comment_types += self.create_m2m_comment_types(
                    instance, comment_type_ids
                )

            for activity_value in activity_data.get("values", []):
                # set `bp_activity_id` for each value
                activity_value["bp_activity_id"] = instance.id
                activity_values.append(BPActivityValue(**activity_value))

        # bulk create Many2Many relations
        BPActivity.substances.through.objects.bulk_create(
            m2m_substances, batch_size=1000
        )
        BPActivity.comment_types.through.objects.bulk_create(
            m2m_comment_types, batch_size=1000
        )
        # bulk create activity values
        BPActivityValue.objects.bulk_create(activity_values, batch_size=1000)

    def create(self, validated_data):
        activities = validated_data.pop("activities", [])
        business_plan = super().create(validated_data)
        self._create_bp_activities(business_plan, activities)

        return business_plan


class BPFileSerializer(serializers.ModelSerializer):
    agency_id = serializers.PrimaryKeyRelatedField(
        required=True,
        queryset=Agency.objects.all().values_list("id", flat=True),
    )
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = BPFile
        fields = [
            "id",
            "agency_id",
            "year_start",
            "year_end",
            "uploaded_at",
            "filename",
            "download_url",
        ]

    def get_download_url(self, obj):
        return reverse("business-plan-file-download", args=(obj.id,))
