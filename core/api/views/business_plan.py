import os
import math
import urllib

import openpyxl
from django.db import transaction
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
    BusinessPlanCreateSerializer,
    BusinessPlanSerializer,
    BPCommentsSerializer,
    BPFileSerializer,
    BPRecordExportSerializer,
    BPRecordDetailSerializer,
)
from core.api.utils import workbook_pdf_response
from core.api.utils import workbook_response
from core.models import BusinessPlan, BPHistory, BPRecord


class BusinessPlanViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = BusinessPlanSerializer
    filterset_class = BusinessPlanFilter
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter,
    ]
    ordering_fields = "__all__"
    search_fields = ["agency__name"]

    def get_queryset(self):
        business_plans = BusinessPlan.objects.all()

        if self.request.method == "PUT":
            return business_plans.select_for_update()
        return business_plans.select_related("agency", "created_by", "updated_by").order_by(
            "year_start", "year_end", "id"
        )

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

    def create(self, request, *args, **kwargs):
        # check if the business plan already exists
        business_plan = BusinessPlan.objects.filter(
            agency_id=request.data.get("agency_id"),
            year_start=request.data.get("year_start"),
            year_end=request.data.get("year_end"),
        ).first()
        if business_plan:
            return Response(
                {
                    "general_error": "A business plan for this agency and these years already exists"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = BusinessPlanCreateSerializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            instance = serializer.instance

            BPHistory.objects.create(
                business_plan=instance,
                bp_version=instance.version,
                updated_by=request.user,
                event_description="Created by user",
            )

            headers = self.get_success_headers(serializer.data)
            return Response(
                serializer.data, status=status.HTTP_201_CREATED, headers=headers
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def check_readonly_fields(self, serializer, current_obj):
        return (
            serializer.initial_data["agency_id"] != current_obj.agency_id
            or serializer.initial_data["year_start"] != current_obj.year_start
            or serializer.initial_data["year_end"] != current_obj.year_end
        )

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        current_obj = self.get_object()

        serializer = BusinessPlanCreateSerializer(data=request.data)
        if not serializer.is_valid() or self.check_readonly_fields(
            serializer, current_obj
        ):
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        self.perform_create(serializer)
        new_instance = serializer.instance

        # inherit all history
        BPHistory.objects.filter(business_plan=current_obj).update(
            business_plan=new_instance
        )

        # create new history for update event
        BPHistory.objects.create(
            business_plan=new_instance,
            bp_version=new_instance.version,
            updated_by=request.user,
            event_description="Updated by user",
        )

        current_obj.delete()

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_200_OK, headers=headers)


class BPRecordViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BPRecordDetailSerializer
    queryset = BPRecord.objects.select_related(
        "business_plan",
        "business_plan__agency",
        "country",
        "sector",
        "subsector",
        "project_type",
        "bp_chemical_type",
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
        queryset = self.filter_queryset(self.get_queryset())
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
        BPHistory.objects.create(
            business_plan=business_plan,
            bp_version=business_plan.version,
            updated_by=user,
            event_description="Comments updated by user",
        )
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
