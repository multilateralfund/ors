from rest_framework import serializers

from core.models import MetaProject


class MetaProjectFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetaProject
        fields = [
            "project_funding",
            "support_cost",
            "project_cost",
            "start_date",
            "end_date",
            "phase_out_co2_eq_t",
            "phase_out_odp",
            "phase_out_mt",
            "target_reduction",
            "target_co2_eq_t",
            "target_odp",
            "starting_point_odp",
            "starting_point_co2_eq_t",
            "baseline_odp",
            "baseline_co2_eq_t",
            "number_of_smes_directly_funded",
            "number_of_non_sme_directly_funded",
            "number_of_both_sme_non_sme_not_directly_funded",
            "number_of_production_lines_assisted",
            "cost_effectiveness_kg",
            "cost_effectiveness_co2",
        ]
