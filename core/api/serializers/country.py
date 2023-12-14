from rest_framework import serializers

from core.models import Country


class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = ["id", "name", "abbr", "name_alt", "iso3"]
