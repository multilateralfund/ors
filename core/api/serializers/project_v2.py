from django.db import transaction
from django.urls import reverse
from rest_framework import serializers

from core.api.serializers.project import (
    ProjectListSerializer,
    ProjectOdsOdpListSerializer,
    ProjectOdsOdpCreateSerializer,
    MetaProjectSerializer,
)
from core.api.serializers.project_history import ProjectHistorySerializer
from core.api.serializers.business_plan import BPActivityDetailSerializer

from core.models.agency import Agency
from core.models.country import Country
from core.models.group import Group
from core.models.meeting import Meeting, Decision
from core.models.project import (
    MetaProject,
    Project,
    ProjectComponents,
    ProjectFile,
    ProjectOdsOdp,
)
from core.utils import get_meta_project_code, get_meta_project_new_code
from core.models import (
    Blend,
    Substance,
)
from core.models.project_metadata import (
    ProjectCluster,
    ProjectSpecificFields,
    ProjectStatus,
    ProjectSubmissionStatus,
    ProjectSubSector,
)
from core.utils import get_project_sub_code
from core.api.views.utils import log_project_history

# pylint: disable=C0302,R1702,W0707


HISTORY_DESCRIPTION_CREATE = "Create project"
HISTORY_DESCRIPTION_UPDATE = "Save project details"
HISTORY_DESCRIPTION_UPDATE_APPROVAL_FIELDS = "Save project details (Approval fields)"
HISTORY_DESCRIPTION_UPDATE_ACTUAL_FIELDS = "Save project details (Actual fields)"
HISTORY_DESCRIPTION_SUBMIT_V1 = "Submit project (Version 1)"
HISTORY_DESCRIPTION_RECOMMEND_V2 = "Recommend project (Version 2)"
HISTORY_DESCRIPTION_APPROVE_V3 = "Approve project (Version 3)"
HISTORY_DESCRIPTION_REJECT_V3 = "Reject project (Version 3)"
HISTORY_DESCRIPTION_WITHDRAW_V3 = "Withdraw project (Version 3)"
HISTORY_DESCRIPTION_STATUS_CHANGE = "Project status changed to {}"


class UpdateOdsOdpEntries:

    def _update_or_create_ods_odp(self, instance, ods_odp_data):
        existing_ods_odp_map = {obj.id: obj for obj in instance.ods_odp.all()}

        ods_odp_to_create = []
        incoming_ids = set()
        for ods_odp in ods_odp_data:
            if not ods_odp.get("ods_type", None):
                ods_odp.pop("ods_type", None)
            item_id = ods_odp.get("id")
            if item_id and item_id in existing_ods_odp_map:
                incoming_ids.add(item_id)
                ods_odp_instance = existing_ods_odp_map[item_id]
                serializer = ProjectV2OdsOdpCreateUpdateSerializer(
                    instance=ods_odp_instance, data=ods_odp, partial=True
                )
                serializer.is_valid(raise_exception=True)
                serializer.save()
            else:
                ods_odp_to_create.append(ProjectOdsOdp(project=instance, **ods_odp))

        if ods_odp_to_create:
            ProjectOdsOdp.objects.bulk_create(ods_odp_to_create)

        ids_to_delete = set(existing_ods_odp_map.keys()) - incoming_ids

        if ids_to_delete:
            instance.ods_odp.filter(id__in=ids_to_delete).delete()


class ProjectV2FileSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()
    project_id = serializers.PrimaryKeyRelatedField(
        required=True,
        queryset=Project.objects.all().values_list("id", flat=True),
    )
    editable = serializers.SerializerMethodField()

    class Meta:
        model = ProjectFile
        fields = [
            "id",
            "name",
            "filename",
            "date_created",
            "download_url",
            "project_id",
            "editable",
        ]

    def get_name(self, obj):
        return obj.file.name

    def get_download_url(self, obj):
        return reverse("project-files-v2-download", args=(obj.project_id, obj.id))

    def get_editable(self, obj):
        edit_queryset_ids = self.context.get("edit_queryset_ids", set())
        return obj.id in edit_queryset_ids


