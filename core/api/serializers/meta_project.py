from rest_framework import serializers

from core.api.serializers import CountrySerializer
from core.api.serializers.agency import AgencySerializer
from core.api.serializers.meta_project_fields import MetaProjectFieldSerializer
from core.api.serializers.project_metadata import (
    ProjectClusterSerializer,
    ProjectSectorSerializer,
)
from core.api.serializers.project_v2 import ProjectListV2Serializer
from core.models.project import MetaProject


class MetaProjectComputedFieldsSerializer(serializers.ModelSerializer):
    start_date = serializers.SerializerMethodField()
    end_date = serializers.SerializerMethodField()
    project_funding = serializers.SerializerMethodField()
    support_cost = serializers.SerializerMethodField()
    phase_out_co2_eq_t = serializers.SerializerMethodField()
    phase_out_odp = serializers.SerializerMethodField()
    phase_out_mt = serializers.SerializerMethodField()

    _cache_computed = None

    class Meta:
        model = MetaProject
        fields = [
            "project_funding",
            "support_cost",
            "start_date",
            "end_date",
            "phase_out_co2_eq_t",
            "phase_out_odp",
            "phase_out_mt",
        ]

    def _get_computed_values(self, obj):
        if self._cache_computed is None:
            self._cache_computed = obj.get_computed_mya_values()
        return self._cache_computed

    def get_start_date(self, obj):
        return self._get_computed_values(obj)["start_date"]

    def get_end_date(self, obj):
        return self._get_computed_values(obj)["end_date"]

    def get_project_funding(self, obj):
        return self._get_computed_values(obj)["project_funding"]

    def get_support_cost(self, obj):
        return self._get_computed_values(obj)["support_cost"]

    def get_phase_out_co2_eq_t(self, obj):
        return self._get_computed_values(obj)["phase_out_co2_eq_t"]

    def get_phase_out_odp(self, obj):
        return self._get_computed_values(obj)["phase_out_odp"]

    def get_phase_out_mt(self, obj):
        return self._get_computed_values(obj)["phase_out_mt"]


class MetaProjecMyaDetailsSerializer(serializers.ModelSerializer):
    computed_field_data = serializers.SerializerMethodField()
    field_data = serializers.SerializerMethodField()
    projects = serializers.SerializerMethodField()
    lead_agency = serializers.SerializerMethodField()
    possible_projects = serializers.SerializerMethodField()

    class Meta:
        model = MetaProject
        fields = [
            "id",
            "type",
            "lead_agency",
            "is_draft",
            "umbrella_code",
            "projects",
            "field_data",
            "computed_field_data",
            "possible_projects",
        ]

    def get_projects(self, obj):
        # only approved projects are considered part of the meta project
        approved_projects = obj.approved_mya_projects_queryset()
        return ProjectListV2Serializer(approved_projects, many=True).data

    def get_possible_projects(self, obj):
        try:
            user = self.context["request"].user
        except KeyError:
            return []
        # projects not yet approved are considered possible projects
        possible_projects = obj.projects.exclude(submission_status__name="Approved")
        if user.has_perm("core.is_mlfs_user") and not user.is_superuser:
            possible_projects = possible_projects.exclude(
                submission_status__name="Draft"
            )
        return ProjectListV2Serializer(possible_projects, many=True).data

    def _get_field_data(self, obj, serializer):
        data = serializer(obj).data
        result = {}
        for order, field_name in enumerate(serializer.Meta.fields):
            value = data[field_name]
            field = getattr(MetaProject, field_name).field
            label = getattr(field, "help_text")
            result[field_name] = {
                "value": value,
                "label": label,
                "order": order,
                "type": field.__class__.__name__,
            }
        return result

    def get_field_data(self, obj):
        return self._get_field_data(obj, MetaProjectFieldSerializer)

    def get_computed_field_data(self, obj):
        return MetaProjectComputedFieldsSerializer(obj).data

    def get_lead_agency(self, obj):
        lead_agency_project = obj.first_approved_mya_project()
        if not lead_agency_project or not lead_agency_project.lead_agency:
            return None
        return AgencySerializer(lead_agency_project.lead_agency).data

    def field_data_with_computed_fallbacks(self):
        result = {}

        field_data = self.data.get("field_data", {})
        computed_data = self.data.get("computed_field_data", {})

        for field_name, field_info in field_data.items():
            value = field_info["value"]
            if value is None and field_name in computed_data:
                value = computed_data[field_name]
            result[field_name] = value

        return result


class MetaProjectMyaSerializer(serializers.ModelSerializer):
    clusters = serializers.SerializerMethodField()
    country = CountrySerializer()
    lead_agency = serializers.SerializerMethodField()
    sectors = serializers.SerializerMethodField()

    class Meta:
        model = MetaProject
        fields = [
            "id",
            "type",
            "lead_agency",
            "is_draft",
            "umbrella_code",
            "country",
            "clusters",
            "sectors",
        ]

    def get_lead_agency(self, obj):
        lead_agency_project = obj.first_approved_mya_project()
        if not lead_agency_project or not lead_agency_project.lead_agency:
            return None
        return AgencySerializer(lead_agency_project.lead_agency).data

    def get_clusters(self, obj):
        clusters = set()
        for project in obj.projects.all():
            clusters.add(project.cluster)
        return [ProjectClusterSerializer(cluster).data for cluster in clusters]

    def get_sectors(self, obj):
        sectors = set()
        for project in obj.projects.all():
            sectors.add(project.sector)
        return [ProjectSectorSerializer(sector).data for sector in sectors]
