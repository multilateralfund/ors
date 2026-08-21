"""
Response-only serializers, so ``/api/docs/`` describes the payloads.

Nothing is validated or deserialized through these; the payloads are built as
plain dicts in ``core/api/dashboard_metrics/``.
"""

from rest_framework import serializers

# pylint: disable=W0223

from core.api.dashboard_metrics.registry import Kind, Unit

KIND_CHOICES = [kind.value for kind in Kind]
UNIT_CHOICES = [unit.value for unit in Unit]


class DashboardEntrySerializer(serializers.Serializer):
    """One addressable entry: a country keyed on iso3, or a region on abbr."""

    key = serializers.CharField()
    name = serializers.CharField()
    entry_type = serializers.ChoiceField(choices=["country", "region"])
    iso3 = serializers.CharField(allow_null=True)


class DashboardScopeSerializer(serializers.Serializer):
    """What every figure in the payload counts."""

    population = serializers.CharField()
    excluded_statuses = serializers.ListField(child=serializers.CharField())
    production_included = serializers.BooleanField()


class DashboardMetricValueSerializer(serializers.Serializer):
    """One metric. ``kind`` and ``unit`` are declared, never sniffed."""

    metric_id = serializers.CharField()
    label = serializers.CharField()
    section = serializers.CharField()
    kind = serializers.ChoiceField(choices=KIND_CHOICES)
    unit = serializers.ChoiceField(choices=UNIT_CHOICES, allow_null=True)
    available = serializers.BooleanField()
    value = serializers.JSONField(allow_null=True)


class DashboardMetricsEnvelopeSerializer(serializers.Serializer):
    """The fund-wide payload."""

    as_of = serializers.CharField()
    apr_year = serializers.IntegerField(allow_null=True)
    apr_years_available = serializers.ListField(child=serializers.IntegerField())
    scope = DashboardScopeSerializer()
    metrics = DashboardMetricValueSerializer(many=True)


class DashboardCountryMetricsEnvelopeSerializer(DashboardMetricsEnvelopeSerializer):
    """The per-entry payload, plus the entry it describes."""

    entry = DashboardEntrySerializer()


class DashboardCountryIndexSerializer(serializers.Serializer):
    """Every entry the country route can address."""

    entries = DashboardEntrySerializer(many=True)
