import json
import urllib
from decimal import Decimal

import openpyxl
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models, transaction
from django.http import HttpResponse
from rest_framework import filters, generics, mixins, status, views, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from core.api.export.base import configure_sheet_print
from core.api.export.replenishment import DashboardWriter, EMPTY_ROW
from core.api.filters.replenishments import (
    InvoiceFilter,
    PaymentFilter,
    ScaleOfAssessmentFilter,
)
from core.api.serializers import (
    CountrySerializer,
    InvoiceSerializer,
    InvoiceCreateSerializer,
    PaymentSerializer,
    PaymentCreateSerializer,
    ReplenishmentSerializer,
    ScaleOfAssessmentSerializer,
    DisputedContributionCreateSerializer,
    DisputedContributionReadSerializer,
)
from core.api.utils import workbook_response
from core.models import (
    AnnualContributionStatus,
    Country,
    DisputedContribution,
    ExternalIncome,
    ExternalAllocation,
    FermGainLoss,
    Invoice,
    InvoiceFile,
    Payment,
    PaymentFile,
    Replenishment,
    ScaleOfAssessment,
    ScaleOfAssessmentVersion,
    TriennialContributionStatus,
)


class ReplenishmentCountriesViewSet(viewsets.GenericViewSet, mixins.ListModelMixin):
    """
    Viewset for all the countries that are available for a replenishment.
    """

    serializer_class = CountrySerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Country.objects.all()
        if user.user_type == user.UserType.COUNTRY_USER:
            queryset = queryset.filter(id=user.country_id)
        return queryset.order_by("name")


class ReplenishmentViewSet(
    viewsets.GenericViewSet, mixins.ListModelMixin, mixins.CreateModelMixin
):
    """
    Viewset for all replenishments that are available.
    """

    model = Replenishment
    serializer_class = ReplenishmentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.user_type == user.UserType.SECRETARIAT:
            return Replenishment.objects.prefetch_related(
                "scales_of_assessment_versions"
            ).order_by("-start_year")
        return Replenishment.objects.none()

    @transaction.atomic
    def perform_create(self, serializer):
        previous_replenishment = Replenishment.objects.order_by("-start_year").first()
        try:
            previous_replenishment_final_version = (
                previous_replenishment.scales_of_assessment_versions.get(is_final=True)
            )
        except ScaleOfAssessmentVersion.DoesNotExist as exc:
            raise ValidationError(
                {
                    "non_field_errors": "The current replenishment hasn't been finalized yet."
                }
            ) from exc
        except ScaleOfAssessmentVersion.MultipleObjectsReturned as exc:
            raise ValidationError(
                {
                    "non_field_errors": "There are multiple final versions for the previous replenishment."
                }
            ) from exc

        new_replenishment = serializer.save(
            start_year=previous_replenishment.start_year + 3,
            end_year=previous_replenishment.end_year + 3,
        )

        # Create draft version
        new_version = ScaleOfAssessmentVersion.objects.create(
            replenishment=new_replenishment
        )

        # Copy scales of assessment from previous replenishment
        new_scales_of_assessment = []
        for (
            previous_scale_of_assessment
        ) in previous_replenishment_final_version.scales_of_assessment.values(
            "country", "currency"
        ):
            new_scale_of_assessment = ScaleOfAssessment(
                version=new_version,
                country_id=previous_scale_of_assessment["country"],
                currency=previous_scale_of_assessment["currency"],
            )
            new_scales_of_assessment.append(new_scale_of_assessment)

        ScaleOfAssessment.objects.bulk_create(new_scales_of_assessment)