class ProjectV2ProjectIncludeFileSerializer(serializers.ModelSerializer):
    """
    Serializer for including files in the project list serializer.
    This serializer is used to include the latest file of the project.
    """

    files = ProjectV2FileSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "title",
            "version",
            "files",
        ]


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
    editable = serializers.SerializerMethodField()

    def get_editable(self, obj):
        """
        Check if the project is editable based on the user's permissions.
        """
        if obj.id in self.context.get("edit_queryset_ids", set()):
            return True
        return False

    bp_activity = serializers.SerializerMethodField()

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
            "ban_of_equipment",
            "ban_of_substances",
            "baseline",
            "bp_activity",
            "capacity_building_programmes",
            "capital_cost",
            "certification_system_for_technicians",
            "checklist_regulations",
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
            "editable",
            "ee_demonstration_project",
            "effectiveness_cost",
            "establishment_of_imp_exp_licensing",
            "establishment_of_quota_systems",
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
            "kwh_year_saved",
            "latest_file",
            "lead_agency",
            "lead_agency_id",
            "lead_agency_submitting_on_behalf",
            "loan",
            "local_ownership",
            "meps_developed_domestic_refrigeration",
            "meps_developed_commercial_refrigeration",
            "meps_developed_residential_ac",
            "meps_developed_commercial_ac",
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
            "number_of_enterprises",
            "number_of_enterprises_assisted",
            "number_of_female_customs_officers_trained",
            "number_of_female_nou_personnel_supported",
            "number_of_female_technicians_certified",
            "number_of_female_technicians_trained",
            "number_of_female_trainers_trained",
            "number_of_production_lines_assisted",
            "number_of_tools_sets_distributed",
            "number_of_training_institutions_newly_assisted",
            "ods_odp",
            "ods_phasedout_co2mt",
            "operating_cost",
            "operation_of_recovery_and_recycling_scheme",
            "operation_of_reclamation_scheme",
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
            "pcr_waived",
            "production",
            "rbm_measures",
            "remarks",
            "retroactive_finance",
            "reviewed_mfs",
            "revision_number",
            "quantity_controlled_substances_destroyed_mt",
            "quantity_controlled_substances_destroyed_co2_eq_t",
            "quantity_hfc_23_by_product_generated",
            "quantity_hfc_23_by_product_generation_rate",
            "quantity_hfc_23_by_product_destroyed",
            "quantity_hfc_23_by_product_emitted",
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
            "total_number_of_technicians_trained",
            "total_number_of_trainers_trained",
            "total_number_of_technicians_certified",
            "total_number_of_customs_officers_trained",
            "total_number_of_nou_personnel_supported",
            "total_psc_cost",
            "total_psc_transferred",
            "umbrella_project",
            "version_created_by",
            "version",
            "withdrawn",
        ]

    def to_representation(self, instance):
        """
        Override the to_representation method to use the ProjectDetailsV2Serializer
        for detailed representation.
        """
        data = super().to_representation(instance)
        if instance.submission_status.name != "Approved":
            if "code" in data:
                data["code"] = None
        return data

    def get_bp_activity(self, obj: Project):
        result = None

        if obj.bp_activity:
            result = BPActivityDetailSerializer(obj.bp_activity).data

        elif obj.bp_activity_json:
            result = obj.bp_activity_json

        return result


class ProjectV2OdsOdpListSerializer(ProjectOdsOdpListSerializer):
    """
    ProjectOdsOdpListSerializer class
    """

    ods_type = serializers.SerializerMethodField()

    class Meta(ProjectOdsOdpListSerializer.Meta):
        fields = ProjectOdsOdpListSerializer.Meta.fields

    def get_ods_type(self, obj):
        return obj.get_ods_type_display()


