import collections
from datetime import datetime
import itertools
import openpyxl

from django.db.models import Prefetch
from django.db import models
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import views
from rest_framework.exceptions import ValidationError


from core.api.export.cp_data_extraction_all import (
    CPConsumptionODPWriter,
    CPDetailsExtractionWriter,
    CPHFCConsumptionMTCO2Writer,
    CPPricesExtractionWriter,
    HFC23EmissionWriter,
    HFC23GenerationWriter,
)
from core.api.export.cp_report_hfc_hcfc import CPReportHFCWriter, CPReportHCFCWriter
from core.api.export.cp_report_new import CPReportNewExporter
from core.api.export.cp_report_old import CPReportOldExporter
from core.api.serializers import BlendSerializer
from core.api.serializers import SubstanceSerializer
from core.api.utils import SUBSTANCE_GROUP_ID_TO_CATEGORY, workbook_pdf_response
from core.api.utils import workbook_response
from core.api.views.cp_records import CPRecordListView
from core.api.views.cp_report_empty_form import EmptyFormView
from core.models import Blend
from core.models import ExcludedUsage
from core.models import Substance
from core.models.country_programme import (
    CPEmission,
    CPGeneration,
    CPPrices,
    CPRecord,
    CPReportFormatColumn,
    CPReportFormatRow,
    CPReport,
)
from core.utils import IMPORT_DB_MAX_YEAR


class CPRecordExportView(CPRecordListView):
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
                description="Country programme report id",
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


class CPRecordPrintView(CPRecordExportView):
    def get_response(self, name, wb):
        return workbook_pdf_response(name, wb)


class CPEmptyExportView(CPRecordExportView):
    @swagger_auto_schema(
        required=["year"],
        manual_parameters=[
            openapi.Parameter(
                "year",
                openapi.IN_QUERY,
                description="What year to generate the empty report for",
                type=openapi.TYPE_INTEGER,
            ),
        ],
    )
    def get(self, *args, **kwargs):
        return super().get(*args, **kwargs)

    def _get_cp_report(self):
        try:
            year = int(self.request.query_params["year"])
        except (KeyError, TypeError, ValueError) as e:
            raise ValidationError({"year": "Invalid or missing parameter"}) from e
        return CPReport(year=year, name=f"Empty Country Programme {year}")

    def get_data(self, cp_report):
        displayed_chemicals = CPReportFormatRow.objects.get_for_year(cp_report.year)
        substances_ids = [x.substance_id for x in displayed_chemicals if x.substance_id]
        blends_ids = [x.blend_id for x in displayed_chemicals if x.blend_id]
        substances = SubstanceSerializer(
            Substance.objects.select_related("group")
            .prefetch_related(
                Prefetch(
                    "excluded_usages",
                    queryset=ExcludedUsage.objects.get_for_year(cp_report.year),
                ),
            )
            .filter(id__in=substances_ids)
            .order_by("group__name", "sort_order"),
            many=True,
            context={"with_usages": True},
        ).data
        blends = BlendSerializer(
            Blend.objects.prefetch_related(
                Prefetch(
                    "excluded_usages",
                    queryset=ExcludedUsage.objects.get_for_year(cp_report.year),
                ),
            )
            .filter(id__in=blends_ids)
            .order_by("sort_order"),
            many=True,
            context={"with_usages": True},
        ).data
        by_section = collections.defaultdict(list)

        for item in itertools.chain(substances, blends):
            for section in item["sections"]:
                item["display_name"] = item["name"]
                by_section["section_" + section.lower()].append(item)

        return {
            "cp_report": {
                "name": cp_report.name,
                "year": cp_report.year,
                "country": "XXXX",
            },
            **by_section,
        }


