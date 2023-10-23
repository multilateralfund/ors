from constance import config
from django.db.models import Count
from django.db.models import F
from django.db.models import Window
from django.db.models.functions import RowNumber
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import generics, status, filters
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from core.api.filters.country_programme import (
    CPReportFilter,
)
from core.api.serializers import CPReportGroupSerializer
from core.api.serializers.cp_report import CPReportCreateSerializer, CPReportSerializer
from core.models.country_programme import CPReport


class CPReportView(generics.ListAPIView, generics.CreateAPIView):
    """
    API endpoint that allows country programmes to be viewed or created.
    """

    queryset = CPReport.objects.select_related("country").order_by("name")
    filterset_class = CPReportFilter
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
    ]
    ordering_fields = ["year", "country__name"]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CPReportCreateSerializer
        return CPReportSerializer

    @swagger_auto_schema(
        operation_description="year < 2019 => required: section_a, adm_b, section_c, adm_c, adm_d\n"
        "year >= 2019 => required: section_a, section_b, section_c, section_d, section_e, section_f",
        request_body=CPReportCreateSerializer,
    )
    def post(self, request, *args, **kwargs):
        serializer = CPReportCreateSerializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(
                serializer.data, status=status.HTTP_201_CREATED, headers=headers
            )

        custom_errors = self.customize_errors(serializer.errors)
        return Response(custom_errors, status=status.HTTP_400_BAD_REQUEST)

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
            if "adm" in section:
                # we do not need to customize adm errors
                custom_errors[section] = section_errors
                continue

            cust_scetion_err = {}
            for errors in section_errors:
                if not errors:
                    # skip empty errors
                    continue

                if "row_id" not in errors or errors["row_id"] == "general_error":
                    cust_scetion_err["general_error"] = errors
                    continue

                row_id = errors["row_id"]

                cust_scetion_err[row_id] = {}
                if errors["errors"].get("record_usages"):
                    # check if there is an error for record_usages
                    cust_scetion_err[row_id] = self.customize_errors(errors["errors"])
                    continue
                for error_key, error_value in errors["errors"].items():
                    # ('substance_id', [ErrorDetail(string='Invalid pk "999" - object does not exist.',
                    # code='does_not_exist')])
                    cust_scetion_err[row_id][error_key] = error_value[0]

            custom_errors[section] = cust_scetion_err

        return custom_errors


class CPReportGroupByYearView(generics.ListAPIView):
    """
    API endpoint that allows listing country programme reports grouped.
    """

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
        return (
            CPReport.objects.values_list(self.group_by, flat=True)
            .distinct()
            .order_by(self.order_field)
        )

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
        page = self.paginate_queryset(queryset)

        queryset = (
            CPReport.objects.annotate(
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
                    f"{self.group_by}__in": (page or queryset),
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
    order_by = "year"

    @staticmethod
    def get_group(obj):
        return obj.country.name

    @staticmethod
    def get_id(obj):
        return obj.country.id
