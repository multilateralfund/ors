from collections import Counter

from django.db import transaction
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from core.api.export.projects_inventory_report import project_actual_fund
from core.api.export.projects_inventory_report import project_apr_co2_actual
from core.api.export.projects_inventory_report import project_apr_date_completed
from core.api.export.projects_inventory_report import project_apr_odp_actual
from core.models.project import MetaProject, Project
from core.models.project_completion_report import (
    PCR,
    PCRDelayCategory,
    PCRLearnedLessonCategory,
    PCRProject,
    PCRProjectAlternativeTechnology,
    PCRProjectComponentOption,
    PCRProjectEnterprise,
    PCRProjectEquipment,
)
from core.models.substance import Substance


class PCRProjectAlternativeTechnologySerializer(serializers.ModelSerializer):
    substance_from = serializers.PrimaryKeyRelatedField(
        queryset=Substance.objects.all(), allow_null=True, required=False
    )
    substance_to = serializers.PrimaryKeyRelatedField(
        queryset=Substance.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = PCRProjectAlternativeTechnology
        fields = ["substance_from", "substance_to"]


class PCRProjectEnterpriseSerializer(serializers.ModelSerializer):
    class Meta:
        model = PCRProjectEnterprise
        fields = ["name", "address"]


class PCRProjectEquipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PCRProjectEquipment
        fields = ["name", "description", "disposal_type", "disposal_date"]


class PCRLookupSerializer(serializers.ModelSerializer):
    class Meta:
        fields = ["id", "name", "sort_order"]


class PCRProjectComponentOptionSerializer(PCRLookupSerializer):
    class Meta(PCRLookupSerializer.Meta):
        model = PCRProjectComponentOption


class PCRDelayCategorySerializer(PCRLookupSerializer):
    class Meta(PCRLookupSerializer.Meta):
        model = PCRDelayCategory


class PCRLearnedLessonCategorySerializer(PCRLookupSerializer):
    class Meta(PCRLookupSerializer.Meta):
        model = PCRLearnedLessonCategory


PCR_PROJECT_NESTED_MODELS = {
    "alternative_technologies": PCRProjectAlternativeTechnology,
    "enterprises": PCRProjectEnterprise,
    "equipments": PCRProjectEquipment,
}


def pop_pcr_project_nested_data(pcr_project_data):
    return {
        field_name: pcr_project_data.pop(field_name, None)
        for field_name in PCR_PROJECT_NESTED_MODELS
    }


def replace_pcr_project_nested_data(pcr_project, nested_data):
    for field_name, rows in nested_data.items():
        if rows is None:
            continue
        getattr(pcr_project, field_name).all().delete()
        PCR_PROJECT_NESTED_MODELS[field_name].objects.bulk_create(
            [
                PCR_PROJECT_NESTED_MODELS[field_name](
                    pcr_project=pcr_project,
                    **row,
                )
                for row in rows
            ]
        )


class PCRProjectSerializer(serializers.ModelSerializer):
    project_id = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(), source="project"
    )
    alternative_technologies = PCRProjectAlternativeTechnologySerializer(
        many=True, required=False
    )
    enterprises = PCRProjectEnterpriseSerializer(many=True, required=False)
    equipments = PCRProjectEquipmentSerializer(many=True, required=False)

    class Meta:
        model = PCRProject
        fields = [
            "id",
            "project_id",
            "financial_figures_status",
            "financial_figures_status_explanation",
            "addresses",
            "funds_disbursed",
            "planned_date_of_completion",
            "alternative_technologies",
            "enterprises",
            "equipments",
            "project_goal_achieved",
            "project_goal_achieved_explanation",
            "rating",
            "rating_explaination",
            "completed_by",
        ]
        extra_kwargs = {
            "financial_figures_status": {"required": False},
            "project_goal_achieved": {"required": False},
            "rating": {"required": False},
            "completed_by": {"required": False},
        }