class ScaleOfAssessmentViewSet(
    viewsets.GenericViewSet, mixins.ListModelMixin, mixins.CreateModelMixin
):
    """
    Viewset for all scales of assessment.
    """

    model = ScaleOfAssessment
    filterset_class = ScaleOfAssessmentFilter
    serializer_class = ScaleOfAssessmentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.user_type == user.UserType.SECRETARIAT:
            return ScaleOfAssessment.objects.select_related(
                "country", "version__replenishment"
            ).order_by("country__name")
        return ScaleOfAssessment.objects.none()

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        input_data = request.data

        try:
            replenishment = Replenishment.objects.get(id=input_data["replenishment_id"])
        except Replenishment.DoesNotExist as exc:
            raise ValidationError(
                {"replenishment_id": "Replenishment does not exist."}
            ) from exc

        if input_data.get("amount"):
            replenishment.amount = input_data["amount"]
            replenishment.save()

        should_create_new_version = input_data.get("createNewVersion")
        final = input_data.get("final") or False
        meeting_number = input_data.get("meeting") or ""
        decision_number = input_data.get("decision") or ""
        comment = input_data.get("comment") or ""

        previous_version = replenishment.scales_of_assessment_versions.order_by(
            "-version"
        ).first()

        if previous_version.is_final:
            raise ValidationError(
                {
                    "non_field_errors": "The current replenishment has already been finalized."
                }
            )

        if should_create_new_version or final:
            # Marking as final always creates a new version that is marked as final
            version = ScaleOfAssessmentVersion.objects.create(
                replenishment=replenishment,
                is_final=final,
                meeting_number=meeting_number,
                decision_number=decision_number,
                version=previous_version.version + 1,
                comment=comment,
            )
        else:
            version = previous_version
            version.decision_number = decision_number
            version.meeting_number = meeting_number
            version.is_final = final
            version.comment = comment
            version.save()

        # Delete all scales of assessment if updating the latest version
        if not should_create_new_version:
            version.scales_of_assessment.all().delete()

        serializer = ScaleOfAssessmentSerializer(data=input_data["data"], many=True)
        serializer.is_valid(raise_exception=True)
        scales_of_assessment = [
            ScaleOfAssessment(version=version, **scale_of_assessment)
            for scale_of_assessment in serializer.validated_data
        ]

        ScaleOfAssessment.objects.bulk_create(scales_of_assessment)

        if final:
            # Delete all previous status of contributions data, if any
            AnnualContributionStatus.objects.filter(
                year__gte=replenishment.start_year, year__lte=replenishment.end_year
            ).delete()
            TriennialContributionStatus.objects.filter(
                start_year__gte=replenishment.start_year,
                end_year__lte=replenishment.end_year,
            ).delete()
            annual_contributions = []
            triennial_contributions = []
            # Create Status of Contributions data
            for scale_of_assessment in scales_of_assessment:
                annual_contributions.extend(
                    [
                        AnnualContributionStatus(
                            year=replenishment.start_year,
                            country=scale_of_assessment.country,
                            agreed_contributions=(
                                scale_of_assessment.amount / Decimal("3")
                            ),
                        ),
                        AnnualContributionStatus(
                            year=replenishment.start_year + 1,
                            country=scale_of_assessment.country,
                            agreed_contributions=(
                                scale_of_assessment.amount / Decimal("3")
                            ),
                        ),
                        AnnualContributionStatus(
                            year=replenishment.start_year + 2,
                            country=scale_of_assessment.country,
                            agreed_contributions=(
                                scale_of_assessment.amount / Decimal("3")
                            ),
                        ),
                    ]
                )
                triennial_contributions.append(
                    TriennialContributionStatus(
                        start_year=replenishment.start_year,
                        end_year=replenishment.end_year,
                        country=scale_of_assessment.country,
                        agreed_contributions=scale_of_assessment.amount,
                    )
                )

            AnnualContributionStatus.objects.bulk_create(annual_contributions)
            TriennialContributionStatus.objects.bulk_create(triennial_contributions)

        headers = self.get_success_headers(serializer.data)
        return Response(
            {},
            status=(
                status.HTTP_201_CREATED
                if should_create_new_version or final
                else status.HTTP_200_OK
            ),
            headers=headers,
        )


