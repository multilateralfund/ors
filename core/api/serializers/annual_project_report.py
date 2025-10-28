from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from core.models import (
    AnnualProgressReport,
    AnnualAgencyProjectReport,
    AnnualProjectReport,
    AnnualProjectReportFile,
)
from core.api.serializers.agency import AgencySerializer


class AnnualProjectReportReadSerializer(serializers.ModelSerializer):
    """
    Read serializer for AnnualProjectReport.
    Returns a flat structure with both derived (from Project) and editable fields.
    """

    # === DERIVED FIELDS (from Project, read-only) ===
    # Project identification
    project_code = serializers.CharField(source="project.code", read_only=True)
    project_title = serializers.CharField(source="project.title", read_only=True)
    agency_name = serializers.CharField(
        source="project.agency.name", read_only=True, allow_null=True
    )
    country_name = serializers.CharField(
        source="project.country.name", read_only=True, allow_null=True
    )
    sector_name = serializers.CharField(
        source="project.sector.name", read_only=True, allow_null=True
    )
    subsector_names = serializers.SerializerMethodField(read_only=True)

    # Approval data
    meeting_number = serializers.IntegerField(
        source="project.meeting.number", read_only=True, allow_null=True
    )
    decision_number = serializers.CharField(
        source="project.decision.number", read_only=True, allow_null=True
    )
    date_approved = serializers.DateField(
        source="project.date_approved", read_only=True, allow_null=True
    )

    # Financial data (derived)
    project_funding = serializers.DecimalField(
        source="project.total_fund",
        max_digits=20,
        decimal_places=2,
        read_only=True,
        allow_null=True,
    )
    support_cost = serializers.DecimalField(
        source="project.support_cost_psc",
        max_digits=20,
        decimal_places=2,
        read_only=True,
        allow_null=True,
    )

    # Substance data (derived)
    baseline_technology = serializers.SerializerMethodField(read_only=True)
    replacement_technology = serializers.SerializerMethodField(read_only=True)
    phase_out_odp_tonnes = serializers.SerializerMethodField(read_only=True)
    phase_out_mt = serializers.SerializerMethodField(read_only=True)

    # === EDITABLE FIELDS (from AnnualProjectReport) ===
    # Date fields
    date_first_disbursement = serializers.DateField(allow_null=True, required=False)
    date_planned_completion = serializers.DateField(allow_null=True, required=False)
    date_actual_completion = serializers.DateField(allow_null=True, required=False)
    date_financial_completion = serializers.DateField(allow_null=True, required=False)

    # Phaseout fields
    consumption_phased_out_odp = serializers.FloatField(allow_null=True, required=False)
    consumption_phased_out_co2 = serializers.FloatField(allow_null=True, required=False)
    production_phased_out_odp = serializers.FloatField(allow_null=True, required=False)
    production_phased_out_co2 = serializers.FloatField(allow_null=True, required=False)

    # Financial fields
    funds_disbursed = serializers.FloatField(allow_null=True, required=False)
    funds_committed = serializers.FloatField(allow_null=True, required=False)
    estimated_disbursement_current_year = serializers.FloatField(
        allow_null=True, required=False
    )
    support_cost_disbursed = serializers.FloatField(allow_null=True, required=False)
    support_cost_committed = serializers.FloatField(allow_null=True, required=False)
    disbursements_made_to_final_beneficiaries = serializers.FloatField(
        allow_null=True, required=False
    )
    funds_advanced = serializers.FloatField(allow_null=True, required=False)

    # Narrative/indicator fields
    last_year_remarks = serializers.CharField(
        allow_null=True, allow_blank=True, required=False
    )
    current_year_remarks = serializers.CharField(
        allow_null=True, allow_blank=True, required=False
    )
    gender_policy = serializers.BooleanField(allow_null=True, required=False)

    # Audit fields
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = AnnualProjectReport
        fields = [
            "id",
            "project_id",
            # Derived fields (read-only, from Project)
            "project_code",
            "project_title",
            "agency_name",
            "country_name",
            "sector_name",
            "subsector_names",
            "meeting_number",
            "decision_number",
            "date_approved",
            "project_funding",
            "support_cost",
            "baseline_technology",
            "replacement_technology",
            "phase_out_odp_tonnes",
            "phase_out_mt",
            # Editable fields (read-write, from AnnualProjectReport)
            "date_first_disbursement",
            "date_planned_completion",
            "date_actual_completion",
            "date_financial_completion",
            "consumption_phased_out_odp",
            "consumption_phased_out_co2",
            "production_phased_out_odp",
            "production_phased_out_co2",
            "funds_disbursed",
            "funds_committed",
            "estimated_disbursement_current_year",
            "support_cost_disbursed",
            "support_cost_committed",
            "disbursements_made_to_final_beneficiaries",
            "funds_advanced",
            "last_year_remarks",
            "current_year_remarks",
            "gender_policy",
            # Audit
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "project_id",
            # All derived fields
            "project_code",
            "project_title",
            "agency_name",
            "country_name",
            "sector_name",
            "subsector_names",
            "meeting_number",
            "decision_number",
            "date_approved",
            "project_funding",
            "support_cost",
            "baseline_technology",
            "replacement_technology",
            "phase_out_odp_tonnes",
            "phase_out_mt",
            # Audit fields
            "created_at",
            "updated_at",
        ]

    def get_subsector_names(self, obj):
        """Get comma-separated list of subsector names."""
        if obj.project and obj.project.subsectors.exists():
            return ", ".join([s.name for s in obj.project.subsectors.all()])
        return None

    def get_baseline_technology(self, obj):
        """
        Get baseline technology from project ODS/ODP entries.
        Concatenate all baseline substances/blends.
        """
        if not obj.project or not obj.project.ods_odp.exists():
            return None

        technologies = []
        for odp in obj.project.ods_odp.all():
            if odp.ods_substance:
                technologies.append(odp.ods_substance.name)
            elif odp.ods_blend:
                technologies.append(odp.ods_blend.name)

        return ", ".join(technologies) if technologies else None

    def get_replacement_technology(self, obj):
        """Get replacement technology from project ODS/ODP entries."""
        if not obj.project or not obj.project.ods_odp.exists():
            return None

        replacements = [
            odp.ods_replacement
            for odp in obj.project.ods_odp.all()
            if odp.ods_replacement
        ]

        return ", ".join(replacements) if replacements else None

    def get_phase_out_odp_tonnes(self, obj):
        """Sum of ODP tonnes from all ODS/ODP entries."""
        if not obj.project or not obj.project.ods_odp.exists():
            return None

        total = sum([odp.odp or Decimal("0") for odp in obj.project.ods_odp.all()])

        return float(total) if total > 0 else None

    def get_phase_out_mt(self, obj):
        """Sum of metric tonnes from all ODS/ODP entries."""
        if not obj.project or not obj.project.ods_odp.exists():
            return None

        total = sum(
            [odp.phase_out_mt or Decimal("0") for odp in obj.project.ods_odp.all()]
        )

        return float(total) if total > 0 else None


