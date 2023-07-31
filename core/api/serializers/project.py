from rest_framework import serializers

from core.models.project import Project
from core.models.project import ProjectStatus
from core.models.project_submission import ProjectSubmission


class ProjectStatusSerializer(serializers.ModelSerializer):
    """
    ProjectStatusSerializer class
    """

    class Meta:
        model = ProjectStatus
        fields = [
            "id",
            "code",
            "name",
            "color",
        ]


class ProjectSubmissionSerializer(serializers.ModelSerializer):
    """
    ProjectSubmissionSerializer class
    """

    class Meta:
        model = ProjectSubmission
        fields = [
            "id",
            "category",
            "submission_number",
            "programme_officer",
            "impact_tranche",
            "funds_allocated",
            "support_cost_13",
            "date_approved",
            "contingency_cost",
            "project_cost",
            "date_received",
            "revision_number",
            "date_of_revision",
            "agency_remarks",
            "comments",
            "withdrawn",
            "issue",
            "issue_description",
            "incomplete",
            "reviewed_mfs",
            "correspondance_no",
            "plus",
        ]


class ProjectSerializer(serializers.ModelSerializer):
    """
    ProjectSerializer class
    """

    country = serializers.SlugRelatedField("name", read_only=True)
    agency = serializers.SlugRelatedField("name", read_only=True)
    sector = serializers.SerializerMethodField()
    subsector = serializers.SlugRelatedField("name", read_only=True)
    project_type = serializers.SlugRelatedField("name", read_only=True)
    status = serializers.SlugRelatedField("name", read_only=True)
    submission = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id",
            "title",
            "country",
            "agency",
            "sector",
            "subsector",
            "project_type",
            "status",
            "substance_type",
            "approval_meeting_no",
            "submission",
        ]

    def get_submission(self, obj):
        request = self.context.get("request")
        if (
            request
            and request.query_params.get("get_submission", None)
            and hasattr(obj, "submission")
        ):
            return ProjectSubmissionSerializer(obj.submission).data
        return None

    def get_sector(self, obj):
        return obj.subsector.sector.name
