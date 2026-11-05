from typing import cast

from rest_framework import mixins, viewsets

from core.models import User
from core.api.permissions import DenyAll, HasPCRViewAccess
from core.api.serializers.project_completion_report import OldPCRDetailSerializer
from core.api.views.project_completion_report.utils import (
    get_pcr_accessible_meta_projects,
)
from core.models.project_completion_report import OLD_PCR


class OldPCRViewSet(viewsets.GenericViewSet, mixins.RetrieveModelMixin):
    """
    Read-only access to the legacy PCRs (developed outside the platform).
    """

    serializer_class = OldPCRDetailSerializer

    @property
    def permission_classes(self):
        if self.action == "retrieve":
            return [HasPCRViewAccess]
        return [DenyAll]

    def get_queryset(self):
        return (
            OLD_PCR.objects.filter(
                meta_project__in=get_pcr_accessible_meta_projects(
                    cast(User, self.request.user)
                )
            )
            .select_related("meta_project")
            .prefetch_related(
                "activities__sector",
                "delay_explanations__agency",
                "delay_explanations__category",
                "learned_lessons__agency",
                "learned_lessons__category",
                "supporting_evidences",
            )
        )
