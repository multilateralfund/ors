from rest_framework import serializers

from core.models import Country


class CountrySerializer(serializers.ModelSerializer):
    has_cp_report = serializers.SerializerMethodField()

    class Meta:
        model = Country
        fields = [
            "id",
            "name",
            "abbr",
            "name_alt",
            "iso3",
            "has_cp_report",
            "is_a2",
        ]

    def get_has_cp_report(self, obj):
        return getattr(obj, "has_cp_report", None)


class CountryDetailsSerializer(CountrySerializer):
    parent = serializers.SlugRelatedField(slug_field="name", read_only=True)
    region = serializers.SerializerMethodField()

    class Meta(CountrySerializer.Meta):
        fields = CountrySerializer.Meta.fields + [
            "parent",
            "region",
            "location_type",
            "ozone_unit",
            "consumption_category",
            "consumption_group",
            "is_lvc",
            "lvc_baseline",
        ]

    def get_region(self, obj):
        country = obj
        while country is not None:
            if country.location_type == "Region":
                return {"id": country.id, "name": country.name}
            country = country.parent
        return None
