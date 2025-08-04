import copy

from django.urls import reverse
from rest_framework import serializers

from core.api.serializers import CountrySerializer
from core.api.serializers.agency import BusinessPlanAgencySerializer
from core.api.serializers.base import Many2ManyListField
from core.api.serializers.project_metadata import (
    ProjectClusterSerializer,
    ProjectSectorSerializer,
    ProjectSubSectorSerializer,
    ProjectTypeSerializer,
)
from core.models import (
    Agency,
    BPChemicalType,
    BPActivity,
    BPActivityValue,
    BusinessPlan,
    Country,
    ProjectCluster,
    ProjectSector,
    ProjectSubSector,
    ProjectType,
    Substance,
)
from core.models.business_plan import BPFile
from core.models.meeting import Decision, Meeting

# pylint: disable=R0902,R0915


class BPChemicalTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = BPChemicalType
        fields = [
            "id",
            "name",
            "obsolete",
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
            "value_co2",
        ]

    def to_internal_value(self, data):
        try:
            internal_value = super().to_internal_value(data)
        except serializers.ValidationError as e:
            # add `year` and `is_after` to error message
            error_dict = {}
            year = data["year"]
            is_after = data["is_after"]
            for field, errors in e.detail.items():
                if is_after:
                    error_dict[f"{field}_{year}_after"] = errors
                else:
                    error_dict[f"{field}_{year}"] = errors

            raise serializers.ValidationError(error_dict) from e

        return internal_value


class BusinessPlanSerializer(serializers.ModelSerializer):
    status = serializers.ChoiceField(
        choices=BusinessPlan.Status.choices, required=False
    )
    updated_by = serializers.StringRelatedField(
        read_only=True, source="updated_by.username"
    )
    meeting_number = serializers.SlugRelatedField(
        "number", read_only=True, source="meeting"
    )
    decision_number = serializers.SlugRelatedField(
        "number", read_only=True, source="decision"
    )

    class Meta:
        model = BusinessPlan
        fields = [
            "id",
            "name",
            "status",
            "year_start",
            "year_end",
            "meeting_number",
            "meeting_id",
            "decision_id",
            "decision_number",
            "updated_at",
            "updated_by",
        ]


class BPActivityExportSerializer(serializers.ModelSerializer):
    agency = serializers.SerializerMethodField()
    lvc_status = serializers.ChoiceField(choices=BPActivity.LVCStatus.choices)
    project_type = serializers.SlugRelatedField("name", read_only=True)
    status = serializers.ChoiceField(choices=BPActivity.Status.choices)
    bp_chemical_type = serializers.SlugRelatedField("name", read_only=True)
    chemical_detail = serializers.SerializerMethodField()
    country = serializers.SlugRelatedField("name", read_only=True)
    project_cluster = serializers.SlugRelatedField("name", read_only=True)

    sector = serializers.SlugRelatedField("name", read_only=True)
    subsector = serializers.SlugRelatedField("name", read_only=True)
    values = BPActivityValueSerializer(many=True)
    display_internal_id = serializers.SerializerMethodField()
    is_multi_year_display = serializers.SerializerMethodField()

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
            "is_multi_year_display",
            "reason_for_exceeding",
            "remarks",
            "values",
        ]

    def get_agency(self, obj):
        if obj.agency.name == "Treasurer (Cash Pool)":
            return "Treasurer"
        return obj.agency.name

    def get_chemical_detail(self, obj):
        return "/".join(chem.name for chem in obj.substances.all())

    def get_display_internal_id(self, obj):
        if obj.agency.name == "Treasurer (Cash Pool)":
            agency_code = "Treasurer"
        else:
            agency_code = obj.agency.name
        country_code = obj.country.iso3 or obj.country.name
        # add 0 padding to internal_id to make it 9 digits
        internal_id = str(obj.initial_id).zfill(9)
        return f"{agency_code}-{country_code}-{internal_id}"

    def get_is_multi_year_display(self, obj):
        return "M" if obj.is_multi_year else "I"