class AnnualProjectReportFileSerializer(serializers.ModelSerializer):
    """Serializer for APR file attachments."""

    file_url = serializers.SerializerMethodField(read_only=True)
    file_size = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = AnnualProjectReportFile
        fields = [
            "id",
            "file",
            "file_name",
            "file_type",
            "file_url",
            "file_size",
            "date_created",
        ]
        read_only_fields = ["id", "date_created", "file_url", "file_size"]

    def get_file_url(self, obj):
        """Get download URL for the file."""
        if obj.file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.file.url)
        return None

    def get_file_size(self, obj):
        """Get file size in bytes."""
        if obj.file:
            return obj.file.size
        return None


class AnnualAgencyProjectReportReadSerializer(serializers.ModelSerializer):
    """
    Read serializer for AnnualAgencyProjectReport, with nested project reports & files
    """

    agency = AgencySerializer(read_only=True)
    agency_id = serializers.IntegerField(read_only=True)
    progress_report_year = serializers.IntegerField(
        source="progress_report.year", read_only=True
    )
    project_reports = AnnualProjectReportReadSerializer(
        many=True,
        read_only=True,
    )
    files = AnnualProjectReportFileSerializer(
        many=True,
        read_only=True,
    )
    total_projects = serializers.SerializerMethodField(read_only=True)
    created_by_username = serializers.CharField(
        source="created_by.username", read_only=True, allow_null=True
    )
    submitted_by_username = serializers.CharField(
        source="submitted_by.username", read_only=True, allow_null=True
    )

    class Meta:
        model = AnnualAgencyProjectReport
        fields = [
            "id",
            "progress_report",
            "progress_report_year",
            "agency",
            "agency_id",
            "status",
            "project_reports",
            "files",
            # Statistics
            "total_projects",
            # Audit
            "created_at",
            "updated_at",
            "created_by",
            "created_by_username",
            "submitted_at",
            "submitted_by",
            "submitted_by_username",
        ]
        read_only_fields = [
            "id",
            "progress_report",
            "progress_report_year",
            "agency",
            "agency_id",
            "project_reports",
            "files",
            "total_projects",
            "created_at",
            "updated_at",
            "created_by_username",
            "submitted_at",
            "submitted_by_username",
        ]

    def get_total_projects(self, obj):
        """Total number of projects in this agency report."""
        return obj.project_reports.count()


