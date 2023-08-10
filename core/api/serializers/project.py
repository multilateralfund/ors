from django.db import transaction
from rest_framework import serializers

from core.models.agency import Agency
from core.models.blend import Blend
from core.models.country import Country
from core.models.project import (
    Project,
    ProjectOdsOdp,
    ProjectSector,
    ProjectStatus,
    ProjectSubSector,
    ProjectType,
)
from core.models.project import ProjectFile
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


class ProjectSectorSerializer(serializers.ModelSerializer):
    """
    ProjectSectorSerializer class
    """

    class Meta:
        model = ProjectSector
        fields = [
            "id",
            "name",
            "code",
            "sort_order",
        ]


class ProjectSubSectorSerializer(serializers.ModelSerializer):
    """
    ProjectSubSectorSerializer class
    """

    sector_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = ProjectSubSector
        fields = [
            "id",
            "name",
            "code",
            "sort_order",
            "sector_id",
        ]


class ProjectTypeSerializer(serializers.ModelSerializer):
    """
    ProjectTypeSerializer class
    """

    class Meta:
        model = ProjectType
        fields = [
            "id",
            "name",
            "code",
            "sort_order",
        ]


class ProjectSubmissionSerializer(serializers.ModelSerializer):
    """
    ProjectSubmissionSerializer class
    """

    id = serializers.IntegerField(read_only=True)
    funds_allocated = serializers.FloatField(required=True)
    support_cost_13 = serializers.FloatField(required=True)

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


class ProjectOdsOdpSerializer(serializers.ModelSerializer):
    """
    ProjectOdsOdpSerializer class
    """

    ods_display_name = serializers.SerializerMethodField()
    ods_substance_id = serializers.PrimaryKeyRelatedField(
        required=False, queryset=Substance.objects.all().values_list("id", flat=True)
    )
    ods_blend_id = serializers.PrimaryKeyRelatedField(
        required=False, queryset=Blend.objects.all().values_list("id", flat=True)
    )
    ods_type = serializers.ChoiceField(
        required=True, choices=ProjectOdsOdp.ProjectOdsOdpType.choices
    )

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

    def validate(self, attrs):
        if not attrs.get("ods_substance_id") and not attrs.get("ods_blend_id"):
            raise serializers.ValidationError(
                "Either ods_substance_id or ods_blend_id is required"
            )
        return super().validate(attrs)


class ProjectFileSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = ProjectFile
        fields = [
            "id",
            "name",
            "date_created",
        ]

    def get_name(self, obj):
        return obj.file.name


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
    agency_id = serializers.PrimaryKeyRelatedField(
        required=True, queryset=Agency.objects.all().values_list("id", flat=True)
    )
    country_id = serializers.PrimaryKeyRelatedField(
        required=True, queryset=Country.objects.all().values_list("id", flat=True)
    )
    subsector_id = serializers.PrimaryKeyRelatedField(
        required=True,
        queryset=ProjectSubSector.objects.all().values_list("id", flat=True),
    )
    project_type_id = serializers.PrimaryKeyRelatedField(
        required=True, queryset=ProjectType.objects.all().values_list("id", flat=True)
    )
    files = ProjectFileSerializer(many=True, read_only=True)

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
            "files",
        ]

    @transaction.atomic
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
