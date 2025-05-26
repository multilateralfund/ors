from rest_framework import serializers

from core.models.project_history import ProjectHistory
from core.models.project import Project


class ProjectHistorySerializer(serializers.ModelSerializer):

    class Meta:
        model = ProjectHistory
        fields = [
            "created_at",
            "project",
            "updated_by",
            "description",
        ]
