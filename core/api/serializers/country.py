from rest_framework import serializers

from core.models import Country


class CountrySerializer(serializers.ModelSerializer):
    has_cp_report = serializers.SerializerMethodField()

    class Meta:
        model = Country
        fields = ["id", "name", "abbr", "name_alt", "iso3", "has_cp_report"]

    def get_has_cp_report(self, obj):
        return getattr(obj, "has_cp_report", None)
