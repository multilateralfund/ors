from rest_framework import serializers
from rest_framework.exceptions import ValidationError

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
            "with_text",
            "text_label",
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
    display_name = serializers.SerializerMethodField()

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

    def get_display_name(self, obj):
        year = self.context.get("year", None)
        if year and int(year) > 2011 and obj.alt_display_name:
            # for years after 2004, we use the alt_display_name
            return obj.alt_display_name
        return obj.display_name


class AdmRecordBaseSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    column_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=AdmColumn.objects.all().values_list("id", flat=True),
        allow_null=True,
    )
    row_id = serializers.PrimaryKeyRelatedField(
        required=True,
        queryset=AdmRow.objects.all().values_list("id", flat=True),
    )
    value_choice_id = serializers.PrimaryKeyRelatedField(
        required=False,
        queryset=AdmChoice.objects.all().values_list("id", flat=True),
        allow_null=True,
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

    def check_user_choice(self, data):
        if (
            not data.get("column_id")
            and not data.get("value_choice_id")
            and not data.get("value_text")
        ):
            raise ValidationError(
                {
                    "row_id": [
                        "Either column_id or value_choice_id or value_text must be specified"
                    ]
                }
            )

        if data.get("column_id") and data.get("value_choice_id"):
            raise ValidationError(
                {
                    "row_id": [
                        "Only one of column_id or value_choice_id must be specified"
                    ]
                }
            )

    def to_internal_value(self, data):
        try:
            self.check_user_choice(data)
            internal_value = super().to_internal_value(data)
        except ValidationError as e:
            # add chemical_id to error message
            row_id = data.get("row_id", "general_error")
            column_id = data.get("column_id", None)
            raport_error = {
                "row_id": row_id,
                "errors": e.detail,
            }
            if column_id:
                raport_error["column_id"] = column_id
            raise ValidationError(raport_error) from e
        return internal_value


class AdmRecordSerializer(AdmRecordBaseSerializer):
    class Meta(AdmRecordBaseSerializer.Meta):
        model = AdmRecord


class AdmRecordArchiveSerializer(AdmRecordBaseSerializer):
    class Meta(AdmRecordBaseSerializer.Meta):
        model = AdmRecordArchive
