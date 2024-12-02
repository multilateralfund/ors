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

    def get_wb(self, method):
        year_start = int(self.request.query_params.get("year_start"))
        year_end = int(self.request.query_params.get("year_end"))
        status = self.request.query_params.get("bp_status")

        # get all activities between year_start and year_end
        wb = openpyxl.Workbook()

        exporter = BPActivitiesWriter(wb, min_year=year_start, max_year=year_end + 1)
        data = self.get_activities()
        exporter.write(data)

        exporter = ModelNameWriter(wb, "Agencies")
        data = self.get_names(Agency)
        exporter.write(data)

        exporter = ModelNameCodeWriter(wb, "Countries")
        data = self.get_name_and_codes(Country, "abbr")
        exporter.write(data)

        exporter = ModelNameWriter(wb, "Clusters", 4)
        data = self.get_names(ProjectCluster)
        exporter.write(data)

        exporter = ModelNameWriter(wb, "ChemicalTypes")
        data = self.get_names(BPChemicalType)
        exporter.write(data)

        exporter = ModelNameCodeWriter(wb, "Project Types")
        data = self.get_name_and_codes(ProjectType, "code")
        exporter.write(data)

        exporter = ModelNameCodeWriter(wb, "Sectors")
        data = self.get_name_and_codes(ProjectSector, "code")
        exporter.write(data)

        exporter = ProjectSubsectorWriter(wb)
        data = self.get_subsector_data()
        exporter.write(data)

        exporter = ModelNameWriter(wb, "LVCStatuses")
        data = [{"name": name} for name in BPActivity.LVCStatus.values]
        exporter.write(data)

        # delete default sheet
        del wb[wb.sheetnames[0]]

        name = f"{status}_BusinessPlan{year_start}-{year_end}"
        return method(name, wb)

    def get(self, *args, **kwargs):
        return self.get_wb(workbook_response)