class ProjectDetailsV2Serializer(ProjectListV2Serializer):
    """
    ProjectSerializer class
    """

    ods_odp = ProjectV2OdsOdpListSerializer(many=True, read_only=True)
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
    meta_project = MetaProjectSerializer(read_only=True)
    meeting_transf_id = serializers.PrimaryKeyRelatedField(
        required=False, queryset=Meeting.objects.all().values_list("id", flat=True)
    )
    cluster_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=ProjectCluster.objects.all().values_list("id", flat=True),
    )
    checklist_regulations_actual = serializers.SerializerMethodField()
    versions = serializers.SerializerMethodField()
    history = serializers.SerializerMethodField()
    editable = serializers.SerializerMethodField()

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
            "meta_project",
            "ods_odp",
            "versions",
            "history",
            "bp_activity_json",
            "total_number_of_technicians_trained_actual",
            "number_of_female_technicians_trained_actual",
            "total_number_of_trainers_trained_actual",
            "number_of_female_trainers_trained_actual",
            "total_number_of_technicians_certified_actual",
            "number_of_female_technicians_certified_actual",
            "number_of_training_institutions_newly_assisted_actual",
            "number_of_tools_sets_distributed_actual",
            "total_number_of_customs_officers_trained_actual",
            "number_of_female_customs_officers_trained_actual",
            "total_number_of_nou_personnel_supported_actual",
            "number_of_female_nou_personnel_supported_actual",
            "number_of_enterprises_assisted_actual",
            "certification_system_for_technicians_actual",
            "operation_of_recovery_and_recycling_scheme_actual",
            "operation_of_reclamation_scheme_actual",
            "establishment_of_imp_exp_licensing_actual",
            "establishment_of_quota_systems_actual",
            "editable",
            "ban_of_equipment_actual",
            "ban_of_substances_actual",
            "kwh_year_saved_actual",
            "meps_developed_domestic_refrigeration_actual",
            "meps_developed_commercial_refrigeration_actual",
            "meps_developed_residential_ac_actual",
            "meps_developed_commercial_ac_actual",
            "capacity_building_programmes_actual",
            "ee_demonstration_project_actual",
            "quantity_controlled_substances_destroyed_mt_actual",
            "quantity_controlled_substances_destroyed_co2_eq_t_actual",
            "checklist_regulations_actual",
            "quantity_hfc_23_by_product_generated_actual",
            "quantity_hfc_23_by_product_generation_rate_actual",
            "quantity_hfc_23_by_product_destroyed_actual",
            "quantity_hfc_23_by_product_emitted_actual",
        ]

    def get_editable(self, obj):
        """
        Check if the project is editable based on the user's permissions.
        """
        if obj.id in self.context.get("edit_queryset_ids", set()):
            return True
        return False

    def get_checklist_regulations_actual(self, obj):
        return obj.get_checklist_regulations_actual_display()

    def get_history(self, obj):
        queryset = obj.project_history.all().select_related("project", "user")
        serializer = ProjectHistorySerializer(queryset, many=True)
        return serializer.data

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


class ProjectV2OdsOdpCreateUpdateSerializer(ProjectOdsOdpCreateSerializer):
    id = serializers.IntegerField(required=False)

    project_id = serializers.PrimaryKeyRelatedField(
        required=False,
        read_only=True,
    )

    ods_substance_id = serializers.PrimaryKeyRelatedField(
        required=False,
        allow_null=True,
        queryset=Substance.objects.all().values_list("id", flat=True),
    )
    ods_blend_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=Blend.objects.all().values_list("id", flat=True),
        allow_null=True,
    )
    ods_type = serializers.CharField(required=False, allow_null=True)

    class Meta(ProjectOdsOdpCreateSerializer.Meta):
        fields = ["id"] + ProjectOdsOdpCreateSerializer.Meta.fields

    def validate(self, attrs):
        if attrs.get("ods_substance_id") and attrs.get("ods_blend_id"):
            raise serializers.ValidationError(
                "Only one of ods_substance_id or ods_blend_id is required"
            )
        # validate partial updates
        if self.instance:
            # set ods_substance_id while ods_blend_id is set
            if (
                attrs.get("ods_substance_id") is not None
                and self.instance.ods_blend_id
                and not ("ods_blend_id" in attrs and attrs["ods_blend_id"] is None)
            ):
                raise serializers.ValidationError(
                    "Cannot update ods_substance_id when ods_blend_id is set"
                )
            # set ods_blend_id while ods_substance_id is set
            if (
                attrs.get("ods_blend_id") is not None
                and self.instance.ods_substance_id
                and not (
                    "ods_substance_id" in attrs and attrs["ods_substance_id"] is None
                )
            ):
                raise serializers.ValidationError(
                    "Cannot update ods_blend_id when ods_substance_id is set"
                )

        return super(ProjectOdsOdpListSerializer, self).validate(attrs)


