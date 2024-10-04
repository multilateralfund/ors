from constance import config
from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied
from django.db import transaction
from django.db.models import Count, F, Window
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
from core.api.permissions import (
    IsCountryUser,
    IsSecretariat,
    IsViewer,
)
from core.api.serializers import CPReportGroupSerializer
from core.api.serializers.cp_comment import CPCommentSerializer
from core.api.serializers.cp_report import (
    CPReportCreateSerializer,
    CPReportListSerializer,
    CPReportNoRelatedSerializer,
    CPReportSerializer,
)
from core.model_views.cp_report import FinalReportsView
from core.models.adm import AdmRecord, AdmRecordArchive
from core.models.country_programme import (
    CPComment,
    CPEmission,
    CPGeneration,
    CPHistory,
    CPPrices,
    CPRecord,
    CPReport,
    CPReportSections,
    CPUsage,
)
from core.models.country_programme_archive import (
    CPCommentArchive,
    CPEmissionArchive,
    CPGenerationArchive,
    CPPricesArchive,
    CPRecordArchive,
    CPReportArchive,
    CPUsageArchive,
    CPReportSectionsArchive,
)
from core.tasks import send_mail_comment_submit, send_mail_report_update

User = get_user_model()

# pylint: disable=R0901


class BaseCPReportListView(generics.ListAPIView):
    permission_classes = [IsSecretariat | IsCountryUser | IsViewer]
    filterset_class = CPReportFilter
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
    ]
    serializer_class = CPReportListSerializer

    def get_queryset(self):
        user = self.request.user

        if self.request.query_params.get("status") == CPReport.CPReportStatus.FINAL:
            cp_reports = FinalReportsView.objects
        else:
            cp_reports = CPReport.objects

        # filter by country for country users
        if user.user_type in (
            user.UserType.COUNTRY_USER,
            user.UserType.COUNTRY_SUBMITTER,
        ):
            cp_reports = cp_reports.filter(country=user.country)

        return cp_reports.filter(country__is_a2=False).select_related(
            "country", "created_by", "version_created_by"
        )


