from rest_framework import serializers

from django.contrib.auth import get_user_model

from core.models.project_history import ProjectHistory
from core.models.project import Project

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name"]


class ProjectHistorySerializer(serializers.ModelSerializer):
    project_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=Project.objects.all().values_list("id", flat=True),
        write_only=True,
    )

    user = UserSerializer(read_only=True)

    class Meta:
        model = ProjectHistory
        fields = [
            "created_at",
            "project_id",
            "user",
            "description",
        ]
