from rest_framework import serializers

from core.api.serializers.project import (
    ProjectListSerializer,
)

from core.models.agency import Agency
from core.models.project import (
    MetaProject,
)
from core.api.serializers.project_v2 import ProjectListSerializer


class MetaProjectSerializer(serializers.ModelSerializer):
    """
    Serializer for MetaProject model.
    """

    lead_agency = serializers.SlugRelatedField("name", read_only=True)
    lead_agency_id = serializers.PrimaryKeyRelatedField(
        required=True, queryset=Agency.objects.all().values_list("id", flat=True)
    )
    projects = ProjectListSerializer(many=True, read_only=True)

    class Meta:
        model = MetaProject
        fields = [
            "id",
            "lead_agency",
            "lead_agency_id",
            "type",
            "code",
            "pcr_project_id",
            "projects",
        ]
