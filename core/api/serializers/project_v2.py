from django.db import transaction
from django.urls import reverse

from rest_framework import serializers

from core.api.serializers.project import (
    ProjectListSerializer,
    ProjectOdsOdpListSerializer,
)
from core.models.agency import Agency
from core.models.country import Country
from core.models.group import Group
from core.models.meeting import Meeting, Decision
from core.models.project import (
    Project,
    ProjectFile,
    ProjectOdsOdp,
)
from core.models.project_metadata import (
    ProjectCluster,
    ProjectStatus,
    ProjectSubmissionStatus,
)
from core.utils import get_project_sub_code


class ProjectV2FileSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()
    project_id = serializers.PrimaryKeyRelatedField(
        required=True,
        queryset=Project.objects.all().values_list("id", flat=True),
    )

    class Meta:
        model = ProjectFile
        fields = [
            "id",
            "name",
            "filename",
            "date_created",
            "download_url",
            "project_id",
        ]

    def get_name(self, obj):
        return obj.file.name

    def get_download_url(self, obj):
        return reverse("project-files-v2-download", args=(obj.id,))


class ProjectListV2Serializer(ProjectListSerializer):

    group = serializers.SlugRelatedField("name", read_only=True)
    group_id = serializers.PrimaryKeyRelatedField(
        allow_null=True,
        queryset=Group.objects.all().values_list("id", flat=True),
    )
    decision = serializers.SlugField(read_only=True)
    decision_id = serializers.PrimaryKeyRelatedField(
        allow_null=True,
        queryset=Decision.objects.all().values_list("id", flat=True),
    )

    class Meta:
        model = Project
        fields = [
            "id",
            "ad_hoc_pcr",
            "agency",
            "agency_id",
            "agency_remarks",
            "aggregated_consumption",
            "application",
            "baseline",
            "bp_activity",
            "capital_cost",
            "cluster",
            "cluster_id",
            "code",
            "code_legacy",
            "compliance",
            "comments",
            "contingency_cost",
            "coop_agencies",
            "correspondance_no",
            "cost_effectiveness",
            "cost_effectiveness_co2",
            "country",
            "country_id",
            "date_actual",
            "date_approved",
            "date_completion",
            "date_comp_revised",
            "date_of_revision",
            "date_per_agreement",
            "date_per_decision",
            "date_received",
            "decision",
            "decision_id",
            "description",
            "destruction_tehnology",
            "effectiveness_cost",
            "export_to",
            "excom_provision",
            "funds",
            "funds_allocated",
            "fund_disbursed",
            "fund_disbursed_psc",
            "funding_window",
            "group",
            "group_id",
            "impact",
            "impact_co2mt",
            "impact_production",
            "impact_prod_co2mt",
            "incomplete",
            "intersessional_approval",
            "individual_consideration",
            "is_lvc",
            "is_sme",
            "issue",
            "issue_description",
            "hcfc_stage",
            "latest_file",
            "lead_agency",
            "lead_agency_id",
            "loan",
            "local_ownership",
            "metaproject_code",
            "metaproject_category",
            "meeting",
            "meeting_id",
            "meeting_transf",
            "meeting_transf_id",
            "mya_code",
            "mya_subsector",
            "mya_start_date",
            "mya_end_date",
            "mya_phase_out_co2_eq_t",
            "mya_phase_out_odp_t",
            "mya_phase_out_mt",
            "mya_project_funding",
            "mya_support_cost",
            "national_agency",
            "ods_odp",
            "ods_phasedout_co2mt",
            "operating_cost",
            "pcr_waived",
            "plan",
            "plus",
            "production_control_type",
            "project_cost",
            "products_manufactured",
            "project_duration",
            "project_end_date",
            "project_start_date",
            "project_type",
            "project_type_id",
            "project_type_legacy",
            "programme_officer",
            "rbm_measures",
            "remarks",
            "retroactive_finance",
            "reviewed_mfs",
            "revision_number",
            "sector",
            "sector_id",
            "sector_legacy",
            "serial_number",
            "status",
            "status_id",
            "stage",
            "starting_point",
            "submission_amounts",
            "submission_category",
            "submission_comments",
            "submission_number",
            "substance_name",
            "submission_status",
            "submission_status_id",
            "substance_type",
            "substance_category",
            "substance_phasedout",
            "subsector_ids",
            "subsectors",
            "subsector_legacy",
            "support_cost_psc",
            "targets",
            "technology",
            "title",
            "tranche",
            "total_fund_transferred",
            "total_fund",
            "total_fund_approved",
            "total_grant",
            "total_psc_cost",
            "total_psc_transferred",
            "umbrella_project",
            "withdrawn",
        ]


