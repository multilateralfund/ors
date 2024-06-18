from rest_framework import serializers

from core.api.serializers.country import CountrySerializer
from core.models import Replenishment, Contribution


class ReplenishmentSerializer(serializers.ModelSerializer):
    amount = serializers.DecimalField(
        max_digits=30, decimal_places=15, coerce_to_string=False
    )

    class Meta:
        model = Replenishment
        fields = "__all__"


class ContributionSerializer(serializers.ModelSerializer):
    replenishment = ReplenishmentSerializer(read_only=True)
    country = CountrySerializer(read_only=True)
    currency = serializers.CharField()
    exchange_rate = serializers.DecimalField(
        max_digits=30, decimal_places=15, coerce_to_string=False
    )
    bilateral_assistance_amount = serializers.DecimalField(
        max_digits=30, decimal_places=15, coerce_to_string=False
    )
    un_scale_of_assessment = serializers.DecimalField(
        max_digits=30, decimal_places=15, coerce_to_string=False
    )
    override_adjusted_scale_of_assessment = serializers.DecimalField(
        max_digits=30, decimal_places=15, coerce_to_string=False
    )
    average_inflation_rate = serializers.DecimalField(
        max_digits=30, decimal_places=15, coerce_to_string=False
    )
    override_qualifies_for_fixed_rate_mechanism = serializers.BooleanField()

    adjusted_scale_of_assessment = serializers.ReadOnlyField()
    qualifies_for_fixed_rate_mechanism = serializers.ReadOnlyField()
    amount = serializers.ReadOnlyField()
    amount_local_currency = serializers.ReadOnlyField()

    class Meta:
        model = Contribution
        fields = "__all__"
