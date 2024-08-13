import os
import urllib

from django.core.exceptions import PermissionDenied
from django.http import HttpResponse
from rest_framework import generics, mixins, status
from rest_framework.response import Response

from core.api.filters.country_programme import CPFileFilter
from core.api.permissions import IsCountryUser, IsSecretariat
from core.api.serializers.cp_file import CPFileSerializer
from core.models.country_programme import CPFile


class CPFilesView(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.DestroyModelMixin,
    generics.GenericAPIView,
):
    """
    API endpoint that allows uploading country programme files.
    """

    permission_classes = [IsSecretariat | IsCountryUser]
    queryset = CPFile.objects.select_related("country")
    serializer_class = CPFileSerializer
    filterset_class = CPFileFilter

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

    def _check_country_user(self):
        user = self.request.user
        country_id = self.request.query_params.get("country_id")
        if (
            user.user_type == user.UserType.COUNTRY_USER
            and user.country_id != country_id
        ):
            raise PermissionDenied("User represents other country")

    def get(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

    def _files_create(self, request, *args, **kwargs):
        country_id = request.query_params.get("country_id")
        year = request.query_params.get("year")
        self._check_country_user()

        cp_files = []
        files = request.FILES
        if not files:
            return Response(
                {"files": "Files not provided"}, status=status.HTTP_400_BAD_REQUEST
            )

        existing_files = CPFile.objects.filter(
            country_id=country_id, year=year, filename__in=list(files.keys())
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

            cp_files.append(
                CPFile(
                    country_id=country_id,
                    year=year,
                    filename=filename,
                    file=file,
                )
            )

        CPFile.objects.bulk_create(cp_files)
        return Response({}, status=status.HTTP_201_CREATED)

    def post(self, request, *args, **kwargs):
        return self._files_create(request, *args, **kwargs)

    def delete(self, request, *args, **kwargs):
        self._check_country_user()

        file_ids = request.data.get("file_ids")
        queryset = self.filter_queryset(self.get_queryset())
        queryset.filter(id__in=file_ids).delete()

        return Response({}, status=status.HTTP_204_NO_CONTENT)


class CPFilesDownloadView(generics.RetrieveAPIView):
    permission_classes = [IsSecretariat | IsCountryUser]
    queryset = CPFile.objects.all()
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
