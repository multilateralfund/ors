from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, filters
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from core.api.filters.country_programme import (
    CPReportArchiveFilter,
)
from core.api.permissions import IsUserAllowedCP
from core.api.serializers.adm import AdmRecordArchiveSerializer
from core.api.serializers.cp_emission import CPEmissionArchiveSerializer
from core.api.serializers.cp_generation import CPGenerationArchiveSerializer
from core.api.serializers.cp_price import CPPricesArchiveSerializer
from core.api.serializers.cp_record import CPRecordArchiveSerializer
from core.api.serializers.cp_report import CPReportArchiveSerializer
from core.api.views.cp_records import CPRecordBaseListView
from core.models import AdmRecordArchive
from core.models.country_programme import CPReport
from core.models.country_programme_archive import (
    CPEmissionArchive,
    CPGenerationArchive,
    CPPricesArchive,
    CPRecordArchive,
    CPReportArchive,
)


class CPReportVersionsListView(generics.GenericAPIView):
    permission_classes = [IsUserAllowedCP]
    serializer_class = CPReportArchiveSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = CPReportArchiveFilter

    def get_queryset(self):
        user = self.request.user
        queryset = CPReportArchive.objects.all()
        if user.user_type == user.UserType.COUNTRY_USER:
            queryset = queryset.filter(country=user.country)
        return queryset

    def get(self, request, *args, **kwargs):
        # add the current version of the report
        country_id = request.query_params.get("country_id")
        year = request.query_params.get("year")
        current_version = None
        if country_id and year:
            current_version = CPReport.objects.filter(country_id=country_id, year=year).first()
        if not current_version:
            raise ValidationError("Could not find the current version of the report")

        # get archived versions
        versions = list(self.filter_queryset(self.get_queryset()).order_by("-version"))
        current_version.version = len(versions) + 1

        # add the current version to the list
        cp_reports_archive = [current_version] + versions

        serializer = self.get_serializer(cp_reports_archive, many=True)
        return Response(serializer.data)


class CPRecordsArchiveListView(CPRecordBaseListView):
    """
    List country programme records
    """

    cp_report_class = CPReportArchive
    cp_record_class = CPRecordArchive
    cp_prices_class = CPPricesArchive
    cp_generation_class = CPGenerationArchive
    cp_emission_class = CPEmissionArchive
    adm_record_class = AdmRecordArchive

    cp_report_seri_class = CPReportArchiveSerializer
    cp_record_seri_class = CPRecordArchiveSerializer
    cp_prices_seri_class = CPPricesArchiveSerializer
    cp_generation_seri_class = CPGenerationArchiveSerializer
    cp_emission_seri_class = CPEmissionArchiveSerializer
    adm_record_seri_class = AdmRecordArchiveSerializer
