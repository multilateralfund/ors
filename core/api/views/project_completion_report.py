from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.generics import ListAPIView, RetrieveAPIView, DestroyAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.api.permissions import (
    HasPCRViewAccess,
    HasPCREditAccess,
    HasPCRSubmitAccess,
)
from core.api.serializers.project_completion_report import (
    DelayCategorySerializer,
    LearnedLessonCategorySerializer,
    PCRGenderPhaseSerializer,
    PCRProjectElementSerializer,
    PCRSDGSerializer,
    PCRAgencyReportReadSerializer,
    PCRAgencyReportSummarySerializer,
    ProjectCompletionReportListSerializer,
    ProjectCompletionReportReadSerializer,
    ProjectCompletionReportWriteSerializer,
    PCRCauseOfDelayReadSerializer,
    PCRCommentSerializer,
    PCRGenderMainstreamingSerializer,
    PCRLessonLearnedReadSerializer,
    PCROverallAssessmentSerializer,
    PCRProjectActivitySerializer,
    PCRRecommendationSerializer,
    PCRSDGContributionSerializer,
    PCRSupportingEvidenceSerializer,
    PCRTrancheDataReadSerializer,
    PCRCauseOfDelayWriteSerializer,
    PCRLessonLearnedWriteSerializer,
    PCRTrancheDataWriteSerializer,
)
from core.models import Project, MetaProject
from core.models.project_complition_report import (
    DelayCategory,
    LearnedLessonCategory,
    PCRAgencyReport,
    PCRCauseOfDelay,
    PCRComment,
    PCRGenderMainstreaming,
    PCRGenderPhase,
    PCRLessonLearned,
    PCROverallAssessment,
    PCRProjectActivity,
    PCRProjectElement,
    PCRRecommendation,
    PCRSDGContribution,
    PCRSupportingEvidence,
    PCRTrancheData,
    PCRSDG,
    ProjectCompletionReport,
)


# pylint: disable=C0302


# Reference Data