class ProjectDetailsV2Serializer(ProjectListV2Serializer):
    """
    ProjectSerializer class
    """

    ods_odp = ProjectOdsOdpListSerializer(many=True, read_only=True)
    country_id = serializers.PrimaryKeyRelatedField(
        required=True, queryset=Country.objects.all().values_list("id", flat=True)
    )
    coop_agencies_id = serializers.PrimaryKeyRelatedField(
        queryset=Agency.objects.all().values_list("id", flat=True),
        many=True,
        write_only=True,
    )
    latest_file = ProjectV2FileSerializer(many=False, read_only=True)
    meeting_id = serializers.PrimaryKeyRelatedField(
        required=True, queryset=Meeting.objects.all().values_list("id", flat=True)
    )
    meeting_transf_id = serializers.PrimaryKeyRelatedField(
        required=False, queryset=Meeting.objects.all().values_list("id", flat=True)
    )
    cluster_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=ProjectCluster.objects.all().values_list("id", flat=True),
    )

    class Meta:
        model = Project
        fields = ProjectListV2Serializer.Meta.fields + [
            "country_id",
            "coop_agencies_id",
            "meeting_id",
            "meeting_transf_id",
            "cluster_id",
            "latest_file",
            "ods_odp",
        ]


class ProjectV2CreateSerializer(serializers.ModelSerializer):
    """
    ProjectSerializer class
    """

    ods_odp = ProjectOdsOdpListSerializer(many=True, required=False)

    class Meta:
        model = Project
        fields = [
            "ad_hoc_pcr",
            "agency",
            "aggregated_consumption",
            "baseline",
            "bp_activity",
            "cluster",
            "cost_effectiveness",
            "cost_effectiveness_co2",
            "country",
            "date_approved",
            "date_completion",
            "decision",
            "description",
            "destruction_tehnology",
            "excom_provision",
            "funding_window",
            "group",
            "individual_consideration",
            "is_lvc",
            "is_sme",
            "lead_agency",
            "meeting",
            "mya_start_date",
            "mya_end_date",
            "mya_phase_out_co2_eq_t",
            "mya_phase_out_odp_t",
            "mya_phase_out_mt",
            "mya_project_funding",
            "mya_support_cost",
            "ods_odp",
            "pcr_waived",
            "production_control_type",
            "products_manufactured",
            "programme_officer",
            "project_end_date",
            "project_start_date",
            "project_type",
            "starting_point",
            "sector",
            "subsectors",
            "support_cost_psc",
            "targets",
            "tranche",
            "title",
            "total_fund",
        ]

    def to_representation(self, instance):
        return ProjectDetailsV2Serializer(context=self.context).to_representation(
            instance
        )

    @transaction.atomic
    def create(self, validated_data):
        status = ProjectStatus.objects.get(code="NA")
        submission_status = ProjectSubmissionStatus.objects.get(name="Draft")
        validated_data["status_id"] = status.id
        validated_data["submission_status_id"] = submission_status.id
        ods_odp_data = validated_data.pop("ods_odp", [])
        subsectors_data = validated_data.pop("subsectors", [])
        project = Project.objects.create(**validated_data)
        # set subcode
        project.code = get_project_sub_code(
            project.country,
            project.cluster,
            project.agency,
            project.project_type,
            project.sector,
            project.meeting,
            project.meeting_transf,
            project.serial_number,
        )
        project.save()

        # create ods_odp
        for ods_odp in ods_odp_data:
            ProjectOdsOdp.objects.create(project=project, **ods_odp)

        project.subsectors.set(subsectors_data)
        return project

    def update(self, instance, validated_data):
        subsectors_data = validated_data.pop("subsectors", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if subsectors_data is not None:
            instance.subsectors.set(subsectors_data)
        return instance
