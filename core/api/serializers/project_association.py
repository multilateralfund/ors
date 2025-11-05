from rest_framework import serializers

from core.models.agency import Agency
from core.models.project import (
    MetaProject,
    Project,
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


# pylint: disable=W0223
class AssociateProjectSerializer(serializers.Serializer):
    """
    Serializer for validating project association input data.
    """

    projects_to_associate = serializers.ListField(
        child=serializers.IntegerField(), allow_empty=False
    )
    meta_project_id = serializers.IntegerField(required=False)
    lead_agency_id = serializers.IntegerField(required=True)

    def validate(self, attrs):
        validated_data = super().validate(attrs)
        projects_to_associate = validated_data.get("projects_to_associate", [])
        if not projects_to_associate:
            raise serializers.ValidationError("projects_to_associate cannot be empty.")

        if "meta_project_id" not in validated_data and len(projects_to_associate) < 2:
            raise serializers.ValidationError(
                "At least two projects are required to create a new meta project."
            )

        if "meta_project_id" in validated_data:
            validated_data["meta_project"] = MetaProject.objects.filter(
                id=validated_data.get("meta_project_id")
            ).first()
            if not validated_data["meta_project"]:
                raise serializers.ValidationError("meta_project_id does not exist.")

        validated_data["projects"] = Project.objects.filter(
            id__in=projects_to_associate
        )
        if validated_data["projects"].count() != len(projects_to_associate):
            raise serializers.ValidationError("One or more project_ids do not exist.")

        # check if all projects belong to the same country
        countries = set(validated_data["projects"].values_list("country_id", flat=True))
        if len(countries) > 1:
            raise serializers.ValidationError(
                "All projects must belong to the same country."
            )

        meta_projects = set(
            validated_data["projects"]
            .exclude(meta_project__isnull=True)
            .values_list("meta_project_id", flat=True)
        )

        if len(meta_projects) > 1 and validated_data.get("meta_project") is None:
            raise serializers.ValidationError(
                "Projects belong to different meta projects. Please provide a meta_project_id to associate them."
            )

        if len(meta_projects) == 1 and validated_data.get("meta_project_id") is None:
            validated_data["meta_project"] = MetaProject.objects.filter(
                id=list(meta_projects)[0]
            ).first()

        validated_data["lead_agency"] = Agency.objects.filter(
            id=validated_data.get("lead_agency_id")
        ).first()
        if not validated_data["lead_agency"]:
            raise serializers.ValidationError("lead_agency_id does not exist.")
        return validated_data
