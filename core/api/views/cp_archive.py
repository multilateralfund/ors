from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import generics, filters
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from core.api.export.cp_report_new import CPReportNewExporter
from core.api.export.cp_report_old import CPReportOldExporter
from core.api.filters.country_programme import (
    CPReportArchiveFilter,
)
from core.api.permissions import IsCountryUser, IsSecretariat
from core.api.serializers.adm import AdmRecordArchiveSerializer
from core.api.serializers.cp_comment import CPCommentArchiveSerializer
from core.api.serializers.cp_emission import CPEmissionArchiveSerializer
from core.api.serializers.cp_generation import CPGenerationArchiveSerializer
from core.api.serializers.cp_price import CPPricesArchiveSerializer
from core.api.serializers.cp_record import CPRecordArchiveSerializer
from core.api.serializers.cp_report import (
    CPReportArchiveSerializer,
    CPReportInfoSerializer,
)
from core.api.utils import workbook_pdf_response
from core.api.utils import workbook_response
from core.api.views.cp_records import CPRecordBaseListView
from core.api.views.cp_report_empty_form import EmptyFormView
from core.models import AdmRecordArchive
from core.models.country_programme import CPReport
from core.models.country_programme_archive import (
    CPEmissionArchive,
    CPGenerationArchive,
    CPPricesArchive,
    CPRecordArchive,
    CPReportArchive,
)
from core.utils import IMPORT_DB_MAX_YEAR


class CPReportVersionsListView(generics.GenericAPIView):
    permission_classes = [IsSecretariat | IsCountryUser]
    queryset = CPReportArchive.objects.all()
    serializer_class = CPReportArchiveSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = CPReportArchiveFilter

    def get(self, request, *args, **kwargs):
        # add the current version of the report
        user = request.user
        country_id = request.query_params.get("country_id")
        year = request.query_params.get("year")
        current_version = None
        if country_id and year:
            cp_reports = CPReport.objects.all()
            if user.user_type in (
                user.UserType.COUNTRY_USER,
                user.UserType.COUNTRY_SUBMITTER,
            ):
                cp_reports = cp_reports.filter(country=user.country)
            current_version = cp_reports.filter(
                country_id=country_id, year=year
            ).first()
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
    cp_report_info_seri_class = CPReportInfoSerializer
    cp_record_seri_class = CPRecordArchiveSerializer
    cp_prices_seri_class = CPPricesArchiveSerializer
    cp_generation_seri_class = CPGenerationArchiveSerializer
    cp_emission_seri_class = CPEmissionArchiveSerializer
    cp_comment_seri_class = CPCommentArchiveSerializer
    adm_record_seri_class = AdmRecordArchiveSerializer


class CPRecordArchiveExportView(CPRecordsArchiveListView):
    def get_usages(self, cp_report):
        empty_form = EmptyFormView.get_data(cp_report.year, cp_report)
        usages = empty_form.pop("usage_columns")
        return {
            **usages,
            **empty_form,
        }

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "cp_report_id",
                openapi.IN_QUERY,
                description="Country programme report archive id",
                type=openapi.TYPE_INTEGER,
            ),
        ],
    )
    def get(self, *args, **kwargs):
        cp_report = self._get_cp_report()
        if cp_report.year > IMPORT_DB_MAX_YEAR:
            exporter = CPReportNewExporter(cp_report)
        else:
            exporter = CPReportOldExporter(cp_report)

        wb = exporter.get_xlsx(self.get_data(cp_report), self.get_usages(cp_report))
        return self.get_response(cp_report.name, wb)

    def get_response(self, name, wb):
        return workbook_response(name, wb)


class CPRecordArchivePrintView(CPRecordArchiveExportView):
    def get_response(self, name, wb):
        return workbook_pdf_response(name, wb)
