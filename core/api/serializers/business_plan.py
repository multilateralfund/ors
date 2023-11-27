import itertools

from rest_framework import serializers

from core.api.serializers import CountrySerializer
from core.api.serializers.agency import AgencySerializer
from core.api.serializers.project import ProjectSectorSerializer
from core.api.serializers.project import ProjectSubSectorSerializer
from core.api.serializers.project import ProjectTypeSerializer
from core.models import BPChemicalType
from core.models import BPRecord
from core.models import BPRecordValue
from core.models import BusinessPlan


class BPChemicalTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = BPChemicalType
        fields = [
            "id",
            "name",
        ]


class BPRecordValueSerializer(serializers.ModelSerializer):
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


class BusinessPlanSerializer(serializers.ModelSerializer):
    agency = AgencySerializer()
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
            "agency",
        ]


class BPRecordExportSerializer(serializers.ModelSerializer):
    agency = serializers.SerializerMethodField()
    lvc_status = serializers.ChoiceField(choices=BPRecord.LVCStatus.choices)
    project_type = serializers.SlugRelatedField("code", read_only=True)
    bp_type = serializers.ChoiceField(choices=BPRecord.BPType.choices)
    bp_chemical_type = serializers.SlugRelatedField("name", read_only=True)
    chemical_detail = serializers.SerializerMethodField()
    country = serializers.SlugRelatedField("name", read_only=True)

    sector = serializers.SlugRelatedField("code", read_only=True)
    subsector = serializers.SlugRelatedField("code", read_only=True)
    values = BPRecordValueSerializer(many=True)

    class Meta:
        model = BPRecord
        fields = [
            "id",
            "business_plan_id",
            "agency",
            "title",
            "required_by_model",
            "country",
            "lvc_status",
            "project_type",
            "bp_chemical_type",
            "chemical_detail",
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

    def get_agency(self, obj):
        return obj.business_plan.agency.name

    def get_chemical_detail(self, obj):
        return "/".join(
            chem.name
            for chem in itertools.chain(
                obj.substances.all(),
                obj.blends.all(),
            )
        )


class BPRecordDetailSerializer(serializers.ModelSerializer):
    business_plan = BusinessPlanSerializer()
    country = CountrySerializer()
    lvc_status = serializers.ChoiceField(choices=BPRecord.LVCStatus.choices)
    project_type = ProjectTypeSerializer()
    bp_type = serializers.ChoiceField(choices=BPRecord.BPType.choices)
    bp_chemical_type = BPChemicalTypeSerializer()

    substances = serializers.SlugRelatedField("name", many=True, read_only=True)
    blends = serializers.SlugRelatedField(slug_field="name", many=True, read_only=True)

    sector = ProjectSectorSerializer()
    subsector = ProjectSubSectorSerializer()
    values = BPRecordValueSerializer(many=True)

    class Meta:
        model = BPRecord
        fields = [
            "id",
            "business_plan",
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