class ProjectV2CreateUpdateSerializer(UpdateOdsOdpEntries, serializers.ModelSerializer):
    """
    ProjectSerializer class
    """

    ods_odp = ProjectV2OdsOdpCreateUpdateSerializer(many=True, required=False)
    subsector_ids = serializers.PrimaryKeyRelatedField(
        allow_null=True,
        many=True,
        write_only=True,
        queryset=ProjectSubSector.objects.all(),
    )

    # This field is not on the Project model, but is used for input only
    associate_project_id = serializers.IntegerField(
        allow_null=True,
        required=False,
        write_only=True,
    )

    def validate_associate_project_id(self, value):
        if value is not None:
            try:
                Project.objects.get(id=value)
            except Project.DoesNotExist:
                raise serializers.ValidationError("Associated project does not exist.")
        return value

    class Meta:
        model = Project
        fields = [
            "ad_hoc_pcr",
            "agency",
            "associate_project_id",
            "aggregated_consumption",
            "baseline",
            "ban_of_equipment",
            "ban_of_equipment_actual",
            "ban_of_substances",
            "ban_of_substances_actual",
            "bp_activity",
            "cluster",
            "capacity_building_programmes",
            "capacity_building_programmes_actual",
            "certification_system_for_technicians",
            "certification_system_for_technicians_actual",
            "checklist_regulations",
            "checklist_regulations_actual",
            "cost_effectiveness",
            "cost_effectiveness_co2",
            "country",
            "date_approved",
            "date_completion",
            "decision",
            "description",
            "destruction_technology",
            "ee_demonstration_project",
            "ee_demonstration_project_actual",
            "establishment_of_imp_exp_licensing",
            "establishment_of_imp_exp_licensing_actual",
            "establishment_of_quota_systems",
            "establishment_of_quota_systems_actual",
            "excom_provision",
            "funding_window",
            "group",
            "individual_consideration",
            "is_lvc",
            "is_sme",
            "kwh_year_saved",
            "kwh_year_saved_actual",
            "lead_agency",
            "lead_agency_submitting_on_behalf",
            "meeting",
            "meps_developed_domestic_refrigeration",
            "meps_developed_domestic_refrigeration_actual",
            "meps_developed_commercial_refrigeration",
            "meps_developed_commercial_refrigeration_actual",
            "meps_developed_residential_ac",
            "meps_developed_residential_ac_actual",
            "meps_developed_commercial_ac",
            "meps_developed_commercial_ac_actual",
            "mya_start_date",
            "mya_end_date",
            "mya_phase_out_co2_eq_t",
            "mya_phase_out_odp_t",
            "mya_phase_out_mt",
            "mya_project_funding",
            "mya_support_cost",
            "number_of_enterprises",
            "number_of_female_nou_personnel_supported",
            "number_of_female_nou_personnel_supported_actual",
            "number_of_enterprises_assisted",
            "number_of_enterprises_assisted_actual",
            "number_of_female_customs_officers_trained",
            "number_of_female_customs_officers_trained_actual",
            "number_of_female_technicians_trained",
            "number_of_female_technicians_trained_actual",
            "number_of_female_trainers_trained",
            "number_of_female_trainers_trained_actual",
            "number_of_female_technicians_certified",
            "number_of_female_technicians_certified_actual",
            "number_of_training_institutions_newly_assisted",
            "number_of_training_institutions_newly_assisted_actual",
            "number_of_tools_sets_distributed",
            "number_of_tools_sets_distributed_actual",
            "number_of_production_lines_assisted",
            "ods_odp",
            "operation_of_recovery_and_recycling_scheme",
            "operation_of_recovery_and_recycling_scheme_actual",
            "operation_of_reclamation_scheme",
            "operation_of_reclamation_scheme_actual",
            "pcr_waived",
            "production_control_type",
            "products_manufactured",
            "programme_officer",
            "project_end_date",
            "project_start_date",
            "project_type",
            "production",
            "quantity_controlled_substances_destroyed_mt",
            "quantity_controlled_substances_destroyed_co2_eq_t",
            "quantity_hfc_23_by_product_generated",
            "quantity_hfc_23_by_product_generation_rate",
            "quantity_hfc_23_by_product_destroyed",
            "quantity_hfc_23_by_product_emitted",
            "quantity_hfc_23_by_product_generated_actual",
            "quantity_hfc_23_by_product_generation_rate_actual",
            "quantity_hfc_23_by_product_destroyed_actual",
            "quantity_hfc_23_by_product_emitted_actual",
            "quantity_controlled_substances_destroyed_mt_actual",
            "quantity_controlled_substances_destroyed_co2_eq_t_actual",
            "starting_point",
            "sector",
            "subsectors",
            "subsector_ids",
            "support_cost_psc",
            "targets",
            "tranche",
            "title",
            "total_fund",
            "total_number_of_technicians_trained",
            "total_number_of_technicians_trained_actual",
            "total_number_of_trainers_trained",
            "total_number_of_trainers_trained_actual",
            "total_number_of_technicians_certified",
            "total_number_of_technicians_certified_actual",
            "total_number_of_customs_officers_trained",
            "total_number_of_customs_officers_trained_actual",
            "total_number_of_nou_personnel_supported",
            "total_number_of_nou_personnel_supported_actual",
        ]
        extra_kwargs = {"associate_project_id": {"write_only": True}}

    def to_representation(self, instance):
        return ProjectDetailsV2Serializer(context=self.context).to_representation(
            instance
        )

    @transaction.atomic
    def create(self, validated_data):
        _ = validated_data.pop("request", None)
        lead_agency = validated_data.pop("lead_agency", None)
        user = self.context["request"].user
        status = ProjectStatus.objects.get(code="NEWSUB")
        submission_status = ProjectSubmissionStatus.objects.get(name="Draft")
        validated_data["status_id"] = status.id
        validated_data["submission_status_id"] = submission_status.id
        ods_odp_data = validated_data.pop("ods_odp", [])
        subsectors_data = validated_data.pop("subsector_ids", [])
        associate_project_id = validated_data.pop("associate_project_id", None)
        bp_activity = validated_data.get("bp_activity", None)
        if bp_activity:
            activity_serializer = BPActivityDetailSerializer(bp_activity)
            validated_data["bp_activity_json"] = activity_serializer.data
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

        # create MetaProject
        if associate_project_id:
            associate_project = Project.objects.get(id=associate_project_id)
            project.meta_project = associate_project.meta_project
            if project.component:
                project.component = associate_project.component
            else:
                component = ProjectComponents.objects.create()
                project.component = component
                associate_project.component = component
                associate_project.save()
        else:
            project.meta_project = MetaProject.objects.create(
                lead_agency=lead_agency,
                code=get_meta_project_code(
                    project.country,
                    project.cluster,
                    project.serial_number_legacy,
                ),
                new_code=get_meta_project_new_code([project]),
            )
        project.save()
        log_project_history(project, user, HISTORY_DESCRIPTION_CREATE)

        return project

    @transaction.atomic
    def update(self, instance, validated_data):
        user = self.context["request"].user
        subsectors_data = validated_data.pop("subsector_ids", None)
        ods_odp_data = validated_data.pop("ods_odp", None)
        bp_activity = validated_data.get("bp_activity", None)
        if bp_activity and (instance.bp_activity != bp_activity):
            activity_serializer = BPActivityDetailSerializer(bp_activity)
            validated_data["bp_activity_json"] = activity_serializer.data

        super().update(instance, validated_data)

        # update, create, delete ods_odp
        if ods_odp_data is not None:
            self._update_or_create_ods_odp(instance, ods_odp_data)

        # set new subcode
        instance.code = get_project_sub_code(
            instance.country,
            instance.cluster,
            instance.agency,
            instance.project_type,
            instance.sector,
            instance.meeting,
            instance.meeting_transf,
            instance.serial_number,
        )
        instance.save()

        if subsectors_data is not None:
            instance.subsectors.set(subsectors_data)

        log_project_history(instance, user, HISTORY_DESCRIPTION_UPDATE)

        return instance