class AnnualStatusOfContributionsView(views.APIView):

    def get(self, request, *args, **kwargs):
        year = kwargs["year"]
        user = request.user

        if user.user_type != user.UserType.SECRETARIAT:
            return Response({})

        data = {}
        data["status_of_contributions"] = [
            {
                "country": CountrySerializer(country).data,
                "agreed_contributions": country.agreed_contributions,
                "cash_payments": country.cash_payments,
                "bilateral_assistance": country.bilateral_assistance,
                "promissory_notes": country.promissory_notes,
                "outstanding_contributions": country.outstanding_contributions,
            }
            for country in Country.objects.filter(
                annual_contributions_status__year=year,
            )
            .prefetch_related("annual_contributions_status")
            .annotate(
                agreed_contributions=models.Sum(
                    "annual_contributions_status__agreed_contributions", default=0
                ),
                cash_payments=models.Sum(
                    "annual_contributions_status__cash_payments", default=0
                ),
                bilateral_assistance=models.Sum(
                    "annual_contributions_status__bilateral_assistance", default=0
                ),
                promissory_notes=models.Sum(
                    "annual_contributions_status__promissory_notes", default=0
                ),
                outstanding_contributions=models.Sum(
                    "annual_contributions_status__outstanding_contributions", default=0
                ),
            )
            .order_by("name")
        ]

        data["total"] = AnnualContributionStatus.objects.filter(year=year).aggregate(
            agreed_contributions=models.Sum("agreed_contributions", default=0),
            cash_payments=models.Sum("cash_payments", default=0),
            bilateral_assistance=models.Sum("bilateral_assistance", default=0),
            promissory_notes=models.Sum("promissory_notes", default=0),
            outstanding_contributions=models.Sum(
                "outstanding_contributions", default=0
            ),
        )

        try:
            disputed_contribution_amount = DisputedContribution.objects.filter(
                year=year
            ).aggregate(total=models.Sum("amount", default=0))["total"]
        except DisputedContribution.DoesNotExist:
            disputed_contribution_amount = 0

        data["total"]["agreed_contributions_with_disputed"] = (
            data["total"]["agreed_contributions"] + disputed_contribution_amount
        )
        data["total"]["outstanding_contributions_with_disputed"] = (
            data["total"]["outstanding_contributions"] + disputed_contribution_amount
        )
        data["disputed_contributions"] = disputed_contribution_amount
        data["disputed_contributions_per_country"] = DisputedContributionReadSerializer(
            DisputedContribution.objects.filter(
                year=year, country__isnull=False
            ).select_related("country"),
            many=True,
        ).data

        return Response(data)


class TriennialStatusOfContributionsView(views.APIView):

    def get(self, request, *args, **kwargs):
        start_year = kwargs["start_year"]
        end_year = kwargs["end_year"]
        user = request.user

        if user.user_type != user.UserType.SECRETARIAT:
            return Response({})

        data = {}
        data["status_of_contributions"] = [
            {
                "country": CountrySerializer(country).data,
                "agreed_contributions": country.agreed_contributions,
                "cash_payments": country.cash_payments,
                "bilateral_assistance": country.bilateral_assistance,
                "promissory_notes": country.promissory_notes,
                "outstanding_contributions": country.outstanding_contributions,
            }
            for country in Country.objects.filter(
                triennial_contributions_status__start_year=start_year,
                triennial_contributions_status__end_year=end_year,
            )
            .prefetch_related("triennial_contributions_status")
            .annotate(
                agreed_contributions=models.Sum(
                    "triennial_contributions_status__agreed_contributions", default=0
                ),
                cash_payments=models.Sum(
                    "triennial_contributions_status__cash_payments", default=0
                ),
                bilateral_assistance=models.Sum(
                    "triennial_contributions_status__bilateral_assistance", default=0
                ),
                promissory_notes=models.Sum(
                    "triennial_contributions_status__promissory_notes", default=0
                ),
                outstanding_contributions=models.Sum(
                    "triennial_contributions_status__outstanding_contributions",
                    default=0,
                ),
            )
            .order_by("name")
        ]

        data["total"] = TriennialContributionStatus.objects.filter(
            start_year=start_year, end_year=end_year
        ).aggregate(
            agreed_contributions=models.Sum("agreed_contributions", default=0),
            cash_payments=models.Sum("cash_payments", default=0),
            bilateral_assistance=models.Sum("bilateral_assistance", default=0),
            promissory_notes=models.Sum("promissory_notes", default=0),
            outstanding_contributions=models.Sum(
                "outstanding_contributions", default=0
            ),
        )

        disputed_contribution_amount = DisputedContribution.objects.filter(
            year__gte=start_year, year__lte=end_year
        ).aggregate(total=models.Sum("amount", default=0))["total"]
        data["total"]["agreed_contributions_with_disputed"] = (
            data["total"]["agreed_contributions"] + disputed_contribution_amount
        )
        data["total"]["outstanding_contributions_with_disputed"] = (
            data["total"]["outstanding_contributions"] + disputed_contribution_amount
        )
        data["disputed_contributions"] = disputed_contribution_amount
        data["disputed_contributions_per_country"] = DisputedContributionReadSerializer(
            DisputedContribution.objects.filter(
                year__gte=start_year, year__lte=end_year, country__isnull=False
            ).select_related("country"),
            many=True,
        ).data

        return Response(data)


