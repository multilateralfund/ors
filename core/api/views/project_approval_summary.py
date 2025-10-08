from rest_framework import mixins
from rest_framework import viewsets
from rest_framework.response import Response

from core.api.filters.project_approval_summary import ProjectApprovalSummaryFilter
from core.api.permissions import HasProjectV2ApproveAccess
from core.api.serializers.project_approval_summary import ApprovalSummarySerializer
from core.models import Project


class ProjectApprovalSummaryViewSet(
    viewsets.GenericViewSet,
    mixins.ListModelMixin,
):
    """ViewSet for approval summary."""

    filterset_class = ProjectApprovalSummaryFilter
    queryset = Project.objects.really_all()
    permission_classes = (HasProjectV2ApproveAccess,)


    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = ApprovalSummarySerializer(queryset)
        return Response(serializer.data)
