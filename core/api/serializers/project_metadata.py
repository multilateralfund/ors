from rest_framework import serializers

from core.models import (
    Group,
    Substance,
    ProjectOdsOdp,
)
from core.api.serializers.chemicals import (
    GroupSerializer,
    SubstanceSerializer,
    BlendSerializer,
)
from core.models.blend import Blend
from core.models.project_metadata import (
    ProjectCluster,
    ProjectField,
    ProjectSector,
    ProjectStatus,
    ProjectSubmissionStatus,
    ProjectSpecificFields,
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
            "production",
            "sort_order",
            "obsolete",
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
            "obsolete",
        ]
        read_only_fields = ["id", "allowed_types"]


class ProjectSectorIncludingSubsectorsSerializer(ProjectSectorSerializer):
    subsectors = serializers.SerializerMethodField()

    class Meta:
        model = ProjectSector
        fields = ProjectSectorSerializer.Meta.fields + [
            "subsectors",
        ]
        read_only_fields = ProjectSectorSerializer.Meta.read_only_fields + [
            "subsectors",
        ]

    def get_subsectors(self, obj):
        subsectors = ProjectSubSector.objects.filter(sectors=obj).order_by("sort_order")
        return ProjectSubSectorSerializer(subsectors, many=True).data


class ProjectSubSectorSerializer(serializers.ModelSerializer):
    """
    ProjectSubSectorSerializer class
    """

    sectors = serializers.PrimaryKeyRelatedField(
        many=True,
        required=False,
        queryset=ProjectSector.objects.all().values_list("id", flat=True),
    )
    name = serializers.CharField(required=True)

    class Meta:
        model = ProjectSubSector
        fields = [
            "id",
            "name",
            "code",
            "sort_order",
            "sectors",
            "obsolete",
        ]

    def create(self, validated_data):
        sectors = validated_data.pop("sectors", [])
        subsector = super().create(validated_data)
        subsector.sectors.set(sectors)
        subsector.save()
        return subsector


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
            "obsolete",
        ]
        read_only_fields = ["id", "allowed_sectors"]


class ProjectFieldListSerializer(serializers.ModelSerializer):
    """
    ProjectFieldListSerializer class
    """

    editable_in_versions = serializers.SerializerMethodField()
    visible_in_versions = serializers.SerializerMethodField()

    class Meta:
        model = ProjectField
        fields = [
            "id",
            "label",
            "read_field_name",
            "write_field_name",
            "table",
            "data_type",
            "section",
            "is_actual",
            "sort_order",
            "editable_in_versions",
            "visible_in_versions",
        ]

    def get_editable_in_versions(self, obj):
        """
        Returns a list of versions where the field is editable.
        """
        return obj.get_editable_versions()

    def get_visible_in_versions(self, obj):
        """
        Returns a list of versions where the field is visible.
        """
        return obj.get_visible_versions()


class ProjectFieldSerializer(ProjectFieldListSerializer):
    """
    ProjectFieldSerializer class
    """

    options = serializers.SerializerMethodField()
    editable = serializers.SerializerMethodField()
    editable_in_versions = serializers.SerializerMethodField()
    visible_in_versions = serializers.SerializerMethodField()

    class Meta:
        model = ProjectField
        fields = [
            "id",
            "label",
            "read_field_name",
            "write_field_name",
            "table",
            "data_type",
            "section",
            "is_actual",
            "editable_in_versions",
            "visible_in_versions",
            "options",
            "editable",
            "sort_order",
        ]

    def get_editable(self, obj):
        """
        Returns whether the field is editable based on the project type.
        """
        project_submission_status_name = self.context.get(
            "project_submission_status_name"
        )
        if not project_submission_status_name or obj.section != "Impact":
            return None
        if project_submission_status_name == "Approved":
            return obj.is_actual
        return not obj.is_actual

    def get_options(self, obj):
        """
        ! Returns options only for specific fields.
        """

        if obj.read_field_name == "group":
            return GroupSerializer(Group.objects.all().order_by("name"), many=True).data
        if obj.read_field_name == "ods_type":
            return [
                (
                    ProjectOdsOdp.ProjectOdsOdpType.OTHER.value,
                    ProjectOdsOdp.ProjectOdsOdpType.OTHER.label,
                ),
                (
                    ProjectOdsOdp.ProjectOdsOdpType.PRODUCTION.value,
                    ProjectOdsOdp.ProjectOdsOdpType.PRODUCTION.label,
                ),
            ]
        if obj.read_field_name == "ods_display_name":
            data = {}

            substances = (
                Substance.objects.all()
                .filter_project_accepted_substances()
                .order_by("name")
            )
            data["substances"] = SubstanceSerializer(substances, many=True).data
            for entry in data["substances"]:
                entry["baseline_type"] = "substance"

            blends = (
                Blend.objects.all().filter_project_accepted_blends().order_by("name")
            )
            data["blends"] = BlendSerializer(blends, many=True).data
            for entry in data["blends"]:
                entry["baseline_type"] = "blend"

            return data

        if obj.read_field_name == "is_sme":
            return [
                {"id": True, "name": "SME"},
                {"id": False, "name": "Non-SME"},
            ]

        if obj.read_field_name == "tranche":
            return [{"id": index, "name": str(index)} for index in range(1, 11)]
        if obj.read_field_name == "production_control_type":
            return Project.ProductionControlType.choices

        if obj.read_field_name == "destruction_technology":
            return Project.DestructionTechnology.choices

        if obj.read_field_name in [
            "checklist_regulations",
            "checklist_regulations_actual",
        ]:
            return Project.Regulations.choices
        return None


class ProjectSpecificFieldsSerializer(serializers.ModelSerializer):
    field_objs = serializers.SerializerMethodField()

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Rename _fields to fields in output
        ret["fields"] = ret.pop("field_objs")
        return ret

    def get_field_objs(self, obj):
        project_submission_status_name = self.context.get(
            "project_submission_status_name"
        )
        return ProjectFieldSerializer(
            obj.fields.all(),
            many=True,
            read_only=True,
            context={"project_submission_status_name": project_submission_status_name},
        ).data

    class Meta:
        model = ProjectSpecificFields
        fields = [
            "field_objs",
        ]
