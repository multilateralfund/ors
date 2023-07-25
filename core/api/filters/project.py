from django_filters import rest_framework as filters


from core.models.project import Project


class ProjectFilter(filters.FilterSet):
    """
    Filter for country programme reports
    """

    status_id = filters.NumberFilter(field_name="status_id", lookup_expr="exact")
    sector_id = filters.NumberFilter(
        field_name="subsector__sector_id", lookup_expr="exact"
    )
    subsector_id = filters.NumberFilter(field_name="subsector_id", lookup_expr="exact")
    project_type_id = filters.NumberFilter(
        field_name="project_type_id", lookup_expr="exact"
    )
    substance_type = filters.CharFilter(
        field_name="substance_type", lookup_expr="iexact"
    )
    agency_id = filters.NumberFilter(field_name="agency_id", lookup_expr="exact")
    approval_meeting_no = filters.NumberFilter(field_name="approval_meeting_no")

    class Meta:
        model = Project
        fields = [
            "status_id",
            "sector_id",
            "subsector_id",
            "project_type_id",
            "substance_type",
            "agency_id",
            "approval_meeting_no",
        ]
