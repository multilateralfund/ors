from constance import config
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count
from django.db.models import F
from django.db.models import Window
from django.db.models.functions import RowNumber
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import generics, status, filters
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from core.api.filters.country_programme import (
    CPReportFilter,
)
from core.api.permissions import IsUserAllowedCP, IsUserAllowedCPComment
from core.api.serializers import CPReportGroupSerializer
from core.api.serializers.cp_report import (
    CPReportCreateSerializer,
    CPReportSerializer,
    CPReportCommentsSerializer,
)
from core.models.adm import AdmRecordArchive
from core.models.country_programme import CPHistory, CPReport
from core.models.country_programme_archive import (
    CPEmissionArchive,
    CPGenerationArchive,
    CPPricesArchive,
    CPRecordArchive,
    CPReportArchive,
    CPUsageArchive,
    CPReportSectionsArchive,
)

User = get_user_model()

# pylint: disable=R0901


class CPReportView(generics.ListCreateAPIView, generics.UpdateAPIView):
    """
    API endpoint that allows country programmes to be viewed or created.
    """

    permission_classes = [IsUserAllowedCP]
    filterset_class = CPReportFilter
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
    ]
    lookup_field = "id"
    ordering_fields = ["year", "country__name"]

    def get_queryset(self):
        user = self.request.user
        cp_reports = CPReport.objects.all()
        if user.user_type == user.UserType.COUNTRY_USER:
            cp_reports = cp_reports.filter(country=user.country)

        if self.request.method == "PUT":
            return cp_reports.select_for_update()
        return cp_reports.select_related("country").order_by("name")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CPReportCreateSerializer
        return CPReportSerializer

    def create(self, request, *args, **kwargs):
        # check if the cp_record already exists
        cp_report = CPReport.objects.filter(
            country_id=request.data.get("country_id"),
            year=request.data.get("year"),
        ).first()
        if cp_report:
            return Response(
                {
                    "general_error": "A report for this country and this year already exists"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = CPReportCreateSerializer(
            data=request.data, context={"user": request.user}
        )

        if serializer.is_valid():
            self.perform_create(serializer)

            headers = self.get_success_headers(serializer.data)
            return Response(
                serializer.data, status=status.HTTP_201_CREATED, headers=headers
            )

        custom_errors = self.customize_errors(serializer.errors)
        return Response(custom_errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_description="year < 2019 => required: section_a, adm_b, section_c, adm_c, adm_d\n"
        "year >= 2019 => required: section_a, section_b, section_c, section_d, section_e, section_f",
        request_body=CPReportCreateSerializer,
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

    def customize_errors(self, error_dict):
        """
        Customize errors for country programme report create

        @param error_dict: dict of errors
        e.g. {
            'section_a': [
                {'row_id': ErrorDetail(string='substance_999', code='invalid'),
                'errors': {'substance_id': [ErrorDetail(string='Invalid pk "999" - object does not exist.',
                            code='does_not_exist')]}},
                {'row_id': ErrorDetail(string='subst_1', code='invalid'),
                 'errors': {
                    'record_usages': [{
                        'row_id': ErrorDetail(string='usage_999', code='invalid'),
                        'errors': {'usage_id': [ErrorDetail(string='Invalid pk "999" - object does not exist.',
                                    code='does_not_exist')]}}, {}]}},
                {}
            ],
        }

        @return: dict of custom errors
        e.g. {
            'section_a': {
                'substance_999': {'substance_id': 'Invalid pk "999" - object does not exist.'},
                'subst_1': {
                    'record_usages': {
                        'usage_999': {'usage_id': 'Invalid pk "999" - object does not exist.'}
                    }
                },
            }

        """
        custom_errors = {}
        for section, section_errors in error_dict.items():
            if (
                not "adm" in section
                and not "section" in section
                and not "record_usages" in section
            ):
                # this is a general error
                custom_errors[section] = section_errors
                continue

            cust_scetion_err = {}
            for errors in section_errors:
                if not errors:
                    # skip empty errors
                    continue

                if "row_id" not in errors or errors["row_id"] == "general_error":
                    cust_scetion_err["general_error"] = (
                        errors["errors"] if errors.get("errors") else errors
                    )
                    continue

                row_id = errors["row_id"]
                # check if there is an error for the entire row
                if "row_id" in errors["errors"]:
                    cust_scetion_err[row_id] = errors["errors"]["row_id"][0]
                    continue

                # initialize the cust_scetion_err
                if row_id not in cust_scetion_err:
                    if errors.get("column_id"):
                        # this is an adm record
                        cust_scetion_err[row_id] = {
                            "values": {},
                        }
                    else:
                        cust_scetion_err[row_id] = {}

                if errors["errors"].get("record_usages"):
                    # check if there is an error for record_usages
                    cust_scetion_err[row_id] = self.customize_errors(errors["errors"])
                    continue
                if errors.get("column_id"):
                    # this is an adm record
                    cust_scetion_err[row_id]["values"][errors["column_id"]] = errors[
                        "errors"
                    ]

                for error_key, error_value in errors["errors"].items():
                    # ('substance_id', [ErrorDetail(string='Invalid pk "999" - object does not exist.',
                    # code='does_not_exist')])
                    cust_scetion_err[row_id][error_key] = error_value[0]

            custom_errors[section] = cust_scetion_err

        return custom_errors

    def _get_archive_data(self, cls, instance, args=None):
        """
        Get archive data for an instance of a model
          - delete unnecessary fields (id, _state)
          - add additional data from args

        @param cls: class of the model
        @param instance: instance of the model
        @param args: dict of additional data

        @return: instance of the model
        """
        data = instance.__dict__.copy()
        for key in ["_state", "id"]:
            data.pop(key)

        if args:
            data.update(args)
        return cls(**data)

    def _archive_cp_report(self, instance):
        """
        Archive country programme report

        @param instance: CPReport object
        @param new_instance: CPReport object
        """
        # archive cp_report
        cp_report_ar = self._get_archive_data(CPReportArchive, instance)
        cp_report_ar.save()

        # archive cp_records and cp_usages
        cp_usages = []
        for cp_record in instance.cprecords.all():
            cp_record_ar = self._get_archive_data(
                CPRecordArchive,
                cp_record,
                {"country_programme_report_id": cp_report_ar.id},
            )
            cp_record_ar.save()
            for cp_usage in cp_record.record_usages.all():
                cp_usages.append(
                    self._get_archive_data(
                        CPUsageArchive,
                        cp_usage,
                        {"country_programme_record_id": cp_record_ar.id},
                    )
                )
        CPUsageArchive.objects.bulk_create(cp_usages, batch_size=1000)

        # archive cp_prices
        cp_prices = []
        for cp_price in instance.prices.all():
            cp_prices.append(
                self._get_archive_data(
                    CPPricesArchive,
                    cp_price,
                    {"country_programme_report_id": cp_report_ar.id},
                )
            )
        CPPricesArchive.objects.bulk_create(cp_prices, batch_size=1000)

        # archive cp_generation
        cp_generation = []
        for cp_gen in instance.cpgenerations.all():
            cp_generation.append(
                self._get_archive_data(
                    CPGenerationArchive,
                    cp_gen,
                    {"country_programme_report_id": cp_report_ar.id},
                )
            )
        CPGenerationArchive.objects.bulk_create(cp_generation, batch_size=1000)

        # archive cp_emission
        cp_emission = []
        for cp_em in instance.cpemissions.all():
            cp_emission.append(
                self._get_archive_data(
                    CPEmissionArchive,
                    cp_em,
                    {"country_programme_report_id": cp_report_ar.id},
                )
            )
        CPEmissionArchive.objects.bulk_create(cp_emission, batch_size=1000)

        # archive adm records
        adm_records = []
        for adm_record in instance.adm_records.all():
            adm_records.append(
                self._get_archive_data(
                    AdmRecordArchive,
                    adm_record,
                    {"country_programme_report_id": cp_report_ar.id},
                )
            )
        AdmRecordArchive.objects.bulk_create(adm_records, batch_size=1000)

        # archive cp reported sections
        if hasattr(instance, "cpreportedsections"):
            cp_reported_sections = self._get_archive_data(
                CPReportSectionsArchive,
                instance.cpreportedsections,
                {"country_programme_report_id":  cp_report_ar.id}
            )
            cp_reported_sections.save()

    def check_readonly_fields(self, serializer, current_obj):
        return (
            serializer.initial_data["country_id"] != current_obj.country_id
            or serializer.initial_data["year"] != current_obj.year
        )

    @transaction.atomic
    def put(self, request, *args, **kwargs):
        current_obj = self.get_object()

        # set event description
        event_description = request.data.get("event_description", "Updated by user")

        serializer = CPReportCreateSerializer(
            data=request.data,
            context={
                "user": request.user,
                "event_description": event_description,
                "report_version": current_obj.version,
            },
        )
        if not serializer.is_valid() or self.check_readonly_fields(
            serializer, current_obj
        ):
            custom_errors = self.customize_errors(serializer.errors)
            return Response(custom_errors, status=status.HTTP_400_BAD_REQUEST)

        self.perform_create(serializer)
        # update version number
        new_instance = serializer.instance

        # make sure that the final status can be set only once
        if current_obj.status == CPReport.CPReportStatus.FINAL:
            new_instance.status = CPReport.CPReportStatus.FINAL

        # increment version number if the status is FINAL
        new_instance.version = current_obj.version + int(
            new_instance.status == CPReport.CPReportStatus.FINAL
        )

        # set created_by to the current object created_by
        new_instance.created_by = current_obj.created_by
        new_instance.save()

        if new_instance.status == CPReport.CPReportStatus.FINAL:
            self._archive_cp_report(current_obj)

        # inherit all history
        CPHistory.objects.filter(
            country_programme_report=current_obj
        ).update(
            country_programme_report=new_instance
        )

        current_obj.delete()

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_200_OK, headers=headers)


class CPReportStatusUpdateView(generics.GenericAPIView):
    """
    API endpoint that allows updating country programme report status.
    """

    permission_classes = [IsUserAllowedCP]
    serializer_class = CPReportSerializer
    lookup_field = "id"

    def get_queryset(self):
        user = self.request.user
        queryset = CPReport.objects.all()
        if user.user_type == user.UserType.COUNTRY_USER:
            queryset = queryset.filter(country=user.country)
        return queryset

    @swagger_auto_schema(
        operation_description="Update country programme report status",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "status": openapi.Schema(
                    type=openapi.TYPE_STRING,
                    enum=CPReport.CPReportStatus.choices,
                )
            },
        ),
    )
    def put(self, request, *args, **kwargs):
        cp_report = self.get_object()
        cp_status = request.data.get("status")
        if cp_status not in CPReport.CPReportStatus.values:
            return Response(
                {"status": f"Invalid value {cp_status}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cp_report.status = cp_status
        cp_report.save()
        CPHistory.objects.create(
            country_programme_report=cp_report,
            updated_by=request.user,
            event_description="Status updated by user",
        )
        serializer = self.get_serializer(cp_report)

        return Response(serializer.data)


class CPReportGroupByYearView(generics.ListAPIView):
    """
    API endpoint that allows listing country programme reports grouped.
    """

    permission_classes = [IsUserAllowedCP]
    serializer_class = CPReportGroupSerializer
    group_by = "year"
    group_pk = "year"
    order_by = "country__name"

    @property
    def order_field(self):
        direction = self.request.query_params.get("ordering", "asc").lower()
        if direction not in ("asc", "desc"):
            raise ValidationError({"ordering": f"Invalid value: {direction}"})

        if direction == "asc":
            return self.group_by
        return "-" + self.group_by

    def get_queryset(self):
        user = self.request.user
        queryset = CPReport.objects.all()
        if user.user_type == user.UserType.COUNTRY_USER:
            queryset = queryset.filter(country=user.country)
        return queryset

    @staticmethod
    def get_group(obj):
        return obj.year

    @staticmethod
    def get_id(obj):
        return obj.year

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                "ordering",
                openapi.IN_QUERY,
                description="Order results in ascending or descending order",
                default="asc",
                type=openapi.TYPE_STRING,
                enum=["asc", "desc"],
            ),
        ],
    )
    def list(self, request, *args, **kwargs):
        totals = dict(
            CPReport.objects.values_list(self.group_pk).annotate(count=Count(1))
        )

        # Only paginate the query based on unique Group IDs
        queryset = self.filter_queryset(self.get_queryset())
        page_queryset = (
            queryset.values_list(self.group_by, flat=True)
            .distinct()
            .order_by(self.order_field)
        )
        page = self.paginate_queryset(page_queryset)

        queryset = (
            queryset.annotate(
                row_number=Window(
                    expression=RowNumber(),
                    partition_by=[F(self.group_by)],
                    order_by=self.order_by,
                ),
            )
            .filter(
                **{
                    # Filter results base on the group and the MAX number of
                    # reports to display.
                    f"{self.group_by}__in": (page or page_queryset),
                    "row_number__lte": config.CP_NR_REPORTS,
                }
            )
            .order_by(self.order_field, self.order_by)
        )

        # Data is already sorted in the correct order, and the dictionary will
        # preserve the order.
        # Create the final response by grouping the data.
        grouped_data = {}
        for obj in queryset:
            pk = self.get_id(obj)
            if pk not in grouped_data:
                grouped_data[pk] = {
                    "id": pk,
                    "count": totals[pk],
                    "group": self.get_group(obj),
                    "reports": [],
                }
            grouped_data[pk]["reports"].append(obj)

        serializer = self.get_serializer(grouped_data.values(), many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)


