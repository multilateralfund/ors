from rest_framework import serializers

from core.models import (
    Group,
    Substance,
)
from core.api.serializers.chemicals import (
    GroupSerializer,
    SubstanceSerializer,
)
from core.models.project_metadata import (
    ProjectCluster,
    ProjectField,
    ProjectSector,
    ProjectStatus,
    ProjectSubmissionStatus,
    ProjectClusterTypeSectorFields,
    ProjectSubSector,
    ProjectType,
)

from core.models import Project

# pylint: disable=R0911


class ProjectClusterSerializer(serializers.ModelSerializer):
    """
    ProjectClusterSerializer class
    """

    class Meta:
        model = ProjectCluster
        fields = [
            "id",
            "name",
            "code",
            "category",
            "sort_order",
        ]


class ProjectStatusSerializer(serializers.ModelSerializer):
    """
    ProjectStatusSerializer class
    """

    class Meta:
        model = ProjectStatus
        fields = [
            "id",
            "code",
            "name",
            "color",
        ]


class ProjectSubmissionStatusSerializer(serializers.ModelSerializer):
    """
    ProjectSubmissionStatusSerializer class
    """

    class Meta:
        model = ProjectSubmissionStatus
        fields = [
            "id",
            "code",
            "name",
            "color",
        ]


class ProjectSectorSerializer(serializers.ModelSerializer):
    """
    ProjectSectorSerializer class
    """

    name = serializers.CharField(required=True)

    class Meta:
        model = ProjectSector
        fields = [
            "id",
            "name",
            "code",
            "sort_order",
            "allowed_types",
        ]
        read_only_fields = ["id", "allowed_types"]


class ProjectSubSectorSerializer(serializers.ModelSerializer):
    """
    ProjectSubSectorSerializer class
    """

    sector_id = serializers.PrimaryKeyRelatedField(
        required=True, queryset=ProjectSector.objects.all().values_list("id", flat=True)
    )
    name = serializers.CharField(required=True)

    class Meta:
        model = ProjectSubSector
        fields = [
            "id",
            "name",
            "code",
            "sort_order",
            "sector_id",
        ]


class ProjectTypeSerializer(serializers.ModelSerializer):
    """
    ProjectTypeSerializer class
    """

    class Meta:
        model = ProjectType
        fields = [
            "id",
            "name",
            "code",
            "sort_order",
            "allowed_sectors",
        ]
        read_only_fields = ["id", "allowed_sectors"]


class ProjectFieldSerializer(serializers.ModelSerializer):
    """
    ProjectFieldSerializer class
    """

    options = serializers.SerializerMethodField()

    class Meta:
        model = ProjectField
        fields = [
            "id",
            "label",
            "field_name",
            "table",
            "data_type",
            "section",
            "options",
        ]

    def get_options(self, obj):
        if obj.field_name == "group":
            return GroupSerializer(Group.objects.all().order_by("name"), many=True).data

        if obj.field_name == "ods_substance":
            return SubstanceSerializer(
                Substance.objects.all().order_by("name"), many=True
            ).data

        if obj.field_name == "is_sme":
            return [
                {"label": "Yes", "value": True},
                {"label": "No", "value": False},
            ]
        if obj.field_name == "production_control_type":
            return Project.ProductionControlType.choices

        if obj.field_name == "destruction_technology":
            return Project.DestructionTechnology.choices

        if obj.field_name == "checklist_regulations":
            return Project.Regulations.choices
        return None


class ProjectClusterTypeSectorFieldsSerializer(serializers.ModelSerializer):
    fields = ProjectFieldSerializer(many=True, read_only=True)

    class Meta:
        model = ProjectClusterTypeSectorFields
        fields = [
            "fields",
        ]
