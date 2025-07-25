from rest_framework import serializers

from core.models.agency import Agency


class AgencySerializer(serializers.ModelSerializer):
    """
    AgencySerializer class
    """

    name_display = serializers.SerializerMethodField()

    class Meta:
        model = Agency
        fields = [
            "id",
            "name",
            "name_display",
        ]

    def get_name_display(self, obj):
        """
        Custom display for agency name
        """
        return obj.get_name_display()


class BusinessPlanAgencySerializer(serializers.ModelSerializer):
    """
    BusinessPlanAgencySerializer class
    """

    name = serializers.SerializerMethodField()

    class Meta:
        model = Agency
        fields = [
            "id",
            "name",
            "code",
            "agency_type",
        ]

    def get_name(self, obj):
        """
        Custom display for agency name
        """
        return obj.get_name_display()
