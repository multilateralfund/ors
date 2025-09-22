from rest_framework import serializers
from core.api.serializers.project_v2 import ProjectListV2Serializer
from core.models.project import MetaProject
from core.models.agency import Agency


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


class MetaProjecMyaDetailsSerializer(serializers.ModelSerializer):

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
        ]

    def get_projects(self, obj):
        return ProjectListV2Serializer(obj.projects.all(), many=True).data

    def get_field_data(self, obj):
        data = MetaProjectFieldSerializer(obj).data
        result = {}
        for order, field_name in enumerate(MetaProjectFieldSerializer.Meta.fields):
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


class MetaProjecMyaSerializer(serializers.ModelSerializer):

    lead_agency = serializers.SlugRelatedField("name", read_only=True)
    lead_agency_id = serializers.PrimaryKeyRelatedField(
        required=True, queryset=Agency.objects.all().values_list("id", flat=True)
    )

    class Meta:
        model = MetaProject
        fields = [
            "id",
            "type",
            "lead_agency",
            "lead_agency_id",
            "new_code",
        ]
