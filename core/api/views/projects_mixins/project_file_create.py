import json
import os

from rest_framework import status
from rest_framework.response import Response

from core.models.project import ProjectFile

# pylint: disable=R0911


class ProjectFileCreateMixin:
    ACCEPTED_EXTENSIONS = [
        ".pdf",
        ".doc",
        ".docx",
        ".xls",
        ".xlsx",
        ".csv",
        ".ppt",
        ".pptx",
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
    ]

    def _file_create(self, request, dry_run, *args, **kwargs):
        files = request.FILES
        if not files:
            return Response(
                {"file": "File not provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        metadata = None
        try:
            metadata = json.loads(request.data.get("metadata", "/"))
        except json.JSONDecodeError:
            return Response(
                {"metadata": "Invalid JSON format"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        filenames = []
        for file in files.getlist("files"):
            filenames.append(file.name)
            extension = os.path.splitext(file.name)[-1]
            if extension not in self.ACCEPTED_EXTENSIONS:
                return Response(
                    {"file": f"File extension {extension} is not valid"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        if kwargs.get("project_id"):
            existing_file = ProjectFile.objects.filter(
                project_id=kwargs.get("project_id"),
                filename__in=filenames,
            ).values_list("filename", flat=True)

            if existing_file:
                return Response(
                    {
                        "files": "Some files already exist: "
                        + str(", ".join(existing_file)),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        for key, value in metadata.items():
            if key not in filenames:
                return Response(
                    {"metadata": f"Filename {key} not in uploaded files"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if value not in ProjectFile.FileType.values:
                return Response(
                    {"metadata": f"Type provided for {key} is not valid"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        if dry_run:
            return Response(
                {"message": "Files are valid and ready to be uploaded."},
                status=status.HTTP_201_CREATED,
            )
        project_files = []
        for file in files.getlist("files"):
            file_type = metadata.get(file.name)
            project_files.append(
                ProjectFile(
                    project_id=kwargs.get("project_id"),
                    filename=file.name,
                    type=file_type,
                    file=file,
                )
            )
        ProjectFile.objects.bulk_create(project_files)
        return Response({}, status=status.HTTP_201_CREATED)