class SummaryStatusOfContributionsView(views.APIView):

    def get(self, request, *args, **kwargs):
        user = request.user

        if user.user_type != user.UserType.SECRETARIAT:
            return Response({})

        data = {}
        data["status_of_contributions"] = [
            {
                "country": CountrySerializer(country).data,
                "agreed_contributions": country.agreed_contributions,
                "cash_payments": country.cash_payments,
                "bilateral_assistance": country.bilateral_assistance,
                "promissory_notes": country.promissory_notes,
                "outstanding_contributions": country.outstanding_contributions,
                "gain_loss": country.gain_loss,
            }
            for country in Country.objects.filter(
                triennial_contributions_status__isnull=False
            )
            .prefetch_related("triennial_contributions_status")
            .select_related("ferm_gain_loss")
            .annotate(
                agreed_contributions=models.Sum(
                    "triennial_contributions_status__agreed_contributions", default=0
                ),
                cash_payments=models.Sum(
                    "triennial_contributions_status__cash_payments", default=0
                ),
                bilateral_assistance=models.Sum(
                    "triennial_contributions_status__bilateral_assistance", default=0
                ),
                promissory_notes=models.Sum(
                    "triennial_contributions_status__promissory_notes", default=0
                ),
                outstanding_contributions=models.Sum(
                    "triennial_contributions_status__outstanding_contributions",
                    default=0,
                ),
                gain_loss=models.F("ferm_gain_loss__amount"),
            )
            .order_by("name")
        ]

        data["total"] = TriennialContributionStatus.objects.aggregate(
            agreed_contributions=models.Sum("agreed_contributions", default=0),
            cash_payments=models.Sum("cash_payments", default=0),
            bilateral_assistance=models.Sum("bilateral_assistance", default=0),
            promissory_notes=models.Sum("promissory_notes", default=0),
            outstanding_contributions=models.Sum(
                "outstanding_contributions", default=0
            ),
        )
        data["total"]["gain_loss"] = FermGainLoss.objects.aggregate(
            total=models.Sum("amount", default=0)
        )["total"]

        disputed_contribution_amount = DisputedContribution.objects.aggregate(
            total=models.Sum("amount", default=0)
        )["total"]
        data["total"]["agreed_contributions_with_disputed"] = (
            data["total"]["agreed_contributions"] + disputed_contribution_amount
        )
        data["total"]["outstanding_contributions_with_disputed"] = (
            data["total"]["outstanding_contributions"] + disputed_contribution_amount
        )
        data["disputed_contributions"] = disputed_contribution_amount
        data["disputed_contributions_per_country"] = DisputedContributionReadSerializer(
            DisputedContribution.objects.filter(country__isnull=False).select_related(
                "country"
            ),
            many=True,
        ).data

        return Response(data)


