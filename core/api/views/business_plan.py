import os
import urllib

import openpyxl
from django.db import transaction
from django.db.models import Max, Min
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import generics, viewsets, filters, mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response

from core.api.export.base import configure_sheet_print
from core.api.export.business_plan import BusinessPlanWriter
from core.api.filters.business_plan import (
    BPActivityListFilter,
    BPChemicalTypeFilter,
    BPFileFilter,
    BPFilterBackend,
)
from core.api.permissions import IsAgency, IsSecretariat, IsViewer
from core.api.serializers.bp_history import BPHistorySerializer
from core.api.serializers.business_plan import (
    BusinessPlanCreateSerializer,
    BusinessPlanSerializer,
    BPChemicalTypeSerializer,
    BPFileSerializer,
    BPActivityExportSerializer,
    BPActivityDetailSerializer,
    BPActivityListSerializer,
)
from core.api.utils import (
    workbook_response,
    workbook_pdf_response,
)
from core.api.views.business_plan_utils import BusinessPlanUtils
from core.api.views.utils import (
    get_business_plan_from_request,
    BPACTIVITY_ORDERING_FIELDS,
)
from core.models import Agency, BusinessPlan, BPChemicalType, BPActivity
from core.models.business_plan import BPFile


class BPChemicalTypeListView(generics.ListAPIView):
    """
    List BP chemical types
    """

    permission_classes = [IsSecretariat | IsAgency | IsViewer]
    queryset = BPChemicalType.objects.all()
    filterset_class = BPChemicalTypeFilter
    serializer_class = BPChemicalTypeSerializer


class BusinessPlanViewSet(
    BusinessPlanUtils,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsSecretariat | IsAgency | IsViewer]
    filter_backends = [
        BPFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter,
    ]
    search_fields = []
    ordering = ["id"]
    ordering_fields = "__all__"

    def get_queryset(self):
        if self.action == "get":
            return BPActivity.objects.all()

        if self.request.method == "PUT":
            return BusinessPlan.objects.select_for_update()

        return BusinessPlan.objects.select_related("created_by", "updated_by").order_by(
            "year_start", "year_end", "status", "id"
        )

    def get_serializer_class(self):
        if self.action == "get":
            return BPActivityDetailSerializer
        if self.action in ["create", "update"]:
            return BusinessPlanCreateSerializer
        return BusinessPlanSerializer

    @action(methods=["GET"], detail=False, url_path="get-years")
    def get_years(self, *args, **kwargs):
        return Response(
            (
                BusinessPlan.objects.values("year_start", "year_end")
                .annotate(
                    min_year=Min("activities__values__year"),
                    max_year=Max("activities__values__year"),
                )
                .order_by("-year_start")
            )
        )

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "business_plan_id",
                openapi.IN_QUERY,
                type=openapi.TYPE_INTEGER,
            ),
            openapi.Parameter(
                "year_start",
                openapi.IN_QUERY,
                type=openapi.TYPE_INTEGER,
            ),
            openapi.Parameter(
                "year_end",
                openapi.IN_QUERY,
                type=openapi.TYPE_INTEGER,
            ),
            openapi.Parameter(
                "bp_status",
                openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
            ),
        ],
    )
    @action(methods=["GET"], detail=False)
    def get(self, *args, **kwargs):
        self.search_fields = ["title", "comment_secretariat"]
        self.ordering = ["country__abbr", "initial_id"]
        self.ordering_fields = BPACTIVITY_ORDERING_FIELDS

        # get activities and history for a specific business plan
        bp = get_business_plan_from_request(self.request)

        history_qs = bp.bphistory.select_related("business_plan", "updated_by")

        ret = {
            "business_plan": BusinessPlanSerializer(bp).data,
            "history": BPHistorySerializer(history_qs, many=True).data,
        }

        activities = self.filter_queryset(self.get_queryset()).filter(business_plan=bp)
        page = self.paginate_queryset(activities)
        if page is not None:
            ret["activities"] = self.get_serializer(page, many=True).data
            return self.get_paginated_response(ret)

        ret["activities"] = self.get_serializer(activities, many=True).data
        return Response(ret)

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        ret_code, ret_data = self.create_bp(request.data)
        return Response(ret_data, status=ret_code)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        current_obj = self.get_object()
        ret_code, ret_data = self.update_bp(request.data, current_obj)
        return Response(ret_data, status=ret_code)


