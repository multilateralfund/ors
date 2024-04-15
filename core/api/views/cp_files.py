from django.core.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.response import Response

from core.api.permissions import IsUserAllowedCP
from core.api.serializers.cp_file import CPFileArchiveSerializer, CPFileSerializer
from core.models.country_programme import CPFile, CPReport
from core.models.country_programme_archive import CPFileArchive

# pylint: disable=E1102


class CPFilesBaseView(generics.GenericAPIView):
    """
    API endpoint that allows updating country programme files.
    This is called with either POST or PUT on an already-existing CP Report.
    """

    permission_classes = [IsUserAllowedCP]
    cp_report_class = None
    cp_file_class = None
    serializer_class = None

    def get_queryset(self):
        user = self.request.user
        queryset = self.cp_file_class.objects.select_related("country_programme_report")
        if user.user_type == user.UserType.COUNTRY_USER:
            queryset = queryset.filter(country_programme_report__country=user.country)
        return queryset

    def _files_create(self, request, *args, **kwargs):
        cp_report_id = request.query_params.get("cp_report_id")
        cp_report = get_object_or_404(self.cp_report_class, id=cp_report_id)

        files_data = request.data.get("files", [])
        for file_data in files_data:
            file_data["country_programme_report_id"] = cp_report.id

        serializer = self.get_serializer(files_data, many=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        cp_report.last_updated_by = request.user
        cp_report.event_description = "Files created by user"
        cp_report.save()

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def post(self, request, *args, **kwargs):
        return self._files_create(request, *args, **kwargs)

    def put(self, request, *args, **kwargs):
        return self._files_create(request, *args, **kwargs)

    def delete(self, request, *args, **kwargs):
        cp_report_id = request.query_params.get("cp_report_id")
        cp_report = get_object_or_404(self.cp_report_class, id=cp_report_id)

        file_ids = request.data.get("file_ids", [])
        queryset = self.filter_queryset(self.get_queryset())
        queryset.filter(id__in=file_ids).delete()

        cp_report.last_updated_by = request.user
        cp_report.event_description = "Files deleted by user"
        cp_report.save()

        return Response({}, status=status.HTTP_204_NO_CONTENT)


class CPFilesView(CPFilesBaseView):
    cp_report_class = CPReport
    cp_file_class = CPFile
    serializer_class = CPFileSerializer

    def get(self, request, *args, **kwargs):
        user = self.request.user
        country_id = request.query_params.get("country_id")
        year = request.query_params.get("year")
        if (
            user.user_type == user.UserType.COUNTRY_USER
            and user.country_id != country_id
        ):
            raise PermissionDenied("Country user not allowed")

        cp_files = CPFile.objects.select_related("country_programme_report").filter(
            country_programme_report__country_id=country_id,
            year=year,
        )
        cp_files_ar = CPFileArchive.objects.select_related(
            "country_programme_report"
        ).filter(
            country_programme_report__country_id=country_id,
            year=year,
        )
        serializer = CPFileSerializer(cp_files, many=True)
        serializer_ar = CPFileArchiveSerializer(cp_files_ar, many=True)

        return Response(
            serializer.data + serializer_ar.data,
            status=status.HTTP_200_OK,
        )
