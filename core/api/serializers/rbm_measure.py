from rest_framework import serializers

from core.models.rbm_measures import RBMMeasure


class RBMMeasureSerializer(serializers.ModelSerializer):
    """
    RBMMeasureSerializer class
    """

    class Meta:
        model = RBMMeasure
        fields = [
            "id",
            "name",
            "description",
            "sort_order",
        ]
