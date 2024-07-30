import os
import math
import urllib

import openpyxl
from constance import config
from django.db import transaction
from django.db.models import Max
from django.db.models import Min
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
from core.api.filters.business_plan import BPRecordFilter
from core.api.filters.business_plan import BusinessPlanFilter
from core.api.permissions import IsUserAllowedBP, IsUserAllowedBPRecord
from core.api.serializers.bp_history import BPHistorySerializer
from core.api.serializers.business_plan import (
    BusinessPlanCreateSerializer,
    BusinessPlanSerializer,
    BPFileSerializer,
    BPRecordExportSerializer,
    BPRecordCreateSerializer,
    BPRecordDetailSerializer,
)
from core.api.utils import STATUS_TRANSITIONS, workbook_pdf_response
from core.api.utils import workbook_response
from core.api.views.utils import get_business_plan_from_request
from core.models import BusinessPlan, BPHistory, BPRecord
from core.tasks import (
    send_mail_bp_create,
    send_mail_bp_status_update,
    send_mail_bp_update,
)


class BusinessPlanViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsUserAllowedBP]
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
        return business_plans.select_related(
            "agency", "created_by", "updated_by"
        ).order_by("year_start", "year_end", "id")

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

    @transaction.atomic
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
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        instance = BusinessPlan(**serializer.validated_data)

        # check user permissions
        user = request.user
        self.check_object_permissions(request, instance)

        # check bp status
        if instance.status not in [
            BusinessPlan.Status.agency_draft,
            BusinessPlan.Status.secretariat_draft,
        ]:
            return Response(
                {"general_error": "Only draft BP can be created"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        self.perform_create(serializer)
        instance = serializer.instance

        # set name
        if not instance.name:
            instance.name = (
                f"{instance.agency} {instance.year_start} - {instance.year_end}"
            )

        # set created by user
        instance.created_by = user
        instance.save()

        BPHistory.objects.create(
            business_plan=instance,
            updated_by=user,
            event_description="Created by user",
        )
        if config.SEND_MAIL:
            send_mail_bp_create.delay(instance.id)  # send mail to MLFS

        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )

    def check_record_values(self, serializer, business_plan):
        for record in serializer.initial_data.get("records", []):
            for record_value in record.get("values", []):
                if (
                    business_plan.year_start > record_value["year"]
                    or record_value["year"] > business_plan.year_end
                ):
                    return False
        return True

    def check_readonly_fields(self, serializer, current_obj):
        return (
            serializer.initial_data["agency_id"] != current_obj.agency_id
            or serializer.initial_data["year_start"] != current_obj.year_start
            or serializer.initial_data["year_end"] != current_obj.year_end
            or serializer.initial_data["status"] != current_obj.status
        )

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        current_obj = self.get_object()

        serializer = BusinessPlanCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        if self.check_readonly_fields(serializer, current_obj):
            return Response(
                {"general_error": "Business plan readonly fields changed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not self.check_record_values(serializer, current_obj):
            return Response(
                {
                    "general_error": "BP record values year not in business plan interval"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # the updates can only be made on drafts
        if current_obj.status not in [
            BusinessPlan.Status.agency_draft,
            BusinessPlan.Status.secretariat_draft,
        ]:
            return Response(
                {"general_error": "Only draft BP can be updated"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        self.perform_create(serializer)
        new_instance = serializer.instance

        # set name
        if not new_instance.name:
            new_instance.name = f"{new_instance.agency} {new_instance.year_start} - {new_instance.year_end}"

        # set updated by user
        user = request.user
        new_instance.updated_by = user
        new_instance.save()

        # inherit all history
        BPHistory.objects.filter(business_plan=current_obj).update(
            business_plan=new_instance
        )

        # create new history for update event
        BPHistory.objects.create(
            business_plan=new_instance,
            updated_by=user,
            event_description="Updated by user",
        )

        current_obj.delete()

        if config.SEND_MAIL:
            send_mail_bp_update.delay(new_instance.id)  # send mail to MLFS

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_200_OK, headers=headers)


class BPStatusUpdateView(generics.GenericAPIView):
    """
    API endpoint that allows updating business plan status.
    """

    queryset = BusinessPlan.objects.all()
    serializer_class = BusinessPlanSerializer
    lookup_field = "id"
    permission_classes = [IsUserAllowedBP]

    @swagger_auto_schema(
        operation_description="Update business plan status",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "status": openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="Update bp status",
                )
            },
        ),
    )
    def put(self, request, *args, **kwargs):
        business_plan = self.get_object()
        initial_status = business_plan.status
        new_status = request.data.get("status")

        # validate status transition
        if (
            initial_status not in STATUS_TRANSITIONS
            or new_status not in STATUS_TRANSITIONS[initial_status]
        ):
            return Response(
                {"general_error": "Invalid status transition"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # validate user permissions
        user = request.user
        if user.user_type not in STATUS_TRANSITIONS[initial_status][new_status]:
            return Response(
                {"general_error": "User not allowed to update status"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # update status
        business_plan.status = new_status
        business_plan.save()

        BPHistory.objects.create(
            business_plan=business_plan,
            updated_by=request.user,
            event_description=f"Status updated from {initial_status} to {new_status}",
        )

        serializer = self.get_serializer(business_plan)

        if config.SEND_MAIL:
            send_mail_bp_status_update.delay(business_plan.id)

        return Response(serializer.data)


class BPRecordViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsUserAllowedBPRecord]
    serializer_class = BPRecordDetailSerializer
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
        "status",
        "is_multi_year",
    ]

    def get_queryset(self):
        bp_records = BPRecord.objects.all()

        if self.request.method == "PUT":
            return bp_records.select_for_update()
        return bp_records.select_related(
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
            "values",
        )

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

    def get_history(self, business_plan):
        history_qs = business_plan.bphistory.all().select_related(
            "business_plan", "updated_by"
        )
        history = BPHistorySerializer(history_qs, many=True).data

        return history

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
        ret = {
            "business_plan": BusinessPlanSerializer(bp).data,
            "history": self.get_history(bp),
        }

        # get records for the business plan
        queryset = self.filter_queryset(self.get_queryset()).filter(business_plan=bp)

        page = self.paginate_queryset(queryset)
        if page is not None:
            ret["records"] = self.get_serializer(page, many=True).data
            return self.get_paginated_response(ret)

        ret["records"] = self.get_serializer(queryset, many=True).data
        return Response(ret)

    def create(self, request, *args, **kwargs):
        serializer = BPRecordCreateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        business_plan = get_object_or_404(
            BusinessPlan,
            id=serializer.initial_data["business_plan_id"],
        )
        if not self.check_readonly_fields(serializer, business_plan):
            return Response(
                {
                    "general_error": "BP record values year not in business plan interval"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        self.perform_create(serializer)
        instance = serializer.instance

        # set updated by user
        business_plan.updated_by = request.user
        business_plan.save()

        BPHistory.objects.create(
            business_plan=instance.business_plan,
            updated_by=request.user,
            event_description=f"Created record {instance.id}",
        )

        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )

    def check_readonly_fields(self, serializer, business_plan):
        for record_value in serializer.initial_data.get("values", []):
            if (
                business_plan.year_start > record_value["year"]
                or record_value["year"] > business_plan.year_end
            ):
                return False
        return True

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        current_obj = self.get_object()

        serializer = BPRecordCreateSerializer(current_obj, data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        if serializer.initial_data["business_plan_id"] != current_obj.business_plan_id:
            return Response(
                {"general_error": "Business plan changed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        business_plan = current_obj.business_plan
        if not self.check_readonly_fields(serializer, business_plan):
            return Response(
                {
                    "general_error": "BP record values year not in business plan interval"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        self.perform_update(serializer)

        # set updated by user
        business_plan.updated_by = request.user
        business_plan.save()

        # create new history for update event
        BPHistory.objects.create(
            business_plan=current_obj.business_plan,
            updated_by=request.user,
            event_description=f"Updated record {current_obj.id}",
        )

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_200_OK, headers=headers)


class BPFileView(generics.GenericAPIView):
    """
    API endpoint that allows uploading business plan file.
    """

    permission_classes = [IsUserAllowedBP]
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
    permission_classes = [IsUserAllowedBP]
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
