from drf_spectacular.utils import OpenApiExample, extend_schema
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models.project_completion_report import (
    PCR,
    PCRAdditionalComment,
    PCRDelayCategory,
    PCRGoal,
    PCRLearnedLessonCategory,
    PCRProjectComponentOption,
    PCRSupportingEvidenceSection,
)

from core.api.serializers.project_completion_report import (
    PCRDelayCategorySerializer,
    PCRGoalSerializer,
    PCRLearnedLessonCategorySerializer,
    PCRProjectComponentOptionSerializer,
    PCRSupportingEvidenceSectionSerializer,
)


class PCRRatingView(APIView):
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


class PCRCompletedByView(APIView):
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


class PCREntityView(APIView):
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


class PCRDelayCategoryView(ListAPIView):
    queryset = PCRDelayCategory.objects.all()
    serializer_class = PCRDelayCategorySerializer


class PCRGoalView(ListAPIView):
    queryset = PCRGoal.objects.all()
    serializer_class = PCRGoalSerializer


class PCRLearnedLessonCategoryView(ListAPIView):
    queryset = PCRLearnedLessonCategory.objects.all()
    serializer_class = PCRLearnedLessonCategorySerializer


class PCRProjectComponentOptionView(ListAPIView):
    queryset = PCRProjectComponentOption.objects.all()
    serializer_class = PCRProjectComponentOptionSerializer


class PCRSupportingEvidenceSectionView(ListAPIView):
    queryset = PCRSupportingEvidenceSection.objects.all()
    serializer_class = PCRSupportingEvidenceSectionSerializer
