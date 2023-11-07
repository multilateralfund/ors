from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema

from core.api.export.cp_report_new import CPReportNewExporter
from core.api.views.cp_records import CPRecordListView
from core.api.views.cp_report_empty_form import EmptyFormView


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
        return CPReportNewExporter().get_xlsx(
            self.get_data(cp_report),
            EmptyFormView.get_data(cp_report)["usage_columns"],
        )
