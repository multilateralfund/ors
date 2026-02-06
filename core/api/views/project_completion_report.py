from datetime import date

from django.db.models import Q
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
from core.models.project import MetaProject, Project
from core.api.serializers.project_completion_report import (
    DelayCategorySerializer,
    LearnedLessonCategorySerializer,
    PCRGenderPhaseSerializer,
    PCRProjectElementSerializer,
    PCRSDGSerializer,
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
from core.models.project_complition_report import (
    DelayCategory,
    LearnedLessonCategory,
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


# Project types that do not require PCR
PCR_EXCLUDED_PROJECT_TYPES = {"INS", "PRP", "TAS"}


# Reference Data


class PCRReferenceDataView(APIView):
    """
    Returns all "static" reference data needed for PCR forms:
    category names, project elements etc.
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


class PCRWorkspaceView(ListAPIView):
    """
    Returns active PCRs for the current user.

    For agencies: Returns PCRs in DRAFT status or (SUBMITTED but unlocked).
    For MLFS: Returns all SUBMITTED PCRs, regardless of locked status.
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
        ).prefetch_related("tranches__agency")

        if not user.has_perm("core.can_view_all_agencies"):
            if hasattr(user, "agency") and user.agency:
                queryset = queryset.filter(
                    Q(tranches__agency=user.agency)
                    | Q(project__agency=user.agency)
                    | Q(project__lead_agency=user.agency)
                    | Q(meta_project__lead_agency=user.agency)
                ).distinct()
            else:
                queryset = queryset.none()

            queryset = queryset.filter(
                Q(status=ProjectCompletionReport.Status.DRAFT)
                | Q(
                    status=ProjectCompletionReport.Status.SUBMITTED,
                    is_unlocked=True,
                )
            )
        else:
            queryset = queryset.filter(status=ProjectCompletionReport.Status.SUBMITTED)

        return queryset.order_by("-date_updated")


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
        ).prefetch_related("tranches__agency")

        # Filter by user's agency if not MLFS
        if not user.has_perm("core.can_view_all_agencies"):
            if hasattr(user, "agency") and user.agency:
                # Agency user sees PCRs where their agency is involved via:
                # 1. Tranches
                # 2. Project's agency (for IND projects)
                # 3. Project's lead_agency (for IND projects)
                # 4. Meta project's lead_agency (for MYA projects)
                queryset = queryset.filter(
                    Q(tranches__agency=user.agency)
                    | Q(project__agency=user.agency)
                    | Q(project__lead_agency=user.agency)
                    | Q(meta_project__lead_agency=user.agency)
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


class PCRCreateView(APIView):
    """
    Create a new PCR for a project (IND) or meta_project (MYA).

    It is unclear what happens with all possible project types.

    Request body should contain one of:
    - project_id: ID of the project (for IND projects)
    - meta_project_id: ID of the meta_project (for MYA projects)
    """

    permission_classes = [HasPCREditAccess]

    def post(self, request):
        user = request.user
        project_id = request.data.get("project_id")
        meta_project_id = request.data.get("meta_project_id")

        # Validate exactly one of project_id or meta_project_id is provided
        if project_id and meta_project_id:
            raise ValidationError(
                "Only one of project_id or meta_project_id should be provided."
            )
        if not project_id and not meta_project_id:
            raise ValidationError("Either project_id or meta_project_id is required.")

        project = None
        meta_project = None
        projects_for_tranches = []

        if project_id:
            project = get_object_or_404(Project, pk=project_id)

            if (
                project.project_type
                and project.project_type.code in PCR_EXCLUDED_PROJECT_TYPES
            ):
                raise ValidationError(
                    f"Projects of type '{project.project_type.name}' do not require a PCR."
                )

            if not user.has_perm("core.can_view_all_agencies"):
                user_agency = getattr(user, "agency", None)
                if not user_agency:
                    raise ValidationError("User has no agency assigned.")
                # TODO: understand what else besides agency/lead_agency is relevant!
                if user_agency not in (project.agency, project.lead_agency):
                    raise ValidationError(
                        "You do not have permission to create a PCR for this project."
                    )

            if ProjectCompletionReport.objects.filter(project=project).exists():
                raise ValidationError(
                    f"A PCR already exists for project {project.code}."
                )

            projects_for_tranches = [project]

        else:
            meta_project = get_object_or_404(MetaProject, pk=meta_project_id)

            if not user.has_perm("core.can_view_all_agencies"):
                user_agency = getattr(user, "agency", None)
                if not user_agency:
                    raise ValidationError("User has no agency assigned.")
                if meta_project.lead_agency != user_agency:
                    raise ValidationError(
                        "You do not have permission to create PCR for this meta project."
                    )

            if ProjectCompletionReport.objects.filter(
                meta_project=meta_project
            ).exists():
                raise ValidationError(
                    f"A PCR already exists for meta project {meta_project.umbrella_code}."
                )

            projects_for_tranches = list(meta_project.projects.all())
            if not projects_for_tranches:
                raise ValidationError("No projects found under this meta project.")

        # Now finally create the PCR for what the user selected
        pcr = ProjectCompletionReport.objects.create(
            project=project,
            meta_project=meta_project,
            status=ProjectCompletionReport.Status.DRAFT,
            created_by=user,
        )

        self._create_tranche_data(pcr, projects_for_tranches, user)
        # Update aggregations after creating tranches
        pcr.update_aggregations()

        serializer = ProjectCompletionReportReadSerializer(
            pcr, context={"request": request}
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def _create_tranche_data(self, pcr, projects, user):
        """
        Create PCRTrancheData entries for each project with pre-populated fields.

        Pre-filled from project master data:
        - Project code
        - Type
        - Sector
        - Agency
        - Tranche number
        - Date approved
        - Actual date of completion
        - Funds approved
        - ODP phase-out (approved/actual)
        - HFC phase-down (approved/actual)
        """
        for project in projects:
            # Determine agency (prefer lead_agency, fall back to agency)
            agency = project.lead_agency or project.agency

            # Get pre-filled values from project data
            project_code = project.code or ""
            project_type = str(project.project_type) if project.project_type else ""
            sector = str(project.sector) if project.sector else ""
            tranche_number = project.tranche
            date_approved = project.date_approved or date.today()
            actual_date_completion = project.date_completion
            funds_approved = project.total_fund or 0

            # Calculate ODP/HFC from project data if available
            odp_approved = self._get_project_odp_approved(project)
            odp_actual = self._get_project_odp_actual(project)
            hfc_approved = self._get_project_hfc_approved(project)
            hfc_actual = self._get_project_hfc_actual(project)

            # Get planned completion date if available
            planned_completion = (
                getattr(project, "date_comp_revised", None)
                or getattr(project, "date_completion", None)
                or date.today()
            )

            PCRTrancheData.objects.create(
                pcr=pcr,
                project=project,
                agency=agency,
                project_code=project_code,
                project_type=project_type,
                sector=sector,
                tranche_number=tranche_number,
                date_approved=date_approved,
                actual_date_completion=actual_date_completion,
                funds_approved=funds_approved,
                odp_phaseout_approved=odp_approved,
                odp_phaseout_actual=odp_actual,
                hfc_phasedown_approved=hfc_approved,
                hfc_phasedown_actual=hfc_actual,
                funds_disbursed=0,
                planned_completion_date=planned_completion,
                created_by=user,
            )

    def _get_project_odp_approved(self, project):
        return project.total_phase_out_odp_tonnes

    def _get_project_odp_actual(self, project):
        latest_apr = project.annual_reports.order_by(
            "-report__progress_report__year"
        ).first()
        if latest_apr and latest_apr.consumption_phased_out_odp is not None:
            return latest_apr.consumption_phased_out_odp
        return None

    def _get_project_hfc_approved(self, project):
        return project.total_phase_out_co2_tonnes

    def _get_project_hfc_actual(self, project):
        latest_apr = project.annual_reports.order_by(
            "-report__progress_report__year"
        ).first()
        if latest_apr and latest_apr.consumption_phased_out_co2 is not None:
            return latest_apr.consumption_phased_out_co2
        return None


class PCRDetailView(RetrieveAPIView):
    """
    Retrieve a specific PCR with all nested related data included.
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
            "activities",
            "overall_assessments",
            "comments",
            "causes_of_delay__project_element",
            "causes_of_delay__categories__category",
            "lessons_learned__project_element",
            "lessons_learned__categories__category",
            "recommendations",
            "gender_mainstreaming__phase",
            "sdg_contributions__sdg",
            "tranches__agency",
            "tranches__technologies__substance_from",
            "tranches__technologies__substance_to",
            "tranches__enterprises",
            "tranches__trainees",
            "tranches__equipment_disposals",
            "supporting_evidence",
        )

        if not user.has_perm("core.can_view_all_agencies"):
            if hasattr(user, "agency") and user.agency:
                # TODO: should really factor this out in a manager method
                queryset = queryset.filter(
                    Q(tranches__agency=user.agency)
                    | Q(project__agency=user.agency)
                    | Q(project__lead_agency=user.agency)
                    | Q(meta_project__lead_agency=user.agency)
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

        # Check if PCR is editable
        # TODO: this check keeps repeating, maybe we can turn it into a method
        if (
            pcr.status == ProjectCompletionReport.Status.SUBMITTED
            and not pcr.is_unlocked
        ):
            raise ValidationError(
                "Cannot edit submitted PCR. Please request MLFS to unlock it first."
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


class PCRProjectActivityCreateView(APIView):
    """Create a project activity for a PCR"""

    permission_classes = [HasPCREditAccess]

    def post(self, request, pcr_id):
        pcr = get_object_or_404(ProjectCompletionReport, pk=pcr_id)
        self.check_object_permissions(request, pcr)

        # Check if PCR is editable
        if (
            pcr.status == ProjectCompletionReport.Status.SUBMITTED
            and not pcr.is_unlocked
        ):
            raise ValidationError(
                "Cannot edit submitted PCR. Please request MLFS to unlock it first."
            )

        serializer = PCRProjectActivitySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(pcr=pcr)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PCRProjectActivityUpdateView(APIView):
    """Update or delete a project activity"""

    permission_classes = [HasPCREditAccess]

    def patch(self, request, pk):
        activity = get_object_or_404(
            PCRProjectActivity.objects.select_related("pcr"),
            pk=pk,
        )
        self.check_object_permissions(request, activity.pcr)

        # Check if PCR is editable
        if (
            activity.pcr.status == ProjectCompletionReport.Status.SUBMITTED
            and not activity.pcr.is_unlocked
        ):
            raise ValidationError(
                "Cannot edit submitted PCR. Please request MLFS to unlock it first."
            )

        serializer = PCRProjectActivitySerializer(
            activity, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        activity = get_object_or_404(
            PCRProjectActivity.objects.select_related("pcr"),
            pk=pk,
        )
        self.check_object_permissions(request, activity.pcr)

        activity.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Section 2 - Overall Assessment


class PCROverallAssessmentUpdateView(APIView):
    """Create or update overall assessment for a PCR"""

    permission_classes = [HasPCREditAccess]

    def post(self, request, pcr_id):
        pcr = get_object_or_404(ProjectCompletionReport, pk=pcr_id)
        self.check_object_permissions(request, pcr)

        # Check if PCR is editable
        if (
            pcr.status == ProjectCompletionReport.Status.SUBMITTED
            and not pcr.is_unlocked
        ):
            raise ValidationError(
                "Cannot edit submitted PCR. Please request MLFS to unlock it first."
            )

        # Get or create the overall assessment (should be only one per PCR)
        try:
            assessment = pcr.overall_assessments.get()
            serializer = PCROverallAssessmentSerializer(
                assessment, data=request.data, partial=True
            )
            status_code = status.HTTP_200_OK
        except PCROverallAssessment.DoesNotExist:
            serializer = PCROverallAssessmentSerializer(data=request.data)
            status_code = status.HTTP_201_CREATED
        except PCROverallAssessment.MultipleObjectsReturned:
            # Handle edge case - use the most recent one
            assessment = pcr.overall_assessments.order_by("-date_created").first()
            serializer = PCROverallAssessmentSerializer(
                assessment, data=request.data, partial=True
            )
            status_code = status.HTTP_200_OK

        if serializer.is_valid():
            serializer.save(pcr=pcr)
            return Response(serializer.data, status=status_code)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Section 2 - Comments


class PCRCommentCreateView(APIView):
    """Create a comment on a PCR"""

    permission_classes = [HasPCREditAccess]

    def post(self, request):
        pcr_id = request.data.get("pcr_id")

        if not pcr_id:
            raise ValidationError("pcr_id is required.")

        pcr = get_object_or_404(ProjectCompletionReport, pk=pcr_id)
        self.check_object_permissions(request, pcr)

        # Check if PCR is editable
        if (
            pcr.status == ProjectCompletionReport.Status.SUBMITTED
            and not pcr.is_unlocked
        ):
            raise ValidationError(
                "Cannot edit submitted PCR. Please request MLFS to unlock it first."
            )

        serializer = PCRCommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(pcr=pcr)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PCRCommentUpdateView(APIView):
    """Update or delete a comment"""

    permission_classes = [HasPCREditAccess]

    def patch(self, request, pk):
        comment = get_object_or_404(PCRComment.objects.select_related("pcr"), pk=pk)
        self.check_object_permissions(request, comment.pcr)

        # Check if PCR is editable
        if (
            comment.pcr.status == ProjectCompletionReport.Status.SUBMITTED
            and not comment.pcr.is_unlocked
        ):
            raise ValidationError(
                "Cannot edit submitted PCR. Please request MLFS to unlock it first."
            )

        serializer = PCRCommentSerializer(comment, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        comment = get_object_or_404(PCRComment.objects.select_related("pcr"), pk=pk)
        self.check_object_permissions(request, comment.pcr)

        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Section 3 - Causes of Delay


class PCRCauseOfDelayView(APIView):
    """Create, update, or delete a cause of delay"""

    permission_classes = [HasPCREditAccess]

    def post(self, request, pcr_id):
        pcr = get_object_or_404(ProjectCompletionReport, pk=pcr_id)
        self.check_object_permissions(request, pcr)

        # Check if PCR is editable
        if (
            pcr.status == ProjectCompletionReport.Status.SUBMITTED
            and not pcr.is_unlocked
        ):
            raise ValidationError(
                "Cannot edit submitted PCR. Please request MLFS to unlock it first."
            )

        serializer = PCRCauseOfDelayWriteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(pcr=pcr)
            read_serializer = PCRCauseOfDelayReadSerializer(serializer.instance)
            return Response(read_serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        cause = get_object_or_404(PCRCauseOfDelay.objects.select_related("pcr"), pk=pk)
        self.check_object_permissions(request, cause.pcr)

        # Check if PCR is editable
        if (
            cause.pcr.status == ProjectCompletionReport.Status.SUBMITTED
            and not cause.pcr.is_unlocked
        ):
            raise ValidationError(
                "Cannot edit submitted PCR. Please request MLFS to unlock it first."
            )

        serializer = PCRCauseOfDelayWriteSerializer(
            cause, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            read_serializer = PCRCauseOfDelayReadSerializer(serializer.instance)
            return Response(read_serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        cause = get_object_or_404(PCRCauseOfDelay.objects.select_related("pcr"), pk=pk)
        self.check_object_permissions(request, cause.pcr)

        cause.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Section 4 - Lessons Learned


class PCRLessonLearnedView(APIView):
    """Create, update, or delete a lesson learned"""

    permission_classes = [HasPCREditAccess]

    def post(self, request, pcr_id):
        pcr = get_object_or_404(ProjectCompletionReport, pk=pcr_id)
        self.check_object_permissions(request, pcr)

        # Check if PCR is editable
        if (
            pcr.status == ProjectCompletionReport.Status.SUBMITTED
            and not pcr.is_unlocked
        ):
            raise ValidationError(
                "Cannot edit submitted PCR. Please request MLFS to unlock it first."
            )

        serializer = PCRLessonLearnedWriteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(pcr=pcr)
            read_serializer = PCRLessonLearnedReadSerializer(serializer.instance)
            return Response(read_serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        lesson = get_object_or_404(
            PCRLessonLearned.objects.select_related("pcr"), pk=pk
        )
        self.check_object_permissions(request, lesson.pcr)

        # Check if PCR is editable
        if (
            lesson.pcr.status == ProjectCompletionReport.Status.SUBMITTED
            and not lesson.pcr.is_unlocked
        ):
            raise ValidationError(
                "Cannot edit submitted PCR. Please request MLFS to unlock it first."
            )

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
            PCRLessonLearned.objects.select_related("pcr"), pk=pk
        )
        self.check_object_permissions(request, lesson.pcr)

        lesson.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Section 4 - Recommendations


class PCRRecommendationCreateView(APIView):
    """Create a recommendation"""

    permission_classes = [HasPCREditAccess]

    def post(self, request):
        pcr_id = request.data.get("pcr_id")

        if not pcr_id:
            raise ValidationError("pcr_id is required.")

        pcr = get_object_or_404(ProjectCompletionReport, pk=pcr_id)
        self.check_object_permissions(request, pcr)

        # Check if PCR is editable
        if (
            pcr.status == ProjectCompletionReport.Status.SUBMITTED
            and not pcr.is_unlocked
        ):
            raise ValidationError(
                "Cannot edit submitted PCR. Please request MLFS to unlock it first."
            )

        serializer = PCRRecommendationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(pcr=pcr)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PCRRecommendationUpdateView(APIView):
    """Update or delete a recommendation"""

    permission_classes = [HasPCREditAccess]

    def patch(self, request, pk):
        recommendation = get_object_or_404(
            PCRRecommendation.objects.select_related("pcr"), pk=pk
        )
        self.check_object_permissions(request, recommendation.pcr)

        # Check if PCR is editable
        if (
            recommendation.pcr.status == ProjectCompletionReport.Status.SUBMITTED
            and not recommendation.pcr.is_unlocked
        ):
            raise ValidationError(
                "Cannot edit submitted PCR. Please request MLFS to unlock it first."
            )

        serializer = PCRRecommendationSerializer(
            recommendation, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        recommendation = get_object_or_404(
            PCRRecommendation.objects.select_related("pcr"), pk=pk
        )
        self.check_object_permissions(request, recommendation.pcr)

        recommendation.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Section 5 - Gender Mainstreaming


class PCRGenderMainstreamingView(APIView):
    """Create, update, or delete a gender mainstreaming entry"""

    permission_classes = [HasPCREditAccess]

    def post(self, request, pcr_id):
        pcr = get_object_or_404(ProjectCompletionReport, pk=pcr_id)
        self.check_object_permissions(request, pcr)

        # Check if PCR is editable
        if (
            pcr.status == ProjectCompletionReport.Status.SUBMITTED
            and not pcr.is_unlocked
        ):
            raise ValidationError(
                "Cannot edit submitted PCR. Please request MLFS to unlock it first."
            )

        serializer = PCRGenderMainstreamingSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(pcr=pcr)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        gender = get_object_or_404(
            PCRGenderMainstreaming.objects.select_related("pcr"), pk=pk
        )
        self.check_object_permissions(request, gender.pcr)

        # Check if PCR is editable
        if (
            gender.pcr.status == ProjectCompletionReport.Status.SUBMITTED
            and not gender.pcr.is_unlocked
        ):
            raise ValidationError(
                "Cannot edit submitted PCR. Please request MLFS to unlock it first."
            )

        serializer = PCRGenderMainstreamingSerializer(
            gender, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        gender = get_object_or_404(
            PCRGenderMainstreaming.objects.select_related("pcr"), pk=pk
        )
        self.check_object_permissions(request, gender.pcr)

        gender.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Section 6 - SDG contributions


class PCRSDGContributionView(APIView):
    """Create, update, or delete an SDG contribution"""

    permission_classes = [HasPCREditAccess]

    def post(self, request, pcr_id):
        pcr = get_object_or_404(ProjectCompletionReport, pk=pcr_id)
        self.check_object_permissions(request, pcr)

        # Check if PCR is editable
        if (
            pcr.status == ProjectCompletionReport.Status.SUBMITTED
            and not pcr.is_unlocked
        ):
            raise ValidationError(
                "Cannot edit submitted PCR. Please request MLFS to unlock it first."
            )

        serializer = PCRSDGContributionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(pcr=pcr)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        sdg_contrib = get_object_or_404(
            PCRSDGContribution.objects.select_related("pcr"), pk=pk
        )
        self.check_object_permissions(request, sdg_contrib.pcr)

        # Check if PCR is editable
        if (
            sdg_contrib.pcr.status == ProjectCompletionReport.Status.SUBMITTED
            and not sdg_contrib.pcr.is_unlocked
        ):
            raise ValidationError(
                "Cannot edit submitted PCR. Please request MLFS to unlock it first."
            )

        serializer = PCRSDGContributionSerializer(
            sdg_contrib, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        sdg_contrib = get_object_or_404(
            PCRSDGContribution.objects.select_related("pcr"), pk=pk
        )
        self.check_object_permissions(request, sdg_contrib.pcr)

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
        if (
            tranche.pcr.status == ProjectCompletionReport.Status.SUBMITTED
            and not tranche.pcr.is_unlocked
        ):
            raise ValidationError(
                "Cannot edit submitted PCR. Please request MLFS to unlock it first."
            )

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
        pcr_id = request.data.get("pcr_id")

        if not pcr_id:
            raise ValidationError("pcr_id is required.")

        pcr = get_object_or_404(ProjectCompletionReport, pk=pcr_id)
        self.check_object_permissions(request, pcr)

        # Check if PCR is editable
        if (
            pcr.status == ProjectCompletionReport.Status.SUBMITTED
            and not pcr.is_unlocked
        ):
            raise ValidationError(
                "Cannot edit submitted PCR. Please request MLFS to unlock it first."
            )

        serializer = PCRSupportingEvidenceSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save(pcr=pcr)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PCRSupportingEvidenceDeleteView(DestroyAPIView):
    """Delete supporting evidence file"""

    permission_classes = [HasPCREditAccess]
    queryset = PCRSupportingEvidence.objects.select_related("pcr")

    def perform_destroy(self, instance):
        self.check_object_permissions(self.request, instance.pcr)

        # Delete the file and database record
        if instance.file:
            instance.file.delete()
        instance.delete()


# Lock/Unlock views


class PCRSubmitView(APIView):
    """
    Submit the entire PCR (can be done by lead agency only).
    """

    permission_classes = [HasPCRSubmitAccess]

    def post(self, request, pk):
        user = request.user
        pcr = get_object_or_404(ProjectCompletionReport, pk=pk)

        self.check_object_permissions(request, pcr)

        # Update PCR status and submission dates
        pcr.status = ProjectCompletionReport.Status.SUBMITTED
        pcr.submitter = user
        pcr.is_unlocked = False

        # Track first and last submission dates
        submission_dt = timezone.now()
        if not pcr.first_submission_date:
            pcr.first_submission_date = submission_dt
        pcr.last_submission_date = submission_dt
        pcr.save()

        pcr.update_aggregations()

        serializer = ProjectCompletionReportReadSerializer(
            pcr, context={"request": request}
        )
        return Response(serializer.data)


class PCRLockUnlockView(APIView):
    """
    Toggle lock/unlock for a submitted PCR (MLFS only).
    Request body should contain: {"is_unlocked": true} or {"is_unlocked": false}
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        # Only MLFS users can lock/unlock
        if not request.user.has_perm("core.can_view_all_agencies"):
            raise ValidationError("Only MLFS users can lock/unlock PCRs.")

        pcr = get_object_or_404(ProjectCompletionReport, pk=pk)

        # Only submitted PCRs can be locked/unlocked
        if pcr.status != ProjectCompletionReport.Status.SUBMITTED:
            raise ValidationError("Can only lock/unlock SUBMITTED PCRs.")

        is_unlocked = request.data.get("is_unlocked")
        if is_unlocked is None:
            raise ValidationError("Field 'is_unlocked' is required (true or false).")

        pcr.is_unlocked = bool(is_unlocked)
        pcr.save(update_fields=["is_unlocked", "date_updated"])

        action = "unlocked" if is_unlocked else "locked"
        return Response(
            {
                "message": f"PCR {action} successfully.",
                "is_unlocked": pcr.is_unlocked,
                "status": pcr.status,
            },
            status=status.HTTP_200_OK,
        )