class DisputedContributionViewSet(
    viewsets.GenericViewSet,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
):
    model = DisputedContribution

    def get_serializer_class(self):
        if self.request.method in ["POST", "PUT"]:
            return DisputedContributionCreateSerializer
        return DisputedContributionReadSerializer

    def get_queryset(self):
        # TODO: add proper permission classes
        user = self.request.user
        queryset = DisputedContribution.objects.all()
        if user.user_type == user.UserType.COUNTRY_USER:
            queryset = queryset.filter(country_id=user.country_id)

        return queryset.select_related("country")


class ReplenishmentDashboardView(views.APIView):

    def get(self, request, *args, **kwargs):
        user = request.user

        if user.user_type != user.UserType.SECRETARIAT:
            return Response({})

        latest_closed_triennial = (
            Replenishment.objects.filter(scales_of_assessment_versions__is_final=True)
            .distinct()
            .order_by("-start_year")
            .first()
        )
        income = ExternalIncome.objects.get()
        allocations = ExternalAllocation.objects.get()

        computed_summary_data = TriennialContributionStatus.objects.aggregate(
            cash_payments=models.Sum("cash_payments", default=0),
            bilateral_assistance=models.Sum("bilateral_assistance", default=0),
            promissory_notes=models.Sum("promissory_notes", default=0),
        )
        computed_party_data = (
            Country.objects.filter(
                triennial_contributions_status__isnull=False,
            )
            .prefetch_related("triennial_contributions_status")
            .annotate(
                outstanding_contributions_sum=models.Sum(
                    "triennial_contributions_status__outstanding_contributions",
                    default=0,
                )
            )
            .aggregate(
                parties_paid_in_advance_count=models.Count(
                    "id",
                    filter=models.Q(outstanding_contributions_sum__lt=0),
                ),
                parties_paid_count=models.Count(
                    "id",
                    filter=models.Q(outstanding_contributions_sum=0),
                ),
                parties_have_to_pay_count=models.Count(
                    "id",
                    filter=models.Q(outstanding_contributions_sum__gt=0),
                ),
            )
        )

        gain_loss = FermGainLoss.objects.aggregate(
            total=models.Sum("amount", default=0)
        )["total"]

        computed_summary_data_latest_closed_triennial = (
            TriennialContributionStatus.objects.filter(
                start_year=latest_closed_triennial.start_year,
                end_year=latest_closed_triennial.end_year,
            ).aggregate(
                agreed_contributions=models.Sum("agreed_contributions", default=0),
                cash_payments=models.Sum("cash_payments", default=0),
                bilateral_assistance=models.Sum("bilateral_assistance", default=0),
                promissory_notes=models.Sum("promissory_notes", default=0),
            )
        )
        payment_pledge_percentage_latest_closed_triennial = (
            (
                computed_summary_data_latest_closed_triennial["cash_payments"]
                + computed_summary_data_latest_closed_triennial["bilateral_assistance"]
                + computed_summary_data_latest_closed_triennial["promissory_notes"]
            )
            / computed_summary_data_latest_closed_triennial["agreed_contributions"]
            * Decimal("100")
        )

        pledges = (
            TriennialContributionStatus.objects.values("start_year", "end_year")
            .annotate(
                outstanding_pledges=models.Sum("outstanding_contributions", default=0),
                agreed_pledges=models.Sum("agreed_contributions", default=0),
                total_payments=models.Sum("cash_payments", default=0),
            )
            .order_by("start_year")
        )

        data = {
            "overview": {
                "payment_pledge_percentage": payment_pledge_percentage_latest_closed_triennial,
                "gain_loss": gain_loss,
                "parties_paid_in_advance_count": computed_party_data[
                    "parties_paid_in_advance_count"
                ],
                "parties_paid_count": computed_party_data["parties_paid_count"],
                "parties_have_to_pay_count": computed_party_data[
                    "parties_have_to_pay_count"
                ],
            },
            "income": {
                "cash_payments": computed_summary_data["cash_payments"],
                "bilateral_assistance": computed_summary_data["bilateral_assistance"],
                "interest_earned": income.interest_earned,
                "promissory_notes": computed_summary_data["promissory_notes"],
                "miscellaneous_income": income.miscellaneous_income,
            },
            "allocations": {
                "undp": allocations.undp,
                "unep": allocations.unep,
                "unido": allocations.unido,
                "world_bank": allocations.world_bank,
                "staff_contracts": allocations.staff_contracts,
                "treasury_fees": allocations.treasury_fees,
                "monitoring_fees": allocations.monitoring_fees,
                "technical_audit": allocations.technical_audit,
                "information_strategy": allocations.information_strategy,
                "bilateral_assistance": computed_summary_data["bilateral_assistance"],
                "gain_loss": gain_loss,
            },
            "charts": {
                "outstanding_pledges": [
                    {
                        "start_year": pledge["start_year"],
                        "end_year": pledge["end_year"],
                        "outstanding_pledges": pledge["outstanding_pledges"],
                    }
                    for pledge in pledges
                    if pledge["end_year"] <= latest_closed_triennial.end_year
                ],
                "pledged_contributions": [
                    {
                        "start_year": pledge["start_year"],
                        "end_year": pledge["end_year"],
                        "agreed_pledges": pledge["agreed_pledges"],
                    }
                    for pledge in pledges
                ],
                "payments": [
                    {
                        "start_year": pledge["start_year"],
                        "end_year": pledge["end_year"],
                        "total_payments": pledge["total_payments"],
                    }
                    for pledge in pledges
                ],
            },
        }

        data["overview"]["balance"] = sum(data["income"].values()) - sum(
            data["allocations"].values()
        )

        return Response(data)

    @transaction.atomic
    def put(self, request, *args, **kwargs):
        user = request.user

        if user.user_type != user.UserType.SECRETARIAT:
            return Response({})

        data = request.data

        income = ExternalIncome.objects.get()
        allocations = ExternalAllocation.objects.get()

        # TODO: serializers?
        income.interest_earned = data["interest_earned"]
        income.miscellaneous_income = data["miscellaneous_income"]
        income.save()

        allocations.undp = data["undp"]
        allocations.unep = data["unep"]
        allocations.unido = data["unido"]
        allocations.world_bank = data["world_bank"]
        allocations.staff_contracts = data["staff_contracts"]
        allocations.treasury_fees = data["treasury_fees"]
        allocations.monitoring_fees = data["monitoring_fees"]
        allocations.technical_audit = data["technical_audit"]
        allocations.information_strategy = data["information_strategy"]
        allocations.save()

        return Response({})