class BPActivityViewSet(
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
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

    def get_serializer_class(self):
        if self.action == "list":
            return BPActivityListSerializer
        return BPActivityDetailSerializer

    def get_queryset(self):
        queryset = BPActivity.objects.all()

        if "agency" in self.request.user.user_type.lower():
            # filter activities by agency if user is agency
            queryset = queryset.filter(agency=self.request.user.agency)

        return queryset

    def get_wb(self, method):
        year_start = int(self.request.query_params.get("year_start"))
        year_end = int(self.request.query_params.get("year_end"))
        agency_id = self.request.query_params.get("agency_id")
        if agency_id:
            agency = get_object_or_404(Agency, id=agency_id)

        # get all activities between year_start and year_end
        queryset = self.filter_queryset(self.get_queryset())

        data = BPActivityExportSerializer(queryset, many=True).data

        wb = openpyxl.Workbook()
        sheet = wb.active
        sheet.title = "Business Plans"
        configure_sheet_print(sheet, sheet.ORIENTATION_LANDSCAPE)

        BusinessPlanWriter(
            sheet,
            min_year=year_start,
            max_year=year_end + 1,
        ).write(data)

        if agency_id:
            name = f"BusinessPlan{agency.name}-{year_start}-{year_end}"
        else:
            name = f"BusinessPlanActivities{year_start}-{year_end}"

        return method(name, wb)

    @action(methods=["GET"], detail=False)
    def export(self, *args, **kwargs):
        return self.get_wb(workbook_response)

    @action(methods=["GET"], detail=False)
    def print(self, *args, **kwargs):
        return self.get_wb(workbook_pdf_response)


class BPFileView(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.DestroyModelMixin,
    generics.GenericAPIView,
):
    """
    API endpoint that allows uploading business plan file.
    """

    permission_classes = [IsSecretariat | IsAgency | IsViewer]
    queryset = BPFile.objects.all()
    serializer_class = BPFileSerializer
    filter_class = BPFileFilter

    ACCEPTED_EXTENSIONS = [
        ".pdf",
        ".doc",
        ".docx",
        ".xls",
        ".xlsx",
        ".csv",
        ".ppt",
        ".pptx",
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".zip",
        ".rar",
        ".7z",
    ]

    def get_permissions(self):
        # only the secretariat can create / delete files
        if self.request.method in ["POST", "DELETE"]:
            return [IsSecretariat()]
        return super().get_permissions()

    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)

    def _file_create(self, request, *args, **kwargs):
        files = request.FILES
        bp_file_data = {
            "status": request.query_params.get("status"),
            "year_start": request.query_params.get("year_start"),
            "year_end": request.query_params.get("year_end"),
        }
        if not files:
            return Response(
                {"feedback_file": "File not provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        filename, file = next(files.items())
        extension = os.path.splitext(filename)[-1]
        if extension not in self.ACCEPTED_EXTENSIONS:
            return Response(
                {"feedback_file": f"File extension {extension} is not valid"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing_file = BPFile.objects.filter(
            **bp_file_data,
            filename__in=list(files.keys()),
        ).values_list("filename", flat=True)

        if existing_file:
            return Response(
                {
                    "files": "Some files already exist: "
                    + str(", ".join(existing_file)),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        bp_files = []
        for filename, file in files.items():
            bp_files.append(
                BPFile(
                    **bp_file_data,
                    filename=filename,
                    file=file,
                )
            )
        BPFile.objects.bulk_create(bp_files)
        return Response({}, status=status.HTTP_201_CREATED)

    def post(self, request, *args, **kwargs):
        return self._file_create(request, *args, **kwargs)

    def delete(self, request, *args, **kwargs):
        file_ids = request.data.get("file_ids")
        queryset = self.filter_queryset(self.get_queryset())
        queryset.filter(id__in=file_ids).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class BPFileDownloadView(generics.RetrieveAPIView):
    permission_classes = [IsSecretariat | IsAgency | IsViewer]
    queryset = BPFile.objects.all()
    lookup_field = "id"

    def get(self, request, *args, **kwargs):
        obj = self.get_object()
        self.check_object_permissions(request, obj)

        response = HttpResponse(obj.file, content_type="application/octet-stream")
        file_name = urllib.parse.quote(obj.filename)

        response["Content-Disposition"] = (
            f"attachment; filename*=UTF-8''{file_name}; filename=\"{file_name}\""
        )

        return response


class BPImportValidateView(BusinessPlanUtils, generics.GenericAPIView):
    def post(self, request, *args, **kwargs):
        files = request.FILES
        year_start = int(request.query_params.get("year_start"))

        ret_code, ret_data = self.import_bp(files, year_start, from_validate=True)
        if ret_code != status.HTTP_200_OK:
            return Response(
                {
                    "error_type": "general error",
                    "row_number": None,
                    "activtiy_id": None,
                    "error_message": ret_data,
                },
                status=ret_code,
            )

        agency_ids = [activity["agency_id"] for activity in ret_data["activities"]]
        return Response(
            {
                "activities_number": len(ret_data["activities"]),
                "agencies_number": len(list(dict.fromkeys(agency_ids))),
                "errors": ret_data["errors"],
                "warnings": ret_data["warnings"],
            },
            status=status.HTTP_200_OK,
        )


class BPImportView(
    BusinessPlanUtils,
    mixins.CreateModelMixin,
    generics.GenericAPIView,
):
    queryset = BusinessPlan.objects.all()
    serializer_class = BusinessPlanCreateSerializer

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        files = request.FILES
        year_start = int(request.query_params.get("year_start"))
        year_end = int(request.query_params.get("year_end"))
        bp_status = request.query_params.get("status")

        ret_code, ret_data = self.import_bp(files, year_start)
        if ret_code != status.HTTP_200_OK:
            return Response("Data import failed", status=ret_code)

        current_bp = BusinessPlan.objects.filter(
            year_start=year_start,
            year_end=year_end,
            status=bp_status,
        ).first()

        data = {
            "year_start": year_start,
            "year_end": year_end,
            "status": bp_status,
            "activities": ret_data["activities"],
        }
        ret_code, _ = (
            self.update_bp(data, current_bp) if current_bp else self.create_bp(data)
        )

        if ret_code == status.HTTP_400_BAD_REQUEST:
            return Response("Data import failed", status=ret_code)
        return Response("Data imported successfully", status=status.HTTP_200_OK)
