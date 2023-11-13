from django.db import transaction
from rest_framework import serializers
from rest_framework.fields import empty

from core.api.serializers.agency import AgencySerializer
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
from core.models.project import ProjectComment
from core.models.project import ProjectFund
from core.models.project import ProjectFile
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


class ProjectFundSerializer(serializers.ModelSerializer):
    """
    ProjectFundSerializer class
    """

    class Meta:
        model = ProjectFund
        fields = [
            "id",
            "project_id",
            "amount",
            "support_13",
            "meeting",
            "interest",
            "date",
            "fund_type",
            "sort_order",
        ]
        read_only_fields = ["id"]


class ProjectCommentSerializer(serializers.ModelSerializer):
    """
    ProjectCommentSerializer class
    """

    class Meta:
        model = ProjectComment
        fields = [
            "id",
            "project_id",
            "meeting_of_report",
            "secretariat_comment",
            "agency_response",
        ]


class ProjectOdsOdpSerializer(serializers.ModelSerializer):
    """
    ProjectOdsOdpSerializer class
    """

    ods_display_name = serializers.SerializerMethodField()
    ods_substance_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=Substance.objects.all().values_list("id", flat=True),
    )
    ods_blend_id = serializers.PrimaryKeyRelatedField(
        required=False, queryset=Blend.objects.all().values_list("id", flat=True)
    )
    project_id = serializers.IntegerField(read_only=True)

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
        if attrs.get("ods_substance_id") and attrs.get("ods_blend_id"):
            raise serializers.ValidationError(
                "Only one of ods_substance_id or ods_blend_id is required"
            )

        # validate partial updates
        if self.instance:
            # set ods_substance_id wile ods_blend_id is set
            if attrs.get("ods_substance_id") and self.instance.ods_blend_id:
                raise serializers.ValidationError(
                    "Cannot update ods_substance_id when ods_blend_id is set"
                )

            # set ods_blend_id wile ods_substance_id is set
            if attrs.get("ods_blend_id") and self.instance.ods_substance_id:
                raise serializers.ValidationError(
                    "Cannot update ods_blend_id when ods_substance_id is set"
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
    coop_agencies = AgencySerializer(many=True, read_only=True)
    sector = serializers.SerializerMethodField()
    subsector = serializers.SlugRelatedField("name", read_only=True)
    project_type = serializers.SlugRelatedField("name", read_only=True)
    status = serializers.SlugRelatedField("name", read_only=True)
    title = serializers.CharField(required=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "title",
            "code",
            "mya_code",
            "number",
            "description",
            "country",
            "agency",
            "national_agency",
            "coop_agencies",
            "sector",
            "subsector",
            "project_type",
            "mya_subsector",
            "stage",
            "status",
            "substance_type",
            "approval_meeting_no",
            "project_duration",
            "application",
            "products_manufactured",
            "plan",
            "excom_provision",
            "technology",
            "impact",
            "impact_co2mt",
            "impact_production",
            "impact_prod_co2mt",
            "ods_phasedout",
            "ods_phasedout_co2mt",
            "hcfc_stage",
            "capital_cost",
            "operating_cost",
            "effectiveness_cost",
            "fund_disbursed",
            "fund_disbursed_13",
            "date_completion",
            "date_actual",
            "date_comp_revised",
            "date_per_agreement",
            "date_per_decision",
            "umbrella_project",
            "loan",
            "intersessional_approval",
            "retroactive_finance",
            "local_ownership",
            "export_to",
            "remarks",
            "decisions",
        ]

    def get_sector(self, obj):
        return obj.subsector.sector.name


class ProjectDetailsSerializer(ProjectListSerializer):
    """
    ProjectSerializer class
    """

    ods_odp = ProjectOdsOdpSerializer(many=True)
    funds = ProjectFundSerializer(many=True)
    comments = ProjectCommentSerializer(many=True)
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
    coop_agencies_id = serializers.PrimaryKeyRelatedField(
        queryset=Agency.objects.all().values_list("id", flat=True),
        many=True,
        write_only=True,
    )
    latest_file = ProjectFileSerializer(many=False, read_only=True)

    class Meta:
        model = Project
        fields = ProjectListSerializer.Meta.fields + [
            "country_id",
            "agency_id",
            "coop_agencies_id",
            "subsector_id",
            "project_type_id",
            "ods_odp",
            "funds",
            "comments",
            "latest_file",
        ]

    def __init__(self, instance=None, data=empty, **kwargs):
        super().__init__(instance, data, **kwargs)
        request = self.context.get("request")

        for field in ("ods_odp", "funds", "comments"):
            # set ods odps read only for PUT, PATCH, DELETE
            self.fields[field].read_only = request.method not in ["GET", "POST"]

    @transaction.atomic
    def create(self, validated_data):
        ods_odp_data = validated_data.pop("ods_odp", [])
        funds = validated_data.pop("funds", [])
        comments = validated_data.pop("comments", [])
        coop_agencies_id = validated_data.pop("coop_agencies_id")

        # a new project = new submission ?
        status = ProjectStatus.objects.get(code="NEWSUB")
        validated_data["status_id"] = status.id

        # create project
        project = Project.objects.create(**validated_data)
        # create ods_odp
        for ods_odp in ods_odp_data:
            ProjectOdsOdp.objects.create(project=project, **ods_odp)
        # create funds
        for fund in funds:
            ProjectFund.objects.create(project=project, **fund)
        # create comments
        for comment in comments:
            ProjectComment.objects.create(project=project, **comment)
        # add coop_agencies
        for coop_agency in coop_agencies_id:
            project.coop_agencies.add(coop_agency)
        return project

    @transaction.atomic
    def update(self, instance, validated_data):
        coop_agencies_id = validated_data.pop("coop_agencies_id", None)

        super().update(instance, validated_data)

        # update coop_agencies
        if coop_agencies_id:
            instance.coop_agencies.clear()
            for coop_agency in coop_agencies_id:
                instance.coop_agencies.add(coop_agency)

        return instance