class ReplenishmentDashboardExportView(views.APIView):

    def get(self, request, *args, **kwargs):
        # TODO: get data
        income = ExternalIncome.objects.get()
        allocations = ExternalAllocation.objects.get()

        computed_summary_data = TriennialContributionStatus.objects.aggregate(
            cash_payments=models.Sum("cash_payments", default=0),
            bilateral_assistance=models.Sum("bilateral_assistance", default=0),
            promissory_notes=models.Sum("promissory_notes", default=0),
        )
        gain_loss = FermGainLoss.objects.aggregate(
            total=models.Sum("amount", default=0)
        )["total"]

        total_income = sum(
            [
                computed_summary_data["cash_payments"],
                computed_summary_data["promissory_notes"],
                computed_summary_data["bilateral_assistance"],
                income.interest_earned,
                income.miscellaneous_income,
            ]
        )

        total_allocations_agencies = sum(
            [
                allocations.undp,
                allocations.unep,
                allocations.unido,
                allocations.world_bank,
            ]
        )

        total_provisions = sum(
            [
                total_allocations_agencies,
                allocations.staff_contracts,
                allocations.treasury_fees,
                allocations.monitoring_fees,
                allocations.technical_audit,
                allocations.information_strategy,
                computed_summary_data["bilateral_assistance"],
                gain_loss,
            ]
        )

        balance = total_income - total_provisions

        data = [
            ("INCOME", None, None),
            ("Contributions received:", None, None),
            (
                "    -  Cash payments including note encashments",
                None,
                computed_summary_data["cash_payments"],
            ),
            (
                "    -  Promissory notes held",
                None,
                computed_summary_data["promissory_notes"],
            ),
            (
                "    -  Bilateral cooperation",
                None,
                computed_summary_data["bilateral_assistance"],
            ),
            (
                "    -  Interest earned",
                None,
                income.interest_earned,
            ),
            (
                "    -  Miscellaneous income",
                None,
                income.miscellaneous_income,
            ),
            EMPTY_ROW,
            (
                "Total income",
                None,
                total_income,
            ),
            EMPTY_ROW,
            (
                "ALLOCATIONS AND PROVISIONS",
                None,
                None,
            ),
            ("    -  UNDP", allocations.undp, None),
            ("    -  UNEP", allocations.unep, None),
            ("    -  UNIDO", allocations.unido, None),
            ("    -  World Bank", allocations.world_bank, None),
            ("Unspecified projects", "-", None),
            ("Less Adjustments", "-", None),
            (
                "Total allocations to implementing agencies",
                None,
                total_allocations_agencies,
            ),
            EMPTY_ROW,
            # TODO: dynamic years?
            ("Secretariat and Executive Committee costs (1991-2026)", None, None),
            (
                "    -  including provision for staff contracts into 2026",
                None,
                allocations.staff_contracts,
            ),
            ("Treasury fees", None, allocations.treasury_fees),
            (
                "Monitoring and Evaluation costs (1999-2025)",
                None,
                allocations.monitoring_fees,
            ),
            ("Technical Audit costs (1998-2010)", None, allocations.technical_audit),
            ("Information strategy costs (2003-2004)", None, None),
            (
                "    -  includes provision for Network maintenance costs for 2004",
                None,
                allocations.information_strategy,
            ),
            (
                "Bilateral cooperation",
                None,
                computed_summary_data["bilateral_assistance"],
            ),
            ("Provision for fixed-exchange-rate mechanism's fluctuations", None, None),
            ("    -  losses/(gains) in value", None, gain_loss),
            EMPTY_ROW,
            (
                "Total allocations and provisions",
                None,
                total_provisions,
            ),
            EMPTY_ROW,
            ("Balance", None, balance),
        ]

        wb = openpyxl.Workbook(write_only=True)
        sheet = wb.create_sheet("Status")
        configure_sheet_print(sheet, "landscape")

        DashboardWriter(sheet, []).write(data)

        return workbook_response("Status", wb)


class ReplenishmentInvoiceViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """
    Viewset for all the invoices.
    """

    model = Invoice
    serializer_class = InvoiceSerializer
    filterset_class = InvoiceFilter
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter,
    ]
    ordering_fields = [
        "amount",
        "country__name",
        "date_of_issuance",
        "date_sent_out",
    ]
    search_fields = ["number"]

    def get_queryset(self):
        user = self.request.user
        queryset = Invoice.objects.all()
        if user.user_type == user.UserType.COUNTRY_USER:
            queryset = queryset.filter(country_id=user.country_id)

        return queryset.select_related("country", "replenishment")

    def get_serializer_class(self):
        if self.request.method in ["POST", "PUT"]:
            return InvoiceCreateSerializer
        return InvoiceSerializer

    def _parse_invoice_new_files(self, request):
        number_of_files = int(request.data.get("nr_new_files", 0))
        files = [
            {
                "type": request.data.get(f"files[{file_no}][type]"),
                "contents": request.data.get(f"files[{file_no}][file]"),
            }
            for file_no in range(number_of_files)
        ]
        return files

    def _create_new_invoice_files(self, invoice, files_list):
        invoice_files = []
        for invoice_file in files_list:
            invoice_files.append(
                InvoiceFile(
                    invoice=invoice,
                    filename=invoice_file["contents"].name,
                    file=invoice_file["contents"],
                )
            )
        InvoiceFile.objects.bulk_create(invoice_files)

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        files = self._parse_invoice_new_files(request)

        serializer = InvoiceCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # First create the actual invoice
        self.perform_create(serializer)
        invoice = serializer.instance

        # Now create the files for this Invoice
        self._create_new_invoice_files(invoice, files)

        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        current_obj = self.get_object()

        new_files = self._parse_invoice_new_files(request)
        files_to_delete = json.loads(request.data.get("deleted_files", "[]"))

        # First perform the update for the Invoice fields
        serializer = InvoiceCreateSerializer(current_obj, data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_update(serializer)

        # Now create the new files for this Invoice
        self._create_new_invoice_files(current_obj, new_files)

        # And delete the ones that need to be deleted
        current_obj.invoice_files.filter(id__in=files_to_delete).delete()

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_200_OK, headers=headers)