class AnnualProgressReportSerializer(serializers.ModelSerializer):
    """Serializer for AnnualProgressReport (yearly container)."""

    meeting_endorsed_number = serializers.IntegerField(
        source="meeting_endorsed.number", read_only=True, allow_null=True
    )
    agency_reports_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = AnnualProgressReport
        fields = [
            "id",
            "year",
            "meeting_endorsed",
            "meeting_endorsed_number",
            "date_endorsed",
            "remarks_endorsed",
            "endorsed",
            "agency_reports_count",
        ]
        read_only_fields = ["id", "meeting_endorsed_number", "agency_reports_count"]

    def get_agency_reports_count(self, obj):
        """Count of agency reports for this year."""
        return obj.agency_project_reports.count()


class AnnualProjectReportUpdateSerializer(serializers.ModelSerializer):
    """
    Write serializer for updating AnnualProjectReport.
    Only allows updating editable fields, not derived fields.
    Requires project_code for matching the correct project report.
    """

    # Required field for matching the project report
    project_code = serializers.CharField(write_only=True, required=True)

    # All editable fields are optional, as this endpoint supports partial updates
    # Date fields
    date_first_disbursement = serializers.DateField(allow_null=True, required=False)
    date_planned_completion = serializers.DateField(allow_null=True, required=False)
    date_actual_completion = serializers.DateField(allow_null=True, required=False)
    date_financial_completion = serializers.DateField(allow_null=True, required=False)

    # Phaseout fields
    consumption_phased_out_odp = serializers.FloatField(allow_null=True, required=False)
    consumption_phased_out_co2 = serializers.FloatField(allow_null=True, required=False)
    production_phased_out_odp = serializers.FloatField(allow_null=True, required=False)
    production_phased_out_co2 = serializers.FloatField(allow_null=True, required=False)

    # Financial fields
    funds_disbursed = serializers.FloatField(allow_null=True, required=False)
    funds_committed = serializers.FloatField(allow_null=True, required=False)
    estimated_disbursement_current_year = serializers.FloatField(
        allow_null=True, required=False
    )
    support_cost_disbursed = serializers.FloatField(allow_null=True, required=False)
    support_cost_committed = serializers.FloatField(allow_null=True, required=False)
    disbursements_made_to_final_beneficiaries = serializers.FloatField(
        allow_null=True, required=False
    )
    funds_advanced = serializers.FloatField(allow_null=True, required=False)

    # Narrative/indicator fields
    last_year_remarks = serializers.CharField(
        allow_null=True, allow_blank=True, required=False
    )
    current_year_remarks = serializers.CharField(
        allow_null=True, allow_blank=True, required=False
    )
    gender_policy = serializers.BooleanField(allow_null=True, required=False)

    class Meta:
        model = AnnualProjectReport
        fields = [
            # Project code is needed for matching rows
            "project_code",
            # Only editable fields should be here; derived fields absent
            "date_first_disbursement",
            "date_planned_completion",
            "date_actual_completion",
            "date_financial_completion",
            "consumption_phased_out_odp",
            "consumption_phased_out_co2",
            "production_phased_out_odp",
            "production_phased_out_co2",
            "funds_disbursed",
            "funds_committed",
            "estimated_disbursement_current_year",
            "support_cost_disbursed",
            "support_cost_committed",
            "disbursements_made_to_final_beneficiaries",
            "funds_advanced",
            "last_year_remarks",
            "current_year_remarks",
            "gender_policy",
        ]

    def validate_project_code(self, value):
        """Validate that project_code is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError("Project code cannot be empty.")
        return value.strip()


class AnnualProjectReportBulkUpdateSerializer(serializers.Serializer):
    """
    Serializer for bulk updating multiple AnnualProjectReport records.
    Used for the copy-paste functionality from Excel.
    """

    project_reports = AnnualProjectReportUpdateSerializer(many=True)

    def validate_project_reports(self, value):
        """
        Validate the list of project reports:
        1. Check for duplicate project codes
        2. Ensure list is not empty
        """
        if not value:
            raise serializers.ValidationError(
                "At least one project report must be provided."
            )

        # Check for duplicate project codes
        project_codes = [pr["project_code"] for pr in value]
        duplicates = [code for code in project_codes if project_codes.count(code) > 1]

        if duplicates:
            unique_duplicates = list(set(duplicates))
            raise serializers.ValidationError(
                f"Duplicate project codes found: {', '.join(unique_duplicates)}"
            )

        return value

    def update(self, instance, validated_data):
        """
        Update multiple AnnualProjectReport records.
        """
        project_reports_data = validated_data["project_reports"]
        project_reports_map = {}
        for pr in instance.project_reports.select_related("project").all():
            project_reports_map[pr.project.code] = pr

        updated_reports = []
        errors = []

        with transaction.atomic():
            for pr_data in project_reports_data:
                project_code = pr_data.pop("project_code")

                if project_code not in project_reports_map:
                    errors.append(
                        {
                            "project_code": project_code,
                            "error": (
                                f"Project with code `{project_code}` not found "
                                "in this agency report."
                            ),
                        }
                    )
                    continue

                project_report = project_reports_map[project_code]

                for field, value in pr_data.items():
                    setattr(project_report, field, value)

                try:
                    project_report.save()
                    updated_reports.append(project_report)
                except Exception as e:
                    errors.append({"project_code": project_code, "error": str(e)})

        return updated_reports, errors


class AnnualProjectReportFileUploadSerializer(serializers.ModelSerializer):
    """
    Serializer for uploading files to an agency report; validates file type
    """

    class Meta:
        model = AnnualProjectReportFile
        fields = ["file", "file_name", "file_type"]

    def validate(self, attrs):
        """
        Validate file type matches the file extension.
        For ANNUAL_PROGRESS_FINANCIAL_REPORT, only allow PDF/Word.
        """
        file_type = attrs.get("file_type")
        file = attrs.get("file")

        # TODO: I think I need an extra check here
        if (
            file_type
            == AnnualProjectReportFile.FileType.ANNUAL_PROGRESS_FINANCIAL_REPORT
        ):
            # Only allowing PDF and Word documents
            allowed_extensions = ["pdf", "doc", "docx"]
            file_extension = file.name.lower().split(".")[-1]

            if file_extension not in allowed_extensions:
                raise serializers.ValidationError(
                    {
                        "file": (
                            f"For Annual Progress & Financial Report, "
                            "only PDF and Word documents are allowed. "
                            f"Current file type: .{file_extension}"
                        )
                    }
                )

        return attrs

    def create(self, validated_data):
        """
        Create the file record.
        If file_type is ANNUAL_PROGRESS_FINANCIAL_REPORT and one already exists,
        delete the old one first (due to unique constraint).
        """
        report = validated_data.get("report")
        file_type = validated_data.get("file_type")

        # Check if we need to replace an existing file
        if (
            file_type
            == AnnualProjectReportFile.FileType.ANNUAL_PROGRESS_FINANCIAL_REPORT
        ):
            # Delete existing file of this type for this report
            AnnualProjectReportFile.objects.filter(
                report=report, file_type=file_type
            ).delete()

        return super().create(validated_data)


class AnnualAgencyProjectReportStatusUpdateSerializer(serializers.Serializer):
    """
    Serializer for updating the status of an agency report (e.g., submitting).
    """

    status = serializers.ChoiceField(
        choices=AnnualAgencyProjectReport.SubmissionStatus.choices, required=True
    )

    def validate_status(self, value):
        instance = self.instance

        if not instance:
            raise serializers.ValidationError("No report instance provided.")

        current_status = instance.status

        # TODO: allow transition back to draft, but only by MLFS
        allowed_transitions = {
            AnnualAgencyProjectReport.SubmissionStatus.DRAFT: [
                AnnualAgencyProjectReport.SubmissionStatus.SUBMITTED
            ],
            AnnualAgencyProjectReport.SubmissionStatus.SUBMITTED: [],
        }

        if value not in allowed_transitions.get(current_status, []):
            raise serializers.ValidationError(
                f"Cannot transition from '{current_status}' to '{value}'."
            )

        return value

    def update(self, instance, validated_data):
        new_status = validated_data["status"]
        instance.status = new_status

        # If submitting, set submission metadata
        if new_status == AnnualAgencyProjectReport.SubmissionStatus.SUBMITTED:
            instance.submitted_at = timezone.now()
            instance.submitted_by = self.context.get("request").user

        instance.save()
        return instance
