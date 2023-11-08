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

        return exporter.get_xlsx(
            self.get_data(cp_report),
            {
                **usages,
                **empty_form,
            },
        )