class CPReportGroupByCountryView(CPReportGroupByYearView):
    group_by = "country__name"
    group_pk = "country__id"
    order_by = "-year"

    @staticmethod
    def get_group(obj):
        return obj.country.name

    @staticmethod
    def get_id(obj):
        return obj.country.id


class CPReportCommentsView(generics.GenericAPIView):
    """
    API endpoint that allows updating country programme comments.

    This is called with either POST or PUT on an already-existing CP Report.
    """

    permission_classes = [IsUserAllowedCPComment]
    serializer_class = CPReportCommentsSerializer
    lookup_field = "id"

    def get_queryset(self):
        user = self.request.user
        queryset = CPReport.objects.all()
        if user.user_type == user.UserType.COUNTRY_USER:
            queryset = queryset.filter(country=user.country)
        return queryset

    @swagger_auto_schema(
        operation_description="Update country programme report comments",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=[],
            properties={
                "comment_country": openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="Comment made by country",
                ),
                "comment_secretariat": openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="Comment made by secretariat",
                ),
            },
        ),
    )
    def _get_object(self, filter_kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        obj = get_object_or_404(queryset, **filter_kwargs)

        # May raise a permission denied
        self.check_object_permissions(self.request, obj)

        return obj

    def get(self, request, *args, **kwargs):
        cp_report = self._get_object(kwargs)
        serializer = self.get_serializer(cp_report)

        return Response(serializer.data, status=status.HTTP_200_OK)

    def _comments_update_or_create(self, request, *args, **kwargs):
        cp_report = self.get_object()
        comment_country = request.data.get("comment_country")
        comment_secretariat = request.data.get("comment_secretariat")

        user_type = request.user.user_type
        if comment_country:
            if user_type != User.UserType.COUNTRY_USER:
                return Response(
                    {"comment_country": f"Invalid value {comment_country}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            cp_report.comment_country = comment_country

        if comment_secretariat:
            if user_type != User.UserType.SECRETARIAT:
                return Response(
                    {"comment_secretariat": f"Invalid value {comment_secretariat}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            cp_report.comment_secretariat = comment_secretariat

        cp_report.save()
        CPHistory.objects.create(
            country_programme_report=cp_report,
            updated_by=request.user,
            event_description="Comments updated by user",
        )
        serializer = self.get_serializer(cp_report)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def post(self, request, *args, **kwargs):
        return self._comments_update_or_create(request, *args, **kwargs)

    def put(self, request, *args, **kwargs):
        return self._comments_update_or_create(request, *args, **kwargs)
