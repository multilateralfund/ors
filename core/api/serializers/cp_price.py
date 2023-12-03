from rest_framework import serializers

from core.api.serializers.base import BaseCPWChemicalSerializer
from core.models.country_programme import CPPrices
from core.models.country_programme_archive import CPPricesArchive


class CPPricesBaseSerializer(BaseCPWChemicalSerializer):
    previous_year_price = serializers.DecimalField(
        max_digits=12, decimal_places=3, required=False, allow_null=True
    )
    current_year_price = serializers.DecimalField(
        max_digits=12, decimal_places=3, required=True
    )
    remarks = serializers.CharField(required=False, allow_blank=True)
    computed_prev_year_price = serializers.SerializerMethodField()

    class Meta:
        fields = BaseCPWChemicalSerializer.Meta.fields + [
            "previous_year_price",
            "current_year_price",
            "computed_prev_year_price",
            "remarks",
        ]

    def get_computed_prev_year_price(self, obj):
        return getattr(obj, "computed_prev_year_price", None)


class CPPricesSerializer(CPPricesBaseSerializer):
    class Meta(CPPricesBaseSerializer.Meta):
        model = CPPrices


class CPPricesArchiveSerializer(CPPricesBaseSerializer):
    class Meta(CPPricesBaseSerializer.Meta):
        model = CPPricesArchive
