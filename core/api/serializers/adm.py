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
            "sort_order",
            "parent_id",
            "level",
            "choices",
        ]


class AdmColumnSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdmColumn
        fields = [
            "id",
            "display_name",
            "type",
            "sort_order",
        ]


class AdmRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdmRecord
        fields = [
            "id",
            "column_id",
            "row_id",
            "value_text",
            "value_choice_id",
        ]