class CPHFCHCFCExportBaseView(views.APIView):
    """
    Base class for HCFC and HFC export views
    you need to implement get_usages and get methods
    - get usages method should return a list of usages for the given year
    - get method should return a response with the data for the given year
    """

    def get_usages(self, year):
        raise NotImplementedError

    def _get_year_params(self):
        min_year = self.request.query_params.get("min_year")
        max_year = self.request.query_params.get("max_year")

        if not min_year and not max_year:
            # set current year for min year and max year
            current_year = datetime.now().year
            min_year = current_year
            max_year = current_year

        return min_year, max_year

    def get_data(self, year, section):
        return CPRecord.objects.get_for_year(year).filter(section=section).all()

    def get_response(self, name, wb):
        return workbook_response(name, wb)

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "min_year",
                openapi.IN_QUERY,
                description="Minimum year",
                type=openapi.TYPE_INTEGER,
            ),
            openapi.Parameter(
                "max_year",
                openapi.IN_QUERY,
                description="Maximum year",
                type=openapi.TYPE_INTEGER,
            ),
        ],
    )
    def get(self, *args, **kwargs):
        raise NotImplementedError


class CPHCFCExportView(CPHFCHCFCExportBaseView):
    def get_usages(self, year):
        cp_report_formats = (
            CPReportFormatColumn.objects.get_for_year(year)
            .filter(section="A")
            .select_related("usage")
            .order_by("sort_order")
        )
        usages = []
        for us_format in cp_report_formats:
            usages.append(
                {
                    "id": str(us_format.usage_id),
                    "headerName": us_format.usage.full_name,
                    "columnCategory": "usage",
                    "convert_to_odp": True,
                }
            )

        return usages

    def get(self, *args, **kwargs):
        min_year, max_year = self._get_year_params()
        wb = openpyxl.Workbook()

        for year in range(int(min_year), int(max_year) + 1):
            usages = self.get_usages(year)
            exporter = CPReportHCFCWriter(wb, usages, year)
            statistics = self.get_data(year, "A")
            exporter.write(statistics)

        # delete default sheet
        del wb[wb.sheetnames[0]]

        return self.get_response("CP Data Extraction-HCFC", wb)


class CPHFCExportView(CPHFCHCFCExportBaseView):
    def get_usages(self, year):
        cp_report_formats = (
            CPReportFormatColumn.objects.get_for_year(year)
            .filter(section="B")
            .select_related("usage")
            .order_by("sort_order")
        )
        usages = {
            "(MT)": [],
            "(CO2)": [],
        }
        for q_type in ["(MT)", "(CO2)"]:
            for us_format in cp_report_formats:
                usages[q_type].append(
                    {
                        "id": f"{us_format.usage_id} {q_type}",
                        "headerName": f"{us_format.usage.full_name} {q_type}",
                        "columnCategory": "usage",
                        "quantity_type": q_type,
                    }
                )

        return usages["(MT)"], usages["(CO2)"]

    def get(self, *args, **kwargs):
        min_year, max_year = self._get_year_params()
        wb = openpyxl.Workbook()

        for year in range(int(min_year), int(max_year) + 1):
            usages_mt, usages_co2 = self.get_usages(year)
            exporter = CPReportHFCWriter(wb, usages_mt, usages_co2, year)
            statistics = self.get_data(year, "B")
            exporter.write(statistics)

        # delete default sheet
        del wb[wb.sheetnames[0]]

        return self.get_response("CP Data Extraction-HFC", wb)