class ProjectV2EditActualFieldsSerializer(serializers.ModelSerializer):
    """
    ProjectSerializer class for editing actual fields
    """

    class Meta:
        model = Project
        fields = [
            "ban_of_equipment_actual",
            "ban_of_substances_actual",
            "capacity_building_programmes_actual",
            "certification_system_for_technicians_actual",
            "checklist_regulations_actual",
            "ee_demonstration_project_actual",
            "establishment_of_imp_exp_licensing_actual",
            "establishment_of_quota_systems_actual",
            "kwh_year_saved_actual",
            "meps_developed_domestic_refrigeration_actual",
            "meps_developed_commercial_refrigeration_actual",
            "meps_developed_residential_ac_actual",
            "meps_developed_commercial_ac_actual",
            "number_of_female_nou_personnel_supported_actual",
            "number_of_enterprises_assisted_actual",
            "number_of_female_customs_officers_trained_actual",
            "number_of_female_technicians_trained_actual",
            "number_of_female_trainers_trained_actual",
            "number_of_female_technicians_certified_actual",
            "number_of_training_institutions_newly_assisted_actual",
            "number_of_tools_sets_distributed_actual",
            "operation_of_recovery_and_recycling_scheme_actual",
            "operation_of_reclamation_scheme_actual",
            "quantity_hfc_23_by_product_generated_actual",
            "quantity_hfc_23_by_product_generation_rate_actual",
            "quantity_hfc_23_by_product_destroyed_actual",
            "quantity_hfc_23_by_product_emitted_actual",
            "quantity_controlled_substances_destroyed_mt_actual",
            "quantity_controlled_substances_destroyed_co2_eq_t_actual",
            "total_number_of_technicians_trained_actual",
            "total_number_of_trainers_trained_actual",
            "total_number_of_technicians_certified_actual",
            "total_number_of_customs_officers_trained_actual",
            "total_number_of_nou_personnel_supported_actual",
        ]


