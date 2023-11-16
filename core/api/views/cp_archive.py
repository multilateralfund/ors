from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, filters

from core.api.filters.country_programme import (
    CPReportArchiveFilter,
)
from core.api.serializers.adm import AdmRecordArchiveSerializer
from core.api.serializers.cp_emission import CPEmissionArchiveSerializer
from core.api.serializers.cp_generation import CPGenerationArchiveSerializer
from core.api.serializers.cp_price import CPPricesArchiveSerializer
from core.api.serializers.cp_record import CPRecordArchiveSerializer
from core.api.serializers.cp_report import CPReportArchiveSerializer, CPReportSerializer
from core.api.views.cp_records import CPRecordBaseListView
from core.models import AdmRecordArchive
from core.models.country_programme_archive import (
    CPEmissionArchive,
    CPGenerationArchive,
    CPPricesArchive,
    CPRecordArchive,
    CPReportArchive,
)


class CPReportVersionsListView(generics.ListAPIView):
    queryset = CPReportArchive.objects.all()
    serializer_class = CPReportSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = CPReportArchiveFilter
    ordering_fields = ["year", "name", "country__name"]


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
