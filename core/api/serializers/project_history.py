from rest_framework import serializers

from django.contrib.auth import get_user_model

from core.models.project_history import ProjectHistory
from core.models.project import Project

User = get_user_model()


class ProjectHistorySerializer(serializers.ModelSerializer):

    project_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=Project.objects.all().values_list("id", flat=True),
        write_only=True,
    )

    updated_by_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=User.objects.all().values_list("id", flat=True),
        write_only=True,
    )

    updated_by_username = serializers.StringRelatedField(
        read_only=True,
        source="updated_by.username",
    )

    updated_by_email = serializers.StringRelatedField(
        read_only=True,
        source="updated_by.email",
    )

    updated_by_first_name = serializers.StringRelatedField(
        read_only=True,
        source="updated_by.first_name",
    )

    updated_by_last_name = serializers.StringRelatedField(
        read_only=True,
        source="updated_by.last_name",
    )

    class Meta:
        model = ProjectHistory
        fields = [
            "created_at",
            "project_id",
            "updated_by_id",
            "description",
            "updated_by_username",
            "updated_by_email",
            "updated_by_first_name",
            "updated_by_last_name",
        ]