class ProjectV2EditApprovalFieldsSerializer(
    UpdateOdsOdpEntries, serializers.ModelSerializer
):
    """
    ProjectSerializer class for editing actual fields
    """

    ods_odp = ProjectV2OdsOdpListSerializer(many=True)

    class Meta:
        model = Project
        fields = [
            "meeting",  # *
            "decision",  # *
            "funding_window",
            "excom_provision",  # *
            "date_completion",  # *
            "total_fund_approved",
            "support_cost_psc",
            "programme_officer",
            "ods_odp",
            "pcr_waived",
            "ad_hoc_pcr",
            "date_approved",
        ]

    def update(self, instance, validated_data):
        """
        Update the project with the validated data
        """
        user = self.context["request"].user
        validated_data["date_approved"] = validated_data["meeting"].end_date
        # update, create, delete ods_odp
        if "ods_odp" in validated_data:
            ods_odp_data = validated_data.pop("ods_odp")
            self._update_or_create_ods_odp(instance, ods_odp_data)

        super().update(instance, validated_data)

        log_project_history(instance, user, HISTORY_DESCRIPTION_UPDATE_APPROVAL_FIELDS)

        return instance

    def validate(self, attrs):
        """
        Validate the project approval fields
        """
        enforce_validation = self.context.get("enforce_validation", False)
        attrs = super().validate(attrs)
        if not enforce_validation:
            return attrs
        errors = {}
        if self.instance.meeting is None:
            errors["meeting"] = "Meeting is required for approval."
        if self.instance.decision is None:
            errors["decision"] = "Decision is required for approval."
        if self.instance.excom_provision is None:
            errors["excom_provision"] = "Excom provision is required for approval."
        if self.instance.date_completion is None:
            errors["date_completion"] = "Date of completion is required for approval."
        if not errors:
            return attrs
        raise serializers.ValidationError(errors)


