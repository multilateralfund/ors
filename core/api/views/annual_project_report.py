import os
from zipfile import ZipFile

from constance import config
from django.db import transaction, models
from django.db.models import Prefetch
from django.http import Http404, HttpResponse, FileResponse
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.generics import RetrieveAPIView, DestroyAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet

from core.api.export.annual_project_report import (
    APRExportWriter,
    APRSummaryTablesExportWriter,
)
from core.api.filters.annual_project_reports import (
    APRProjectFilter,
    APRGlobalFilter,
    build_filtered_project_reports_queryset,
)
from core.api.permissions import (
    HasAPRViewAccess,
    HasAPREditAccess,
    HasAPRSubmitAccess,
    HasAPRMLFSViewAccess,
    HasAPRMLFSFullAccess,
)
from core.api.serializers.annual_project_report import (
    AnnualProjectReportReadSerializer,
    AnnualAgencyProjectReportReadSerializer,
    AnnualProjectReportBulkUpdateSerializer,
    AnnualProjectReportFileSerializer,
    AnnualProjectReportFileUploadSerializer,
    AnnualAgencyProjectReportStatusUpdateSerializer,
    AnnualProgressReportSerializer,
    AnnualProgressReportEndorseSerializer,
    AnnualProjectReportMLFSBulkUpdateSerializer,
    AnnualProjectReportKickStartResponseSerializer,
    AnnualProjectReportKickStartStatusSerializer,
)
from core.api.utils import (
    get_latest_endorsed_year,
    get_unendorsed_years,
    get_previous_year_project_reports,
)
from core.models import (
    AnnualProgressReport,
    AnnualAgencyProjectReport,
    AnnualProjectReport,
    AnnualProjectReportFile,
    Project,
    Country,
)
from core.tasks import send_agency_submission_notification


# pylint: disable=C0302


def get_version_3_prefetch():
    """
    Returns a Prefetch object for version 3 of projects.
    Caches results in project.cached_version_3_list attribute.
    """
    return Prefetch(
        "project_reports__project__archive_projects",
        queryset=Project.objects.really_all()
        .filter(version=3)
        .select_related("status", "post_excom_decision__meeting"),
        to_attr="cached_version_3_list",
    )


def get_latest_version_prefetch(year):
    """
    Returns a Prefetch object for the latest project version up to the given year.
    Caches results in project.cached_versions_for_year attribute.
    """
    return Prefetch(
        "project_reports__project__archive_projects",
        queryset=Project.objects.really_all()
        .filter(
            post_excom_decision__isnull=False,
            post_excom_decision__meeting__date__year__lte=year,
        )
        .select_related("status", "post_excom_decision__meeting")
        .order_by("-post_excom_decision__meeting__date", "-version"),
        to_attr="cached_versions_for_year",
    )


def get_all_versions_for_year_prefetch(year):
    """
    Returns a Prefetch object for all project versions during the given year.
    Caches results in project.cached_all_versions_for_year attribute.
    """
    return Prefetch(
        "project_reports__project__archive_projects",
        queryset=Project.objects.really_all()
        .filter(
            models.Q(
                post_excom_decision__isnull=False,
                post_excom_decision__meeting__date__year=year,
            )
            | models.Q(post_excom_decision__isnull=True, version=3)
        )
        .select_related("status"),
        to_attr="cached_all_versions_for_year",
    )


class APRCurrentYearView(APIView):
    """
    Returns the current "active" APR year for the workspace and the list of existing APRs
    (so the UI can switch years).

    If no unendorsed (active reporting) APR exists, returns the latest endorsed.
    """

    permission_classes = [IsAuthenticated, HasAPRViewAccess]

    def get(self, request):
        apr_list = list(
            AnnualProgressReport.objects.order_by("-year").values("year", "endorsed")
        )

        current_year = None
        endorsed = False
        for apr_data in apr_list:
            if not apr_data["endorsed"]:
                current_year = apr_data["year"]
                endorsed = apr_data["endorsed"]
                break

        # If no unendorsed APR exists, use the latest endorsed
        if current_year is None and apr_list:
            current_year = apr_list[0]["year"]
            endorsed = apr_list[0]["endorsed"]

        return Response(
            {
                "current_year": current_year,
                "endorsed": endorsed,
                "apr_list": apr_list,
            }
        )


