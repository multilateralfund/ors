from rest_framework import serializers

from core.models.adm import AdmChoice, AdmColumn, AdmRecord, AdmRow

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
            "min_year",
            "max_year",
            "sort_order",
            "parent_id",
            "level",
            "choices",
            "country_programme_report_id",
        ]


class AdmColumnSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdmColumn
        fields = [
            "id",
            "display_name",
            "type",
            "min_year",
            "max_year",
            "sort_order",
        ]


class AdmRecordSerializer(serializers.ModelSerializer):
    row_name = serializers.StringRelatedField(source="row")
    column_name = serializers.SerializerMethodField()

    class Meta:
        model = AdmRecord
        fields = [
            "id",
            "column_id",
            "row_id",
            "row_name",
            "column_name",
            "value_text",
            "value_choice_id",
            "country_programme_report_id",
        ]

    def get_row_name(self, obj):
        return obj.row

    def get_column_name(self, obj):
        if obj.column is None:
            return None
        return obj.column.name