class CPReportView(
    BaseCPReportListView,
    generics.CreateAPIView,
    generics.UpdateAPIView,
    generics.DestroyAPIView,
):
    """
    API endpoint that allows country programmes reports to be created, updated and deleted.
    """

    lookup_field = "id"
    ordering_fields = ["created_at", "year", "country__name"]

    def get_queryset(self):
        if self.request.method == "PUT":
            user = self.request.user
            cp_reports = CPReport.objects.filter(country__is_a2=False)
            if user.user_type in (
                user.UserType.COUNTRY_USER,
                user.UserType.COUNTRY_SUBMITTER,
            ):
                cp_reports = cp_reports.filter(country=user.country)

            return cp_reports.select_for_update()
        return super().get_queryset()

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CPReportCreateSerializer
        if self.request.method in ["PUT", "DELETE"]:
            return CPReportNoRelatedSerializer
        # "GET":
        return CPReportListSerializer

    def get_permissions(self):
        # only secretariat can delete reports
        if self.request.method == "DELETE":
            return [IsSecretariat()]

        return super().get_permissions()

    @transaction.atomic
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

        vald_perm_inst = CPReport(
            country_id=request.data.get("country_id"), year=request.data.get("year")
        )
        self.check_object_permissions(request, vald_perm_inst)

        # Only COUNTRY_SUBMITTER users can finalize versions
        # All other user types and unsafe method permissions are checked via permission
        # classes.
        if (
            request.data.get("status") == CPReport.CPReportStatus.FINAL
            and request.user.user_type == User.UserType.COUNTRY_USER
        ):
            raise PermissionDenied(
                "Only Secretariat and Country Submitters can submit final versions"
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
                or section.startswith("comments_")
            ):
                # this is a general error
                custom_errors[section] = section_errors
                continue

            cust_section_err = {}
            for errors in section_errors:
                if not errors:
                    # skip empty errors
                    continue

                if "row_id" not in errors or errors["row_id"] == "general_error":
                    cust_section_err["general_error"] = (
                        errors["errors"] if errors.get("errors") else errors
                    )
                    continue

                row_id = errors["row_id"]
                # check if there is an error for the entire row
                if "row_id" in errors["errors"]:
                    cust_section_err[row_id] = errors["errors"]["row_id"][0]
                    continue

                # initialize the cust_scetion_err
                if row_id not in cust_section_err:
                    if errors.get("column_id"):
                        # this is an adm record
                        cust_section_err[row_id] = {
                            "values": {},
                        }
                    else:
                        cust_section_err[row_id] = {}

                if errors["errors"].get("record_usages"):
                    # check if there is an error for record_usages
                    cust_section_err[row_id] = self.customize_errors(errors["errors"])
                    continue
                if errors.get("column_id"):
                    # this is an adm record
                    cust_section_err[row_id]["values"][errors["column_id"]] = errors[
                        "errors"
                    ]

                for error_key, error_value in errors["errors"].items():
                    # ('substance_id', [ErrorDetail(string='Invalid pk "999" - object does not exist.',
                    # code='does_not_exist')])
                    cust_section_err[row_id][error_key] = error_value[0]

            custom_errors[section] = cust_section_err

        return custom_errors

    def _get_data_from_object(self, cls, instance, args=None):
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

    def _clone_report(
        self,
        instance,
        cls_dict,
    ):
        """
        Archive country programme report

        @param instance: CPReport object
        @param new_instance: CPReport object
        """
        # clone cp_report
        cp_report_clone = self._get_data_from_object(cls_dict["report_cls"], instance)
        cp_report_clone.save()
        # Make sure cloned versions keep the `created_at` of the original instance
        cp_report_clone.created_at = instance.created_at
        cp_report_clone.save(update_fields=["created_at"])

        # clone cp_records and cp_usages
        cp_usages = []
        for cp_record in instance.cprecords.all():
            cp_record_ar = self._get_data_from_object(
                cls_dict["record_cls"],
                cp_record,
                {"country_programme_report_id": cp_report_clone.id},
            )
            cp_record_ar.save()
            for cp_usage in cp_record.record_usages.all():
                cp_usages.append(
                    self._get_data_from_object(
                        cls_dict["usage_cls"],
                        cp_usage,
                        {"country_programme_record_id": cp_record_ar.id},
                    )
                )
        cls_dict["usage_cls"].objects.bulk_create(cp_usages, batch_size=1000)

        # clone cp_prices
        cp_prices = []
        for cp_price in instance.prices.all():
            cp_prices.append(
                self._get_data_from_object(
                    cls_dict["price_cls"],
                    cp_price,
                    {"country_programme_report_id": cp_report_clone.id},
                )
            )
        cls_dict["price_cls"].objects.bulk_create(cp_prices, batch_size=1000)

        # clone cp_generation
        cp_generation = []
        for cp_gen in instance.cpgenerations.all():
            cp_generation.append(
                self._get_data_from_object(
                    cls_dict["generation_cls"],
                    cp_gen,
                    {"country_programme_report_id": cp_report_clone.id},
                )
            )
        cls_dict["generation_cls"].objects.bulk_create(cp_generation, batch_size=1000)

        # clone cp_emission
        cp_emission = []
        for cp_em in instance.cpemissions.all():
            cp_emission.append(
                self._get_data_from_object(
                    cls_dict["emission_cls"],
                    cp_em,
                    {"country_programme_report_id": cp_report_clone.id},
                )
            )
        cls_dict["emission_cls"].objects.bulk_create(cp_emission, batch_size=1000)

        # clone adm records
        adm_records = []
        for adm_record in instance.adm_records.all():
            adm_records.append(
                self._get_data_from_object(
                    cls_dict["adm_record_cls"],
                    adm_record,
                    {"country_programme_report_id": cp_report_clone.id},
                )
            )
        cls_dict["adm_record_cls"].objects.bulk_create(adm_records, batch_size=1000)

        # clone cp reported sections
        if hasattr(instance, "cpreportedsections"):
            cp_reported_sections = self._get_data_from_object(
                cls_dict["section_cls"],
                instance.cpreportedsections,
                {"country_programme_report_id": cp_report_clone.id},
            )
            cp_reported_sections.save()

        # clone cp comments
        cp_comments = []
        for cp_comment in instance.cpcomments.all():
            cp_comments.append(
                self._get_data_from_object(
                    cls_dict["comment_cls"],
                    cp_comment,
                    {"country_programme_report_id": cp_report_clone.id},
                )
            )
        cls_dict["comment_cls"].objects.bulk_create(cp_comments, batch_size=1000)

        return cp_report_clone

    def check_readonly_fields(self, serializer, current_obj):
        return (
            serializer.initial_data["country_id"] != current_obj.country_id
            or serializer.initial_data["year"] != current_obj.year
        )

    @transaction.atomic
    def put(self, request, *args, **kwargs):
        # Only COUNTRY_SUBMITTER users can finalize versions
        # All other user types and unsafe method permissions are checked via permission
        # classes.
        if (
            request.data["status"] == CPReport.CPReportStatus.FINAL
            and request.user.user_type == User.UserType.COUNTRY_USER
        ):
            raise PermissionDenied(
                "Only Secretariat and Country Submitters can submit final versions"
            )

        current_obj = self.get_object()

        serializer = CPReportCreateSerializer(
            data=request.data,
            context={
                "user": request.user,
                "from_update": True,
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

        # increment version number if the status is FINAL
        new_instance.version = current_obj.version + int(
            current_obj.status == CPReport.CPReportStatus.FINAL
        )

        # set created_by to the current object created_by
        new_instance.created_by = current_obj.created_by
        new_instance.version_created_by = request.user
        new_instance.save()

        # archive versions only for FINAL reports
        if current_obj.status == CPReport.CPReportStatus.FINAL:
            self._clone_report(
                current_obj,
                {
                    "report_cls": CPReportArchive,
                    "record_cls": CPRecordArchive,
                    "usage_cls": CPUsageArchive,
                    "price_cls": CPPricesArchive,
                    "generation_cls": CPGenerationArchive,
                    "emission_cls": CPEmissionArchive,
                    "adm_record_cls": AdmRecordArchive,
                    "section_cls": CPReportSectionsArchive,
                    "comment_cls": CPCommentArchive,
                },
            )

        # inherit all history
        CPHistory.objects.filter(country_programme_report=current_obj).update(
            country_programme_report=new_instance
        )
        event_descrs = ["Updated by user"]

        # check if the status was changed
        if current_obj.status != new_instance.status:
            event_descrs.append(
                f"Status changed from {current_obj.status} to {new_instance.status}"
            )

        # create new history for update event
        history = []
        for event_desc in event_descrs:
            history.append(
                CPHistory(
                    country_programme_report=new_instance,
                    report_version=new_instance.version,
                    updated_by=request.user,
                    reporting_officer_name=new_instance.reporting_entry,
                    reporting_officer_email=new_instance.reporting_email,
                    event_description=event_desc,
                    event_in_draft=(
                        new_instance.status != CPReport.CPReportStatus.FINAL
                    ),
                )
            )
        CPHistory.objects.bulk_create(history)

        current_obj.delete()

        if config.SEND_MAIL and new_instance.status == CPReport.CPReportStatus.FINAL:
            send_mail_report_update.delay(new_instance.id)  # send mail to MLFS

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_200_OK, headers=headers)

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        if instance.status != CPReport.CPReportStatus.DRAFT:
            return Response(
                {"status": "Only draft reports can be reverted"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        prev_version = (
            CPReportArchive.objects.filter(
                country_id=instance.country_id, year=instance.year
            )
            .order_by("-version")
            .first()
        )

        if not prev_version:
            return Response(
                {"status": "Could not find previous final version"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # recreate the previous version
        new_instance = self._clone_report(
            prev_version,
            {
                "report_cls": CPReport,
                "record_cls": CPRecord,
                "usage_cls": CPUsage,
                "price_cls": CPPrices,
                "generation_cls": CPGeneration,
                "emission_cls": CPEmission,
                "adm_record_cls": AdmRecord,
                "section_cls": CPReportSections,
                "comment_cls": CPComment,
            },
        )

        # inherit all history
        CPHistory.objects.filter(country_programme_report_id=instance.id).update(
            country_programme_report_id=new_instance.id
        )

        # create new history for revert event
        CPHistory.objects.create(
            country_programme_report=new_instance,
            report_version=new_instance.version,
            updated_by=request.user,
            reporting_officer_name=new_instance.reporting_entry,
            reporting_officer_email=new_instance.reporting_email,
            event_description="Reverted to previous final version "
            f"(from {instance.version} to {new_instance.version})",
            event_in_draft=(new_instance.status != CPReport.CPReportStatus.FINAL),
        )

        # delete the current draft and previous final version from the archive
        self.perform_destroy(instance)
        self.perform_destroy(prev_version)

        serializer = self.get_serializer(new_instance)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        operation_description="""Revert country programme report curent draft
        to the previous final version. \n
        Only the secretariat user can delete the curent draft
        """,
    )
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)


class CPReportStatusUpdateView(generics.GenericAPIView):
    """
    API endpoint that allows updating country programme report status.
    """

    permission_classes = [IsSecretariat | IsCountryUser]
    serializer_class = CPReportSerializer
    lookup_field = "id"

    def get_queryset(self):
        user = self.request.user
        queryset = CPReport.objects.all()
        if user.user_type in (
            user.UserType.COUNTRY_USER,
            user.UserType.COUNTRY_SUBMITTER,
        ):
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
        # Only COUNTRY_SUBMITTER users can finalize versions
        # All other user types and unsafe method permissions are checked via permission
        # classes.
        if (
            cp_status == CPReport.CPReportStatus.FINAL
            and request.user.user_type == User.UserType.COUNTRY_USER
        ):
            raise PermissionDenied(
                "Only Secretariat and Country Submitters can submit final versions"
            )

        initial_value = cp_report.status
        cp_report.status = cp_status
        cp_report.save()
        CPHistory.objects.create(
            country_programme_report=cp_report,
            report_version=cp_report.version,
            updated_by=request.user,
            reporting_officer_name=cp_report.reporting_entry,
            reporting_officer_email=cp_report.reporting_email,
            event_description=f"Status updated from {initial_value} to {cp_status}",
            event_in_draft=(cp_status != CPReport.CPReportStatus.FINAL),
        )
        serializer = self.get_serializer(cp_report)

        return Response(serializer.data)


class CPReportGroupByYearView(BaseCPReportListView):
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

        show_all_per_group = request.query_params.get("show_all_per_group", False)
        # Filter results base on the group and, if specified,
        # by the MAX number of reports to display.
        filter_params = {
            f"{self.group_by}__in": (page or page_queryset),
        }
        if not show_all_per_group:
            filter_params |= {
                "row_number__lte": config.CP_NR_REPORTS,
            }

        queryset = (
            queryset.select_related("country", "created_by", "version_created_by")
            .annotate(
                row_number=Window(
                    expression=RowNumber(),
                    partition_by=[F(self.group_by)],
                    order_by=self.order_by,
                ),
            )
            .filter(**filter_params)
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

    filterset_class = CPReportFilter

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

    permission_classes = [IsSecretariat | IsCountryUser]
    serializer_class = CPCommentSerializer
    lookup_field = "id"
    queryset = CPReport.objects.all()

    def _get_report(self, filter_kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        obj = get_object_or_404(queryset, **filter_kwargs)

        # May raise a permission denied
        self.check_object_permissions(self.request, obj)

        return obj

    @swagger_auto_schema(
        operation_description="Update country programme report comments",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=[],
            properties={
                "section": openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="Comment section",
                ),
                "comment_type": openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="comment_country or comment_secretariat",
                ),
                "comment": openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="Comment text",
                ),
            },
        ),
    )
    def _comments_update_or_create(self, request, *args, **kwargs):
        cp_report = self._get_report(kwargs)
        section = request.data.get("section")
        comment_type = request.data.get("comment_type")
        comment = request.data.get("comment", "")
        user_type = request.user.user_type

        if section not in CPComment.CPCommentSection:
            return Response(
                {"comment": "No valid comment section provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if comment_type == CPComment.CPCommentType.COMMENT_COUNTRY:
            if user_type not in (
                User.UserType.COUNTRY_USER,
                User.UserType.COUNTRY_SUBMITTER,
            ):
                return Response(
                    {"comment": f"Invalid value {comment}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if comment_type == CPComment.CPCommentType.COMMENT_SECRETARIAT:
            if user_type != User.UserType.SECRETARIAT:
                return Response(
                    {"comment": f"Invalid value {comment}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        cp_comment, _ = CPComment.objects.update_or_create(
            country_programme_report=cp_report,
            section=section,
            comment_type=comment_type,
            defaults={"comment": comment},
        )

        CPHistory.objects.create(
            country_programme_report=cp_report,
            report_version=cp_report.version,
            updated_by=request.user,
            reporting_officer_name=cp_report.reporting_entry,
            reporting_officer_email=cp_report.reporting_email,
            event_description=(
                f"Comments updated by user ({CPComment.CPCommentSection(section).label})"
            ),
            event_in_draft=(cp_report.status != CPReport.CPReportStatus.FINAL),
        )
        serializer = self.get_serializer(cp_comment)

        if config.SEND_MAIL:
            # send mail to country or MLFS
            send_mail_comment_submit.delay(cp_comment.id)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def post(self, request, *args, **kwargs):
        return self._comments_update_or_create(request, *args, **kwargs)

    def put(self, request, *args, **kwargs):
        return self._comments_update_or_create(request, *args, **kwargs)
