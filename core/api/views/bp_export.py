import openpyxl

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, filters


from core.api.export.business_plan import (
    BPActivitiesWriter,
    ModelNameWriter,
    ModelNameCodeWriter,
    ProjectSubsectorWriter,
)
from core.api.filters.business_plan import BPActivityListFilter
from core.api.permissions import IsAgency, IsSecretariat, IsViewer

from core.api.serializers.business_plan import BPActivityExportSerializer
from core.api.utils import (
    workbook_response,
)
from core.api.views.utils import (
    BPACTIVITY_ORDERING_FIELDS,
)
from core.models.agency import Agency
from core.models.business_plan import BPActivity, BPChemicalType
from core.models.country import Country
from core.models.project import (
    ProjectCluster,
    ProjectType,
    ProjectSector,
    ProjectSubSector,
)


class BPActivityExportView(generics.GenericAPIView):
    permission_classes = [IsSecretariat | IsAgency | IsViewer]
    filterset_class = BPActivityListFilter

    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter,
    ]
    search_fields = ["title", "comment_secretariat"]
    ordering = ["agency__name", "country__abbr", "initial_id"]
    ordering_fields = BPACTIVITY_ORDERING_FIELDS
    queryset = BPActivity.objects.all()

    def get_activities(self):
        queryset = self.filter_queryset(self.get_queryset())
        return BPActivityExportSerializer(queryset, many=True).data

    def get_subsector_data(self):
        queryset = ProjectSubSector.objects.values_list("name", "sector__code")
        return [{"name": name, "sector_code": sector} for name, sector in queryset]

    def get_names(self, cls_name):
        queryset = (
            cls_name.objects.values_list("name", flat=True).distinct().order_by("name")
        )
        return [{"name": name} for name in queryset]

    def get_name_and_codes(self, cls_name, code_name):
        queryset = cls_name.objects.values_list("name", code_name).order_by("name")
        return [{"name": name, "acronym": acronym} for name, acronym in queryset]

    def add_data_validation(
        self, wb, column, validation_sheet, validation_range, allow_blank=False
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
            showErrorMessage=True,
            allow_blank=allow_blank,
        )
        data_validation.prompt = "Please select from the dropdown"
        data_validation.error = (
            "Invalid entry, please select a value from the dropdown list."
        )
        wb["Activities"].add_data_validation(data_validation)
        data_validation.add(f"{column}2:{column}1048576")

    def add_all_value_validation(self, wb, column, allowed_values, prompt, error):
        """
        Add data validation to a column in the Activities sheet with allowed values
        @param wb: openpyxl.Workbook
        @param column: str
        @param allowed_values: str
        @param prompt: str
        @param error: str

        """
        data_validation = openpyxl.worksheet.datavalidation.DataValidation(
            type="list",
            formula1=allowed_values,
            showDropDown=False,
            showErrorMessage=True,
        )
        data_validation.prompt = prompt
        data_validation.error = error
        wb["Activities"].add_data_validation(data_validation)
        data_validation.add(f"{column}2:{column}1048576")

    def get_wb(self, method):
        year_start = int(self.request.query_params.get("year_start"))
        year_end = int(self.request.query_params.get("year_end"))
        status = self.request.query_params.get("bp_status")

        # get all activities between year_start and year_end
        wb = openpyxl.Workbook()

        exporter = BPActivitiesWriter(wb, min_year=year_start, max_year=year_end + 1)
        data = self.get_activities()
        exporter.write(data)

        exporter = ModelNameCodeWriter(wb, "Countries")
        data = self.get_name_and_codes(Country, "abbr")
        exporter.write(data)
        self.add_data_validation(wb, "B", "Countries", len(data))

        exporter = ModelNameWriter(wb, "Agencies")
        data = self.get_names(Agency)
        exporter.write(data)
        self.add_data_validation(wb, "C", "Agencies", len(data))

        exporter = ModelNameWriter(wb, "Clusters", 4)
        data = self.get_names(ProjectCluster)
        exporter.write(data)
        self.add_data_validation(wb, "I", "Clusters", len(data), allow_blank=True)

        exporter = ModelNameWriter(wb, "ChemicalTypes")
        data = self.get_names(BPChemicalType)
        exporter.write(data)
        self.add_data_validation(wb, "F", "ChemicalTypes", len(data))

        exporter = ModelNameCodeWriter(wb, "ProjectTypes")
        data = self.get_name_and_codes(ProjectType, "code")
        exporter.write(data)
        self.add_data_validation(wb, "E", "ProjectTypes", len(data))

        exporter = ModelNameCodeWriter(wb, "Sectors")
        data = self.get_name_and_codes(ProjectSector, "code")
        exporter.write(data)
        self.add_data_validation(wb, "J", "Sectors", len(data))

        exporter = ProjectSubsectorWriter(wb)
        data = self.get_subsector_data()
        exporter.write(data)
        self.add_data_validation(wb, "K", "SubSectors", len(data))

        exporter = ModelNameWriter(wb, "LVCStatuses")
        data = [{"name": name} for name in BPActivity.LVCStatus.values]
        exporter.write(data)
        self.add_data_validation(wb, "D", "LVCStatuses", len(data))

        # delete default sheet
        del wb[wb.sheetnames[0]]

        # add other column validation
        # project status (A/P)
        self.add_all_value_validation(
            wb,
            "AA",
            '"A,P"',
            "Enter 'A' for Approved or 'P' for Pending",
            "Invalid entry, please enter 'A' or 'P'.",
        )

        # project category (I/M)
        self.add_all_value_validation(
            wb,
            "AB",
            '"I,M"',
            "Enter 'I' for Individual or 'M' for Multi-year",
            "Invalid entry, please enter 'I' or 'M'.",
        )

        # decimals validation
        for col in ["H", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y"]:
            data_validation = openpyxl.worksheet.datavalidation.DataValidation(
                type="decimal",
                operator="greaterThanOrEqual",
                showErrorMessage=True,
                formula1="0",
            )
            data_validation.prompt = "Please enter a number"
            data_validation.error = "Invalid entry, please enter a number."
            wb["Activities"].add_data_validation(data_validation)
            data_validation.add(f"{col}2:{col}104857")

        name = f"{status}_BusinessPlan{year_start}-{year_end}"
        return method(name, wb)

    def get(self, *args, **kwargs):
        return self.get_wb(workbook_response)
