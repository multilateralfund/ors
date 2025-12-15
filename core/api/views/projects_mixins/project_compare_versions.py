from rest_framework.decorators import action

from core.models import Project
from core.api.export.single_project_v2.compare_versions_as_xlsx import (
    CompareVersionsProjectExport,
)


class ProjectCompareVersionsMixin:
    @action(methods=["GET"], url_path="compare-versions", detail=True)
    def compare_versions(self, request, *args, **kwargs):
        project_id = request.query_params.getlist("project_id", [])
        queryset = Project.objects.really_all().filter(id__in=project_id)

        exporter = CompareVersionsProjectExport(
            project=self.get_object(),
            queryset=queryset,
        )
        return exporter.export()
