from rest_framework.response import Response
from rest_framework.views import APIView
from core.models.project_completion_report import PCR


class PCRRatingView(APIView):
    """
    View to return a list of all PCR Rating choices
    """

    def get(self, request, *args, **kwargs):
        choices = PCR.Rating.choices
        return Response(choices)


class PCRCompletedByView(APIView):
    """
    View to return a list of all PCR CompletedBy choices
    """

    def get(self, request, *args, **kwargs):
        choices = PCR.CompletedBy.choices
        return Response(choices)