class CPDataExtractionAllExport(views.APIView):
    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "year",
                openapi.IN_QUERY,
                description="The year to generate the report for",
                type=openapi.TYPE_INTEGER,
            ),
        ],
    )
    def get(self, *args, **kwargs):
        year = self.request.query_params.get("year")

        if not year:
            # set current year for min year and max year
            year = datetime.now().year

        wb = openpyxl.Workbook()
        # ODS Price
        exporter = CPPricesExtractionWriter(wb, year)
        data = self.get_prices(year)
        exporter.write(data)

        # CP Details
        exporter = CPDetailsExtractionWriter(wb, year)
        data = self.get_subtances_records(year)
        exporter.write(data)

        # CPConsumption(ODP)
        exporter = CPConsumptionODPWriter(wb, year)
        data = self._get_cp_consumption_data(year)
        exporter.write(data)

        # HFC-Consumption(MTvsCO2)
        exporter = CPHFCConsumptionMTCO2Writer(wb, year)
        data = self._get_hfc_consumption_data(year)
        exporter.write(data)

        # HFC-23Generation
        exporter = HFC23GenerationWriter(wb, year)
        data = self._get_generations(year)
        exporter.write(data)

        # HFC23Emission
        exporter = HFC23EmissionWriter(wb, year)
        data = self._get_emissions(year)
        exporter.write(data)

        # delete default sheet
        del wb[wb.sheetnames[0]]

        return workbook_response("CP Data Extraction-All", wb)

    def get_prices(self, year):
        return (
            CPPrices.objects.select_related(
                "blend",
                "substance",
                "country_programme_report__country",
            )
            .prefetch_related("blend__components")
            .filter(country_programme_report__year=year)
            .filter(
                models.Q(current_year_price__isnull=False)
                | models.Q(previous_year_price__isnull=False)
            )
            .order_by(
                "country_programme_report__country__name",
                "substance__sort_order",
                "blend__sort_order",
            )
            .all()
        )

    def get_subtances_records(self, year):
        return (
            CPRecord.objects.get_for_year(year)
            .select_related("substance__group")
            .filter(substance__isnull=False)
            .all()
        )

    def _get_cp_consumption_data(self, year):
        """
        Get CP consumption data for the given year

        @param year: int
        @return: dict
        structure:
        {
            "country_name": {
                "substance_category": consumption_value,
                ...
            },
            ...
        }
        """
        records = (
            CPRecord.objects.get_for_year(year)
            .filter(section="A", substance__isnull=False)
            .all()
        )
        country_records = {}
        for record in records:
            country_name = record.country_programme_report.country.name
            if country_name not in country_records:
                country_records[country_name] = {}

            group = SUBSTANCE_GROUP_ID_TO_CATEGORY.get(record.substance.group.group_id)
            if not group:
                continue
            if group not in country_records[country_name]:
                country_records[country_name][group] = 0

            # convert consumption value to ODP
            consumption_value = record.get_consumption_value() * record.substance.odp
            country_records[country_name][group] += consumption_value

            # set a custom group for HCFC-141b in Imported Pre-blended Polyol
            if record.substance.name == "HCFC-141b in Imported Pre-blended Polyol":
                group = "HCFC-141b Preblended Polyol"
                if group not in country_records[country_name]:
                    country_records[country_name][group] = 0
                country_records[country_name][group] += consumption_value

        return country_records

    def _get_hfc_consumption_data(self, year):
        """
        Get HFC consumption data for the given year

        @param year: int
        @return: dict
        structure:
        {
            {
            "country_name": {
                "group": {
                    "consumption_mt": value,
                    "consumption_co2": value,
                    "servicing": value,
                    "usages_total": value,
                },
                ...
            },
            ...
        }
        """
        records = (
            CPRecord.objects.get_for_year(year)
            .filter(section="B", substance__isnull=False, substance__group__annex="F")
            .all()
        )
        country_records = {}
        for record in records:
            country_name = record.country_programme_report.country.name
            if country_name not in country_records:
                country_records[country_name] = {}

            group = "I"  # ask Laura about this
            if group not in country_records[country_name]:
                country_records[country_name][group] = {
                    "country_lvc": record.country_programme_report.country.is_lvc,
                    "substance_name": SUBSTANCE_GROUP_ID_TO_CATEGORY.get(
                        record.substance.group.group_id
                    ),
                    "consumption_mt": 0,
                    "consumption_co2": 0,
                    "servicing": 0,
                    "usages_total": 0,
                }

            # convert consumption value to ODP
            consumption_value = record.get_consumption_value()
            country_records[country_name][group]["consumption_mt"] += consumption_value

            # convert consumption value to CO2 equivalent
            country_records[country_name][group]["consumption_co2"] += (
                consumption_value * record.substance.gwp
            )

            for rec_us in record.record_usages.all():
                if "servicing" in rec_us.usage.full_name.lower():
                    country_records[country_name][group]["servicing"] += rec_us.quantity
                country_records[country_name][group]["usages_total"] += rec_us.quantity

        return country_records

    def _get_generations(self, year):
        return (
            CPGeneration.objects.filter(country_programme_report__year=year)
            .select_related("country_programme_report__country")
            .all()
        )

    def _get_emissions(self, year):
        return (
            CPEmission.objects.filter(country_programme_report__year=year)
            .select_related("country_programme_report__country")
            .all()
        )
