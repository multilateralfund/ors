from django.db.models import Max
from django.db.models import Min
from django.db.models import Sum
from rest_framework import serializers

from core.api.serializers import CountrySerializer
from core.api.serializers.agency import AgencySerializer
from core.api.serializers.project_metadata import ProjectClusterSerializer
from core.api.serializers.project_v2 import ProjectListV2Serializer
from core.models.project import MetaProject


class MetaProjectFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetaProject
        fields = [
            "project_funding",
            "support_cost",
            "start_date",
            "end_date",
            "phase_out_odp",
            "pahse_out_mt",
            "targets",
            "starting_point",
            "baseline",
            "number_of_enterprises_assisted",
            "number_of_enterprises",
            "aggregated_consumption",
            "number_of_production_lines_assisted",
            "cost_effectiveness_kg",
            "cost_effectiveness_co2",
        ]


class MetaProjectComputedFieldsSerializer(serializers.ModelSerializer):
    start_date = serializers.SerializerMethodField()
    end_date = serializers.SerializerMethodField()
    project_funding = serializers.SerializerMethodField()
    support_cost = serializers.SerializerMethodField()

    _cache_computed = None

    class Meta:
        model = MetaProject
        fields = [
            "project_funding",
            "support_cost",
            "start_date",
            "end_date",
            "phase_out_odp",
            "pahse_out_mt",
        ]

    def _get_computed_values(self, obj):
        if self._cache_computed is None:
            self._cache_computed = obj.projects.aggregate(
                min_start=Min("project_start_date"),
                max_end=Max("project_end_date"),
                total_funding=Sum("total_fund"),
                total_support=Sum("support_cost_psc"),
            )
        return self._cache_computed

    def get_start_date(self, obj):
        return self._get_computed_values(obj)["min_start"]

    def get_end_date(self, obj):
        return self._get_computed_values(obj)["max_end"]

    def get_project_funding(self, obj):
        return self._get_computed_values(obj)["total_funding"]

    def get_support_cost(self, obj):
        return self._get_computed_values(obj)["total_support"]


class MetaProjecMyaDetailsSerializer(serializers.ModelSerializer):

    computed_field_data = serializers.SerializerMethodField()
    field_data = serializers.SerializerMethodField()
    projects = serializers.SerializerMethodField()

    class Meta:
        model = MetaProject
        fields = [
            "id",
            "type",
            "lead_agency",
            "new_code",
            "projects",
            "field_data",
            "computed_field_data",
        ]

    def get_projects(self, obj):
        return ProjectListV2Serializer(obj.projects.all(), many=True).data

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


class MetaProjecMyaSerializer(serializers.ModelSerializer):

    lead_agency = AgencySerializer(read_only=True)
    country = serializers.SerializerMethodField()
    cluster = serializers.SerializerMethodField()

    class Meta:
        model = MetaProject
        fields = [
            "id",
            "type",
            "lead_agency",
            "new_code",
            "country",
            "cluster",
        ]

    def get_country(self, obj):
        country = obj.projects.first().country
        return CountrySerializer(country).data

    def get_cluster(self, obj):
        cluster = obj.projects.first().cluster
        return ProjectClusterSerializer(cluster).data
