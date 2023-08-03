from rest_framework import serializers

from core.models.agency import Agency


class AgencySerializer(serializers.ModelSerializer):
    """
    AgencySerializer class
    """

    class Meta:
        model = Agency
        fields = [
            "id",
            "name",
        ]