class ProjectV2SubmitSerializer(serializers.ModelSerializer):
    """
    ProjectSerializer class for submitting a project
    """

    class Meta:
        model = Project
        fields = [
            "version",
        ]

    def validate_required_fields(self, errors):
        mandatory_fields_at_submission = [
            "cluster",
            "project_type",
            "sector",
            "subsectors",
            "country",
            "agency",
            "meeting",
            "is_lvc",
            "title",
            "description",
            "project_start_date",
            "project_end_date",
            "total_fund",
            "support_cost_psc",
        ]
        for field in mandatory_fields_at_submission:
            if field == "subsectors":
                if not self.instance.subsectors.exists():
                    errors["subsectors"] = (
                        "At least one subsector is required for submission."
                    )
            if getattr(self.instance, field) is None:
                errors[field] = (
                    f"{field.replace('_', ' ').title()} is required for submission."
                )

        # Check project specific mandatory fields
        project_specific_fields_obj = ProjectSpecificFields.objects.filter(
            cluster=self.instance.cluster,
            type=self.instance.project_type,
            sector=self.instance.sector,
        ).first()

        if project_specific_fields_obj:
            for field in project_specific_fields_obj.fields.filter(
                section__in=["Header", "Substance Details", "Impact"],
                is_actual=False,
            ):
                if field.table == "ods_odp":
                    project_ods_odp_entries = self.instance.ods_odp.all()
                    if not project_ods_odp_entries:
                        if field.write_field_name == "ods_display_name":

                            errors["ods_display_name"] = (
                                "Ods name is required for submission."
                            )
                        else:
                            errors[field.write_field_name] = (
                                f"{field.label} is required for submission."
                            )
                    else:
                        for ods_odp in project_ods_odp_entries:
                            if field.write_field_name == "ods_display_name":
                                if (
                                    getattr(ods_odp, "ods_substance") is None
                                    and getattr(ods_odp, "ods_blend") is None
                                    and getattr(ods_odp, "ods_display_name") is None
                                ):
                                    errors["ods_display_name"] = (
                                        "Ods name is required for submission."
                                    )

                            elif getattr(ods_odp, field.write_field_name) is None:
                                errors[f"{field.write_field_name}_ods_odp"] = (
                                    f"{field.label} is required for submission."
                                )
                else:
                    if getattr(self.instance, field.write_field_name) is None:
                        errors[field.write_field_name] = (
                            f"{field.label} is required for submission."
                        )
        if ProjectFile.objects.filter(project=self.instance).count() < 1:
            errors["files"] = (
                "At least one file must be attached to the project for submission."
            )
        return errors

    def validate_previous_tranches(self, errors):
        """
        Validate that the project's previous tranches have at least one actual field completed
        """
        try:
            tranche = int(self.instance.tranche)
        except (ValueError, TypeError):
            return errors
        previous_tranches = Project.objects.filter(
            meta_project=self.instance.meta_project,
            tranche=tranche - 1,
            submission_status__name="Approved",
        )
        if self.instance.tranche > 1 > len(previous_tranches):
            errors["tranche"] = "Project must have at least one previous tranche entry."
        for previous_tranche in previous_tranches:
            specific_field_entry = ProjectSpecificFields.objects.filter(
                cluster=previous_tranche.cluster,
                type=previous_tranche.project_type,
                sector=previous_tranche.sector,
            ).first()
            if specific_field_entry:
                fields = specific_field_entry.fields.filter(is_actual=True)
                if fields.exists():
                    one_field_filled = False
                    for field in fields:
                        if getattr(previous_tranche, field.read_field_name) is not None:
                            one_field_filled = True

                    if not one_field_filled:
                        if "previous_tranches" not in errors:
                            errors["previous_tranches"] = []
                        errors["previous_tranches"].append(
                            f"Previous tranche {previous_tranche.title}({previous_tranche.id}): "
                            "At least one actual indicator should be filled."
                        )
        return errors

    def validate(self, attrs):
        """
        Validate the project submission
        """
        errors = {}
        if self.instance.submission_status.name != "Draft":
            errors["submission_status"] = (
                "Project can only be submitted if its status is Draft."
            )

        self.validate_required_fields(errors)

        self.validate_previous_tranches(errors)

        if errors:
            raise serializers.ValidationError(errors)

        return attrs


class ProjectV2RecommendSerializer(ProjectV2SubmitSerializer):
    """
    ProjectSerializer class for recommending a project
    """

    class Meta:
        model = Project
        fields = [
            "version",
        ]

    def validate(self, attrs):
        """
        Validate the project submission
        """
        errors = {}
        if self.instance.version != 2:
            errors["version"] = "Project can only be recommended if it is version 2."
        if self.instance.submission_status.name != "Submitted":
            errors["submission_status"] = (
                "Project can only be recommended if its status is Submitted."
            )

        self.validate_required_fields(errors)
        if errors:
            raise serializers.ValidationError(errors)
        return attrs