class BPActivityDetailSerializer(serializers.ModelSerializer):
    agency = BusinessPlanAgencySerializer()
    country = CountrySerializer()
    business_plan = BusinessPlanSerializer(read_only=True)
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

    sector = ProjectSectorSerializer()
    sector_code = serializers.SerializerMethodField()
    subsector = ProjectSubSectorSerializer()
    values = BPActivityValueSerializer(many=True)

    class Meta:
        model = BPActivity
        fields = [
            "id",
            "initial_id",
            "title",
            "required_by_model",
            "business_plan",
            "agency",
            "agency_id",
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
            "values",
            "is_multi_year_display",
            "status_display",
        ]

    def get_is_multi_year_display(self, obj):
        if obj.is_multi_year:
            return "Multi-Year"
        return "Individual"

    def get_status_display(self, obj):
        return obj.get_status_display()

    def get_project_type_code(self, obj):
        return obj.project_type.code if obj.project_type else ""

    def get_sector_code(self, obj):
        return obj.sector.code if obj.sector else ""


class BPActivityListSerializer(BPActivityDetailSerializer):
    bp_status = serializers.SerializerMethodField()
    display_internal_id = serializers.SerializerMethodField()

    class Meta(BPActivityDetailSerializer.Meta):
        fields = [
            "bp_status",
            "display_internal_id",
        ] + BPActivityDetailSerializer.Meta.fields

    def get_bp_status(self, obj):
        return obj.business_plan.status

    def get_display_internal_id(self, obj):
        if obj.agency.name == "Treasurer (Cash Pool)":
            agency_code = "Treasurer"
        else:
            agency_code = obj.agency.name
        country_code = obj.country.iso3 or obj.country.name
        # add 0 padding to internal_id to make it 9 digits
        internal_id = str(obj.initial_id).zfill(9)
        return f"{agency_code}-{country_code}-{internal_id}"


class BPActivityCreateSerializer(serializers.ModelSerializer):
    # don't use `PrimaryKeyRelatedField`; makes 1 query / item when `many=True`
    # FKs will be manually validated
    business_plan_id = serializers.IntegerField(required=False)
    title = serializers.CharField(allow_blank=True)
    agency_id = serializers.IntegerField()
    country_id = serializers.IntegerField()
    lvc_status = serializers.ChoiceField(
        choices=BPActivity.LVCStatus.choices, allow_blank=True
    )
    project_type_id = serializers.IntegerField(allow_null=True)
    project_type_code = serializers.CharField(write_only=True, allow_blank=True)
    status = serializers.ChoiceField(
        choices=BPActivity.Status.choices, allow_blank=True
    )
    bp_chemical_type_id = serializers.IntegerField(allow_null=True)
    project_cluster_id = serializers.IntegerField(allow_null=True)

    # Many2Many represented as list of integers and manually validated
    substances = Many2ManyListField(child=serializers.IntegerField())

    sector_id = serializers.IntegerField(allow_null=True)
    sector_code = serializers.CharField(write_only=True, allow_blank=True)
    subsector_id = serializers.IntegerField(allow_null=True)
    values = BPActivityValueSerializer(many=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # get all related obj IDs only once for validation
        self.agency_ids = Agency.objects.exclude(
            name__in=[
                "China (FECO)",
            ]
        ).values_list("id", flat=True)

        self.country_ids = Country.get_business_plan_countries().values_list(
            "id", flat=True
        )
        self.project_type_ids = ProjectType.objects.filter(obsolete=False).values_list(
            "id", flat=True
        )
        self.bp_chemical_type_ids = BPChemicalType.objects.filter(
            obsolete=False
        ).values_list("id", flat=True)
        self.project_cluster_ids = ProjectCluster.objects.filter(
            obsolete=False
        ).values_list("id", flat=True)
        self.sector_ids = ProjectSector.objects.filter(obsolete=False).values_list(
            "id", flat=True
        )
        self.subsector_ids = ProjectSubSector.objects.filter(
            obsolete=False
        ).values_list("id", flat=True)
        self.substance_ids = Substance.objects.values_list("id", flat=True)

    def validate_agency_id(self, agency_id):
        if agency_id not in self.agency_ids:
            raise serializers.ValidationError("Agency not found")
        return agency_id

    def validate_country_id(self, country_id):
        if country_id not in self.country_ids:
            raise serializers.ValidationError("Country not found")
        return country_id

    def validate_project_type_id(self, project_type_id):
        if project_type_id and project_type_id not in self.project_type_ids:
            raise serializers.ValidationError("ProjectType not found")
        return project_type_id

    def validate_bp_chemical_type_id(self, bp_chemical_type_id):
        if bp_chemical_type_id and bp_chemical_type_id not in self.bp_chemical_type_ids:
            raise serializers.ValidationError("BPChemicalType not found")
        return bp_chemical_type_id

    def validate_project_cluster_id(self, project_cluster_id):
        if project_cluster_id and project_cluster_id not in self.project_cluster_ids:
            raise serializers.ValidationError("ProjectCluster not found")
        return project_cluster_id

    def validate_sector_id(self, sector_id):
        if sector_id and sector_id not in self.sector_ids:
            raise serializers.ValidationError("Sector not found")
        return sector_id

    def validate_subsector_id(self, subsector_id):
        if subsector_id and subsector_id not in self.subsector_ids:
            raise serializers.ValidationError("SubSector not found")
        return subsector_id

    def validate_substances(self, substances):
        for substance_id in substances:
            if substance_id not in self.substance_ids:
                raise serializers.ValidationError("Substance not found")
        return substances

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
            "business_plan_id",
            "title",
            "required_by_model",
            "agency_id",
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
            "values",
        ]


