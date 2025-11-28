import os
from django.db.models import Prefetch
from django.http import Http404, FileResponse
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.generics import RetrieveAPIView, DestroyAPIView
from rest_framework.permissions import IsAuthenticated

from core.models import (
    AnnualProgressReport,
    AnnualAgencyProjectReport,
    AnnualProjectReport,
    AnnualProjectReportFile,
    Project,
    Country,
)
from core.api.filters.annual_project_reports import (
    APRProjectFilter,
    APRGlobalFilter,
    build_filtered_project_reports_queryset,
)
from core.api.export.annual_project_report import APRExportWriter
from core.api.permissions import (
    HasAPRViewAccess,
    HasAPREditAccess,
    HasAPRSubmitAccess,
    HasMLFSViewAccess,
    HasMLFSFullAccess,
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

        queryset = AnnualAgencyProjectReport.objects.select_related(
            "progress_report",
            "agency",
            "created_by",
            "submitted_by",
        ).prefetch_related(
            "project_reports",
            "project_reports__project",
            "project_reports__project__meta_project",
            "project_reports__project__agency",
            "project_reports__project__country",
            "project_reports__project__cluster",
            "project_reports__project__sector",
            "project_reports__project__subsectors",
            "project_reports__project__project_type",
            "project_reports__project__status",
            "project_reports__project__meeting",
            "project_reports__project__decision",
            "project_reports__project__ods_odp",
            "project_reports__project__ods_odp__ods_substance",
            "project_reports__project__ods_odp__ods_blend",
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

        # When creating for the first time, populate individual project reports.
        # We don't need to consider the case of new projects being added after this.
        if created or agency_report.project_reports.count() == 0:
            # Get projects for this agency and create AnnualProjectReport for each
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
                AnnualProjectReport.objects.get_or_create(
                    project=project,
                    report=agency_report,
                )

        return agency_report


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
        Exports APR data to Excel according to filters.
        """
        agency_report = get_object_or_404(
            AnnualAgencyProjectReport.objects.prefetch_related(
                "project_reports",
                "project_reports__project",
                "project_reports__project__meta_project",
                "project_reports__project__agency",
                "project_reports__project__country",
                "project_reports__project__cluster",
                "project_reports__project__sector",
                "project_reports__project__subsectors",
                "project_reports__project__project_type",
                "project_reports__project__status",
                "project_reports__project__ods_odp",
                "project_reports__project__ods_odp__ods_substance",
                "project_reports__project__ods_odp__ods_blend",
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


class APRGlobalViewSet(ReadOnlyModelViewSet):
    """
    List/retrieve all agency reports for MLFS users.
    Only showing them submitted reports for now.
    On retrieve, we prefetch all related info necessary for full data display.
    """

    permission_classes = [IsAuthenticated, HasMLFSViewAccess]
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
        queryset = AnnualAgencyProjectReport.objects.filter(
            progress_report__year=year,
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
                "project_reports__project__meta_project",
                "project_reports__project__agency",
                "project_reports__project__country",
                "project_reports__project__cluster",
                "project_reports__project__sector",
                "project_reports__project__subsectors",
                "project_reports__project__project_type",
                "project_reports__project__status",
                "project_reports__project__meeting",
                "project_reports__project__decision",
                "project_reports__project__ods_odp",
                "project_reports__project__ods_odp__ods_substance",
                "project_reports__project__ods_odp__ods_blend",
                "files",
            )
            .order_by("agency__name")
        )


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
    Get or Endorse (via POST) the Annual Progress Report for a specific year.

    Endorsing marks *all* agency reports for that year as final and locked.
    As a prerequisites, all agency reports must be SUBMITTED.
    """

    permission_classes = [IsAuthenticated, HasMLFSFullAccess]

    def get(self, request, year):
        """Gets the endorsement status for the APR year."""
        progress_report = get_object_or_404(AnnualProgressReport, year=year)

        agency_reports = progress_report.agency_project_reports.all()
        draft_reports = agency_reports.filter(
            status=AnnualAgencyProjectReport.SubmissionStatus.DRAFT
        )
        submitted_reports = agency_reports.filter(
            status=AnnualAgencyProjectReport.SubmissionStatus.SUBMITTED
        )

        # Can only be endorsed if all reports are submitted
        is_endorsable = not progress_report.endorsed and draft_reports.count() == 0

        serializer = AnnualProgressReportSerializer(progress_report)

        return Response(
            {
                **serializer.data,
                "is_endorsable": is_endorsable,
                "total_agencies": agency_reports.count(),
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

        # Check that all agency reports are SUBMITTED
        agency_reports = progress_report.agency_project_reports.all()
        draft_reports = agency_reports.filter(
            status=AnnualAgencyProjectReport.SubmissionStatus.DRAFT
        )
        if draft_reports.exists():
            draft_agencies = [ar.agency.name for ar in draft_reports]
            raise ValidationError(
                "Cannot endorse APR. The following agencies have DRAFT reports: "
                f"{', '.join(draft_agencies)}"
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
                    "total_agencies": agency_reports.count(),
                },
                status=status.HTTP_200_OK,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
