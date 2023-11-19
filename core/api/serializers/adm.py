from rest_framework import serializers

from core.models import AdmRecordArchive
from core.models.adm import AdmChoice, AdmColumn, AdmRecord, AdmRow
from core.models.country_programme import CPReport

# pylint: disable=W0223

CP_GENERATION_CHEMICAL = "HFC-23"


class AdmChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdmChoice
        fields = [
            "id",
            "value",
            "sort_order",
        ]


# countryProgramReport serializer
class AdmRowSerializer(serializers.ModelSerializer):
    choices = AdmChoiceSerializer(many=True, read_only=True)

    class Meta:
        model = AdmRow
        fields = [
            "id",
            "index",
            "text",
            "type",
            "sort_order",
            "parent_id",
            "level",
            "choices",
        ]


class RecursiveField(serializers.Serializer):
    def to_representation(self, instance):
        serializer = self.parent.parent.__class__(instance, context=self.context)
        return serializer.data


class AdmColumnSerializer(serializers.ModelSerializer):
    children = RecursiveField(read_only=True, many=True)
    full_name = serializers.SerializerMethodField()
    category = serializers.SerializerMethodField()

    class Meta:
        model = AdmColumn
        fields = [
            "id",
            "display_name",
            "category",
            "type",
            "sort_order",
            "children",
            "full_name",
        ]

    def get_full_name(self, obj):
        final_name = obj.name.lower().replace(" ", "_")
        return f"{obj.section}_{final_name}"

    def get_category(self, _obj):
        return "adm"


class AdmRecordBaseSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    column_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=AdmColumn.objects.all().values_list("id", flat=True),
    )
    row_id = serializers.PrimaryKeyRelatedField(
        required=True,
        queryset=AdmRow.objects.all().values_list("id", flat=True),
    )
    value_choice_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=AdmChoice.objects.all().values_list("id", flat=True),
    )
    country_programme_report_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=CPReport.objects.all().values_list("id", flat=True),
        write_only=True,
    )
    section = serializers.CharField(required=False, write_only=True)

    class Meta:
        model = AdmRecord
        fields = [
            "id",
            "column_id",
            "row_id",
            "value_text",
            "value_choice_id",
            "country_programme_report_id",
            "section",
        ]

    def validate(self, attrs):
        if not attrs.get("column_id") and not attrs.get("value_choice_id"):
            raise serializers.ValidationError(
                "Either column_id or value_choice_id must be specified"
            )
        if attrs.get("column_id") and attrs.get("value_choice_id"):
            raise serializers.ValidationError(
                "Only one of column_id or value_choice_id must be specified"
            )

        return super().validate(attrs)


class AdmRecordSerializer(AdmRecordBaseSerializer):
    class Meta(AdmRecordBaseSerializer.Meta):
        model = AdmRecord


class AdmRecordArchiveSerializer(AdmRecordBaseSerializer):
    class Meta(AdmRecordBaseSerializer.Meta):
        model = AdmRecordArchive