class APRWorkspaceView(RetrieveAPIView):
    """
    Retrieves APR workspace for a specific year, for the user's agency.
    As a side effect, this initializes the APR process by creating the agency report
    and project reports if these did not already exist.
    """

    permission_classes = [IsAuthenticated, HasAPRViewAccess]
    serializer_class = AnnualAgencyProjectReportReadSerializer
    lookup_field = "year"

    def get_queryset(self):
        user = self.request.user
        year = int(self.kwargs.get("year"))

        queryset = AnnualAgencyProjectReport.objects.select_related(
            "progress_report",
            "agency",
            "created_by",
            "submitted_by",
        ).prefetch_related(
            "project_reports",
            "project_reports__project__meta_project",
            "project_reports__project__agency",
            "project_reports__project__country__parent",
            "project_reports__project__country",
            "project_reports__project__cluster",
            "project_reports__project__sector",
            "project_reports__project__project_type",
            get_version_3_prefetch(),
            get_latest_version_prefetch(year),
            get_all_versions_for_year_prefetch(year),
            "files",
        )

        user = self.request.user
        if not user.is_superuser and not user.has_perm("core.can_view_all_agencies"):
            if hasattr(user, "agency") and user.agency:
                queryset = queryset.filter(agency=user.agency)
            else:
                queryset = queryset.none()
        return queryset

    def get_object(self):
        """
        Get or create the APR workspace for the user's agency.
        """
        user = self.request.user
        agency = user.agency
        if not hasattr(user, "agency") or not user.agency:
            raise ValidationError("User is not associated with any agency.")

        year = int(self.kwargs["year"])

        # Get status filter from query params (defaults are ONG, COM)
        status_codes = self.request.query_params.get("status", "ONG,COM")

        # Check that the annual progress report for the year actually exists
        try:
            progress_report = AnnualProgressReport.objects.get(year=year)
        except AnnualProgressReport.DoesNotExist as exc:
            raise ValidationError(
                f"Reporting for year {year} has not been started yet."
            ) from exc

        # Get or create agency report container
        agency_report, created = AnnualAgencyProjectReport.objects.get_or_create(
            progress_report=progress_report,
            agency=agency,
            defaults={
                "status": AnnualAgencyProjectReport.SubmissionStatus.DRAFT,
                "created_by": user,
            },
        )

        # When creating for the first time, populate individual project reports.
        # We don't need to consider the case of new projects being added after this.
        if created or agency_report.project_reports.count() == 0:
            # Get the previous year reported data (if any)
            previous_reports_dict = get_previous_year_project_reports(agency.id, year)

            # Get *current* projects for this agency, create AnnualProjectReport for each
            projects_queryset = (
                Project.objects.filter(
                    latest_project__isnull=True,
                    version__gte=3,
                )
                .select_related(
                    "country",
                    "agency",
                    "sector",
                    "project_type",
                    "status",
                    "meeting",
                    "decision",
                )
                .prefetch_related(
                    "subsectors",
                    "ods_odp",
                    "ods_odp__ods_substance",
                    "ods_odp__ods_blend",
                )
                .order_by("code")
            )
            filterset = APRProjectFilter(
                data={
                    "year": year,
                    "agency": agency.id,
                    "status": status_codes,
                },
                queryset=projects_queryset,
            )
            projects = filterset.qs

            for project in projects:
                # Check if previously-reported data exists for this project & agency
                key = (project.code, agency.id)
                # If no previous APR exists for this, we default to the project's status
                default_data = {"status": project.status.name}
                previous_data = previous_reports_dict.get(key, default_data)

                project_report, created = AnnualProjectReport.objects.get_or_create(
                    project=project,
                    report=agency_report,
                    defaults=previous_data,
                )
                if created or project_report.meta_code_denorm is None:
                    project_report.populate_derived_fields()
                    project_report.save()

        # Refetch the agency report using the optimized queryset - with prefetches
        return self.get_queryset().get(pk=agency_report.pk)


