from rest_framework import serializers
from core.models.agency import Agency
from core.models.blend import Blend
from core.models.country import Country

from core.models.project import (
    Project,
    ProjectOdsOdp,
    ProjectStatus,
    ProjectSubSector,
    ProjectType,
)
from core.models.project_submission import ProjectSubmission
from core.models.substance import Substance


class ProjectStatusSerializer(serializers.ModelSerializer):
    """
    ProjectStatusSerializer class
    """

    class Meta:
        model = ProjectStatus
        fields = [
            "id",
            "code",
            "name",
            "color",
        ]


class ProjectSubmissionSerializer(serializers.ModelSerializer):
    """
    ProjectSubmissionSerializer class
    """

    id = serializers.IntegerField(read_only=True)
    funds_allocated = serializers.FloatField(required=True)
    support_cost_13 = serializers.FloatField(required=True)
    category = serializers.CharField(required=True)

    class Meta:
        model = ProjectSubmission
        fields = [
            "id",
            "category",
            "submission_number",
            "programme_officer",
            "impact_tranche",
            "funds_allocated",
            "support_cost_13",
            "date_approved",
            "contingency_cost",
            "project_cost",
            "date_received",
            "revision_number",
            "date_of_revision",
            "agency_remarks",
            "comments",
            "withdrawn",
            "issue",
            "issue_description",
            "incomplete",
            "reviewed_mfs",
            "correspondance_no",
            "plus",
        ]

    def validate_category(self, value):
        categories = [
            x[0] for x in ProjectSubmission.ProjectSubmissionCategories.choices
        ]
        if value not in categories:
            raise serializers.ValidationError("Invalid category")
        return value


class ProjectOdsOdpSerializer(serializers.ModelSerializer):
    """
    ProjectOdsOdpSerializer class
    """

    ods_display_name = serializers.SerializerMethodField()
    ods_substance_id = serializers.IntegerField(required=False)
    ods_blend_id = serializers.IntegerField(required=False)

    class Meta:
        model = ProjectOdsOdp
        fields = [
            "id",
            "project_id",
            "ods_display_name",
            "odp",
            "ods_replacement",
            "co2_mt",
            "ods_type",
            "ods_substance_id",
            "ods_blend_id",
            "sort_order",
        ]
        read_only_fields = ["id"]

    def get_ods_display_name(self, obj):
        if obj.ods_display_name:
            return obj.ods_display_name
        if obj.ods_substance:
            return obj.ods_substance.name
        if obj.ods_blend:
            return obj.ods_blend.name
        return None

    def validate_ods_substance_id(self, value):
        substance = Substance.objects.filter(id=value).first()
        if not substance:
            raise serializers.ValidationError(f"Invalid ods substance id {value}")
        return value

    def validate_ods_blend_id(self, value):
        blend = Blend.objects.filter(id=value).first()
        if not blend:
            raise serializers.ValidationError(f"Invalid ods blend id {value}")
        return value

    def validate_ods_type(self, value):
        ods_types = [x[0] for x in ProjectOdsOdp.ProjectOdsOdpType.choices]
        if value not in ods_types:
            raise serializers.ValidationError("Invalid ods type")
        return value

    def validate(self, attrs):
        if not attrs.get("ods_substance_id") and not attrs.get("ods_blend_id"):
            raise serializers.ValidationError(
                "Either ods_substance_id or ods_blend_id is required"
            )
        return super().validate(attrs)


class ProjectListSerializer(serializers.ModelSerializer):
    """
    ProjectSerializer class
    """

    country = serializers.SlugRelatedField("name", read_only=True)
    agency = serializers.SlugRelatedField("name", read_only=True)
    sector = serializers.SerializerMethodField()
    subsector = serializers.SlugRelatedField("name", read_only=True)
    project_type = serializers.SlugRelatedField("name", read_only=True)
    status = serializers.SlugRelatedField("name", read_only=True)
    title = serializers.CharField(required=True)
    substance_type = serializers.CharField(required=True)
    submission = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id",
            "title",
            "country",
            "agency",
            "sector",
            "subsector",
            "project_type",
            "status",
            "substance_type",
            "approval_meeting_no",
            "submission",
        ]

    def get_submission(self, obj):
        request = self.context.get("request")
        if (
            request
            and request.query_params.get("get_submission", None)
            and hasattr(obj, "submission")
        ):
            return ProjectSubmissionSerializer(obj.submission).data
        return None

    def get_sector(self, obj):
        return obj.subsector.sector.name


class ProjectDetailsSerializer(ProjectListSerializer):
    """
    ProjectSerializer class
    """

    submission = ProjectSubmissionSerializer()
    ods_odp = ProjectOdsOdpSerializer(many=True)
    agency_id = serializers.IntegerField(required=True)
    country_id = serializers.IntegerField(required=True)
    subsector_id = serializers.IntegerField(required=True)
    project_type_id = serializers.IntegerField(required=True)

    class Meta:
        model = Project
        fields = ProjectListSerializer.Meta.fields + [
            "description",
            "country_id",
            "agency_id",
            "national_agency",
            "subsector_id",
            "project_type_id",
            "approval_meeting_no",
            "submission",
            "ods_odp",
        ]

    def validate_country_id(self, value):
        country = Country.objects.filter(id=value).first()
        if not country:
            raise serializers.ValidationError(f"Invalid country id {value}")
        return value

    def validate_agency_id(self, value):
        agency = Agency.objects.filter(id=value).first()
        if not agency:
            raise serializers.ValidationError(f"Invalid agency id {value}")
        return value

    def validate_subsector_id(self, value):
        subsector = ProjectSubSector.objects.filter(id=value).first()
        if not subsector:
            raise serializers.ValidationError(f"Invalid subsector id {value}")
        return value

    def validate_project_type_id(self, value):
        project_type = ProjectType.objects.filter(id=value).first()
        if not project_type:
            raise serializers.ValidationError(f"Invalid project type id {value}")
        return value

    def create(self, validated_data):
        submission_data = validated_data.pop("submission")
        ods_odp_data = validated_data.pop("ods_odp")

        if submission_data:
            status = ProjectStatus.objects.get(code="NEWSUB")
            validated_data["status_id"] = status.id
        else:
            status = ProjectStatus.objects.get(code="NEW")
            validated_data["status_id"] = status.id

        # create project
        project = Project.objects.create(**validated_data)
        # create submission
        if submission_data:
            ProjectSubmission.objects.create(project=project, **submission_data)
        # create ods_odp
        for ods_odp in ods_odp_data:
            ProjectOdsOdp.objects.create(project=project, **ods_odp)
        return project
