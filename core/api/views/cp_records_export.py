import io
import shutil
import subprocess
import tempfile
from pathlib import Path

from django.http import FileResponse
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema

from core.api.export.cp_report_new import CPReportNewExporter
from core.api.export.cp_report_old import CPReportOldExporter
from core.api.views.cp_records import CPRecordListView
from core.api.views.cp_report_empty_form import EmptyFormView
from core.utils import IMPORT_DB_MAX_YEAR


class CPRecordExportView(CPRecordListView):
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
        empty_form = EmptyFormView.get_data(cp_report)

        if cp_report.year > IMPORT_DB_MAX_YEAR:
            exporter = CPReportNewExporter()
        else:
            exporter = CPReportOldExporter()

        usages = empty_form.pop("usage_columns")
        wb = exporter.get_xlsx(
            self.get_data(cp_report),
            {
                **usages,
                **empty_form,
            },
        )

        return self.get_response(cp_report, wb)

    def get_response(self, cp_report, wb):
        """Save xlsx and return the response"""
        xls = io.BytesIO()
        wb.save(xls)
        xls.seek(0)
        return FileResponse(xls, as_attachment=True, filename=cp_report.name + ".xlsx")


class CPRecordPrintView(CPRecordExportView):
    def get_response(self, cp_report, wb):
        """Save pdf and return the response"""

        with tempfile.TemporaryDirectory(prefix="cp-report-print-") as tmpdirname:
            pdf_file = Path(tmpdirname) / (cp_report.name + ".pdf")
            xlsx_file = Path(tmpdirname) / (cp_report.name + ".xlsx")
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
                filename=cp_report.name + ".pdf",
            )