class APRBulkUpdateView(APIView):
    """
    Bulk update multiple project reports (copy-paste from Excel).
    """

    permission_classes = [IsAuthenticated, HasAPREditAccess]

    def post(self, request, year, agency_id):
        """
        Bulk update project reports for an agency.

        Request body:
        {
            "project_reports": [
                {
                    "project_code": "CPR/FOA/80/INV/01",
                    "funds_disbursed": 1500000,
                    "date_first_disbursement": "2024-01-15",
                    ...
                },
                ...
            ]
        }
        """
        agency_report = get_object_or_404(
            AnnualAgencyProjectReport.objects.select_related(
                "agency", "progress_report"
            ),
            progress_report__year=year,
            agency_id=agency_id,
        )
        self.check_object_permissions(request, agency_report)

        # Check if report is editable in its current state by this user
        if agency_report.is_endorsed():
            raise ValidationError("Cannot edit endorsed reports.")

        user = request.user
        is_mlfs = user.has_perm("core.can_view_all_agencies")
        if not is_mlfs and not agency_report.is_editable_by_agency():
            raise ValidationError(
                f"Cannot update report with status '{agency_report.status}'. "
                "Only DRAFT or unlocked reports can be edited."
            )

        serializer = AnnualProjectReportBulkUpdateSerializer(
            instance=agency_report, data=request.data
        )
        if serializer.is_valid():
            updated_reports, errors = serializer.save()

            response_data = {
                "updated_count": len(updated_reports),
                "error_count": len(errors),
                "message": f"Successfully updated {len(updated_reports)} project report(s).",
            }

            if errors:
                response_data["errors"] = errors

            return Response(response_data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class APRFileUploadView(APIView):
    permission_classes = [IsAuthenticated, HasAPREditAccess]

    def post(self, request, year, agency_id):
        """
        Upload a file to the agency report.
        """
        agency_report = get_object_or_404(
            AnnualAgencyProjectReport, progress_report__year=year, agency_id=agency_id
        )
        self.check_object_permissions(request, agency_report)

        user = request.user
        is_mlfs = user.has_perm("core.can_view_all_agencies")

        if agency_report.is_endorsed():
            raise ValidationError("Cannot upload files to endorsed reports.")

        if not is_mlfs and not agency_report.is_editable_by_agency():
            raise ValidationError(
                f"Cannot upload files to report with status `{agency_report.status}`. "
                "Only DRAFT or unlocked reports can be edited."
            )

        serializer = AnnualProjectReportFileUploadSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            result = serializer.save(report=agency_report)
            created_files_data = AnnualProjectReportFileSerializer(
                result["created_files"], many=True, context={"request": request}
            ).data
            return Response(
                {
                    "message": "Files uploaded successfully.",
                    "files": created_files_data,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class APRFileDownloadView(APIView):
    """
    Download a file from an agency report, taking permissions into account.
    """

    permission_classes = [IsAuthenticated, HasAPRViewAccess]

    def get(self, request, year, agency_id, pk):
        file_obj = get_object_or_404(
            AnnualProjectReportFile.objects.select_related(
                "report", "report__agency", "report__progress_report"
            ),
            pk=pk,
            report__progress_report__year=year,
            report__agency_id=agency_id,
        )
        self.check_object_permissions(request, file_obj.report)

        if not file_obj.file or not os.path.exists(file_obj.file.path):
            raise Http404("File not found on disk.")

        response = FileResponse(
            file_obj.file.open("rb"), content_type="application/octet-stream"
        )
        filename = file_obj.file_name or os.path.basename(file_obj.file.name)
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        return response


class APRFileDeleteView(DestroyAPIView):
    """
    Delete a file from an agency report; only works on DRAFT reports.
    """

    permission_classes = [IsAuthenticated, HasAPREditAccess]

    def get_queryset(self):
        """Get files for the specified agency report."""
        year = self.kwargs.get("year")
        agency_id = self.kwargs.get("agency_id")

        return AnnualProjectReportFile.objects.filter(
            report__progress_report__year=year, report__agency_id=agency_id
        ).select_related("report")

    def perform_destroy(self, instance):
        self.check_object_permissions(self.request, instance.report)

        user = self.request.user
        is_mlfs = user.has_perm("core.can_view_all_agencies")

        if instance.report.is_endorsed():
            raise ValidationError("Cannot delete files from endorsed reports.")

        if not is_mlfs and not instance.report.is_editable_by_agency():
            raise ValidationError(
                f"Cannot delete files from report with status {instance.report.status}. "
                "Only DRAFT reports can be edited."
            )

        instance.delete()


class APRFilesDownloadAllView(APIView):
    """
    Download all files from an agency report as a ZIP archive - MLFS only.
    """

    permission_classes = [IsAuthenticated, HasAPRMLFSViewAccess]

    def get(self, request, year, agency_id):
        """
        Response will be an empty ZIP if the agency report has no attached files.
        """
        agency_report = get_object_or_404(
            AnnualAgencyProjectReport.objects.select_related(
                "progress_report", "agency"
            ).prefetch_related("files"),
            progress_report__year=year,
            agency_id=agency_id,
        )

        files = agency_report.files.all()

        safe_agency_name = "".join(
            c for c in agency_report.agency.name if c.isalnum() or c in (" ", "-", "_")
        ).strip()
        safe_agency_name = "_".join(safe_agency_name.split()).replace(" ", "_")
        zip_filename = f"APR_{year}_{safe_agency_name}_Files.zip"

        response = HttpResponse(content_type="application/zip")
        response["Content-Disposition"] = f'attachment; filename="{zip_filename}"'

        with ZipFile(response, "w") as zipf:
            for file_obj in files:
                if file_obj.file and os.path.exists(file_obj.file.path):
                    arcname = file_obj.file_name or os.path.basename(file_obj.file.name)
                    zipf.write(file_obj.file.path, arcname=arcname)

        return response


class APRStatusView(APIView):
    """
    Changes the status of an agency report.
    Only "Agency Submitter" or MLFS users can perform this action.
    """

    permission_classes = [IsAuthenticated, HasAPRSubmitAccess]

    def post(self, request, year, agency_id):
        """
        By default, it submits the agency report. If it's another status change,
        the request body looks like:
        {
            "status": "SUB"
        }
        Submitted reports can only be re-submitted if they are unlocked.
        When an unlocked vertsion is re-submitted, it becomes locked again.
        """
        agency_report = get_object_or_404(
            AnnualAgencyProjectReport, progress_report__year=year, agency_id=agency_id
        )
        self.check_object_permissions(request, agency_report)

        # Submit by default (for now)
        data = {"status": AnnualAgencyProjectReport.SubmissionStatus.SUBMITTED}
        if "status" in request.data:
            data["status"] = request.data["status"]
        serializer = AnnualAgencyProjectReportStatusUpdateSerializer(
            instance=agency_report, data=data, context={"request": request}
        )

        if serializer.is_valid():
            serializer.save()

            if (
                agency_report.status
                == AnnualAgencyProjectReport.SubmissionStatus.SUBMITTED
                and config.APR_AGENCY_SUBMISSION_NOTIFICATIONS_ENABLED
            ):
                send_agency_submission_notification.delay(agency_report.id)

            return Response(
                {
                    "message": "Report submitted successfully.",
                    "status": agency_report.status,
                    "is_unlocked": agency_report.is_unlocked,
                    "submitted_at": agency_report.submitted_at,
                    "submitted_by": (
                        agency_report.submitted_by.username
                        if agency_report.submitted_by
                        else None
                    ),
                },
                status=status.HTTP_200_OK,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class APRExportView(APIView):
    """
    Generates Excel file with derived and editable fields for all projects.
    """

    permission_classes = [IsAuthenticated, HasAPRViewAccess]

    def get(self, request, year, agency_id):
        """
        Exports APR data to Excel according to filters.
        """
        year = int(year)

        agency_report = get_object_or_404(
            AnnualAgencyProjectReport.objects.prefetch_related(
                "project_reports",
                "project_reports__project__meta_project",
                "project_reports__project__agency",
                "project_reports__project__country__parent",
                "project_reports__project__country",
                "project_reports__project__cluster",
                "project_reports__project__sector",
                "project_reports__project__project_type",
            ),
            progress_report__year=year,
            agency_id=agency_id,
        )

        self.check_object_permissions(request, agency_report)

        status_codes = request.query_params.get("status", "ONG,COM")
        status_codes = [s.strip() for s in status_codes.split(",") if s.strip()]

        project_reports = agency_report.project_reports.filter(
            project__status__code__in=status_codes
        )

        serializer = AnnualProjectReportReadSerializer(
            project_reports, many=True, context={"request": request}
        )
        writer = APRExportWriter(
            year=year,
            agency_name=agency_report.agency.name,
            project_reports_data=serializer.data,
        )
        return writer.generate()


class APRSummaryTablesExportView(APIView):
    """
    Export APR Summary Tables (multi-sheet with aggregations).
    Includes *all* data regardless of UI filters, but agencies only see own projects.
    """

    permission_classes = [IsAuthenticated, HasAPRViewAccess]

    @swagger_auto_schema(
        operation_description="Export APR Summary Tables as Excel",
        manual_parameters=[
            openapi.Parameter(
                "year",
                openapi.IN_QUERY,
                description="APR Year",
                type=openapi.TYPE_INTEGER,
                required=True,
            ),
        ],
        responses={200: "Excel file download"},
    )
    def get(self, request):
        agency = None
        if request.user.agency:
            agency = request.user.agency

        writer = APRSummaryTablesExportWriter(agency=agency)
        return writer.generate()


class APRGlobalViewSet(ReadOnlyModelViewSet):
    """
    List/retrieve all agency reports for MLFS users.
    Only showing them submitted reports for now.
    On retrieve, we prefetch all related info necessary for full data display.
    """

    permission_classes = [IsAuthenticated, HasAPRMLFSViewAccess]
    serializer_class = AnnualAgencyProjectReportReadSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = APRGlobalFilter
    lookup_field = "agency_id"
    lookup_url_kwarg = "agency_id"

    def get_queryset(self):
        year = self.kwargs["year"]

        if self.action == "list":
            queryset = self.get_list_queryset(year)
        else:
            queryset = self.get_detail_queryset(year)

        user = self.request.user
        if not user.has_perm("core.has_apr_edit_access"):
            queryset = queryset.filter(
                status=AnnualAgencyProjectReport.SubmissionStatus.SUBMITTED
            )

        return queryset

    def get_list_queryset(self, year):
        # MLFS users can only see submitted and locked Agency reports
        # Otherwise, it is considered that they are under editing and should not be seen.
        queryset = AnnualAgencyProjectReport.objects.filter(
            progress_report__year=year,
            status=AnnualAgencyProjectReport.SubmissionStatus.SUBMITTED,
            is_unlocked=False,
        ).select_related(
            "progress_report",
            "agency",
            "created_by",
            "submitted_by",
        )

        # Also filter the *nested* project reports for each agency report
        filter_params = {}

        country_param = self.request.query_params.get("country")
        if country_param:
            country_names = [c.strip() for c in country_param.split(",") if c.strip()]
            filter_params["country"] = Country.objects.filter(
                name__in=country_names, location_type=Country.LocationType.COUNTRY
            )

        region_param = self.request.query_params.get("region")
        if region_param:
            region_names = [r.strip() for r in region_param.split(",") if r.strip()]
            filter_params["region"] = Country.objects.filter(
                name__in=region_names,
                location_type__in=[
                    Country.LocationType.REGION,
                    Country.LocationType.SUBREGION,
                ],
            )

        cluster_param = self.request.query_params.get("cluster")
        if cluster_param:
            filter_params["cluster"] = cluster_param

        status_param = self.request.query_params.get("status")
        if status_param:
            filter_params["status"] = status_param

        project_reports_qs = build_filtered_project_reports_queryset(filter_params)
        project_reports_qs = project_reports_qs.select_related(
            "project__meta_project",
            "project__meeting",
            "project__decision",
        ).prefetch_related(
            "project__subsectors",
            "project__ods_odp",
            "project__ods_odp__ods_substance",
            "project__ods_odp__ods_blend",
        )

        queryset = queryset.prefetch_related(
            Prefetch("project_reports", queryset=project_reports_qs),
            "files",
        ).order_by("agency__name")

        return queryset

    def get_detail_queryset(self, year):
        return (
            AnnualAgencyProjectReport.objects.filter(
                progress_report__year=year,
                status=AnnualAgencyProjectReport.SubmissionStatus.SUBMITTED,
                is_unlocked=False,
            )
            .select_related(
                "progress_report",
                "agency",
                "created_by",
                "submitted_by",
            )
            .prefetch_related(
                "project_reports",
                "project_reports__project__meta_project",
                "project_reports__project__agency",
                "project_reports__project__country__parent",
                "project_reports__project__country",
                "project_reports__project__cluster",
                "project_reports__project__sector",
                "project_reports__project__project_type",
                "files",
            )
            .order_by("agency__name")
        )


class APRToggleLockView(APIView):
    """
    Toggle lock/unlock for a submitted agency report.
    Request body should contain: {"is_unlocked": true} or {"is_unlocked": false}
    """

    permission_classes = [IsAuthenticated, HasAPRMLFSFullAccess]

    def post(self, request, year, agency_id):
        agency_report = get_object_or_404(
            AnnualAgencyProjectReport.objects.select_related("progress_report"),
            progress_report__year=year,
            agency_id=agency_id,
        )

        # Only submitted and not endorsed reports can be locked or unlocked
        if agency_report.is_endorsed():
            raise ValidationError("Cannot modify locked status of endorsed reports.")
        if agency_report.status != AnnualAgencyProjectReport.SubmissionStatus.SUBMITTED:
            raise ValidationError("Can only lock/unlock SUBMITTED reports.")

        is_unlocked = request.data.get("is_unlocked")
        if is_unlocked is None:
            raise ValidationError("Field 'is_unlocked' is required (true or false).")

        agency_report.is_unlocked = bool(is_unlocked)
        agency_report.save(update_fields=["is_unlocked", "updated_at"])

        action = "unlocked" if is_unlocked else "locked"
        return Response(
            {
                "message": f"Report {action} successfully.",
                "is_unlocked": agency_report.is_unlocked,
                "status": agency_report.status,
            },
            status=status.HTTP_200_OK,
        )


class APREndorseView(APIView):
    """
    Get or Endorse (via POST) the Annual Progress Report for a specific year.

    Endorsing marks *all* agency reports for that year as final and locked.
    As a prerequisite, all agency reports must be SUBMITTED and locked.
    """

    permission_classes = [IsAuthenticated, HasAPRMLFSFullAccess]

    @staticmethod
    def _get_draft_and_submitted(progress_report):
        agency_reports = progress_report.agency_project_reports.all()

        # Treating DRAFT and unlocked reports as "not ready for endorsement"
        draft_reports = agency_reports.filter(
            status=AnnualAgencyProjectReport.SubmissionStatus.DRAFT
        ) | agency_reports.filter(
            status=AnnualAgencyProjectReport.SubmissionStatus.SUBMITTED,
            is_unlocked=True,
        )

        submitted_reports = agency_reports.filter(
            status=AnnualAgencyProjectReport.SubmissionStatus.SUBMITTED,
            is_unlocked=False,
        )

        return draft_reports, submitted_reports

    def get(self, request, year):
        """Gets the endorsement status for the APR year."""
        progress_report = get_object_or_404(AnnualProgressReport, year=year)

        draft_reports, submitted_reports = self._get_draft_and_submitted(
            progress_report
        )

        # Can only be endorsed if all reports are submitted
        is_endorsable = (
            not progress_report.endorsed
            and draft_reports.count() == 0
            and submitted_reports.count() > 0
        )

        serializer = AnnualProgressReportSerializer(progress_report)

        return Response(
            {
                **serializer.data,
                "is_endorsable": is_endorsable,
                "total_agencies": progress_report.agency_project_reports.count(),
                "submitted_agencies": submitted_reports.count(),
                "draft_agencies": draft_reports.count(),
                "draft_agency_names": [ar.agency.name for ar in draft_reports],
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request, year):
        """
        This endorses the APR, using the request data to set relevant fields.
        """
        progress_report = get_object_or_404(AnnualProgressReport, year=year)

        draft_reports, submitted_reports = self._get_draft_and_submitted(
            progress_report
        )

        if draft_reports.exists():
            draft_agencies = [ar.agency.name for ar in draft_reports]
            raise ValidationError(
                "Cannot endorse APR. The following agencies have "
                f"DRAFT or unlocked reports: {', '.join(draft_agencies)}"
            )

        if not submitted_reports.exists():
            raise ValidationError(
                "Cannot endorse APR. No agencies have submitted reports."
            )

        # Use serializer to validate and set endorsement fields, then endorse
        serializer = AnnualProgressReportEndorseSerializer(
            instance=progress_report, data=request.data
        )
        if serializer.is_valid():
            serializer.save()

            return Response(
                {
                    "message": f"APR for year {year} has been endorsed successfully.",
                    "year": year,
                    "date_endorsed": progress_report.date_endorsed,
                    "meeting_endorsed": (
                        progress_report.meeting_endorsed.number
                        if progress_report.meeting_endorsed
                        else None
                    ),
                    "remarks_endorsed": progress_report.remarks_endorsed,
                    "total_agencies": progress_report.agency_project_reports.count(),
                },
                status=status.HTTP_200_OK,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class APRMLFSBulkUpdateView(APIView):
    """
    MLFS bulk update for multiple project reports across all agencies.
    Unlike the agency bulk update, this uses project report IDs for matching.
    """

    permission_classes = [IsAuthenticated, HasAPRMLFSFullAccess]

    def post(self, request, year):
        """
        Bulk update project reports across all agencies (MLFS only).

        Request body contains a list of nested project reports; id is required for each.
        """
        progress_report = get_object_or_404(AnnualProgressReport, year=year)
        if progress_report.endorsed:
            raise ValidationError(
                f"Cannot edit reports for year {year}. APR has been endorsed."
            )

        serializer = AnnualProjectReportMLFSBulkUpdateSerializer(
            instance=None,
            data=request.data,
            context={
                "request": request,
                "year": year,
            },
        )

        if serializer.is_valid():
            updated_reports, errors = serializer.save()

            response_data = {
                "updated_count": len(updated_reports),
                "error_count": len(errors),
                "message": f"Successfully updated {len(updated_reports)} project report(s).",
            }

            if errors:
                response_data["errors"] = errors

            return Response(response_data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class APRKickStartView(APIView):
    """
    Endpoint for MLFS to kick-start a new reporting period - only if MLFS full-access
    GET: checks whether a new APR year can be kicked off
    POST: kick-starts a new APR reporting cycle
    """

    permission_classes = [IsAuthenticated, HasAPRMLFSFullAccess]

    def get(self, request):
        latest_endorsed_year = get_latest_endorsed_year()
        unendorsed_years = get_unendorsed_years()

        if latest_endorsed_year is None:
            serializer = AnnualProjectReportKickStartStatusSerializer(
                {
                    "can_kick_start": False,
                    "latest_endorsed_year": None,
                    "next_year": None,
                    "unendorsed_years": unendorsed_years,
                    "message": "No endorsed APRs exist. Cannot kick-start a new APR.",
                }
            )
            return Response(serializer.data, status=status.HTTP_200_OK)

        can_kick_start = len(unendorsed_years) == 0
        next_year = latest_endorsed_year + 1 if can_kick_start else None

        data = {
            "can_kick_start": can_kick_start,
            "latest_endorsed_year": latest_endorsed_year,
            "next_year": next_year,
            "unendorsed_years": unendorsed_years,
        }

        if not can_kick_start:
            data["message"] = (
                f"Year {unendorsed_years[0]} already exists and must be endorsed "
                f"before creating year {latest_endorsed_year + 1}."
            )

        serializer = AnnualProjectReportKickStartStatusSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """
        Kick-start a new APR year by creating the AnnualProgressReport container.

        Individual agency reports and project reports will be created later,
        when agencies access their workspaces, with data automatically pre-populated
        from the previous reporting year.
        """
        with transaction.atomic():
            latest_endorsed_year = get_latest_endorsed_year()

            # For now we assume a previous APR exists (should exist after importing data)
            if latest_endorsed_year is None:
                raise ValidationError(
                    "Cannot kick-start APR. No endorsed APRs exist yet."
                )
            next_year = latest_endorsed_year + 1

            unendorsed_years = get_unendorsed_years()
            if unendorsed_years:
                raise ValidationError(
                    f"Cannot kick-start APR. "
                    f"APR for {unendorsed_years[0]} already exists "
                    f"and must be endorsed before reporting for {next_year}."
                )

            if AnnualProgressReport.objects.filter(year=next_year).exists():
                raise ValidationError(
                    f"APR for year {next_year} already exists. "
                    f"It must be endorsed before creating year {next_year + 1}."
                )

            progress_report = AnnualProgressReport.objects.create(
                year=next_year,
                endorsed=False,
                remarks_endorsed="",
                created_by=request.user,
            )

        response_data = {
            "year": progress_report.year,
            "message": (
                f"APR for year {next_year} has been initialized successfully. "
                "Agencies can now access their workspaces to begin reporting."
            ),
            "previous_year": latest_endorsed_year,
        }

        serializer = AnnualProjectReportKickStartResponseSerializer(response_data)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class APRMLFSExportView(APIView):
    """
    Excel export for multiple agencies, for the MLFS global view/dashboard.
    It exports the project reports for all submitted & locked agency reports.
    """

    permission_classes = [IsAuthenticated, HasAPRMLFSViewAccess]

    def get(self, request, year):
        year = int(year)
        queryset = self._get_filtered_agency_reports(year)

        all_project_reports = []
        for agency_report in queryset:
            # Project reports are already filtered
            # by the prefetch in self._get_filtered_agency_reports() (see below)
            all_project_reports.extend(agency_report.project_reports.all())

        # Now prefetch the version data (version3, latest_version, all versions for year)
        # for all collected project reports at once.
        # Using dicts to handle multi-APR, multi-project data.
        if all_project_reports:
            final_project_ids = set()
            for pr in all_project_reports:
                final_id = pr.project.latest_project_id or pr.project.id
                final_project_ids.add(final_id)

            version_3_projects = {
                p.latest_project_id or p.id: p
                for p in Project.objects.really_all()
                .filter(
                    models.Q(id__in=final_project_ids)
                    | models.Q(latest_project_id__in=final_project_ids),
                    version=3,
                )
                .select_related("status", "post_excom_decision__meeting")
            }

            latest_version_projects = {}
            for p in (
                Project.objects.really_all()
                .filter(
                    models.Q(id__in=final_project_ids)
                    | models.Q(latest_project_id__in=final_project_ids),
                    post_excom_decision__isnull=False,
                    post_excom_decision__meeting__date__year__lte=year,
                )
                .select_related("status", "post_excom_decision__meeting")
                .order_by("-post_excom_decision__meeting__date", "-version")
            ):
                project_key = p.latest_project_id or p.id
                if project_key not in latest_version_projects:
                    latest_version_projects[project_key] = p

            all_versions_for_year = {}
            for p in (
                Project.objects.really_all()
                .filter(
                    models.Q(id__in=final_project_ids)
                    | models.Q(latest_project_id__in=final_project_ids),
                    models.Q(
                        post_excom_decision__isnull=False,
                        post_excom_decision__meeting__date__year=year,
                    )
                    | models.Q(post_excom_decision__isnull=True, version=3),
                )
                .select_related("status")
            ):
                project_key = p.latest_project_id or p.id
                if project_key not in all_versions_for_year:
                    all_versions_for_year[project_key] = []
                all_versions_for_year[project_key].append(p)

            # And finally "attach" the cached data to each project
            for pr in all_project_reports:
                project_key = pr.project.latest_project_id or pr.project.id

                pr.project.cached_version_3_list = (
                    [version_3_projects[project_key]]
                    if project_key in version_3_projects
                    else []
                )
                pr.project.cached_versions_for_year = (
                    [latest_version_projects[project_key]]
                    if project_key in latest_version_projects
                    else []
                )
                pr.project.cached_all_versions_for_year = all_versions_for_year.get(
                    project_key, []
                )

        serializer = AnnualProjectReportReadSerializer(
            all_project_reports, many=True, context={"request": request}
        )

        writer = APRExportWriter(
            year=year,
            agency_name=None,
            project_reports_data=serializer.data,
        )
        return writer.generate()

    def _get_filtered_agency_reports(self, year):
        """
        Applies the same filtering logic as APRGlobalViewSet.get_list_queryset();
        this is needed to emulate the exact results of the APR Global View.

        Returns queryset of filtered AnnualAgencyProjectReport objects.
        """
        year = int(year)

        queryset = AnnualAgencyProjectReport.objects.filter(
            progress_report__year=year,
            status=AnnualAgencyProjectReport.SubmissionStatus.SUBMITTED,
            is_unlocked=False,
        ).select_related(
            "progress_report",
            "agency",
        )

        # Build the filter parameters for the nested project reports
        filter_params = {}

        agency_param = self.request.query_params.get("agency")
        if agency_param:
            agency_ids = [a.strip() for a in agency_param.split(",") if a.strip()]
            queryset = queryset.filter(agency_id__in=agency_ids)

        country_param = self.request.query_params.get("country")
        if country_param:
            country_names = [c.strip() for c in country_param.split(",") if c.strip()]
            filter_params["country"] = Country.objects.filter(
                name__in=country_names, location_type=Country.LocationType.COUNTRY
            )

        region_param = self.request.query_params.get("region")
        if region_param:
            region_names = [r.strip() for r in region_param.split(",") if r.strip()]
            filter_params["region"] = Country.objects.filter(
                name__in=region_names,
                location_type__in=[
                    Country.LocationType.REGION,
                    Country.LocationType.SUBREGION,
                ],
            )

        cluster_param = self.request.query_params.get("cluster")
        if cluster_param:
            filter_params["cluster"] = cluster_param

        status_param = self.request.query_params.get("status")
        if status_param:
            filter_params["status"] = status_param

        project_reports_qs = build_filtered_project_reports_queryset(filter_params)
        project_reports_qs = project_reports_qs.select_related(
            "project__meta_project",
            "project__agency",
            "project__country__parent",
            "project__country",
            "project__cluster",
            "project__sector",
            "project__project_type",
        ).prefetch_related(
            Prefetch(
                "project__archive_projects",
                queryset=Project.objects.really_all()
                .filter(version=3)
                .select_related("status", "post_excom_decision__meeting"),
                to_attr="cached_version_3_list",
            ),
            Prefetch(
                "project__archive_projects",
                queryset=Project.objects.really_all()
                .filter(
                    post_excom_decision__isnull=False,
                    post_excom_decision__meeting__date__year__lte=year,
                )
                .select_related("status", "post_excom_decision__meeting")
                .order_by("-post_excom_decision__meeting__date", "-version"),
                to_attr="cached_versions_for_year",
            ),
            Prefetch(
                "project__archive_projects",
                queryset=Project.objects.really_all()
                .filter(
                    models.Q(
                        post_excom_decision__isnull=False,
                        post_excom_decision__meeting__date__year=year,
                    )
                    | models.Q(post_excom_decision__isnull=True, version=3)
                )
                .select_related("status"),
                to_attr="cached_all_versions_for_year",
            ),
        )

        # Prefetch the filtered project reports and order the same as the global view
        queryset = queryset.prefetch_related(
            Prefetch("project_reports", queryset=project_reports_qs)
        ).order_by("agency__name")

        return queryset
