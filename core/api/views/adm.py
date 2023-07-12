from django.db import models
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import views
from rest_framework.response import Response

from core.api.serializers.adm import AdmColumnSerializer, AdmRowSerializer
from core.models.adm import AdmColumn, AdmRow
from core.models.country_programme import CPReport
from core.utils import IMPORT_DB_MAX_YEAR


class AdmEmptyFormView(views.APIView):
    """
    API endpoint that allows to get empty form for ADM
    """

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
    def get(self, request, *args, **kwargs):
        cp_report_id = request.query_params.get(
            "cp_report_id",
        )
        cp_report = CPReport.objects.filter(id=cp_report_id).first()
        if not cp_report:
            return Response({"error": "cp_report_id is invalid"}, status=400)

        if cp_report.year > IMPORT_DB_MAX_YEAR:
            return Response(
                {
                    "error": "You can use this endpint only for years before "
                    f"{IMPORT_DB_MAX_YEAR+1}"
                },
                status=400,
            )

        # set columns
        columns = AdmColumn.objects.filter(
            min_year__lte=cp_report.year, max_year__gte=cp_report.year
        ).order_by("section", "sort_order")

        sections = {
            "admB": {
                "columns": [],
                "rows": [],
            },
            "admC": {
                "columns": [],
                "rows": [],
            },
            "admD": {
                "columns": [],
                "rows": [],
            },
        }

        for col in columns:
            serial_col = AdmColumnSerializer(col).data
            if col.section == AdmColumn.AdmColumnSection.B:
                sections["admB"]["columns"].append(serial_col)
            elif col.section == AdmColumn.AdmColumnSection.C:
                sections["admC"]["columns"].append(serial_col)

        # set rows
        rows = (
            AdmRow.objects.filter(
                min_year__lte=cp_report.year,
                max_year__gte=cp_report.year,
                level=0,
            )
            .get_descendants(include_self=True)
            .filter(
                models.Q(min_year__lte=cp_report.year, max_year__gte=cp_report.year),
                models.Q(
                    models.Q(country_programme_report_id__isnull=True)
                    | models.Q(country_programme_report_id=cp_report.id)
                ),
            )
            .prefetch_related("choices")
            .order_by("sort_order", "level")
        )

        # admb 1.6.1 and 1.6,2 is special case
        # if there is an 1.6.1 with user text then we will not displai 1.6.1 for N/A
        # same for 1.6.2
        admb_161 = False
        admb_162 = False
        for row in rows:
            serial_row = AdmRowSerializer(row).data
            if row.section == AdmRow.AdmRowSection.B:
                if row.index not in ["1.6.1", "1.6.2"]:
                    sections["admB"]["rows"].append(serial_row)
                    continue
                # row.index in ["1.6.1", "1.6.2"]
                if row.index == "1.6.1":
                    if row.text.lower() != "n/a":
                        # set admb_161 to True so we will not display 1.6.1 for N/A
                        admb_161 = True
                        sections["admB"]["rows"].append(serial_row)
                    elif not admb_161:
                        # row.text.lower() == "n/a" and admb_161 is False
                        sections["admB"]["rows"].append(serial_row)
                elif row.index == "1.6.2":
                    if row.text.lower() != "n/a":
                        # set admb_162 to True so we will not display 1.6.2 for N/A
                        admb_162 = True
                        sections["admB"]["rows"].append(serial_row)
                    elif not admb_162:
                        # row.text.lower() == "n/a" and admb_162 is False
                        sections["admB"]["rows"].append(serial_row)

            elif row.section == AdmRow.AdmRowSection.C:
                sections["admC"]["rows"].append(serial_row)
            elif row.section == AdmRow.AdmRowSection.D:
                sections["admD"]["rows"].append(serial_row)

        return Response(sections)
