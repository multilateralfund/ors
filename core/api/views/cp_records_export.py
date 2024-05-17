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


from core.api.export.cp_calculated_amount import CPCalculatedAmountWriter
from core.api.export.cp_data_extraction_all import (
    CPConsumptionODPWriter,
    CPDetailsExtractionWriter,
    CPHFCConsumptionMTCO2Writer,
    CPPricesExtractionWriter,
    HFC23EmissionWriter,
    HFC23GenerationWriter,
    MbrConsumptionWriter,
)
from core.api.export.cp_report_hfc_hcfc import CPReportHFCWriter, CPReportHCFCWriter
from core.api.export.cp_report_new import CPReportNewExporter
from core.api.export.cp_report_old import CPReportOldExporter
from core.api.permissions import IsUserSecretariatOrAdmin
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
        convert_data = str(self.request.query_params.get("convert_data", None))
        cp_report = self._get_cp_report()
        if cp_report.year > IMPORT_DB_MAX_YEAR:
            exporter = CPReportNewExporter(cp_report)
        else:
            exporter = CPReportOldExporter(cp_report)

        wb = exporter.get_xlsx(
            self.get_data(cp_report), self.get_usages(cp_report), convert_data == "1"
        )
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


class CPCalculatedAmountExportView(CPRecordListView):
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

        wb = openpyxl.Workbook()
        exporter = CPCalculatedAmountWriter(wb, cp_report.year)
        data = self.get_data(cp_report)
        exporter.write(data)

        # delete default sheet
        del wb[wb.sheetnames[0]]

        return workbook_response(f"CalculatedAmount {cp_report.name}", wb)

    def get_data(self, cp_report):
        records = (
            CPRecord.objects.filter(
                country_programme_report_id=cp_report.id, substance_id__isnull=False
            )
            .select_related("substance__group")
            .prefetch_related("record_usages")
            .all()
        )
        # set all consumprtion to 0
        data = {
            group: {"sectorial_total": 0, "consumption": 0, "substances": ""}
            for group in SUBSTANCE_GROUP_ID_TO_CATEGORY.values()
            if group not in ["Other", "Legacy"]
        }

        # calculate the consumption and sectorial total
        for record in records:
            # set the substance category
            substance_category = SUBSTANCE_GROUP_ID_TO_CATEGORY.get(
                record.substance.group.group_id
            )
            if substance_category in ["Other", "Legacy"]:
                continue

            # get the sectorial total
            sectorial_total = record.get_sectorial_total()
            consumption = record.get_consumption_value(use_sectorial_total=False)

            # convert data
            if substance_category == "HFC":
                # convert consumption value to CO2 equivalent
                # substance = f"{record.substance.name} (gwp:{record.substance.gwp or 0}), consump:{consumption or 0})"
                consumption *= record.substance.gwp or 0
                sectorial_total *= record.substance.gwp or 0
            else:
                # convert consumption value to ODP
                # substance = f"{record.substance.name} (odp:{record.substance.odp or 0}, consump:{consumption or 0})"
                consumption *= record.substance.odp or 0
                sectorial_total *= record.substance.odp or 0

            data[substance_category]["sectorial_total"] += sectorial_total
            data[substance_category]["consumption"] += consumption
            # data[substance_category]["substances"] += f"{substance};\n"

        # set the correct decimals number (for odp 2 decimals, for CO2 0 decimals)
        response_data = []
        for group, values in data.items():
            if group == "HFC":
                values["consumption"] = round(values["consumption"], 0)
                values["sectorial_total"] = round(values["sectorial_total"], 0)
                values["unit"] = "CO2-eq"
            else:
                values["consumption"] = round(values["consumption"], 2)
                values["sectorial_total"] = round(values["sectorial_total"], 2)
                values["unit"] = "ODP tonnes"

            substance_name = group if group != "MBR" else "MB Non-QPS only"
            response_data.append(
                {
                    "substance_name": substance_name,
                    **values,
                }
            )
        return response_data


