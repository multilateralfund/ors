import os

from django.core.exceptions import PermissionDenied
from rest_framework import generics, status
from rest_framework.response import Response

from core.api.filters.country_programme import CPFileFilter
from core.api.permissions import IsUserAllowedCP
from core.api.serializers.cp_file import CPFileSerializer
from core.models.country_programme import CPFile


class CPFilesView(generics.GenericAPIView):
    """
    API endpoint that allows uploading country programme files.
    """

    permission_classes = [IsUserAllowedCP]
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
            raise PermissionDenied("Country user not allowed")

    def get(self, request, *args, **kwargs):
        self._check_country_user()

        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

    def _files_create(self, request, *args, **kwargs):
        country_id = request.query_params.get("country_id")
        year = request.query_params.get("year")
        self._check_country_user()

        file = request.FILES.get("file")
        if not file:
            return Response("File not provided", status=status.HTTP_400_BAD_REQUEST)

        extension = os.path.splitext(file.name)[-1]
        if extension not in self.ACCEPTED_EXTENSIONS:
            return Response("File is not valid", status=status.HTTP_400_BAD_REQUEST)

        CPFile.objects.create(
            country_id=country_id,
            year=year,
            filename=file.name,
            file=file,
        )
        return Response({}, status=status.HTTP_201_CREATED)

    def post(self, request, *args, **kwargs):
        return self._files_create(request, *args, **kwargs)

    def put(self, request, *args, **kwargs):
        return self._files_create(request, *args, **kwargs)

    def delete(self, request, *args, **kwargs):
        self._check_country_user()

        file_ids = request.data.get("file_ids", [])
        queryset = self.filter_queryset(self.get_queryset())
        queryset.filter(id__in=file_ids).delete()

        return Response({}, status=status.HTTP_204_NO_CONTENT)
