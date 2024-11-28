import os
import urllib

import openpyxl
from constance import config
from django.core.exceptions import PermissionDenied
from django.db import transaction
from django.db.models import F, Max, Min
from django.http import HttpResponse
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
    BPActivityCreateSerializer,
    BPActivityExportSerializer,
    BPActivityDetailSerializer,
    BPActivityListSerializer,
)
from core.api.utils import (
    workbook_response,
    workbook_pdf_response,
)
from core.api.views.utils import (
    delete_fields,
    get_business_plan_from_request,
    BPACTIVITY_ORDERING_FIELDS,
)
from core.models import BusinessPlan, BPChemicalType, BPHistory, BPActivity
from core.models.business_plan import BPFile
from core.tasks import (
    send_mail_bp_create,
    send_mail_bp_update,
)


class BPChemicalTypeListView(generics.ListAPIView):
    """
    List BP chemical types
    """

    permission_classes = [IsSecretariat | IsAgency | IsViewer]
    queryset = BPChemicalType.objects.all()
    filterset_class = BPChemicalTypeFilter
    serializer_class = BPChemicalTypeSerializer


class BusinessPlanViewSet(
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
            user = self.request.user
            if "agency" in user.user_type.lower():
                return BPActivity.objects.filter(agency=user.agency)
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

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # check if the business plan already exists
        business_plan = BusinessPlan.objects.filter(
            year_start=request.data.get("year_start"),
            year_end=request.data.get("year_end"),
            status=request.data.get("status"),
        ).first()

        if business_plan:
            return Response(
                {
                    "general_error": "A business plan for this status and these years already exists"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(
            data=request.data, context={"ignore_comment": True}
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data.copy()
        validated_data.pop("activities", [])
        instance = BusinessPlan(**validated_data)

        ret_code, error = self.check_activity_values(serializer.initial_data, instance)
        if ret_code != status.HTTP_200_OK:
            return Response({"general_error": error}, status=ret_code)

        self.perform_create(serializer)
        instance = serializer.instance

        # set initial_id - used to set `is_updated` later
        instance.activities.update(initial_id=F("id"))

        # set name
        if not instance.name:
            instance.name = (
                f"{instance.status} {instance.year_start} - {instance.year_end}"
            )

        # set created by user
        user = request.user
        instance.created_by = user
        instance.save()

        self.create_history(instance, user, "Created by user")

        if config.SEND_MAIL:
            send_mail_bp_create.delay(instance.id)  # send mail to MLFS

        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )

    def check_activity_values(self, initial_data, business_plan):
        for activity in initial_data.get("activities", []):
            for activity_value in activity.get("values", []):
                if (
                    business_plan.year_start > activity_value["year"]
                    or activity_value["year"] > business_plan.year_end
                ):
                    return (
                        status.HTTP_400_BAD_REQUEST,
                        "BP activity values year not in business plan interval",
                    )

        return status.HTTP_200_OK, ""

    def check_readonly_fields(self, initial_data, current_obj):
        if (
            initial_data["year_start"] != current_obj.year_start
            or initial_data["year_end"] != current_obj.year_end
            or initial_data["status"] != current_obj.status
        ):
            return status.HTTP_400_BAD_REQUEST, "Business plan readonly fields changed"

        return status.HTTP_200_OK, ""

    def set_is_updated_activities(self, new_instance, current_obj):
        new_activities = []
        updated_activities = []
        data = BPActivityCreateSerializer(new_instance.activities.all(), many=True).data
        data_old = BPActivityCreateSerializer(
            current_obj.activities.all(), many=True
        ).data
        activities_old = {activity["initial_id"]: activity for activity in data_old}

        for activity in data:
            # match new with old activities using `initial_id`
            activity_old = activities_old.pop(activity["initial_id"], None)
            activity_id = activity.pop("id", None)

            if not activity_old:
                new_activities.append(activity_id)
                continue

            # delete ids to compare only actual values
            delete_fields(activity, ["id", "business_plan_id", "is_updated"])
            delete_fields(activity_old, ["id", "business_plan_id", "is_updated"])
            for value in activity.get("values", []) + activity_old.get("values", []):
                delete_fields(value, ["id"])

            if activity != activity_old:
                updated_activities.append(activity_id)

        BPActivity.objects.filter(id__in=new_activities).update(
            is_updated=True, initial_id=F("id")
        )
        BPActivity.objects.filter(id__in=updated_activities).update(is_updated=True)

    def set_bp_data(self, user, new_instance, current_obj):
        # inherit all history
        BPHistory.objects.filter(business_plan=current_obj).update(
            business_plan=new_instance
        )

        # set name
        if not new_instance.name:
            new_instance.name = f"{new_instance.status} {new_instance.year_start} - {new_instance.year_end}"

        # set updated by user
        new_instance.updated_by = user

        # set is_updated, compare with current obj
        self.set_is_updated_activities(new_instance, current_obj)

        current_obj.delete()

    def create_history(self, business_plan, user, event):
        BPHistory.objects.create(
            business_plan=business_plan,
            updated_by=user,
            event_description=event,
        )

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        user = request.user
        current_obj = self.get_object()

        ignore_comment = bool("agency" in user.user_type.lower())
        serializer = self.get_serializer(
            data=request.data, context={"ignore_comment": ignore_comment}
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # validate bp and activities data
        ret_code, error = self.check_readonly_fields(
            serializer.initial_data, current_obj
        )
        if ret_code != status.HTTP_200_OK:
            return Response({"general_error": error}, status=ret_code)

        ret_code, error = self.check_activity_values(
            serializer.initial_data, current_obj
        )
        if ret_code != status.HTTP_200_OK:
            return Response({"general_error": error}, status=ret_code)

        # create new bp instance and activities
        self.perform_create(serializer)
        new_instance = serializer.instance

        # set name, updated_by, is_updated
        self.set_bp_data(user, new_instance, current_obj)
        new_instance.save()

        # create new history for update event
        self.create_history(new_instance, user, "Updated by user")

        if config.SEND_MAIL:
            send_mail_bp_update.delay(new_instance.id)  # send mail to MLFS

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_200_OK, headers=headers)


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
        bp_status = self.request.query_params.get("bp_status")

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

        if bp_status:
            name = f"BusinessPlan{bp_status}-{year_start}-{year_end}"
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
    queryset = BPFile.objects.select_related("agency")
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
        user = request.user
        agency_id = request.query_params.get("agency_id")
        if "agency" in user.user_type.lower() and user.agency_id != int(agency_id):
            raise PermissionDenied("User represents other agency")

        return self.list(request, *args, **kwargs)

    def _file_create(self, request, *args, **kwargs):
        files = request.FILES
        bp_file_data = {
            "agency_id": request.query_params.get("agency_id"),
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