class BusinessPlanCreateSerializer(serializers.ModelSerializer):
    meeting_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=Meeting.objects.all().values_list("id", flat=True),
        allow_null=True,
    )
    decision_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=Decision.objects.all().values_list("id", flat=True),
        allow_null=True,
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
            "status",
            "meeting_id",
            "decision_id",
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

    def _create_bp_activities(self, business_plan, activities):
        activity_objs = []
        activities_copy = copy.deepcopy(activities)
        for activity in activities_copy:
            # set `business_plan_id` for each activity
            activity["business_plan_id"] = business_plan.id
            # remove Many2Many fields
            activity.pop("values", [])
            activity.pop("substances", [])
            activity.pop("project_type_code", "")
            activity.pop("sector_code", "")

            activity_objs.append(BPActivity(**activity))

        # bulk create all activities for this bp
        activity_objs = BPActivity.objects.bulk_create(activity_objs, batch_size=1000)

        activity_values = []
        m2m_substances = []
        for instance, activity_data in zip(activity_objs, activities, strict=True):
            # set Many2Many fields after all activities are created
            substance_ids = activity_data.get("substances", [])
            m2m_substances += self.create_m2m_substances(instance, substance_ids)

            for activity_value in activity_data.get("values", []):
                # set `bp_activity_id` for each value
                activity_value["bp_activity_id"] = instance.id
                activity_values.append(BPActivityValue(**activity_value))

        # bulk create Many2Many relations
        BPActivity.substances.through.objects.bulk_create(
            m2m_substances, batch_size=1000
        )
        # bulk create activity values
        BPActivityValue.objects.bulk_create(activity_values, batch_size=1000)

    def _bulk_create_m2m_relations(self, activity_objs, activities):
        activity_values = []
        m2m_substances = []
        for instance, activity_data in zip(activity_objs, activities, strict=True):
            # set Many2Many fields after all activities are created
            substance_ids = activity_data.get("substances", [])
            m2m_substances += self.create_m2m_substances(instance, substance_ids)

            # update existing values or create new ones
            for activity_value in activity_data.get("values", []):
                activity_value["bp_activity_id"] = instance.id
                if "id" in activity_value:
                    # update existing value
                    activity_value_obj, _ = BPActivityValue.objects.update_or_create(
                        id=activity_value["id"], defaults=activity_value
                    )
                else:
                    # create new value
                    activity_value_obj = BPActivityValue(**activity_value)
                activity_values.append(activity_value_obj)
        # bulk create Many2Many relations
        BPActivity.substances.through.objects.bulk_create(
            m2m_substances, batch_size=1000
        )
        # bulk create activity values
        BPActivityValue.objects.bulk_create(activity_values, batch_size=1000)

    def _update_bp_activities(self, business_plan, activities, from_import=False):
        # update existing activities
        create_activity_objs = []
        create_activities = []
        initial_update_activities = []
        update_activities = []
        if from_import:
            initial_instances = BPActivity.objects.filter(
                business_plan=business_plan
            ).values_list("initial_id", flat=True)
        else:
            initial_instances = BPActivity.objects.filter(
                business_plan=business_plan
            ).values_list("id", flat=True)
        for activity in activities:
            if from_import:
                identifier = activity.get("initial_id", None)
            else:
                identifier = activity.get("id", None)
            if not identifier:
                # set `business_plan_id` for each activity
                create_activities.append(copy.deepcopy(activity))
                activity.pop("values", [])
                activity.pop("substances", [])
                activity.pop("project_type_code", "")
                activity.pop("sector_code", "")
                activity["business_plan_id"] = business_plan.id
                create_activity_objs.append(BPActivity(**activity))
            elif identifier not in initial_instances:
                # if the activity is not found, create a new one
                create_activities.append(copy.deepcopy(activity))
                activity.pop("values", [])
                activity.pop("substances", [])
                activity.pop("project_type_code", "")
                activity.pop("sector_code", "")
                activity["business_plan_id"] = business_plan.id
                create_activity_objs.append(BPActivity(**activity))
            else:
                # if the activity is found, update it
                initial_update_activities.append((identifier, copy.deepcopy(activity)))

        # bulk create new activities for this bp
        create_activity_objs = BPActivity.objects.bulk_create(
            create_activity_objs, batch_size=1000
        )
        self._bulk_create_m2m_relations(create_activity_objs, create_activities)
        # bulk update all activities for this bp
        if from_import:
            instances = BPActivity.objects.filter(
                initial_id__in=[
                    activity_id for activity_id, _ in initial_update_activities
                ],
                business_plan=business_plan,
            )
            instances_ids = [instance.initial_id for instance in instances]
            for identifier, activity_data in initial_update_activities:
                if identifier in instances_ids:
                    update_activities.append((identifier, activity_data))
        else:
            instances = BPActivity.objects.filter(
                id__in=[activity_id for activity_id, _ in initial_update_activities],
                business_plan=business_plan,
            )
            instances_ids = [instance.id for instance in instances]
            for identifier, activity_data in initial_update_activities:
                if identifier in instances_ids:
                    update_activities.append((identifier, activity_data))

        fields_to_update = [
            "title",
            "required_by_model",
            "agency_id",
            "country_id",
            "lvc_status",
            "project_type_id",
            "bp_chemical_type_id",
            "project_cluster_id",
            "amount_polyol",
            "sector_id",
            "subsector_id",
            "legacy_sector_and_subsector",
            "status",
            "is_multi_year",
            "reason_for_exceeding",
            "remarks",
        ]
        for instance, (identifier, activity_data) in zip(
            instances, update_activities, strict=True
        ):
            for field in fields_to_update:
                setattr(instance, field, activity_data.get(field, None))

        BPActivity.objects.bulk_update(instances, fields_to_update, batch_size=1000)

        # delete old M2M activities
        BPActivity.substances.through.objects.filter(
            bpactivity_id__in=instances
        ).delete()
        BPActivityValue.objects.filter(bp_activity_id__in=instances).delete()

        # recreate M2M relations
        self._bulk_create_m2m_relations(
            instances, [activity for _, activity in update_activities]
        )

        # delete activities that are not in create or update lists
        create_activity_ids = set(activity.id for activity in create_activity_objs)
        update_activity_ids = [instance.id for instance in instances]
        bp_activities = BPActivity.objects.filter(business_plan=business_plan).exclude(
            id__in=create_activity_ids
        )
        bp_activities = bp_activities.exclude(id__in=update_activity_ids)
        bp_activities.delete()

    def create(self, validated_data):
        activities = validated_data.pop("activities", [])
        business_plan = super().create(validated_data)
        self._create_bp_activities(business_plan, activities)
        return business_plan

    def update(self, instance, validated_data):
        from_import = validated_data.pop("from_import", False)
        activities = validated_data.pop("activities", [])
        # update business plan fields
        instance = super().update(instance, validated_data)
        # update existing activities
        self._update_bp_activities(instance, activities, from_import=from_import)
        return instance


class BPFileSerializer(serializers.ModelSerializer):
    status = serializers.ChoiceField(choices=BusinessPlan.Status.choices, required=True)
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = BPFile
        fields = [
            "id",
            "status",
            "year_start",
            "year_end",
            "uploaded_at",
            "filename",
            "download_url",
        ]

    def get_download_url(self, obj):
        return reverse("business-plan-file-download", args=(obj.id,))