class PCRReferenceDataView(APIView):
    """
    Returns all reference data needed for PCR forms.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            {
                "delay_categories": DelayCategorySerializer(
                    DelayCategory.objects.all().order_by("sort_order"), many=True
                ).data,
                "lesson_categories": LearnedLessonCategorySerializer(
                    LearnedLessonCategory.objects.all().order_by("sort_order"),
                    many=True,
                ).data,
                "project_elements": PCRProjectElementSerializer(
                    PCRProjectElement.objects.all().order_by("sort_order"), many=True
                ).data,
                "sdgs": PCRSDGSerializer(
                    PCRSDG.objects.all().order_by("number"), many=True
                ).data,
                "gender_phases": PCRGenderPhaseSerializer(
                    PCRGenderPhase.objects.all().order_by("sort_order"), many=True
                ).data,
            }
        )


# PCR Workspace


class PCRWorkspaceView(APIView):
    """
    Retrieves or creates PCR workspace for a specific project or meta-project.

    For multi-agency projects, creates/returns PCR with agency reports.
    For single-agency projects, creates/returns PCR with agency reports.

    Query params:
    - project_id: ID of project to create PCR for
    - meta_project_id: ID of meta-project to create PCR for (use one or the other)
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get or create PCR for a project or meta-project.
        """
        user = request.user
        project_id = request.query_params.get("project_id")
        meta_project_id = request.query_params.get("meta_project_id")

        if not project_id and not meta_project_id:
            raise ValidationError(
                "Either project_id or meta_project_id must be provided."
            )

        if project_id and meta_project_id:
            raise ValidationError(
                "Only one of project_id or meta_project_id should be provided."
            )

        if project_id:
            project = get_object_or_404(
                Project.objects.select_related(
                    "agency", "country", "sector", "project_type"
                ),
                pk=project_id,
            )
            meta_project = None

            if not user.has_perm("core.can_view_all_agencies"):
                if not hasattr(user, "agency") or user.agency != project.agency:
                    raise ValidationError(
                        "You do not have permission to access this project."
                    )

            pcr, created = ProjectCompletionReport.objects.get_or_create(
                project=project,
                defaults={
                    "status": ProjectCompletionReport.Status.DRAFT,
                    "created_by": user,
                },
            )

            involved_agencies = [project.agency] if project.agency else []

        else:
            meta_project = get_object_or_404(
                MetaProject.objects.prefetch_related("projects__agency"),
                pk=meta_project_id,
            )
            project = None

            involved_agencies = set()
            for proj in meta_project.projects.all():
                if proj.agency:
                    involved_agencies.add(proj.agency)
            involved_agencies = list(involved_agencies)

            if not user.has_perm("core.can_view_all_agencies"):
                if not hasattr(user, "agency") or user.agency not in involved_agencies:
                    raise ValidationError(
                        "You do not have permission to access this meta-project."
                    )

            pcr, created = ProjectCompletionReport.objects.get_or_create(
                meta_project=meta_project,
                defaults={
                    "status": ProjectCompletionReport.Status.DRAFT,
                    "created_by": user,
                },
            )

        # Create agency reports if newly created or if none exist
        if created or pcr.agency_reports.count() == 0:
            self._create_agency_reports(pcr, involved_agencies, user)

        # Create tranche data if newly created or if none exist
        if created or pcr.tranches.count() == 0:
            self._create_tranche_data(pcr, project, meta_project)

        # Fetch with optimized queryset
        pcr = (
            ProjectCompletionReport.objects.select_related(
                "project__country",
                "project__agency",
                "meta_project",
                "submitter",
                "created_by",
            )
            .prefetch_related(
                "agency_reports__agency",
                "agency_reports__activities",
                "agency_reports__overall_assessment",
                "agency_reports__comments",
                "agency_reports__causes_of_delay__project_element",
                "agency_reports__causes_of_delay__categories__category",
                "agency_reports__lessons_learned__project_element",
                "agency_reports__lessons_learned__categories__category",
                "agency_reports__recommendations",
                "agency_reports__gender_mainstreaming__phase",
                "agency_reports__sdg_contributions__sdg",
                "tranches__agency",
                "tranches__technologies__substance_from",
                "tranches__technologies__substance_to",
                "tranches__enterprises",
                "tranches__trainees",
                "tranches__equipment_disposals",
                "comments",
                "recommendations",
                "supporting_evidence",
            )
            .get(pk=pcr.pk)
        )

        serializer = ProjectCompletionReportReadSerializer(
            pcr, context={"request": request}
        )
        return Response(serializer.data)

    def _create_agency_reports(self, pcr, agencies, user):
        """Create agency reports for all involved agencies"""
        # Determine lead agency (first agency or user's agency)
        lead_agency = None
        if hasattr(user, "agency") and user.agency in agencies:
            lead_agency = user.agency
        elif agencies:
            lead_agency = agencies[0]

        for agency in agencies:
            is_lead = agency == lead_agency
            PCRAgencyReport.objects.get_or_create(
                pcr=pcr,
                agency=agency,
                defaults={
                    "is_lead_agency": is_lead,
                    "status": PCRAgencyReport.ReportStatus.DRAFT,
                },
            )

    def _create_tranche_data(self, pcr, project, meta_project):
        """
        Create tranche data entries from project(s).

        For single project: create one entry per unique (project, agency) combination.
        For meta-project: create entries for all child projects.
        """
        if project:
            # Single project - create tranche data for the agency
            if project.agency:
                PCRTrancheData.create_from_project(
                    pcr=pcr, project=project, agency=project.agency
                )
        elif meta_project:
            # Meta-project - create tranche data for all child projects
            for child_project in meta_project.projects.all():
                if child_project.agency:
                    PCRTrancheData.create_from_project(
                        pcr=pcr, project=child_project, agency=child_project.agency
                    )


# PCR List/Create/Delete/Update


class PCRListView(ListAPIView):
    """
    List all PCRs with filtering, based on user types (agency vs MLFS)
    """

    permission_classes = [HasPCRViewAccess]
    serializer_class = ProjectCompletionReportListSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = ProjectCompletionReport.objects.select_related(
            "project__country",
            "project__agency",
            "meta_project",
            "submitter",
        ).prefetch_related("agency_reports__agency")

        # Filter by user's agency if not MLFS
        if not user.has_perm("core.can_view_all_agencies"):
            if hasattr(user, "agency") and user.agency:
                queryset = queryset.filter(
                    agency_reports__agency=user.agency
                ).distinct()
            else:
                queryset = queryset.none()

        # Apply filters from query params
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        country_id = self.request.query_params.get("country_id")
        if country_id:
            queryset = queryset.filter(project__country_id=country_id)

        return queryset.order_by("-date_created")


class PCRDetailView(RetrieveAPIView):
    """
    Retrieve a specific PCR with all details.
    """

    permission_classes = [HasPCRViewAccess]
    serializer_class = ProjectCompletionReportReadSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = ProjectCompletionReport.objects.select_related(
            "project__country",
            "project__agency",
            "meta_project",
            "submitter",
            "created_by",
        ).prefetch_related(
            "agency_reports__agency",
            "agency_reports__activities",
            "agency_reports__overall_assessment",
            "agency_reports__comments",
            "agency_reports__causes_of_delay__project_element",
            "agency_reports__causes_of_delay__categories__category",
            "agency_reports__lessons_learned__project_element",
            "agency_reports__lessons_learned__categories__category",
            "agency_reports__recommendations",
            "agency_reports__gender_mainstreaming__phase",
            "agency_reports__sdg_contributions__sdg",
            "tranches__agency",
            "tranches__technologies__substance_from",
            "tranches__technologies__substance_to",
            "tranches__enterprises",
            "tranches__trainees",
            "tranches__equipment_disposals",
            "comments",
            "recommendations",
            "supporting_evidence",
        )

        if not user.has_perm("core.can_view_all_agencies"):
            if hasattr(user, "agency") and user.agency:
                queryset = queryset.filter(
                    agency_reports__agency=user.agency
                ).distinct()
            else:
                queryset = queryset.none()

        return queryset


class PCRUpdateView(APIView):
    """
    Update PCR overview data (Section 1.6 fields).
    """

    permission_classes = [HasPCREditAccess]

    def patch(self, request, pk):
        pcr = get_object_or_404(ProjectCompletionReport, pk=pk)
        self.check_object_permissions(request, pcr)

        if pcr.status == ProjectCompletionReport.Status.SUBMITTED:
            if not request.user.has_perm("core.can_view_all_agencies"):
                raise ValidationError(
                    "Cannot edit submitted PCR. Only MLFS can unlock."
                )

        serializer = ProjectCompletionReportWriteSerializer(
            pcr, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()

            pcr.refresh_from_db()
            read_serializer = ProjectCompletionReportReadSerializer(
                pcr, context={"request": request}
            )
            return Response(read_serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Agency reports


class PCRAgencyReportDetailView(RetrieveAPIView):
    """
    Retrieve a specific agency report with all sections.
    """

    permission_classes = [HasPCRViewAccess]
    serializer_class = PCRAgencyReportReadSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = PCRAgencyReport.objects.select_related(
            "pcr__project",
            "pcr__meta_project",
            "agency",
        ).prefetch_related(
            "activities",
            "overall_assessment",
            "comments",
            "causes_of_delay__project_element",
            "causes_of_delay__categories__category",
            "lessons_learned__project_element",
            "lessons_learned__categories__category",
            "recommendations",
            "gender_mainstreaming__phase",
            "sdg_contributions__sdg",
        )

        if not user.has_perm("core.can_view_all_agencies"):
            if hasattr(user, "agency") and user.agency:
                queryset = queryset.filter(agency=user.agency)
            else:
                queryset = queryset.none()

        return queryset


class PCRAgencyReportStatusUpdateView(APIView):
    permission_classes = [HasPCRSubmitAccess]

    def post(self, request, pk):
        user = request.user
        agency_report = get_object_or_404(
            PCRAgencyReport.objects.select_related("agency", "pcr"), pk=pk
        )

        self.check_object_permissions(request, agency_report.pcr)

        new_status = request.data.get("status")
        if not new_status:
            raise ValidationError("Status is required.")

        # TODO: here (and below) we should also take locked/unlocked into account
        current = agency_report.status
        if (
            new_status == PCRAgencyReport.ReportStatus.SUBMITTED
            and current == PCRAgencyReport.ReportStatus.DRAFT
        ):
            agency_report.status = new_status
            submission_date = timezone.now()
            agency_report.date_submitted = submission_date
            agency_report.save()

            # Update financial summary
            agency_report.update_financial_summary()

            # Check if all agency reports are submitted and update PCR status
            pcr = agency_report.pcr
            all_submitted = all(
                ar.status == PCRAgencyReport.ReportStatus.SUBMITTED
                for ar in pcr.agency_reports.all()
            )
            if all_submitted and pcr.status == ProjectCompletionReport.Status.DRAFT:
                pcr.status = ProjectCompletionReport.Status.SUBMITTED
                pcr.submitter = user

                # Track submission dates
                if not pcr.first_submission_date:
                    pcr.first_submission_date = submission_date
                pcr.last_submission_date = submission_date
                pcr.save()

                # Update aggregations
                pcr.update_aggregations()

        elif new_status == current:
            # No change, just pass
            pass
        else:
            raise ValidationError(
                f"Invalid status transition from {current} to {new_status}."
            )

        serializer = PCRAgencyReportSummarySerializer(agency_report)
        return Response(serializer.data)


# Section 2 - Project activities


class PCRProjectActivityCreateView(APIView):
    """Create a project activity for an agency report"""

    permission_classes = [HasPCREditAccess]

    def post(self, request, agency_report_id):
        agency_report = get_object_or_404(
            PCRAgencyReport.objects.select_related("agency", "pcr"), pk=agency_report_id
        )

        self.check_object_permissions(request, agency_report.pcr)

        # Check if editable
        if (
            not agency_report.is_unlocked
            and agency_report.status != PCRAgencyReport.ReportStatus.DRAFT
        ):
            raise ValidationError("Cannot edit submitted report unless unlocked.")

        serializer = PCRProjectActivitySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(agency_report=agency_report)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PCRProjectActivityUpdateView(APIView):
    """Update or delete a project activity"""

    permission_classes = [HasPCREditAccess]

    def patch(self, request, pk):
        activity = get_object_or_404(
            PCRProjectActivity.objects.select_related(
                "agency_report__agency", "agency_report__pcr"
            ),
            pk=pk,
        )

        agency_report = activity.agency_report
        self.check_object_permissions(request, agency_report.pcr)

        if (
            not agency_report.is_unlocked
            and agency_report.status != PCRAgencyReport.ReportStatus.DRAFT
        ):
            raise ValidationError("Cannot edit submitted report unless unlocked.")

        serializer = PCRProjectActivitySerializer(
            activity, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        activity = get_object_or_404(
            PCRProjectActivity.objects.select_related(
                "agency_report__agency", "agency_report__pcr"
            ),
            pk=pk,
        )

        agency_report = activity.agency_report
        self.check_object_permissions(request, agency_report.pcr)

        if (
            not agency_report.is_unlocked
            and agency_report.status != PCRAgencyReport.ReportStatus.DRAFT
        ):
            raise ValidationError("Cannot edit submitted report unless unlocked.")

        activity.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Section 2 - Overall Assessment


class PCROverallAssessmentUpdateView(APIView):
    """Create or update overall assessment for an agency report"""

    permission_classes = [HasPCREditAccess]

    def post(self, request, agency_report_id):
        agency_report = get_object_or_404(
            PCRAgencyReport.objects.select_related("agency", "pcr"), pk=agency_report_id
        )

        self.check_object_permissions(request, agency_report.pcr)

        if (
            not agency_report.is_unlocked
            and agency_report.status != PCRAgencyReport.ReportStatus.DRAFT
        ):
            raise ValidationError("Cannot edit submitted report unless unlocked.")

        # Get or create overall assessment
        assessment, created = PCROverallAssessment.objects.get_or_create(
            agency_report=agency_report
        )

        serializer = PCROverallAssessmentSerializer(
            assessment, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                serializer.data,
                status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Section 2 - Comments


class PCRCommentCreateView(APIView):
    """Create a comment on either agency report or main PCR"""

    permission_classes = [HasPCREditAccess]

    def post(self, request):
        # Determine if this is for agency report or PCR
        agency_report_id = request.data.get("agency_report_id")
        pcr_id = request.data.get("pcr_id")

        if agency_report_id:
            agency_report = get_object_or_404(
                PCRAgencyReport.objects.select_related("pcr"), pk=agency_report_id
            )

            self.check_object_permissions(request, agency_report.pcr)

            if (
                not agency_report.is_unlocked
                and agency_report.status != PCRAgencyReport.ReportStatus.DRAFT
            ):
                raise ValidationError("Cannot edit submitted report unless unlocked.")

            serializer = PCRCommentSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(agency_report=agency_report)
                return Response(serializer.data, status=status.HTTP_201_CREATED)

        elif pcr_id:
            pcr = get_object_or_404(ProjectCompletionReport, pk=pcr_id)

            self.check_object_permissions(request, pcr)

            serializer = PCRCommentSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(pcr=pcr)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            raise ValidationError("Either agency_report_id or pcr_id is required.")

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PCRCommentUpdateView(APIView):
    """Update or delete a comment"""

    permission_classes = [HasPCREditAccess]

    def patch(self, request, pk):
        comment = get_object_or_404(
            PCRComment.objects.select_related("agency_report__pcr", "pcr"), pk=pk
        )

        pcr = comment.agency_report.pcr if comment.agency_report else comment.pcr
        self.check_object_permissions(request, pcr)

        serializer = PCRCommentSerializer(comment, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        comment = get_object_or_404(
            PCRComment.objects.select_related("agency_report__pcr", "pcr"), pk=pk
        )

        pcr = comment.agency_report.pcr if comment.agency_report else comment.pcr
        self.check_object_permissions(request, pcr)

        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Section 3 - Causes of Delay


class PCRCauseOfDelayView(APIView):
    """Create, update, or delete a cause of delay"""

    permission_classes = [HasPCREditAccess]

    def post(self, request, agency_report_id):
        agency_report = get_object_or_404(
            PCRAgencyReport.objects.select_related("agency", "pcr"), pk=agency_report_id
        )

        self.check_object_permissions(request, agency_report.pcr)

        if (
            not agency_report.is_unlocked
            and agency_report.status != PCRAgencyReport.ReportStatus.DRAFT
        ):
            raise ValidationError("Cannot edit submitted report unless unlocked.")

        serializer = PCRCauseOfDelayWriteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(agency_report=agency_report)
            read_serializer = PCRCauseOfDelayReadSerializer(serializer.instance)
            return Response(read_serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        cause = get_object_or_404(
            PCRCauseOfDelay.objects.select_related(
                "agency_report__agency", "agency_report__pcr"
            ),
            pk=pk,
        )

        self.check_object_permissions(request, cause.agency_report.pcr)

        if (
            not cause.agency_report.is_unlocked
            and cause.agency_report.status != PCRAgencyReport.ReportStatus.DRAFT
        ):
            raise ValidationError("Cannot edit submitted report unless unlocked.")

        serializer = PCRCauseOfDelayWriteSerializer(
            cause, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            read_serializer = PCRCauseOfDelayReadSerializer(serializer.instance)
            return Response(read_serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        cause = get_object_or_404(
            PCRCauseOfDelay.objects.select_related(
                "agency_report__agency", "agency_report__pcr"
            ),
            pk=pk,
        )

        self.check_object_permissions(request, cause.agency_report.pcr)

        if (
            not cause.agency_report.is_unlocked
            and cause.agency_report.status != PCRAgencyReport.ReportStatus.DRAFT
        ):
            raise ValidationError("Cannot edit submitted report unless unlocked.")

        cause.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Section 4 - Lessons Learned


class PCRLessonLearnedView(APIView):
    """Create, update, or delete a lesson learned"""

    permission_classes = [HasPCREditAccess]

    def post(self, request, agency_report_id):
        agency_report = get_object_or_404(
            PCRAgencyReport.objects.select_related("agency", "pcr"), pk=agency_report_id
        )

        self.check_object_permissions(request, agency_report.pcr)

        if (
            not agency_report.is_unlocked
            and agency_report.status != PCRAgencyReport.ReportStatus.DRAFT
        ):
            raise ValidationError("Cannot edit submitted report unless unlocked.")

        serializer = PCRLessonLearnedWriteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(agency_report=agency_report)
            read_serializer = PCRLessonLearnedReadSerializer(serializer.instance)
            return Response(read_serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        lesson = get_object_or_404(
            PCRLessonLearned.objects.select_related(
                "agency_report__agency", "agency_report__pcr"
            ),
            pk=pk,
        )

        self.check_object_permissions(request, lesson.agency_report.pcr)

        if (
            not lesson.agency_report.is_unlocked
            and lesson.agency_report.status != PCRAgencyReport.ReportStatus.DRAFT
        ):
            raise ValidationError("Cannot edit submitted report unless unlocked.")

        serializer = PCRLessonLearnedWriteSerializer(
            lesson, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            read_serializer = PCRLessonLearnedReadSerializer(serializer.instance)
            return Response(read_serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        lesson = get_object_or_404(
            PCRLessonLearned.objects.select_related(
                "agency_report__agency", "agency_report__pcr"
            ),
            pk=pk,
        )

        self.check_object_permissions(request, lesson.agency_report.pcr)

        if (
            not lesson.agency_report.is_unlocked
            and lesson.agency_report.status != PCRAgencyReport.ReportStatus.DRAFT
        ):
            raise ValidationError("Cannot edit submitted report unless unlocked.")

        lesson.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Section 4 - Recommendations


class PCRRecommendationCreateView(APIView):
    """Create a recommendation (can be on agency report or main PCR)"""

    permission_classes = [HasPCREditAccess]

    def post(self, request):
        agency_report_id = request.data.get("agency_report_id")
        pcr_id = request.data.get("pcr_id")

        if agency_report_id:
            agency_report = get_object_or_404(
                PCRAgencyReport.objects.select_related("pcr"), pk=agency_report_id
            )

            self.check_object_permissions(request, agency_report.pcr)

            if (
                not agency_report.is_unlocked
                and agency_report.status != PCRAgencyReport.ReportStatus.DRAFT
            ):
                raise ValidationError("Cannot edit submitted report unless unlocked.")

            serializer = PCRRecommendationSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(agency_report=agency_report)
                return Response(serializer.data, status=status.HTTP_201_CREATED)

        elif pcr_id:
            pcr = get_object_or_404(ProjectCompletionReport, pk=pcr_id)

            self.check_object_permissions(request, pcr)

            serializer = PCRRecommendationSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(pcr=pcr)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            raise ValidationError("Either agency_report_id or pcr_id is required.")

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PCRRecommendationUpdateView(APIView):
    """Update or delete a recommendation"""

    permission_classes = [HasPCREditAccess]

    def patch(self, request, pk):
        recommendation = get_object_or_404(
            PCRRecommendation.objects.select_related("agency_report__pcr", "pcr"), pk=pk
        )

        pcr = (
            recommendation.agency_report.pcr
            if recommendation.agency_report
            else recommendation.pcr
        )
        self.check_object_permissions(request, pcr)

        serializer = PCRRecommendationSerializer(
            recommendation, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        recommendation = get_object_or_404(
            PCRRecommendation.objects.select_related("agency_report__pcr", "pcr"), pk=pk
        )

        pcr = (
            recommendation.agency_report.pcr
            if recommendation.agency_report
            else recommendation.pcr
        )
        self.check_object_permissions(request, pcr)

        recommendation.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Section 5 - Gender Mainstreaming


class PCRGenderMainstreamingView(APIView):
    """Create, update, or delete a gender mainstreaming entry"""

    permission_classes = [HasPCREditAccess]

    def post(self, request, agency_report_id):
        agency_report = get_object_or_404(
            PCRAgencyReport.objects.select_related("agency", "pcr"), pk=agency_report_id
        )

        self.check_object_permissions(request, agency_report.pcr)

        if (
            not agency_report.is_unlocked
            and agency_report.status != PCRAgencyReport.ReportStatus.DRAFT
        ):
            raise ValidationError("Cannot edit submitted report unless unlocked.")

        serializer = PCRGenderMainstreamingSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(agency_report=agency_report)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        gender = get_object_or_404(
            PCRGenderMainstreaming.objects.select_related(
                "agency_report__agency", "agency_report__pcr"
            ),
            pk=pk,
        )

        self.check_object_permissions(request, gender.agency_report.pcr)

        if (
            not gender.agency_report.is_unlocked
            and gender.agency_report.status != PCRAgencyReport.ReportStatus.DRAFT
        ):
            raise ValidationError("Cannot edit submitted report unless unlocked.")

        serializer = PCRGenderMainstreamingSerializer(
            gender, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        gender = get_object_or_404(
            PCRGenderMainstreaming.objects.select_related(
                "agency_report__agency", "agency_report__pcr"
            ),
            pk=pk,
        )

        self.check_object_permissions(request, gender.agency_report.pcr)

        if (
            not gender.agency_report.is_unlocked
            and gender.agency_report.status != PCRAgencyReport.ReportStatus.DRAFT
        ):
            raise ValidationError("Cannot edit submitted report unless unlocked.")

        gender.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Section 6 - SDG contributions


class PCRSDGContributionView(APIView):
    """Create, update, or delete an SDG contribution"""

    permission_classes = [HasPCREditAccess]

    def post(self, request, agency_report_id):
        agency_report = get_object_or_404(
            PCRAgencyReport.objects.select_related("agency", "pcr"), pk=agency_report_id
        )

        self.check_object_permissions(request, agency_report.pcr)

        if (
            not agency_report.is_unlocked
            and agency_report.status != PCRAgencyReport.ReportStatus.DRAFT
        ):
            raise ValidationError("Cannot edit submitted report unless unlocked.")

        serializer = PCRSDGContributionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(agency_report=agency_report)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        sdg_contrib = get_object_or_404(
            PCRSDGContribution.objects.select_related(
                "agency_report__agency", "agency_report__pcr"
            ),
            pk=pk,
        )

        self.check_object_permissions(request, sdg_contrib.agency_report.pcr)

        if (
            not sdg_contrib.agency_report.is_unlocked
            and sdg_contrib.agency_report.status != PCRAgencyReport.ReportStatus.DRAFT
        ):
            raise ValidationError("Cannot edit submitted report unless unlocked.")

        serializer = PCRSDGContributionSerializer(
            sdg_contrib, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        sdg_contrib = get_object_or_404(
            PCRSDGContribution.objects.select_related(
                "agency_report__agency", "agency_report__pcr"
            ),
            pk=pk,
        )

        self.check_object_permissions(request, sdg_contrib.agency_report.pcr)

        if (
            not sdg_contrib.agency_report.is_unlocked
            and sdg_contrib.agency_report.status != PCRAgencyReport.ReportStatus.DRAFT
        ):
            raise ValidationError("Cannot edit submitted report unless unlocked.")

        sdg_contrib.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Section 7 - Tranche data


class PCRTrancheDataUpdateView(APIView):
    """Update editable fields in tranche data"""

    permission_classes = [HasPCREditAccess]

    def patch(self, request, pk):
        tranche = get_object_or_404(
            PCRTrancheData.objects.select_related("pcr", "agency"), pk=pk
        )

        self.check_object_permissions(request, tranche.pcr)

        # Check if PCR is editable
        if tranche.pcr.status == ProjectCompletionReport.Status.SUBMITTED:
            if not request.user.has_perm("core.can_view_all_agencies"):
                raise ValidationError("Cannot edit submitted PCR.")

        serializer = PCRTrancheDataWriteSerializer(
            tranche, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()

            # Return full tranche data
            read_serializer = PCRTrancheDataReadSerializer(tranche)
            return Response(read_serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Section 8 - Supporting Evidence


class PCRSupportingEvidenceUploadView(APIView):
    """Upload supporting evidence file"""

    permission_classes = [HasPCREditAccess]

    def post(self, request):
        # Get PCR or agency report
        pcr_id = request.data.get("pcr_id")
        agency_report_id = request.data.get("agency_report_id")

        if pcr_id:
            pcr = get_object_or_404(ProjectCompletionReport, pk=pcr_id)

            self.check_object_permissions(request, pcr)

            serializer = PCRSupportingEvidenceSerializer(
                data=request.data, context={"request": request}
            )
            if serializer.is_valid():
                serializer.save(pcr=pcr)
                return Response(serializer.data, status=status.HTTP_201_CREATED)

        elif agency_report_id:
            agency_report = get_object_or_404(
                PCRAgencyReport.objects.select_related("pcr"), pk=agency_report_id
            )

            self.check_object_permissions(request, agency_report.pcr)

            if (
                not agency_report.is_unlocked
                and agency_report.status != PCRAgencyReport.ReportStatus.DRAFT
            ):
                raise ValidationError(
                    "Cannot upload to submitted report unless unlocked."
                )

            serializer = PCRSupportingEvidenceSerializer(
                data=request.data, context={"request": request}
            )
            if serializer.is_valid():
                serializer.save(agency_report=agency_report)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            raise ValidationError("Either pcr_id or agency_report_id is required.")

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PCRSupportingEvidenceDeleteView(DestroyAPIView):
    """Delete supporting evidence file"""

    permission_classes = [HasPCREditAccess]
    queryset = PCRSupportingEvidence.objects.select_related("agency_report__pcr", "pcr")

    def perform_destroy(self, instance):
        pcr = instance.agency_report.pcr if instance.agency_report else instance.pcr
        self.check_object_permissions(self.request, pcr)

        # Delete the file and database record
        if instance.file:
            instance.file.delete()
        instance.delete()


# Lock/Unlock views


class PCRToggleLockView(APIView):
    """
    Toggle lock status for an agency report (MLFS only).
    Allows MLFS to unlock submitted reports for editing.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        user = request.user

        # Only MLFS users can unlock
        if not user.has_perm("core.can_view_all_agencies"):
            raise ValidationError("Only MLFS users can unlock agency reports.")

        agency_report = get_object_or_404(PCRAgencyReport, pk=pk)

        # Toggle the lock
        agency_report.is_unlocked = not agency_report.is_unlocked
        agency_report.save()

        serializer = PCRAgencyReportSummarySerializer(agency_report)
        return Response(serializer.data)


class PCRSubmitView(APIView):
    """
    Submit the entire PCR (lead agency only).
    All agency reports must be submitted first.
    """

    permission_classes = [HasPCRSubmitAccess]

    def post(self, request, pk):
        user = request.user
        pcr = get_object_or_404(
            ProjectCompletionReport.objects.prefetch_related("agency_reports"), pk=pk
        )

        self.check_object_permissions(request, pcr)

        # Check all agency reports are submitted
        all_submitted = all(
            ar.status == PCRAgencyReport.ReportStatus.SUBMITTED
            for ar in pcr.agency_reports.all()
        )
        if not all_submitted:
            raise ValidationError(
                "All agency reports must be submitted before submitting the PCR."
            )

        # Update PCR status and submission dates
        pcr.status = ProjectCompletionReport.Status.SUBMITTED
        pcr.submitter = user

        # Track first and last submission dates
        submission_dt = timezone.now()
        if not pcr.first_submission_date:
            pcr.first_submission_date = submission_dt
        pcr.last_submission_date = submission_dt
        pcr.save()

        # Update aggregations
        pcr.update_aggregations()

        serializer = ProjectCompletionReportReadSerializer(
            pcr, context={"request": request}
        )
        return Response(serializer.data)
