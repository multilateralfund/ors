from rest_framework import serializers

from core.api.serializers import BlendSerializer
from core.api.serializers import SubstanceSerializer
from core.models import Agency
from core.models import BPRecord
from core.models import BPRecordValue
from core.models import BusinessPlan
from core.models import Country
from core.models import ProjectSector
from core.models import ProjectSubSector


class BPRecordValueSerializer(serializers.ModelSerializer):
    bp_record_id = serializers.PrimaryKeyRelatedField(
        required=True,
        queryset=BPRecord.objects.all().values_list("id", flat=True),
    )

    class Meta:
        model = BPRecordValue
        fields = [
            "id",
            "bp_record_id",
            "year",
            "value_usd",
            "value_odp",
            "value_mt",
        ]


class BPRecordSerializer(serializers.ModelSerializer):
    country = serializers.SlugRelatedField("name", read_only=True)
    lvc_status = serializers.ChoiceField(choices=BPRecord.LVCStatus.choices)
    project_type = serializers.StringRelatedField()
    bp_type = serializers.ChoiceField(choices=BPRecord.BPType.choices)
    bp_chemical_type = serializers.StringRelatedField()

    substances = SubstanceSerializer(many=True)
    blends = BlendSerializer(many=True)

    sector = serializers.SlugRelatedField("name", read_only=True)
    subsector = serializers.SlugRelatedField("name", read_only=True)
    values = BPRecordValueSerializer(many=True)

    class Meta:
        model = BPRecord
        fields = [
            "id",
            "business_plan_id",
            "title",
            "required_by_model",
            "country",
            "lvc_status",
            "project_type",
            "bp_chemical_type",
            "substances",
            "blends",
            "amount_polyol",
            "sector",
            "subsector",
            "sector_subsector",
            "bp_type",
            "is_multi_year",
            "reason_for_exceeding",
            "remarks",
            "remarks_additional",
            "values",
        ]


class BusinessPlanSerializer(serializers.ModelSerializer):
    agencies = serializers.PrimaryKeyRelatedField(
        required=True,
        many=True,
        queryset=Agency.objects.all().values_list("id", flat=True),
    )
    status = serializers.ChoiceField(
        choices=BusinessPlan.Status.choices, required=False
    )

    class Meta:
        model = BusinessPlan
        fields = [
            "id",
            "status",
            "year_start",
            "year_end",
            "agencies",
        ]
