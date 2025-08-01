from datetime import datetime
import os
import urllib

from django.db import transaction
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import generics, viewsets, filters, mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response

from core.api.filters.business_plan import (
    BPActivityListFilter,
    BPChemicalTypeFilter,
    BPFileFilter,
    BPFilterBackend,
)
from core.models import Project
from core.api.permissions import (
    HasBusinessPlanEditAccess,
    HasBusinessPlanViewAccess,
    DenyAll,
)

from core.api.serializers.bp_history import BPHistorySerializer
from core.api.serializers.business_plan import (
    BusinessPlanCreateSerializer,
    BusinessPlanSerializer,
    BPChemicalTypeSerializer,
    BPFileSerializer,
    BPActivityDetailSerializer,
    BPActivityListSerializer,
)
from core.api.views.business_plan_utils import IMPORT_PARAMETERS, BusinessPlanUtils
from core.api.views.utils import (
    get_business_plan_from_request,
    BPACTIVITY_ORDERING_FIELDS,
)
from core.models import BusinessPlan, BPChemicalType, BPActivity
from core.models.business_plan import BPFile


class BPChemicalTypeListView(generics.ListAPIView):
    """
    List BP chemical types, excluding obsolete values by default.
    """

    permission_classes = [HasBusinessPlanViewAccess]

    def get_queryset(self):
        # By default, exclude obsolete values unless explicitly filtered
        queryset = BPChemicalType.objects.all()
        include_obsoletes = self.request.query_params.get("include_obsoletes", None)
        if not include_obsoletes:
            queryset = queryset.filter(obsolete=False)
        return queryset

    filterset_class = BPChemicalTypeFilter
    serializer_class = BPChemicalTypeSerializer

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "include_obsoletes",
                openapi.IN_QUERY,
                type=openapi.TYPE_BOOLEAN,
                description="Include obsolete chemical types. By default, only non-obsolete types are returned.",
            ),
        ],
    )
    def get(self, request, *args, **kwargs):
        """
        Override get method to handle the queryset filtering.
        """
        self.queryset = self.get_queryset()
        return super().get(request, *args, **kwargs)


class BusinessPlanViewSet(
    BusinessPlanUtils,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    filter_backends = [
        BPFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter,
    ]
    search_fields = []
    ordering = ["id"]
    ordering_fields = "__all__"

    @property
    def permission_classes(self):
        if self.action in ["list", "retrieve", "get_years", "get"]:
            return [HasBusinessPlanViewAccess]
        if self.action in [
            "create",
            "update",
            "partial_update",
            "destroy",
        ]:
            return [HasBusinessPlanEditAccess]
        return [DenyAll]

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
        if self.action == "update":
            return BusinessPlanCreateSerializer
        return BusinessPlanSerializer

    @action(methods=["GET"], detail=False, url_path="get-years")
    def get_years(self, *args, **kwargs):
        # initialize years from 2014 to current year
        current_year = datetime.now().year
        final_years = {}
        for ys in range(current_year + 1, 2013, -1):
            final_years[ys] = {
                "year_start": ys,
                "year_end": ys + 2,
                "status": [],
            }
        # get existing years
        existing_years = (
            BusinessPlan.objects.values("year_start", "year_end", "status")
            .distinct()
            .order_by("year_start", "year_end", "status")
            .all()
        )
        for bp_data in existing_years:
            year_start = bp_data["year_start"]
            if "status" in final_years[year_start]:
                final_years[year_start]["status"].append(bp_data["status"])

        return Response(final_years.values())

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
        self.search_fields = ["title"]
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
    def update(self, request, *args, **kwargs):
        current_obj = self.get_object()
        ret_code, ret_data = self.update_bp(request.data, current_obj)
        return Response(ret_data, status=ret_code)


class BPActivityViewSet(
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    filterset_class = BPActivityListFilter
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter,
    ]
    search_fields = [
        "title",
        "required_by_model",
        "lvc_status",
        "remarks",
        "bp_chemical_type__name",
        "substances__name",
    ]
    ordering = ["agency__name", "country__abbr", "initial_id"]
    ordering_fields = BPACTIVITY_ORDERING_FIELDS

    @property
    def permission_classes(self):
        if self.action in ["list", "retrieve"]:
            return [HasBusinessPlanViewAccess]
        if self.action in ["validate_for_removal"]:
            return [HasBusinessPlanEditAccess]
        return [DenyAll]

    def get_serializer_class(self):
        if self.action == "list":
            return BPActivityListSerializer
        return BPActivityDetailSerializer

    def get_queryset(self):
        return BPActivity.objects.all()

    @action(methods=["GET"], detail=True)
    def validate_for_removal(self, *args, **kwargs):
        errors = []
        bp_activity = get_object_or_404(self.get_queryset(), id=kwargs.get("pk", None))
        if Project.objects.really_all().filter(bp_activity=bp_activity).count() > 0:
            errors.append(
                "Cannot remove activity with projects. Please remove all projects first."
            )
        return Response(errors, status=status.HTTP_200_OK)


class BPFileView(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.DestroyModelMixin,
    generics.GenericAPIView,
):
    """
    API endpoint that allows uploading business plan file.
    """

    queryset = BPFile.objects.all()
    serializer_class = BPFileSerializer
    filterset_class = BPFileFilter

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

    @property
    def permission_classes(self):
        if self.request.method in ["GET"]:
            return [HasBusinessPlanViewAccess]
        if self.request.method in ["POST", "DELETE"]:
            return [HasBusinessPlanEditAccess]
        return [DenyAll]

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
    permission_classes = [HasBusinessPlanViewAccess]
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
    permission_classes = [HasBusinessPlanEditAccess]

    @swagger_auto_schema(
        manual_parameters=IMPORT_PARAMETERS,
        operation_description="Check if uploaded file is valid without saving data",
    )
    def post(self, request, *args, **kwargs):
        files = request.FILES
        year_start = int(request.query_params.get("year_start", 0))

        ret_code, ret_data = self.import_bp(files, year_start, from_validate=True)
        if ret_code != status.HTTP_200_OK:
            return Response(
                {
                    "activities_number": None,
                    "agencies_number": None,
                    "errors": [
                        {
                            "error_type": "general error",
                            "row_number": None,
                            "activity_id": None,
                            "error_message": ret_data,
                        },
                    ],
                    "warnings": [],
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
    serializer_class = BusinessPlanCreateSerializer
    permission_classes = [HasBusinessPlanEditAccess]

    @swagger_auto_schema(
        manual_parameters=IMPORT_PARAMETERS,
        operation_description="Perform Business Plan import from file",
    )
    @transaction.atomic
    def post(self, request, *args, **kwargs):
        files = request.FILES
        year_start = int(request.query_params.get("year_start", 0))
        year_end = int(request.query_params.get("year_end", 0))
        bp_status = request.query_params.get("status")
        meeting_id = request.query_params.get("meeting_id")
        decision_id = request.query_params.get("decision_id")
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
            "meeting_id": meeting_id,
            "decision_id": decision_id,
            "activities": ret_data["activities"],
        }
        ret_code, _ = (
            self.update_bp(data, current_bp) if current_bp else self.create_bp(data)
        )

        if ret_code == status.HTTP_400_BAD_REQUEST:
            return Response("Data import failed", status=ret_code)
        return Response("Data imported successfully", status=status.HTTP_200_OK)
