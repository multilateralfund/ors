import os
import urllib

from django.http import HttpResponse
from rest_framework import generics, mixins, status
from rest_framework.response import Response

from core.api.filters.business_plan import BPFileFilter
from core.api.serializers.bp_file import BPFileSerializer
from core.models.business_plan import BPFile


class BPFilesView(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.DestroyModelMixin,
    generics.GenericAPIView,
):
    """
    API endpoint that allows uploading business plan files.
    """

    queryset = BPFile.objects.select_related("agency")
    serializer_class = BPFileSerializer
    filterset_class = BPFileFilter

    ACCEPTED_EXTENSIONS = [
        ".pdf",
        ".doc",
        ".docx",
        ".xls",
        ".xlsx",
        ".csv",
        ".ppt",
        ".pptx",
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".zip",
        ".rar",
        ".7z",
    ]

    def get(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

    def _files_create(self, request, *args, **kwargs):
        agency_id = request.query_params.get("agency_id")
        year_start = request.query_params.get("year_start")
        year_end = request.query_params.get("year_end")

        bp_files = []
        files = request.FILES
        if not files:
            return Response(
                {"files": "Files not provided"}, status=status.HTTP_400_BAD_REQUEST
            )

        existing_files = BPFile.objects.filter(
            agency_id=agency_id,
            year_start=year_start,
            year_end=year_end,
            filename__in=list(files.keys()),
        )
        if existing_files:
            existing_filenames = existing_files.values_list("filename", flat=True)
            return Response(
                {"files": f"Some files already exist: {', '.join(existing_filenames)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        for filename, file in files.items():
            extension = os.path.splitext(filename)[-1]
            if extension not in self.ACCEPTED_EXTENSIONS:
                return Response(
                    {"files": f"File extension {extension} is not valid"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            bp_files.append(
                BPFile(
                    agency_id=agency_id,
                    year_start=year_start,
                    year_end=year_end,
                    filename=filename,
                    file=file,
                )
            )

        BPFile.objects.bulk_create(bp_files)
        return Response({}, status=status.HTTP_201_CREATED)

    def post(self, request, *args, **kwargs):
        return self._files_create(request, *args, **kwargs)

    def delete(self, request, *args, **kwargs):
        file_ids = request.data.get("file_ids")
        queryset = self.filter_queryset(self.get_queryset())
        queryset.filter(id__in=file_ids).delete()

        return Response({}, status=status.HTTP_204_NO_CONTENT)


class BPFilesDownloadView(generics.RetrieveAPIView):
    queryset = BPFile.objects.all()
    lookup_field = "id"

    def get(self, request, *args, **kwargs):
        obj = self.get_object()
        response = HttpResponse(
            obj.file.read(), content_type="application/octet-stream"
        )
        file_name = urllib.parse.quote(obj.filename)
        response["Content-Disposition"] = (
            f"attachment; filename*=UTF-8''{file_name}; filename=\"{file_name}\""
        )
        return response