class ReplenishmentInvoiceFileDownloadView(generics.RetrieveAPIView):
    # TODO: add proper permission_classes
    queryset = InvoiceFile.objects.all()
    lookup_field = "id"

    def get(self, request, *args, **kwargs):
        obj = self.get_object()
        response = HttpResponse(
            obj.file.read(), content_type="application/octet-stream"
        )
        file_name = urllib.parse.quote(obj.filename)
        response["Content-Disposition"] = (
            f"attachment; filename*=UTF-8''{file_name}; filename=\"{file_name}\""
        )
        return response


class ReplenishmentPaymentViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """
    Viewset for all the payments.
    """

    model = Payment
    serializer_class = PaymentSerializer
    filterset_class = PaymentFilter
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
    ]
    ordering_fields = [
        "amount",
        "country__name",
    ]

    def get_queryset(self):
        user = self.request.user
        queryset = Payment.objects.all()
        if user.user_type == user.UserType.COUNTRY_USER:
            queryset = queryset.filter(country_id=user.country_id)

        return queryset.select_related("country", "replenishment")

    def get_serializer_class(self):
        if self.request.method in ["POST", "PUT"]:
            return PaymentCreateSerializer
        return PaymentSerializer

    def _parse_payment_new_files(self, request):
        number_of_files = int(request.data.get("nr_new_files", 0))
        files = [
            {
                "type": request.data.get(f"files[{file_no}][type]"),
                "contents": request.data.get(f"files[{file_no}][file]"),
            }
            for file_no in range(number_of_files)
        ]
        return files

    def _create_new_payment_files(self, payment, files_list):
        payment_files = []
        for payment_file in files_list:
            payment_files.append(
                PaymentFile(
                    payment=payment,
                    filename=payment_file["contents"].name,
                    file=payment_file["contents"],
                )
            )
        PaymentFile.objects.bulk_create(payment_files)

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        files = self._parse_payment_new_files(request)

        serializer = PaymentCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # First create the actual payment
        self.perform_create(serializer)
        payment = serializer.instance

        # Now create the files for this Payment
        self._create_new_payment_files(payment, files)

        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        current_obj = self.get_object()

        new_files = self._parse_payment_new_files(request)
        files_to_delete = json.loads(request.data.get("deleted_files", "[]"))

        # First perform the update for the Payment fields
        serializer = PaymentCreateSerializer(current_obj, data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_update(serializer)

        # Now create the new files for this Payment
        self._create_new_payment_files(current_obj, new_files)

        # And delete the ones that need to be deleted
        current_obj.payment_files.filter(id__in=files_to_delete).delete()

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_200_OK, headers=headers)


class ReplenishmentPaymentFileDownloadView(generics.RetrieveAPIView):
    # TODO: add proper permission_classes
    queryset = PaymentFile.objects.all()
    lookup_field = "id"

    def get(self, request, *args, **kwargs):
        obj = self.get_object()
        response = HttpResponse(
            obj.file.read(), content_type="application/octet-stream"
        )
        file_name = urllib.parse.quote(obj.filename)
        response["Content-Disposition"] = (
            f"attachment; filename*=UTF-8''{file_name}; filename=\"{file_name}\""
        )
        return response
