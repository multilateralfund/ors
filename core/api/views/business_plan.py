import os
import math
import urllib

import openpyxl
from django.db.models import Max
from django.db.models import Min
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import generics, viewsets, filters, mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response

from core.api.export.base import configure_sheet_print
from core.api.export.business_plan import BusinessPlanWriter
from core.api.filters.business_plan import BPRecordFilter
from core.api.filters.business_plan import BusinessPlanFilter
from core.api.serializers.business_plan import (
    BusinessPlanSerializer,
    BPCommentsSerializer,
    BPFileSerializer,
    BPRecordExportSerializer,
    BPRecordDetailSerializer,
)
from core.api.utils import workbook_pdf_response
from core.api.utils import workbook_response
from core.api.views.utils import get_business_plan_from_request
from core.models import BusinessPlan, BPRecord


class BusinessPlanViewSet(
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = BusinessPlanSerializer
    queryset = BusinessPlan.objects.select_related("agency").order_by(
        "year_start", "year_end", "id"
    )
    filterset_class = BusinessPlanFilter
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter,
    ]
    ordering_fields = "__all__"
    search_fields = ["agency__name"]

    @action(methods=["GET"], detail=False, url_path="get-years")
    def get_years(self, *args, **kwargs):
        return Response(
            (
                BusinessPlan.objects.values("year_start", "year_end")
                .annotate(
                    min_year=Min("records__values__year"),
                    max_year=Max("records__values__year"),
                )
                .order_by("-year_start")
            )
        )


class BPRecordViewSet(
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = BPRecordDetailSerializer
    queryset = BPRecord.objects.select_related(
        "business_plan",
        "business_plan__agency",
        "country",
        "sector",
        "subsector",
        "project_type",
        "bp_chemical_type",
        "project_cluster",
    ).prefetch_related(
        "substances",
        "blends",
        "values",
    )
    filterset_class = BPRecordFilter
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter,
    ]
    search_fields = ["title"]
    ordering = ["title", "country", "id"]
    ordering_fields = [
        "title",
        "country__iso3",
        "country__name",
        "business_plan__agency__name",
        "project_type__code",
        "sector__code",
        "subsector__code",
        "bp_type",
        "is_multi_year",
    ]

    def get_wb(self, method):
        bp = get_business_plan_from_request(self.request)

        # get records for the business plan
        queryset = self.filter_queryset(self.get_queryset()).filter(business_plan=bp)

        data = BPRecordExportSerializer(queryset, many=True).data

        limits = queryset.aggregate(
            min_year=Min("values__year"), max_year=Max("values__year")
        )

        if start_year := int(
            self.request.query_params.get("business_plan__year_start", "0")
        ):
            # If there is no data, or only partial data. Ensure we have fields for
            # start_year, start_year + 1, start_year + 2, after start_year + 2
            limits["min_year"] = limits["min_year"] or start_year
            limits["max_year"] = max(limits["max_year"] or -math.inf, start_year + 3)

        wb = openpyxl.Workbook()
        sheet = wb.active
        sheet.title = "Business Plans"
        configure_sheet_print(sheet, sheet.ORIENTATION_LANDSCAPE)

        BusinessPlanWriter(
            sheet,
            min_year=limits["min_year"],
            max_year=limits["max_year"],
        ).write(data)

        name = f"Business Plans {limits['min_year']}-{limits['max_year'] - 1}"
        return method(name, wb)

    @action(methods=["GET"], detail=False)
    def export(self, *args, **kwargs):
        return self.get_wb(workbook_response)

    @action(methods=["GET"], detail=False)
    def print(self, *args, **kwargs):
        return self.get_wb(workbook_pdf_response)

    @swagger_auto_schema(
        operation_description="List records for a specific business plan",
        manual_parameters=[
            openapi.Parameter(
                name="business_plan_id",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_INTEGER,
                description="Business plan ID",
            ),
            openapi.Parameter(
                name="agency_id",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_INTEGER,
                description="Agency ID",
            ),
            openapi.Parameter(
                name="year_start",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_INTEGER,
                description="Year start",
            ),
            openapi.Parameter(
                name="year_end",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_INTEGER,
                description="Year end",
            ),
        ],
    )
    def list(self, request, *args, **kwargs):
        # get records for a specific business plan
        bp = get_business_plan_from_request(request)

        # get records for the business plan
        queryset = self.filter_queryset(self.get_queryset()).filter(business_plan=bp)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class BPCommentsView(generics.GenericAPIView):
    """
    API endpoint that allows updating business plan comments.
    This is called with either POST or PUT on an already-existing BP.
    """

    queryset = BusinessPlan.objects.all()
    serializer_class = BPCommentsSerializer
    lookup_field = "id"

    @swagger_auto_schema(
        operation_description="Update business plan comments",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=[],
            properties={
                "comment_type": openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="comment_agency or comment_secretariat",
                ),
                "comment": openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="Comment text",
                ),
            },
        ),
    )
    def _comments_update_or_create(self, request, *args, **kwargs):
        business_plan = self.get_object()
        comment_type = request.data.get("comment_type")
        comment = request.data.get("comment", "")

        user = request.user
        if comment_type == "comment_agency":
            if user.user_type != user.UserType.AGENCY:
                return Response(
                    {comment_type: f"Invalid value {comment}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            business_plan.comment_agency = comment

        if comment_type == "comment_secretariat":
            if user.user_type != user.UserType.SECRETARIAT:
                return Response(
                    {comment_type: f"Invalid value {comment}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            business_plan.comment_secretariat = comment

        business_plan.save()
        serializer = self.get_serializer(business_plan)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def post(self, request, *args, **kwargs):
        return self._comments_update_or_create(request, *args, **kwargs)

    def put(self, request, *args, **kwargs):
        return self._comments_update_or_create(request, *args, **kwargs)


class BPFileView(generics.GenericAPIView):
    """
    API endpoint that allows uploading business plan file.
    """

    queryset = BusinessPlan.objects.all()
    serializer_class = BPFileSerializer
    lookup_field = "id"

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

    def _file_create(self, request, *args, **kwargs):
        business_plan = self.get_object()

        files = request.FILES
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

        if bool(business_plan.feedback_file):
            business_plan.feedback_file.delete(save=False)

        business_plan.feedback_filename = filename
        business_plan.feedback_file = file
        business_plan.save()
        serializer = self.get_serializer(business_plan)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def post(self, request, *args, **kwargs):
        return self._file_create(request, *args, **kwargs)


class BPFileDownloadView(generics.RetrieveAPIView):
    queryset = BusinessPlan.objects.all()
    lookup_field = "id"

    def get(self, request, *args, **kwargs):
        business_plan = self.get_object()
        response = HttpResponse(
            business_plan.feedback_file.read(), content_type="application/octet-stream"
        )
        file_name = urllib.parse.quote(business_plan.feedback_filename)
        response["Content-Disposition"] = (
            f"attachment; filename*=UTF-8''{file_name}; filename=\"{file_name}\""
        )
        return response
