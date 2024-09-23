import os
import urllib

import openpyxl
from constance import config
from django.db import transaction
from django.db.models import F, Max, Min
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
    BPFilterBackend,
)
from core.api.permissions import IsAgency, IsSecretariat, IsViewer
from core.api.serializers.bp_history import BPHistorySerializer
from core.api.serializers.business_plan import (
    BusinessPlanCreateSerializer,
    BusinessPlanSerializer,
    BPFileSerializer,
    BPActivityCreateSerializer,
    BPActivityExportSerializer,
    BPActivityDetailSerializer,
    BPActivityListSerializer,
)
from core.api.utils import workbook_pdf_response
from core.api.utils import workbook_response
from core.api.views.utils import (
    check_status_transition,
    copy_fields,
    delete_fields,
    get_business_plan_from_request,
    rename_fields,
    BPACTIVITY_ORDERING_FIELDS,
)
from core.models import Agency, BusinessPlan, BPHistory, BPActivity
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
    permission_classes = [IsSecretariat | IsAgency | IsViewer]
    filter_backends = [
        BPFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter,
    ]
    ordering = ["agency__name", "id"]
    ordering_fields = "__all__"
    search_fields = ["agency__name"]

    def get_queryset(self):
        if self.action == "get":
            return BPActivity.objects.all()

        if self.request.method == "PUT":
            return BusinessPlan.objects.get_latest().select_for_update()

        business_plans = BusinessPlan.objects.all()
        # filter business plans by agency if user is agency
        if "agency" in self.request.user.user_type.lower():
            business_plans = business_plans.filter(agency=self.request.user.agency)

        return business_plans.select_related(
            "agency", "created_by", "updated_by"
        ).order_by("year_start", "year_end", "id")

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
                BusinessPlan.objects.get_latest()
                .values("year_start", "year_end")
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
                "agency_id",
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
                "version",
                openapi.IN_QUERY,
                type=openapi.TYPE_INTEGER,
            ),
        ],
    )
    @action(methods=["GET"], detail=False)
    def get(self, *args, **kwargs):
        self.search_fields = ["title"]
        self.ordering = ["title", "country", "id"]
        self.ordering_fields = BPACTIVITY_ORDERING_FIELDS

        # get activities and history for a specific business plan
        bp = get_business_plan_from_request(self.request)
        self.check_object_permissions(self.request, bp)

        history_qs = bp.bphistory.select_related("business_plan", "updated_by")
        activities = self.filter_queryset(self.get_queryset()).filter(business_plan=bp)

        ret = {
            "business_plan": BusinessPlanSerializer(bp).data,
            "history": BPHistorySerializer(history_qs, many=True).data,
        }

        page = self.paginate_queryset(activities)
        if page is not None:
            ret["activities"] = self.get_serializer(page, many=True).data
            return self.get_paginated_response(ret)

        ret["activities"] = self.get_serializer(activities, many=True).data
        return Response(ret)

    @swagger_auto_schema(
        operation_description="List business plans",
        manual_parameters=[
            openapi.Parameter(
                name="get_versions",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_BOOLEAN,
                description="Get all versions or only latest ones",
            ),
        ],
    )
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if not request.query_params.get("get_versions"):
            queryset = queryset.filter(is_latest=True)

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

        serializer = self.get_serializer(
            data=request.data, context={"ignore_comment": True}
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data.copy()
        validated_data.pop("activities", [])
        instance = BusinessPlan(**validated_data)

        # check user permissions
        self.check_object_permissions(request, instance)

        if not self.check_activity_values(serializer, instance):
            return Response(
                {
                    "general_error": "BP activity values year not in business plan interval"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

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

        # set initial_id - used to set `is_updated` later
        instance.activities.update(initial_id=F("id"))

        # set name
        if not instance.name:
            instance.name = (
                f"{instance.agency} {instance.year_start} - {instance.year_end}"
            )

        # set created by user
        user = request.user
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

    def check_activity_values(self, serializer, business_plan):
        for activity in serializer.initial_data.get("activities", []):
            for activity_value in activity.get("values", []):
                if (
                    business_plan.year_start > activity_value["year"]
                    or activity_value["year"] > business_plan.year_end
                ):
                    return False
        return True

    def check_readonly_fields(self, serializer, current_obj):
        return (
            serializer.initial_data["agency_id"] != current_obj.agency_id
            or serializer.initial_data["year_start"] != current_obj.year_start
            or serializer.initial_data["year_end"] != current_obj.year_end
        )

    def set_is_updated_activities(self, new_instance, bp_old_version):
        new_activities = []
        updated_activities = []
        data = BPActivityCreateSerializer(new_instance.activities.all(), many=True).data
        data_old = BPActivityCreateSerializer(
            bp_old_version.activities.all(), many=True
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

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        user = request.user
        current_obj = self.get_object()
        initial_status = current_obj.status
        new_status = request.data["status"]

        ignore_comment = bool(
            "agency" in user.user_type.lower() and initial_status != new_status
        )
        serializer = self.get_serializer(
            data=request.data, context={"ignore_comment": ignore_comment}
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        if self.check_readonly_fields(serializer, current_obj):
            return Response(
                {"general_error": "Business plan readonly fields changed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not self.check_activity_values(serializer, current_obj):
            return Response(
                {
                    "general_error": "BP activity values year not in business plan interval"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # the updates can only be made on drafts
        if new_status not in [
            BusinessPlan.Status.agency_draft,
            BusinessPlan.Status.secretariat_draft,
        ]:
            return Response(
                {"general_error": "Only draft BP can be updated"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ret_code, error = check_status_transition(user, initial_status, new_status)
        if ret_code != status.HTTP_200_OK:
            return Response({"general_error": error}, status=ret_code)

        self.perform_create(serializer)
        new_instance = serializer.instance

        # inherit all history
        BPHistory.objects.filter(business_plan=current_obj).update(
            business_plan=new_instance
        )

        # set name
        if not new_instance.name:
            new_instance.name = f"{new_instance.agency} {new_instance.year_start} - {new_instance.year_end}"

        # set version
        if new_status != initial_status:
            new_instance.version = current_obj.version + 1
            current_obj.is_latest = False
            current_obj.save()
        else:
            new_instance.version = current_obj.version
            current_obj.delete()

        # set updated by user
        new_instance.updated_by = user
        new_instance.save()

        # set is_updated, compare with `latest_version - 1`
        bp_old_version = BusinessPlan.objects.filter(
            agency_id=new_instance.agency_id,
            year_start=new_instance.year_start,
            year_end=new_instance.year_end,
            version=new_instance.version - 1,
        ).first()
        if bp_old_version:
            self.set_is_updated_activities(new_instance, bp_old_version)

        # create new history for update event
        BPHistory.objects.create(
            business_plan=new_instance,
            updated_by=user,
            event_description="Updated by user",
            bp_version=new_instance.version,
        )

        if config.SEND_MAIL:
            send_mail_bp_update.delay(new_instance.id)  # send mail to MLFS

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_200_OK, headers=headers)


class BPStatusUpdateView(generics.GenericAPIView):
    """
    API endpoint that allows updating business plan status.
    """

    queryset = BusinessPlan.objects.get_latest()
    serializer_class = BusinessPlanSerializer
    lookup_field = "id"
    permission_classes = [IsSecretariat | IsAgency]

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
        user = request.user

        ret_code, error = check_status_transition(user, initial_status, new_status)
        if ret_code != status.HTTP_200_OK:
            return Response({"general_error": error}, status=ret_code)

        # update status
        business_plan.status = new_status
        business_plan.save()

        BPHistory.objects.create(
            business_plan=business_plan,
            updated_by=request.user,
            event_description=f"Status updated from {initial_status} to {new_status}",
            bp_version=business_plan.version,
        )

        serializer = self.get_serializer(business_plan)

        if config.SEND_MAIL:
            send_mail_bp_status_update.delay(business_plan.id)

        return Response(serializer.data)


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
    search_fields = ["title"]
    ordering = ["title", "country", "id"]
    ordering_fields = ["business_plan__agency__name"] + BPACTIVITY_ORDERING_FIELDS

    def get_serializer_class(self):
        if self.action == "list":
            return BPActivityListSerializer
        return BPActivityDetailSerializer

    def get_queryset(self):
        queryset = BPActivity.objects.get_latest()

        if "agency" in self.request.user.user_type.lower():
            # filter activities by agency if user is agency
            queryset = queryset.filter(business_plan__agency=self.request.user.agency)

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


class BPFileView(generics.GenericAPIView):
    """
    API endpoint that allows uploading business plan file.
    """

    permission_classes = [IsSecretariat | IsAgency | IsViewer]
    queryset = BusinessPlan.objects.get_latest()
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
    permission_classes = [IsSecretariat | IsAgency | IsViewer]
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


class BPActivityDiffView(mixins.ListModelMixin, generics.GenericAPIView):
    permission_classes = [IsSecretariat | IsAgency | IsViewer]

    def diff_activities(self, data, data_old, fields):
        diff_data = []
        values_fields = ["value_usd", "value_odp", "value_mt"]
        activities_old = {activity["initial_id"]: activity for activity in data_old}

        for activity in data:
            activity_old = activities_old.pop(activity["initial_id"], None)

            # Prepare data for comparison
            delete_fields(activity, ["id", "is_updated"])
            if activity_old:
                delete_fields(activity_old, ["id", "is_updated"])
                for value in activity.get("values", []) + activity_old.get(
                    "values", []
                ):
                    delete_fields(value, ["id"])

            # And now actually compare
            if activity == activity_old:
                # Only display newly-added or changed activities
                continue
            copy_fields(activity, activity_old, fields)
            activity["change_type"] = "changed" if activity_old else "new"

            # Also copy nested values
            old_activity_values = activity_old.get("values", []) if activity_old else []
            values_old = {
                (str(value["year"]), value["is_after"]): value
                for value in old_activity_values
            }
            for value in activity.get("values", []):
                value_old = values_old.pop(
                    (str(value["year"]), value["is_after"]), None
                )
                copy_fields(value, value_old, values_fields)

            diff_data.append(activity)

        for activity in activities_old.values():
            rename_fields(activity, fields)
            for value in activity.get("values", []):
                rename_fields(value, values_fields)
            activity["change_type"] = "deleted"
            diff_data.append(activity)

        return diff_data

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "business_plan_id",
                openapi.IN_QUERY,
                type=openapi.TYPE_INTEGER,
            ),
            openapi.Parameter(
                "agency_id",
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
                "version",
                openapi.IN_QUERY,
                type=openapi.TYPE_INTEGER,
            ),
        ],
    )
    def get(self, request, *args, **kwargs):
        business_plan = get_business_plan_from_request(request)
        # We are diff-ing with the previous version by default
        business_plan_ar = get_object_or_404(
            BusinessPlan,
            version=business_plan.version - 1,
            agency_id=business_plan.agency_id,
            year_start=business_plan.year_start,
            year_end=business_plan.year_end,
        )

        fields = BPActivityDetailSerializer.Meta.fields.copy()
        for field in ("id", "initial_id", "is_updated", "values"):
            fields.remove(field)

        return Response(
            self.diff_activities(
                BPActivityDetailSerializer(
                    business_plan.activities.all(), many=True
                ).data,
                BPActivityDetailSerializer(
                    business_plan_ar.activities.all(), many=True
                ).data,
                fields,
            ),
        )
