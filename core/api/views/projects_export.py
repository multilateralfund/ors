import openpyxl

from rest_framework.viewsets import GenericViewSet

from core.models.country import Country

from core.api.export.base import configure_sheet_print
from core.api.export.projects import ProjectWriter
from core.api.serializers.project import ProjectExportSerializer
from core.api.utils import workbook_response, workbook_pdf_response

from core.api.export.business_plan import ModelNameCodeWriter


class ProjectsExport:

    view: GenericViewSet

    def __init__(self, view: GenericViewSet):
        self.view = view

    def export_xls(self):
        return self.get_wb(workbook_response)

    def export_pdf(self):
        return self.get_wb(workbook_pdf_response)

    def get_wb(self, method):
        queryset = self.view.filter_queryset(self.view.get_queryset())

        data = ProjectExportSerializer(queryset, many=True).data

        wb = openpyxl.Workbook(write_only=True)
        sheet = wb.create_sheet("Projects")
        configure_sheet_print(sheet, "landscape")

        ProjectWriter(sheet).write(data)

        name = "Projects"
        return method(name, wb)


class ProjectsV2Export(ProjectsExport):
    def get_name_and_codes(self, cls_name, code_name):
        queryset = cls_name.objects.values_list("name", code_name).order_by("name")
        return [{"name": name, "acronym": acronym} for name, acronym in queryset]

    def get_wb(self, method):
        queryset = self.view.filter_queryset(self.view.get_queryset())

        wb = openpyxl.Workbook()
        # delete default sheet
        del wb[wb.sheetnames[0]]

        sheet = wb.create_sheet("Projects")
        configure_sheet_print(sheet, "landscape")

        data = ProjectExportSerializer(queryset, many=True).data
        ProjectWriter(sheet).write(data)

        data = self.get_name_and_codes(Country, "abbr")
        ModelNameCodeWriter(wb, "Countries").write(data)

        self.add_data_validation(wb, sheet, "R", "Countries", len(data), show_error=True)

        filename = "Projects"
        return method(filename, wb)

    def add_data_validation(
        self,
        wb,
        sheet,
        column,
        validation_sheet,
        validation_range,
        allow_blank=False,
        show_error=False,
    ):
        """
        Add data validation to a column in the Activities sheet
        @param wb: openpyxl.Workbook
        @param column: str
        @param validation_sheet: str
        @param validation_range: number
        @param allow_blank: bool

        """
        validation_formula = f"{validation_sheet}!$A$2:$A${validation_range + 1}"
        data_validation = openpyxl.worksheet.datavalidation.DataValidation(
            type="list",
            formula1=validation_formula,
            showDropDown=False,
            showErrorMessage=show_error,
            allow_blank=allow_blank,
        )
        data_validation.prompt = "Please select from the dropdown"
        data_validation.error = (
            "Invalid entry, please select a value from the dropdown list."
        )
        sheet.add_data_validation(data_validation)
        data_validation.add(f"{column}2:{column}1048576")