def validate_pcr_project_references(pcr_projects, allowed_project_ids):
    project_ids = [pcr_project["project"].id for pcr_project in pcr_projects]
    project_id_counts = Counter(project_ids)
    duplicate_ids = sorted(
        project_id for project_id, count in project_id_counts.items() if count > 1
    )
    if duplicate_ids:
        duplicate_ids_display = ", ".join(map(str, duplicate_ids))
        raise serializers.ValidationError(
            {
                "pcr_projects": [
                    f"Duplicate Project IDs are not allowed: {duplicate_ids_display}."
                ]
            }
        )

    unrelated_ids = sorted(set(project_ids) - set(allowed_project_ids))
    if unrelated_ids:
        unrelated_ids_display = ", ".join(map(str, unrelated_ids))
        raise serializers.ValidationError(
            {
                "pcr_projects": [
                    "Projects do not belong to this PCR's MetaProject: "
                    f"{unrelated_ids_display}."
                ]
            }
        )


class PCRResponseSerializer(serializers.ModelSerializer):
    meta_project_id = serializers.IntegerField(read_only=True)
    pcr_projects = serializers.SerializerMethodField()

    class Meta:
        model = PCR
        fields = ["id", "meta_project_id", "submission_date", "pcr_projects"]

    def get_pcr_projects(self, instance):
        return PCRProjectSerializer(
            instance.pcr_projects.order_by("id"), many=True, context=self.context
        ).data


class PCRCreateSerializer(serializers.ModelSerializer):
    meta_project_id = serializers.PrimaryKeyRelatedField(
        queryset=MetaProject.objects.all(), source="meta_project"
    )
    pcr_projects = PCRProjectSerializer(many=True, required=False)

    class Meta:
        model = PCR
        fields = ["meta_project_id", "submission_date", "pcr_projects"]

    def validate_meta_project_id(self, meta_project):
        project_ids = meta_project.projects.values_list("id", flat=True)
        assigned_ids = list(
            PCRProject.objects.filter(project_id__in=project_ids)
            .order_by("project_id")
            .values_list("project_id", flat=True)
        )
        if assigned_ids:
            assigned_ids_display = ", ".join(map(str, assigned_ids))
            raise serializers.ValidationError(
                "MetaProject has Projects already assigned to a PCR: "
                f"{assigned_ids_display}."
            )
        return meta_project

    def validate(self, attrs):
        pcr_projects = attrs.get("pcr_projects", [])
        allowed_project_ids = attrs["meta_project"].projects.values_list(
            "id", flat=True
        )
        validate_pcr_project_references(pcr_projects, allowed_project_ids)
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        pcr_projects_data = validated_data.pop("pcr_projects", [])
        pcr_projects_by_project_id = {
            pcr_project_data["project"].id: pcr_project_data
            for pcr_project_data in pcr_projects_data
        }
        pcr = PCR.objects.create(**validated_data)
        for project in pcr.meta_project.projects.order_by("id"):
            pcr_project_data = pcr_projects_by_project_id.get(project.id, {}).copy()
            pcr_project_data.pop("project", None)
            nested_data = pop_pcr_project_nested_data(pcr_project_data)
            pcr_project = PCRProject.objects.create(
                pcr=pcr,
                project=project,
                **pcr_project_data,
            )
            replace_pcr_project_nested_data(pcr_project, nested_data)
        return pcr

    def to_representation(self, instance):
        return PCRResponseSerializer(instance, context=self.context).data


class PCRUpdateSerializer(serializers.ModelSerializer):
    pcr_projects = PCRProjectSerializer(many=True, required=False)

    class Meta:
        model = PCR
        fields = ["submission_date", "pcr_projects"]

    def validate(self, attrs):
        pcr_projects = attrs.get("pcr_projects", [])
        allowed_project_ids = self.instance.pcr_projects.values_list(
            "project_id", flat=True
        )
        validate_pcr_project_references(pcr_projects, allowed_project_ids)
        return attrs

    @transaction.atomic
    def update(self, instance, validated_data):
        pcr_projects_data = validated_data.pop("pcr_projects", [])
        instance = super().update(instance, validated_data)
        pcr_projects_by_project_id = {
            pcr_project.project_id: pcr_project
            for pcr_project in instance.pcr_projects.all()
        }
        for pcr_project_data in pcr_projects_data:
            project = pcr_project_data.pop("project")
            pcr_project = pcr_projects_by_project_id[project.id]
            nested_data = pop_pcr_project_nested_data(pcr_project_data)
            for field_name, value in pcr_project_data.items():
                setattr(pcr_project, field_name, value)
            pcr_project.save()
            replace_pcr_project_nested_data(pcr_project, nested_data)
        return instance

    def to_representation(self, instance):
        return PCRResponseSerializer(instance, context=self.context).data


