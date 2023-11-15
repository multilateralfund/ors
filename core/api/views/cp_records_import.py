import openpyxl
from rest_framework.exceptions import ValidationError

from core.api.export.cp_report_new import CPReportNewExporter
from core.api.export.section_export import parse_section_sheet
from core.api.views import CPReportView


class CPReportViewImport(CPReportView):
    def get_data(self):
        try:
            file = list(self.request.FILES.values())[0]
        except IndexError as e:
            raise ValidationError({"file": "Missing file upload"}) from e

        wb = openpyxl.load_workbook(file)
        for section, sheet_name in CPReportNewExporter.iter_sections():
            data = parse_section_sheet(wb[sheet_name])

