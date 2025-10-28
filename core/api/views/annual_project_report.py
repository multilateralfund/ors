from datetime import datetime, timezone

from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import RetrieveAPIView, ListAPIView, DestroyAPIView
from rest_framework.permissions import IsAuthenticated

from core.models import (
    AnnualProgressReport,
    AnnualAgencyProjectReport,
    AnnualProjectReport,
    AnnualProjectReportFile,
    Project,
)
from core.api.filters.annual_project_reports import APRProjectFilter, APRGlobalFilter
from core.api.permissions import (
    HasAPRViewAccess,
    HasAPREditAccess,
    HasAPRSubmitAccess,
    HasMLFSFullAccess,
)
from core.api.serializers.annual_project_report import (
    AnnualProjectReportReadSerializer,
    AnnualAgencyProjectReportReadSerializer,
    AnnualProjectReportBulkUpdateSerializer,
    AnnualProjectReportFileUploadSerializer,
    AnnualAgencyProjectReportStatusUpdateSerializer,
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

        # TODO: I should probably also exclude projects with version < 3
        queryset = (
            Project.objects.filter(latest_project__isnull=True)
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

        user = self.request.user
        if not user.is_superuser and not user.has_perm("core.can_view_all_agencies"):
            if hasattr(user, "agency") and user.agency:
                # TODO: I am not sure how to deal with Lead Agency !
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

        year = self.kwargs["year"]

        # Get status filter from query params (defaults are ONG, COM)
        status_codes = self.request.query_params.get("status", "ONG,COM")

        # Get or create annual progress report for the year
        progress_report, _ = AnnualProgressReport.objects.get_or_create(
            year=year, defaults={"endorsed": False, "remarks_endorsed": ""}
        )

        # Get or create agency report container
        agency_report, created = AnnualAgencyProjectReport.objects.get_or_create(
            progress_report=progress_report,
            agency=agency,
            defaults={
                "status": AnnualAgencyProjectReport.SubmissionStatus.DRAFT,
                "created_by": user,
            },
        )

        # When creating for the first time, populate individual project reports
        if created or agency_report.project_reports.count() == 0:
            # Get projects for this agency and create AnnualProjectReport for each
            filterset = APRProjectFilter(
                data={
                    "year": year,
                    "agency": agency.id,
                    "status": status_codes,
                },
                queryset=self.get_queryset(),
            )
            if filterset.is_valid():
                projects = filterset.qs
                for project in projects:
                    AnnualProjectReport.objects.get_or_create(
                        project=project,
                        report=agency_report,
                    )

        return agency_report


class APRAgencyReportDetailView(RetrieveAPIView):
    """
    Retrieve detailed information about an agency's APR for a specific year.
    Includes all project reports and files.
    """

    permission_classes = [IsAuthenticated, HasAPRViewAccess]
    serializer_class = AnnualAgencyProjectReportReadSerializer

    def get_queryset(self):
        """
        Filter to only allow users to access their own agency's reports.
        Superusers or MLFS can access all reports.
        """
        user = self.request.user
        queryset = AnnualAgencyProjectReport.objects.select_related(
            "progress_report",
            "agency",
            "created_by",
            "submitted_by",
        ).prefetch_related(
            "project_reports",
            "project_reports__project",
            "project_reports__project__agency",
            "project_reports__project__country",
            "project_reports__project__sector",
            "project_reports__project__subsectors",
            "project_reports__project__meeting",
            "project_reports__project__decision",
            "project_reports__project__ods_odp",
            "project_reports__project__ods_odp__ods_substance",
            "project_reports__project__ods_odp__ods_blend",
            "files",
        )

        # If not superuser, filter to own agency
        if not user.is_superuser and not user.has_perm("core.can_view_all_agencies"):
            if hasattr(user, "agency") and user.agency:
                queryset = queryset.filter(agency=user.agency)
            else:
                queryset = queryset.none()

        return queryset

    def get_object(self):
        """Get the agency report by year and agency_id."""
        year = self.kwargs.get("year")
        agency_id = self.kwargs.get("agency_id")

        queryset = self.get_queryset()
        obj = get_object_or_404(
            queryset, progress_report__year=year, agency_id=agency_id
        )
        self.check_object_permissions(self.request, obj)

        return obj


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
            serializer.save(report=agency_report)
            return Response(
                {"message": "File uploaded successfully.", "file": serializer.data},
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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


class APRStatusView(APIView):
    """
    Changes the status of an agency report.
    Only "Agency Submitter" or MLFS users can perform this action.
    """

    permission_classes = [IsAuthenticated, HasAPRSubmitAccess]

    def post(self, request, year, agency_id):
        """
        By default, it submit the agency report. If it's another status change,
        the request body looks like:
        {
            "status": "SUB"
        }
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

            return Response(
                {
                    "message": "Report submitted successfully.",
                    "status": agency_report.status,
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
        Export APR data to Excel.

        TODO: Implement Excel generation using openpyxl.
        For now, return placeholder response.
        """
        # Get the agency report
        agency_report = get_object_or_404(
            AnnualAgencyProjectReport.objects.prefetch_related(
                "project_reports",
                "project_reports__project",
                "project_reports__project__agency",
                "project_reports__project__country",
                "project_reports__project__sector",
                "project_reports__project__subsectors",
                "project_reports__project__meeting",
                "project_reports__project__decision",
                "project_reports__project__ods_odp",
            ),
            progress_report__year=year,
            agency_id=agency_id,
        )

        # Check object permissions
        self.check_object_permissions(request, agency_report)

        # Get status filter from query params
        status_codes = request.query_params.get("status", "ONG,COM")
        status_codes = [s.strip() for s in status_codes.split(",") if s.strip()]

        # Filter project reports by status
        project_reports = (
            agency_report.project_reports.filter(project__status__code__in=status_codes)
            .select_related(
                "project",
                "project__agency",
                "project__country",
                "project__sector",
            )
            .prefetch_related(
                "project__subsectors",
                "project__ods_odp",
            )
        )

        # TODO: Generate Excel file; returning JSON data for now
        serializer = AnnualProjectReportReadSerializer(
            project_reports, many=True, context={"request": request}
        )
        return Response(
            {
                "message": "Excel export not yet implemented. Returning JSON data.",
                "year": year,
                "agency": agency_report.agency.name,
                "total_projects": project_reports.count(),
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class APRSummaryTablesView(APIView):
    """
    Read-only view to generate summary tables (Annex II).
    """

    # TODO: implement when we receive the Annex II specifications
    permission_classes = [IsAuthenticated]

    def get(self, request, year):
        """
        Generate summary tables for the specified year.
        """
        return Response(
            {
                "message": "Summary tables not yet implemented.",
                "year": year,
            },
            status=status.HTTP_501_NOT_IMPLEMENTED,
        )


class APRGlobalListView(ListAPIView):
    """
    List all agency reports for MLFS users.
    Only showing them submitted reports for now.
    """

    permission_classes = [IsAuthenticated, HasAPRViewAccess]
    serializer_class = AnnualAgencyProjectReportReadSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = APRGlobalFilter

    def get_queryset(self):
        year = self.kwargs["year"]

        queryset = (
            AnnualAgencyProjectReport.objects.filter(
                progress_report__year=year,
                status=AnnualAgencyProjectReport.SubmissionStatus.SUBMITTED,
            )
            .select_related(
                "progress_report",
                "agency",
                "created_by",
                "submitted_by",
            )
            .prefetch_related(
                "project_reports",
                "project_reports__project",
                "project_reports__project__country",
                "project_reports__project__sector",
                "files",
            )
            .order_by("agency__name")
        )
        return queryset


class APRToggleLockView(APIView):
    """
    Toggle lock/unlock for a submitted agency report.
    Request body should contain: {"is_unlocked": true} or {"is_unlocked": false}
    """

    permission_classes = [IsAuthenticated, HasMLFSFullAccess]

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
    Endorse the Annual Progress Report for a specific year.
    This marks *all* agency reports for that year as final and locked.
    As a prerequisites, all agency reports must be SUBMITTED.
    """

    permission_classes = [IsAuthenticated, HasMLFSFullAccess]

    def post(self, request, year):
        progress_report = get_object_or_404(AnnualProgressReport, year=year)

        # Check if already endorsed
        if progress_report.endorsed:
            raise ValidationError(f"APR for year {year} is already endorsed.")

        # Check that all agency reports are SUBMITTED
        agency_reports = progress_report.agency_reports.all()
        draft_reports = agency_reports.filter(
            status=AnnualAgencyProjectReport.SubmissionStatus.DRAFT
        )
        if draft_reports.exists():
            draft_agencies = [ar.agency.name for ar in draft_reports]
            raise ValidationError(
                "Cannot endorse APR. The following agencies have DRAFT reports: "
                f"draft_agencies: {draft_agencies}"
            )

        # Endorse the progress report
        progress_report.endorsed = True
        progress_report.endorsed_at = datetime.now(timezone.utc)
        progress_report.endorsed_by = request.user
        progress_report.save(update_fields=["endorsed", "endorsed_at", "endorsed_by"])

        return Response(
            {
                "message": f"APR for year {year} has been endorsed successfully.",
                "year": year,
                "endorsed_at": progress_report.endorsed_at,
                "endorsed_by": request.user.username,
                "total_agencies": agency_reports.count(),
            },
            status=status.HTTP_200_OK,
        )
