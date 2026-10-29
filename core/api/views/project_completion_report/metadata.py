from drf_spectacular.utils import OpenApiExample, extend_schema
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models.project_completion_report import (
    PCR,
    PCRAdditionalComment,
    PCRGoal,
    PCRLearnedLessonCategory,
    PCRDelayCluster,
    PCRRootCausesOfDelay,
    PCRSupportingEvidenceSection,
)

from core.api.serializers.project_completion_report import (
    PCRGoalSerializer,
    PCRLearnedLessonCategorySerializer,
    PCRDelayClusterSerializer,
    PCRRootCausesOfDelaySerializer,
    PCRSupportingEvidenceSectionSerializer,
)

from core.api.permissions import HasPCRViewAccess


class BaseMetadataView(APIView):
    permission_classes = [HasPCRViewAccess]


class PCRRatingView(BaseMetadataView):
    """
    View to return a list of all PCR Rating choices
    """

    @extend_schema(
        responses={200: list[tuple[str, str]]},
        examples=[
            OpenApiExample(
                "PCR rating choices",
                value=PCR.Rating.choices,
                response_only=True,
            )
        ],
    )
    def get(self, request, *args, **kwargs):
        choices = PCR.Rating.choices
        return Response(choices)


class PCRCompletedByView(BaseMetadataView):
    """
    View to return a list of all PCR CompletedBy choices
    """

    @extend_schema(
        responses={200: list[tuple[str, str]]},
        examples=[
            OpenApiExample(
                "PCR completed by choices",
                value=PCR.CompletedBy.choices,
                response_only=True,
            )
        ],
    )
    def get(self, request, *args, **kwargs):
        choices = PCR.CompletedBy.choices
        return Response(choices)


class PCRStatusView(BaseMetadataView):
    """
    View to return a list of all PCR Status choices
    """

    @extend_schema(
        responses={200: list[tuple[str, str]]},
        examples=[
            OpenApiExample(
                "PCR status choices",
                value=PCR.Status.choices,
                response_only=True,
            )
        ],
    )
    def get(self, request, *args, **kwargs):
        choices = PCR.Status.choices
        return Response(choices)


class PCREntityView(BaseMetadataView):
    """
    View to return a list of all PCRAdditionalComment Entity choices
    """

    @extend_schema(
        responses={200: list[tuple[str, str]]},
        examples=[
            OpenApiExample(
                "PCR additional comment entity choices",
                value=PCRAdditionalComment.Entity.choices,
                response_only=True,
            )
        ],
    )
    def get(self, request, *args, **kwargs):
        choices = PCRAdditionalComment.Entity.choices
        return Response(choices)


class PCRRootCausesOfDelayView(ListAPIView):
    queryset = PCRRootCausesOfDelay.objects.all()
    serializer_class = PCRRootCausesOfDelaySerializer


class PCRGoalView(ListAPIView):
    queryset = PCRGoal.objects.all()
    serializer_class = PCRGoalSerializer


class PCRLearnedLessonCategoryView(ListAPIView):
    queryset = PCRLearnedLessonCategory.objects.all()
    serializer_class = PCRLearnedLessonCategorySerializer


class PCRDelayClusterView(ListAPIView):
    queryset = PCRDelayCluster.objects.all()
    serializer_class = PCRDelayClusterSerializer


class PCRSupportingEvidenceSectionView(ListAPIView):
    queryset = PCRSupportingEvidenceSection.objects.all()
    serializer_class = PCRSupportingEvidenceSectionSerializer
