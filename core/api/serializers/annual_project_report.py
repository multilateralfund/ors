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

# pylint: disable=W0223, W0613


class AnnualProjectReportReadSerializer(serializers.ModelSerializer):
    """
    Read serializer for AnnualProjectReport.
    Returns a flat structure with both derived (from Project) and editable fields.
    """

    # TODO: some fields might need SerializerMethodFields instead to avoid null FKs

    # Project identification - derived fields
    meta_code = serializers.CharField(
        source="project.meta_project.new_code", read_only=True
    )
    project_code = serializers.CharField(source="project.code", read_only=True)
    legacy_code = serializers.CharField(source="project.legacy_code", read_only=True)
    agency_name = serializers.CharField(
        source="project.agency.name", read_only=True, allow_null=True
    )
    # TODO: is it ok to use cluster.name below? or should it be cluster.code?
    cluster_name = serializers.CharField(source="project.cluster.name", read_only=True)
    region_name = serializers.CharField(
        source="project.country.parent.name", read_only=True
    )
    country_name = serializers.CharField(
        source="project.country.name", read_only=True, allow_null=True
    )
    type_code = serializers.CharField(
        source="project.project_type.code", read_only=True, allow_null=True
    )
    sector_code = serializers.CharField(source="project.sector.code", read_only=True)
    project_title = serializers.CharField(source="project.title", read_only=True)

    # Project date data fields - derived
    date_approved = serializers.DateField(
        source="project.date_approved", read_only=True, allow_null=True
    )
    date_completion_proposal = serializers.DateField(
        source="project.date_completion", read_only=True, allow_null=True
    )

    # Project date data fields - input
    status = serializers.CharField(required=False)
    date_first_disbursement = serializers.DateField(allow_null=True, required=False)
    date_planned_completion = serializers.DateField(allow_null=True, required=False)
    date_actual_completion = serializers.DateField(allow_null=True, required=False)
    date_financial_completion = serializers.DateField(allow_null=True, required=False)

    # Phaseout data fields - derived
    consumption_phased_out_odp_proposal = serializers.SerializerMethodField(
        read_only=True
    )
    consumption_phased_out_co2_proposal = serializers.SerializerMethodField(
        read_only=True
    )
    production_phased_out_odp_proposal = serializers.SerializerMethodField(
        read_only=True
    )
    production_phased_out_co2_proposal = serializers.SerializerMethodField(
        read_only=True
    )

    # Phaseout data fields - input
    consumption_phased_out_odp = serializers.FloatField(allow_null=True, required=False)
    consumption_phased_out_co2 = serializers.FloatField(allow_null=True, required=False)
    production_phased_out_odp = serializers.FloatField(allow_null=True, required=False)
    production_phased_out_co2 = serializers.FloatField(allow_null=True, required=False)

    # Financial data fields - derived
    approved_funding = serializers.FloatField(
        source="project.total_fund", read_only=True, allow_null=True
    )
    adjustment = serializers.SerializerMethodField(read_only=True)

    # Financial data fields - calculated
    approved_funding_plus_adjustment = serializers.SerializerMethodField(read_only=True)
    per_cent_funds_disbursed = serializers.SerializerMethodField(read_only=True)
    balance = serializers.SerializerMethodField(read_only=True)

    # Financial data fields - derived (2)
    support_cost_approved = serializers.DecimalField(
        source="project.support_cost_psc",
        max_digits=20,
        decimal_places=2,
        read_only=True,
        allow_null=True,
    )
    support_cost_adjustment = serializers.SerializerMethodField(read_only=True)

    # Financial data fields - calculated (2)
    support_cost_approved_plus_adjustment = serializers.SerializerMethodField(
        read_only=True
    )
    support_cost_balance = serializers.SerializerMethodField(read_only=True)

    # Financial data fields - input
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

    # Project financial data fields - derived (3)
    implementation_delays_status_report_decisions = serializers.SerializerMethodField(
        read_only=True
    )
    date_of_completion_per_agreement_or_decisions = serializers.SerializerMethodField(
        read_only=True
    )

    # Narrative and indicator data fields - input
    last_year_remarks = serializers.CharField(
        allow_null=True, allow_blank=True, required=False
    )
    current_year_remarks = serializers.CharField(
        allow_null=True, allow_blank=True, required=False
    )
    gender_policy = serializers.BooleanField(allow_null=True, required=False)

    # Audit fields - extra (not in document)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = AnnualProjectReport
        excel_fields = [
            # Project identification - derived fields
            "meta_code",
            "project_code",
            "legacy_code",
            "agency_name",
            "cluster_name",
            "region_name",
            "country_name",
            "type_code",
            "sector_code",
            "project_title",
            # Project date data fields - derived
            "date_approved",
            "date_completion_proposal",
            # Project date data fields - input
            "status",
            "date_first_disbursement",
            "date_planned_completion",
            "date_actual_completion",
            "date_financial_completion",
            # Project phaseout data fields - derived
            "consumption_phased_out_odp_proposal",
            "consumption_phased_out_co2_proposal",
            "production_phased_out_odp_proposal",
            "production_phased_out_co2_proposal",
            # Project phaseout data fields - input
            "consumption_phased_out_odp",
            "consumption_phased_out_co2",
            "production_phased_out_odp",
            "production_phased_out_co2",
            # Project financial data fields - derived
            "approved_funding",
            "adjustment",
            # Project financial data fields - calculated
            "approved_funding_plus_adjustment",
            "per_cent_funds_disbursed",
            "balance",
            # Project financial data fields - derived (2)
            "support_cost_approved",
            "support_cost_adjustment",
            # Project financial data fields - calculated (2)
            "support_cost_approved_plus_adjustment",
            "support_cost_balance",
            # Project financial data fields - input
            "funds_disbursed",
            "funds_committed",
            "estimated_disbursement_current_year",
            "support_cost_disbursed",
            "support_cost_committed",
            "disbursements_made_to_final_beneficiaries",
            "funds_advanced",
            # Project financial data fields - derived (3)
            "implementation_delays_status_report_decisions",
            "date_of_completion_per_agreement_or_decisions",
            # Narrative and indicators data fields - input
            "last_year_remarks",
            "current_year_remarks",
            "gender_policy",
        ]

        api_only_fields = [
            "id",
            "project_id",
            # Audit
            "created_at",
            "updated_at",
        ]

        fields = excel_fields + api_only_fields

        read_only_fields = [
            "id",
            "project_id",
            # All derived *and* calculated fields
            "meta_code",
            "project_code",
            "legacy_code",
            "agency_name",
            "cluster_name",
            "region_name",
            "country_name",
            "type_code",
            "sector_code",
            "project_title",
            "date_approved",
            "date_completion_proposal",
            "consumption_phased_out_odp_proposal",
            "consumption_phased_out_co2_proposal",
            "production_phased_out_odp_proposal",
            "production_phased_out_co2_proposal",
            "approved_funding",
            "adjustment",
            "approved_funding_plus_adjustment",
            "per_cent_funds_disbursed",
            "balance",
            "support_cost_approved",
            "support_cost_adjustment",
            "support_cost_approved_plus_adjustment",
            "support_cost_balance",
            "implementation_delays_status_report_decisions",
            "date_of_completion_per_agreement_or_decisions",
            # And the audit fields
            "created_at",
            "updated_at",
        ]

    def get_consumption_phased_out_odp_proposal(self, obj):
        # TODO; how do we use version 3?
        # I think I just need to check that obj.project version is >= 3
        if not obj.project or not obj.project.ods_odp.exists():
            return None

        return sum(
            ods_odp.odp or Decimal("0")
            for ods_odp in obj.project.ods_odp.all()
            if ods_odp.ods_type != ods_odp.ProjectOdsOdpType.PRODUCTION
        )

    def get_consumption_phased_out_co2_proposal(self, obj):
        if not obj.project or not obj.project.ods_odp.exists():
            return None

        return sum(
            ods_odp.co2_mt or Decimal("0")
            for ods_odp in obj.project.ods_odp.all()
            if ods_odp.ods_type != ods_odp.ProjectOdsOdpType.PRODUCTION
        )

    def get_production_phased_out_odp_proposal(self, obj):
        if not obj.project or not obj.project.ods_odp.exists():
            return None

        return sum(
            ods_odp.odp or Decimal("0")
            for ods_odp in obj.project.ods_odp.all()
            if ods_odp.ods_type == ods_odp.ProjectOdsOdpType.PRODUCTION
        )

    def get_production_phased_out_co2_proposal(self, obj):
        if not obj.project or not obj.project.ods_odp.exists():
            return None

        return sum(
            ods_odp.co2_mt or Decimal("0")
            for ods_odp in obj.project.ods_odp.all()
            if ods_odp.ods_type == ods_odp.ProjectOdsOdpType.PRODUCTION
        )

    def get_adjustment(self, obj):
        # TODO - flesh it out as:
        # Approved Funding in the last version - Approved Funding in Version 3
        return Decimal("0")

    def get_approved_funding_plus_adjustment(self, obj):
        # TODO - flesh it out based on a model method
        return Decimal("0")

    def get_per_cent_funds_disbursed(self, obj):
        # TODO - flesh it out based on a model method
        return Decimal("0")

    def get_balance(self, obj):
        # TODO - flesh it out based on a model method
        return Decimal("0")

    def get_support_cost_adjustment(self, obj):
        # TODO: Support cost in the latest version - Support cost in version 3
        return Decimal("0")

    def get_support_cost_approved_plus_adjustment(self, obj):
        # TODO: Support Cost Approved + Support Cost Adjustment
        # This would much better be a model method!
        return Decimal("0")

    def get_support_cost_balance(self, obj):
        # TODO: Support Costs Approved Funding plus Adjustments (US$) - Support Cost Disbursed (US$)
        # This would much better be a model method!
        return Decimal("0")

    def get_implementation_delays_status_report_decisions(self, obj):
        # TODO: need to ask MLFS bout this field
        return ""

    def get_date_of_completion_per_agreement_or_decisions(self, obj):
        return obj.project.date_completion


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

    is_unlocked = serializers.BooleanField(read_only=True)
    is_endorsed = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = AnnualAgencyProjectReport
        fields = [
            "id",
            "progress_report",
            "progress_report_year",
            "agency",
            "agency_id",
            "status",
            "is_unlocked",
            "is_endorsed",
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

    def get_is_endorsed(self, obj):
        return obj.is_endorsed()


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
    # Project date data fields - input
    status = serializers.CharField(required=False)
    date_first_disbursement = serializers.DateField(allow_null=True, required=False)
    date_planned_completion = serializers.DateField(allow_null=True, required=False)
    date_actual_completion = serializers.DateField(allow_null=True, required=False)
    date_financial_completion = serializers.DateField(allow_null=True, required=False)

    # Phaseout data fields - input
    consumption_phased_out_odp = serializers.FloatField(allow_null=True, required=False)
    consumption_phased_out_co2 = serializers.FloatField(allow_null=True, required=False)
    production_phased_out_odp = serializers.FloatField(allow_null=True, required=False)
    production_phased_out_co2 = serializers.FloatField(allow_null=True, required=False)

    # Financial data fields - input
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

    # Narrative and indicator data fields - input
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
            # Project date data fields - input
            "status",
            "date_first_disbursement",
            "date_planned_completion",
            "date_actual_completion",
            "date_financial_completion",
            # Project phaseout data fields - input
            "consumption_phased_out_odp",
            "consumption_phased_out_co2",
            "production_phased_out_odp",
            "production_phased_out_co2",
            # Project financial data fields - input
            "funds_disbursed",
            "funds_committed",
            "estimated_disbursement_current_year",
            "support_cost_disbursed",
            "support_cost_committed",
            "disbursements_made_to_final_beneficiaries",
            "funds_advanced",
            # Narrative and indicators data fields - input
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
                except Exception as e:  # pylint: disable=broad-exception-caught
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
