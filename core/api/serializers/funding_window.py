from decimal import Decimal

from django.db.models import DecimalField
from django.db.models import Sum
from django.db.models import Value
from django.db.models.functions import Coalesce
from rest_framework import serializers
from rest_framework.fields import SerializerMethodField

from core.api.serializers.meeting import DecisionSerializer
from core.api.serializers.meeting import MeetingSerializer
from core.models import Decision
from core.models import Meeting
from core.models.funding_window import FundingWindow


class FundingWindowSerializer(serializers.ModelSerializer):
    meeting = MeetingSerializer(read_only=True)
    decision = DecisionSerializer(read_only=True)

    meeting_id = serializers.PrimaryKeyRelatedField(
        source="meeting",
        queryset=Meeting.objects.all(),
        write_only=True,
    )
    decision_id = serializers.PrimaryKeyRelatedField(
        source="decision",
        queryset=Decision.objects.all(),
        write_only=True,
    )

    total_project_funding_approved = SerializerMethodField(read_only=True)
    balance = SerializerMethodField(read_only=True)

    class Meta:
        model = FundingWindow
        fields = [
            "id",
            "meeting",
            "decision",
            "meeting_id",
            "decision_id",
            "description",
            "amount",
            "remarks",
            "total_project_funding_approved",
            "balance",
        ]

    def _get_projects_sum(self, obj):
        totals = obj.projects.filter(
            version__gte=3, submission_status__name="Approved"
        ).aggregate(
            total_funding=Coalesce(
                Sum("total_fund"),
                Value(Decimal("0")),
                output_field=DecimalField(),
            ),
            total_support=Coalesce(
                Sum("support_cost_psc"),
                Value(Decimal("0")),
                output_field=DecimalField(),
            ),
        )
        return sum(totals.values())

    def get_total_project_funding_approved(self, obj):
        return self._get_projects_sum(obj)

    def get_balance(self, obj):
        return obj.amount - self._get_projects_sum(obj)