class PCRProjectListSerializer(serializers.ModelSerializer):
    project_id = serializers.IntegerField(source="project.id", read_only=True)
    pcr_id = serializers.IntegerField(source="pcr.id", read_only=True)
    project_metacode = serializers.CharField(source="project.metacode", read_only=True)
    country = serializers.SerializerMethodField()
    country_id = serializers.IntegerField(source="project.country_id", read_only=True)
    region = serializers.SerializerMethodField()
    region_id = serializers.SerializerMethodField()
    lead_agency = serializers.SerializerMethodField()
    lead_agency_id = serializers.IntegerField(
        source="project.lead_agency_id", read_only=True
    )
    cooperating_agencies = serializers.SerializerMethodField()
    cooperating_agency_ids = serializers.SerializerMethodField()
    cluster = serializers.SerializerMethodField()
    cluster_id = serializers.IntegerField(source="project.cluster_id", read_only=True)
    type = serializers.SerializerMethodField()
    type_id = serializers.IntegerField(source="project.project_type_id", read_only=True)
    sector = serializers.SerializerMethodField()
    sector_id = serializers.IntegerField(source="project.sector_id", read_only=True)
    subsector = serializers.SerializerMethodField()
    subsector_ids = serializers.SerializerMethodField()
    title = serializers.CharField(source="project.title", read_only=True)
    category = serializers.CharField(source="project.category", read_only=True)
    pcr_due = serializers.SerializerMethodField()
    pcr_submission_date = serializers.DateTimeField(
        source="date_created", read_only=True
    )

    @staticmethod
    def _name(value):
        return value.name if value else None

    @staticmethod
    def _country_region(country):
        if not country:
            return None
        if country.parent_id and country.parent.parent_id:
            return country.parent.parent
        if country.parent_id:
            return country.parent
        return country

    def get_country(self, obj):
        return self._name(obj.project.country)

    def get_region(self, obj):
        return self._name(self._country_region(obj.project.country))

    def get_region_id(self, obj):
        region = self._country_region(obj.project.country)
        return region.id if region else None

    def get_lead_agency(self, obj):
        return self._name(obj.project.lead_agency)

    @staticmethod
    def _cooperating_agency(project):
        if (
            project.lead_agency_submitting_on_behalf
            and project.lead_agency_id != project.agency_id
        ):
            return project.agency
        return None

    def get_cooperating_agencies(self, obj):
        agency = self._cooperating_agency(obj.project)
        return [agency.name] if agency else []

    def get_cooperating_agency_ids(self, obj):
        agency = self._cooperating_agency(obj.project)
        return [agency.id] if agency else []

    def get_cluster(self, obj):
        return self._name(obj.project.cluster)

    def get_type(self, obj):
        return self._name(obj.project.project_type)

    def get_sector(self, obj):
        return self._name(obj.project.sector)

    def get_subsector(self, obj):
        return ", ".join(subsector.name for subsector in obj.project.subsectors.all())

    def get_subsector_ids(self, obj):
        return [subsector.id for subsector in obj.project.subsectors.all()]

    def get_pcr_due(self, obj):
        return bool(obj.pcr_due_value)

    class Meta:
        model = PCRProject
        fields = [
            "id",
            "pcr_id",
            "project_id",
            "project_metacode",
            "country",
            "country_id",
            "region",
            "region_id",
            "lead_agency",
            "lead_agency_id",
            "cooperating_agencies",
            "cooperating_agency_ids",
            "cluster",
            "cluster_id",
            "type",
            "type_id",
            "sector",
            "sector_id",
            "subsector",
            "subsector_ids",
            "title",
            "category",
            "pcr_due",
            "pcr_submission_date",
        ]


