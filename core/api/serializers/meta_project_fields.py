from rest_framework import serializers

from core.models import MetaProject


class MetaProjectFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetaProject
        fields = [
            "project_funding",
            "support_cost",
            "start_date",
            "end_date",
            "phase_out_odp",
            "phase_out_mt",
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
