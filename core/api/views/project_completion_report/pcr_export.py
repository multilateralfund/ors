import mimetypes

from django.conf import settings
from django.http import FileResponse, Http404, HttpResponse
from django.utils.http import content_disposition_header
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, viewsets
from rest_framework.decorators import action

from core.api.permissions import HasPCRViewAccess
from core.api.serializers.pcr_export import PCRExportSerializer
from core.models.project_completion_report import PCRExport


def _content_type(filename):
    return mimetypes.guess_type(filename)[0] or "application/octet-stream"


class PCRExportViewSet(mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """
    The PCR bulk exports of the user, generated in the background. They are created
    with `pcr-metaprojects/export_pcrs/`; the status is polled until the export is
    completed and the file can be downloaded.
    """

    serializer_class = PCRExportSerializer
    permission_classes = [HasPCRViewAccess]

    def get_queryset(self):
        return PCRExport.objects.filter(created_by=self.request.user)

    @extend_schema(request=None, responses={200: OpenApiTypes.BINARY})
    @action(methods=["GET"], detail=True)
    def download(self, request, *args, **kwargs):
        export = self.get_object()
        if (
            export.status != PCRExport.Status.COMPLETED
            or not export.file
            or not export.file.storage.exists(export.file.name)
        ):
            raise Http404("The export file is not available.")

        if settings.PROTECTED_MEDIA_X_ACCEL_REDIRECT:
            # The export can be over 1 GB; nginx sends it, so the download does
            # not block a gunicorn worker (and is not stopped by its timeout)
            response = HttpResponse(content_type=_content_type(export.filename))
            response["Content-Disposition"] = content_disposition_header(
                True, export.filename
            )
            response["X-Accel-Redirect"] = (
                f"{settings.PROTECTED_MEDIA_X_ACCEL_PREFIX}{export.file.name}"
            )
            return response

        return FileResponse(
            export.file.open("rb"), as_attachment=True, filename=export.filename
        )
