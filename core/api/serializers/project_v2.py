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
    ProjectSubSector,
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

    group = serializers.SlugRelatedField("name_alt", read_only=True)
    group_id = serializers.PrimaryKeyRelatedField(
        allow_null=True,
        queryset=Group.objects.all().values_list("id", flat=True),
    )
    decision = serializers.SlugField(read_only=True)
    decision_id = serializers.PrimaryKeyRelatedField(
        allow_null=True,
        queryset=Decision.objects.all().values_list("id", flat=True),
    )
    is_sme = serializers.SerializerMethodField()
    destruction_technology = serializers.SerializerMethodField()
    production_control_type = serializers.SerializerMethodField()
    checklist_regulations = serializers.SerializerMethodField()

    def get_destruction_technology(self, obj):
        return obj.get_destruction_technology_display()

    def get_production_control_type(self, obj):
        return obj.get_production_control_type_display()

    def get_is_sme(self, obj):
        """
        Get the is_sme field
        """
        if obj.is_sme:
            return "SME"
        if obj.is_sme is False:
            return "Non-SME"
        return None

    def get_checklist_regulations(self, obj):
        return obj.get_checklist_regulations_display()

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
            "number_of_production_lines_assisted",
            "country",
            "country_id",
            "date_actual",
            "date_approved",
            "date_created",
            "date_completion",
            "date_comp_revised",
            "date_of_revision",
            "date_per_agreement",
            "date_per_decision",
            "date_received",
            "decision",
            "decision_id",
            "description",
            "destruction_technology",
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
            "number_of_enterprises",
            "national_agency",
            "ods_odp",
            "ods_phasedout_co2mt",
            "operating_cost",
            "pcr_waived",
            "total_number_of_technicians_trained",
            "number_of_female_technicians_trained",
            "total_number_of_trainers_trained",
            "number_of_female_trainers_trained",
            "total_number_of_technicians_certified",
            "number_of_female_technicians_certified",
            "number_of_training_institutions_newly_assisted",
            "number_of_tools_sets_distributed",
            "total_number_of_customs_officers_trained",
            "number_of_female_customs_officers_trained",
            "total_number_of_nou_personnnel_supported",
            "number_of_female_nou_personnel_supported",
            "number_of_enterprises_assisted",
            "certification_system_for_technicians",
            "operation_of_recovery_and_recycling_scheme",
            "operation_of_reclamation_scheme",
            "establishment_of_imp_exp_licensing",
            "establishment_of_quota_systems",
            "ban_of_equipment",
            "ban_of_substances",
            "kwh_year_saved",
            "meps_developed_domestic_refrigeration",
            "meps_developed_commercial_refrigeration",
            "meps_developed_residential_ac",
            "meps_developed_commercial_ac",
            "capacity_building_programmes",
            "ee_demonstration_project",
            "quantity_controlled_substances_destroyed_mt",
            "quantity_controlled_substances_destroyed_co2_eq_t",
            "checklist_regulations",
            "quantity_hfc_23_by_product_generated",
            "quantity_hfc_23_by_product_generation_rate",
            "quantity_hfc_23_by_product_destroyed",
            "quantity_hfc_23_by_product_emitted",
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
            "version_created_by",
            "version",
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
    versions = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ProjectListV2Serializer.Meta.fields + [
            "country_id",
            "coop_agencies_id",
            "meeting_id",
            "meeting_transf_id",
            "cluster_id",
            "latest_file",
            "latest_project",
            "ods_odp",
            "versions",
        ]

    def get_versions(self, obj):
        """
        Get the versions of the project
        """
        versions = []
        if obj.latest_project:
            # If the project has a latest project, it means it is an archived project
            # and we need to append the latest project to the list first
            versions.append(
                {
                    "id": obj.latest_project.id,
                    "title": obj.latest_project.title,
                    "version": obj.latest_project.version,
                    "final_version_id": obj.latest_project.id,
                    "created_by": getattr(obj.version_created_by, "username", None),
                    "date_created": obj.latest_project.date_created,
                }
            )
            latest_project = obj.latest_project
        else:
            versions.append(
                {
                    "id": obj.id,
                    "title": obj.title,
                    "version": obj.version,
                    "final_version_id": obj.id,
                    "created_by": getattr(obj.version_created_by, "username", None),
                    "date_created": obj.date_created,
                }
            )
            latest_project = obj
        previous_versions = (
            Project.objects.really_all()
            .filter(latest_project__id=latest_project.id)
            .values(
                "id", "title", "version", "version_created_by__username", "date_created"
            )
            .order_by("-version")
        )
        for version in previous_versions:
            versions.append(
                {
                    "id": version["id"],
                    "title": version["title"],
                    "version": version["version"],
                    "final_version_id": latest_project.id,
                    "created_by": version["version_created_by__username"],
                    "date_created": version["date_created"],
                }
            )
        return versions


class ProjectV2CreateSerializer(serializers.ModelSerializer):
    """
    ProjectSerializer class
    """

    ods_odp = ProjectOdsOdpListSerializer(many=True, required=False)
    subsector_ids = serializers.PrimaryKeyRelatedField(
        allow_null=True,
        many=True,
        write_only=True,
        queryset=ProjectSubSector.objects.all(),
    )

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
            "number_of_production_lines_assisted",
            "country",
            "date_approved",
            "date_completion",
            "decision",
            "description",
            "destruction_technology",
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
            "number_of_enterprises",
            "ods_odp",
            "pcr_waived",
            "total_number_of_technicians_trained",
            "number_of_female_technicians_trained",
            "total_number_of_trainers_trained",
            "number_of_female_trainers_trained",
            "total_number_of_technicians_certified",
            "number_of_female_technicians_certified",
            "number_of_training_institutions_newly_assisted",
            "number_of_tools_sets_distributed",
            "total_number_of_customs_officers_trained",
            "number_of_female_customs_officers_trained",
            "total_number_of_nou_personnnel_supported",
            "number_of_female_nou_personnel_supported",
            "number_of_enterprises_assisted",
            "certification_system_for_technicians",
            "operation_of_recovery_and_recycling_scheme",
            "operation_of_reclamation_scheme",
            "establishment_of_imp_exp_licensing",
            "establishment_of_quota_systems",
            "ban_of_equipment",
            "ban_of_substances",
            "kwh_year_saved",
            "meps_developed_domestic_refrigeration",
            "meps_developed_commercial_refrigeration",
            "meps_developed_residential_ac",
            "meps_developed_commercial_ac",
            "capacity_building_programmes",
            "ee_demonstration_project",
            "quantity_controlled_substances_destroyed_mt",
            "quantity_controlled_substances_destroyed_co2_eq_t",
            "checklist_regulations",
            "quantity_hfc_23_by_product_generated",
            "quantity_hfc_23_by_product_generation_rate",
            "quantity_hfc_23_by_product_destroyed",
            "quantity_hfc_23_by_product_emitted",
            "production_control_type",
            "products_manufactured",
            "programme_officer",
            "project_end_date",
            "project_start_date",
            "project_type",
            "starting_point",
            "sector",
            "subsectors",
            "subsector_ids",
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
        request = validated_data.pop("request", None)
        user = getattr(request, "user", None)
        status = ProjectStatus.objects.get(code="NA")
        submission_status = ProjectSubmissionStatus.objects.get(name="Draft")
        validated_data["status_id"] = status.id
        validated_data["submission_status_id"] = submission_status.id
        ods_odp_data = validated_data.pop("ods_odp", [])
        subsectors_data = validated_data.pop("subsector_ids", [])
        project = Project.objects.create(**validated_data, version_created_by=user)
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
