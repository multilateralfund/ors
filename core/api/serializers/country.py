from rest_framework import serializers

from core.models import Country


class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = ["id", "name", "name_alt", "iso3"]
