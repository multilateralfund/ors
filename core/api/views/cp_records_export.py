import collections
import itertools
import shutil
import subprocess
import tempfile
from pathlib import Path

from django.db.models import Prefetch
from django.http import FileResponse
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework.exceptions import ValidationError

from core.api.export.cp_report_new import CPReportNewExporter
from core.api.export.cp_report_old import CPReportOldExporter
from core.api.serializers import BlendSerializer
from core.api.serializers import SubstanceSerializer
from core.api.utils import workbook_response
from core.api.views.cp_records import CPRecordListView
from core.api.views.cp_report_empty_form import EmptyFormView
from core.models import Blend
from core.models import CPReport
from core.models import ExcludedUsage
from core.models import Substance
from core.utils import IMPORT_DB_MAX_YEAR


class CPRecordExportView(CPRecordListView):
    def get_usages(self, cp_report):
        empty_form = EmptyFormView.get_data(cp_report.year)
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
            exporter = CPReportNewExporter()
        else:
            exporter = CPReportOldExporter()

        wb = exporter.get_xlsx(self.get_data(cp_report), self.get_usages(cp_report))
        return self.get_response(cp_report.name, wb)

    def get_response(self, name, wb):
        return workbook_response(name, wb)


class CPRecordPrintView(CPRecordExportView):
    def get_response(self, name, wb):
        """Save pdf and return the response"""

        with tempfile.TemporaryDirectory(prefix="cp-report-print-") as tmpdirname:
            pdf_file = Path(tmpdirname) / (name + ".pdf")
            xlsx_file = Path(tmpdirname) / (name + ".xlsx")
            wb.save(xlsx_file)

            libreoffice_bin = shutil.which("libreoffice")
            subprocess.check_call(
                [libreoffice_bin, "--headless", "--convert-to", "pdf", str(xlsx_file)],
                cwd=tmpdirname,
                shell=False,
            )
            return FileResponse(
                pdf_file.open("rb"),
                as_attachment=True,
                filename=name + ".pdf",
            )


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
        substances = SubstanceSerializer(
            Substance.objects.select_related("group")
            .prefetch_related(
                Prefetch(
                    "excluded_usages",
                    queryset=ExcludedUsage.objects.get_for_year(cp_report.year),
                ),
            )
            .filter(displayed_in_all=True)
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
            .filter(displayed_in_all=True)
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
