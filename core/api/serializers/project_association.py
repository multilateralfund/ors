from rest_framework import serializers

from core.models.agency import Agency
from core.models.project import (
    MetaProject,
)
from core.api.serializers.project_v2 import ProjectListV2Serializer


class MetaProjectSerializer(serializers.ModelSerializer):
    """
    Serializer for MetaProject model.
    """

    lead_agency = serializers.SlugRelatedField("name", read_only=True)
    lead_agency_id = serializers.PrimaryKeyRelatedField(
        required=True, queryset=Agency.objects.all().values_list("id", flat=True)
    )
    projects = serializers.SerializerMethodField()

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

    def get_projects(self, obj):
        # Use filtered_projects if available, otherwise fallback to all projects
        projects = getattr(obj, "filtered_projects", obj.projects.all())
        return ProjectListV2Serializer(projects, many=True).data
