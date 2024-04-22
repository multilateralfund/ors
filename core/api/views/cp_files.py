from django.core.exceptions import PermissionDenied
from rest_framework import generics, status
from rest_framework.response import Response

from core.api.permissions import IsUserAllowedCP
from core.api.serializers.cp_file import CPFileSerializer
from core.models.country_programme import CPFile


class CPFilesView(generics.GenericAPIView):
    """
    API endpoint that allows uploading country programme files.
    """

    permission_classes = [IsUserAllowedCP]
    serializer_class = CPFileSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = CPFile.objects.select_related("country")
        if user.user_type == user.UserType.COUNTRY_USER:
            queryset = queryset.filter(country=user.country)
        return queryset

    def get(self, request, *args, **kwargs):
        user = self.request.user
        country_id = request.query_params.get("country_id")
        year = request.query_params.get("year")
        if (
            user.user_type == user.UserType.COUNTRY_USER
            and user.country_id != country_id
        ):
            raise PermissionDenied("Country user not allowed")

        queryset = self.filter_queryset(self.get_queryset())
        cp_files = queryset.filter(country_id=country_id, year=year)
        serializer = self.get_serializer(cp_files, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

    def _files_create(self, request, *args, **kwargs):
        country_id = request.query_params.get("country_id")
        year = request.query_params.get("year")

        files_data = request.data.get("files", [])
        for file_data in files_data:
            file_data["country_id"] = country_id
            file_data["year"] = year

        serializer = self.get_serializer(data=files_data, many=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def post(self, request, *args, **kwargs):
        return self._files_create(request, *args, **kwargs)

    def put(self, request, *args, **kwargs):
        return self._files_create(request, *args, **kwargs)

    def delete(self, request, *args, **kwargs):
        country_id = request.query_params.get("country_id")
        year = request.query_params.get("year")

        file_ids = request.data.get("file_ids", [])
        queryset = self.filter_queryset(self.get_queryset())
        queryset.filter(id__in=file_ids).delete()

        return Response({}, status=status.HTTP_204_NO_CONTENT)