class ProjectListForPCRSerializer(serializers.ModelSerializer):

    actual_date_of_completion = serializers.SerializerMethodField()
    agency = serializers.SlugRelatedField("name", read_only=True)
    agency_id = serializers.IntegerField(read_only=True, source="agency.id")

    cluster = serializers.SlugRelatedField("name", read_only=True)
    cluster_id = serializers.IntegerField(read_only=True, source="cluster.id")

    country = serializers.SlugRelatedField("name", read_only=True)
    pcr_id = serializers.IntegerField(source="pcr_project.pcr_id", read_only=True)
    pcr_submission_date = serializers.DateField(
        read_only=True, source="pcr_project.pcr.submission_date"
    )
    project_type = serializers.SlugRelatedField("name", read_only=True)
    project_type_id = serializers.IntegerField(read_only=True, source="project_type.id")
    sector = serializers.SlugRelatedField("name", read_only=True)
    sector_id = serializers.IntegerField(read_only=True, source="sector.id")
    subsectors = serializers.SerializerMethodField()
    subsector_ids = serializers.SerializerMethodField()
    status = serializers.SlugRelatedField("name", read_only=True)
    status_id = serializers.IntegerField(read_only=True, source="status.id")
    funds_approved = serializers.SerializerMethodField()
    hfc_phase_down_co2_actual = serializers.SerializerMethodField()
    hfc_phase_down_co2_approved = serializers.DecimalField(
        max_digits=30,
        decimal_places=15,
        read_only=True,
        source="total_phase_out_co2_tonnes",
    )
    odp_phase_out_actual = serializers.SerializerMethodField()
    odp_phase_out_approved = serializers.DecimalField(
        max_digits=30,
        decimal_places=15,
        read_only=True,
        source="total_phase_out_odp_tonnes",
    )

    class Meta:
        model = Project
        fields = [
            "id",
            "actual_date_of_completion",
            "ad_hoc_pcr",
            "agency",
            "agency_id",
            "cluster",
            "cluster_id",
            "code",
            "country",
            "country_id",
            "date_approved",
            "funds_approved",
            "hfc_phase_down_co2_actual",
            "hfc_phase_down_co2_approved",
            "metacode",
            "odp_phase_out_actual",
            "odp_phase_out_approved",
            "pcr_id",
            "project_type",
            "project_type_id",
            "pcr_submission_date",
            "sector",
            "sector_id",
            "subsectors",
            "subsector_ids",
            "support_cost_psc",
            "status",
            "status_id",
            "title",
            "total_fund",
            "tranche",
        ]

    def get_subsectors(self, obj):
        return ", ".join(subsector.name for subsector in obj.subsectors.all())

    def get_subsector_ids(self, obj):
        return [subsector.id for subsector in obj.subsectors.all()]

    @extend_schema_field(serializers.DateField(allow_null=True))
    def get_actual_date_of_completion(self, obj):
        completion_date = project_apr_date_completed(obj)
        return completion_date.isoformat() if completion_date else None

    @extend_schema_field(serializers.FloatField(allow_null=True))
    def get_funds_approved(self, obj):
        return project_actual_fund(obj)

    @extend_schema_field(serializers.FloatField(allow_null=True))
    def get_hfc_phase_down_co2_actual(self, obj):
        return project_apr_co2_actual(obj)

    @extend_schema_field(serializers.FloatField(allow_null=True))
    def get_odp_phase_out_actual(self, obj):
        return project_apr_odp_actual(obj)


class PCRMetaProjectSerializer(serializers.ModelSerializer):
    """
    Serializer for MetaProject model.
    """

    projects = serializers.SerializerMethodField()

    class Meta:
        model = MetaProject
        fields = [
            "id",
            "umbrella_code",
            "type",
            "projects",
        ]

    @extend_schema_field(ProjectListForPCRSerializer(many=True))
    def get_projects(self, obj):
        # Use filtered_projects if available, otherwise fallback to all projects
        projects = getattr(obj, "filtered_projects", obj.projects.all())
        return ProjectListForPCRSerializer(projects, many=True).data
