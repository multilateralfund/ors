from typing import cast

from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from rest_framework import mixins, viewsets
from rest_framework.decorators import action

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
        if self.action in ["retrieve", "download_supporting_evidence"]:
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

    @action(
        methods=["GET"],
        detail=True,
        url_path=r"supporting-evidences/(?P<evidence_id>\d+)/download",
    )
    def download_supporting_evidence(self, request, *args, evidence_id=None, **kwargs):
        """
        Download a legacy PCR report file. The files live in the protected
        storage, so they can't be served directly by nginx.
        """
        evidence = get_object_or_404(
            self.get_object().supporting_evidences, pk=evidence_id
        )
        if not evidence.file or not evidence.file.storage.exists(evidence.file.name):
            raise Http404("File not found.")
        return FileResponse(
            evidence.file.open("rb"),
            as_attachment=True,
            filename=evidence.filename or evidence.file.name.rsplit("/", 1)[-1],
        )