class CPHFCHCFCExportBaseView(views.APIView):
    """
    Base class for HCFC and HFC export views
    you need to implement get_usages and get methods
    - get usages method should return a list of usages for the given year
    - get method should return a response with the data for the given year
    """

    permission_classes = [IsUserSecretariatOrAdmin]

    def get_usages(self, year):
        raise NotImplementedError

    def _get_year_params(self):
        min_year = self.request.query_params.get("min_year")
        max_year = self.request.query_params.get("max_year")

        current_year = datetime.now().year
        if not min_year and not max_year:
            # set current year for min year and max year
            min_year = current_year
            max_year = current_year
        if not max_year:
            max_year = current_year
        if not min_year:
            min_year = 1995

        return min_year, max_year

    def get_data(self, year, section):
        return CPRecord.objects.get_for_year(year).filter(section=section)

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
            .exclude(
                header_name__in=["Refrigeration", "Methyl bromide", "QPS", "Non-QPS"]
            )
            .select_related("usage")
            .order_by("sort_order")
        )
        usages = []
        for us_format in cp_report_formats:
            usages.append(
                {
                    "id": str(us_format.usage_id),
                    "headerName": (
                        us_format.usage.full_name
                        if "solvent" not in us_format.usage.full_name.lower()
                        else "Solvent"
                    ),
                    "columnCategory": "usage",
                    "convert_to_odp": True,
                }
            )

        return usages

    def get_data(self, year, section):
        return super().get_data(year, section).filter(substance__name__icontains="HCFC")

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
    permission_classes = [IsUserSecretariatOrAdmin]

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
        data = CPRecord.objects.get_for_year(year)
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
        exporter = HFC23GenerationWriter(wb)
        data = self._get_generations(year)
        exporter.write(data)

        # HFC23Emission
        exporter = HFC23EmissionWriter(wb)
        data = self._get_emissions(year)
        exporter.write(data)

        # MbrConsumption
        exporter = MbrConsumptionWriter(wb)
        data = self.get_mbr_consumption_data(year)
        exporter.write(data)

        # delete default sheet
        del wb[wb.sheetnames[0]]

        return workbook_response("CP Data Extraction-All", wb)

    def get_mbr_consumption_data(self, year):
        return (
            CPRecord.objects.get_for_year(year)
            .filter(substance__name__iexact="Methyl Bromide")
            .annotate(
                country_name=models.F("country_programme_report__country__name"),
                methyl_bromide_qps=models.Sum(
                    "record_usages__quantity",
                    filter=models.Q(record_usages__usage__name__iexact="QPS"),
                    default=0,
                ),
                methyl_bromide_non_qps=models.Sum(
                    "record_usages__quantity",
                    filter=models.Q(record_usages__usage__name__iexact="Non-QPS"),
                    default=0,
                ),
                total=models.F("methyl_bromide_qps")
                + models.F("methyl_bromide_non_qps"),
            )
        ).values(
            "country_name",
            "methyl_bromide_qps",
            "methyl_bromide_non_qps",
            "total",
        )


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

            # convert consumption value to ODP
            consumption_value = record.get_consumption_value() * record.substance.odp

            # set a custom group for HCFC-141b in Imported Pre-blended Polyol
            if record.substance.name == "HCFC-141b in Imported Pre-blended Polyol":
                group = "HCFC-141b Preblended Polyol"
                if group not in country_records[country_name]:
                    country_records[country_name][group] = 0
                country_records[country_name][group] += consumption_value
                continue

            # set the group
            group = SUBSTANCE_GROUP_ID_TO_CATEGORY.get(record.substance.group.group_id)
            if not group:
                continue
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
            "country_name": {
                "substance_group": value,
                "consumption_mt": value,
                "consumption_co2": value,
                "servicing": value,
                "usages_total": value,
            },
            ...
        }
        """
        records = CPRecord.objects.get_for_year(year).filter(section="B").all()
        country_records = {}
        for record in records:
            country_name = record.country_programme_report.country.name
            if country_name not in country_records:
                country_records[country_name] = {
                    "country_lvc": record.country_programme_report.country.is_lvc,
                    "substance_name": (
                        SUBSTANCE_GROUP_ID_TO_CATEGORY.get(record.substance.group.group_id)
                        if record.substance
                        else "HFC"
                    ),
                    "substance_group": record.country_programme_report.country.consumption_group,
                    "consumption_mt": 0,
                    "consumption_co2": 0,
                    "servicing": 0,
                    "usages_total": 0,
                }

            # get consumption data
            consumption_value = record.get_consumption_value() or 0
            country_records[country_name]["consumption_mt"] += consumption_value

            # convert consumption value to CO2 equivalent
            country_records[country_name]["consumption_co2"] += (
                consumption_value * record.get_chemical_gwp()
            )

            for rec_us in record.record_usages.all():
                if "servicing" in rec_us.usage.full_name.lower():
                    country_records[country_name]["servicing"] += rec_us.quantity
                country_records[country_name]["usages_total"] += rec_us.quantity

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
