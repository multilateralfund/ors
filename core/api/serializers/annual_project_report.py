from django.db import transaction
from django.urls import reverse
from django.utils import timezone
from rest_framework import serializers

from core.models import (
    AnnualProgressReport,
    AnnualAgencyProjectReport,
    AnnualProjectReport,
    AnnualProjectReportFile,
    Meeting,
)
from core.api.serializers.agency import AgencySerializer

# pylint: disable=W0223, W0613


class AnnualProjectReportReadSerializer(serializers.ModelSerializer):
    """
    Read serializer for AnnualProjectReport.
    Returns a flat structure with both derived (from Project) and editable fields.
    """
    # PCR due - later-added derived field
    pcr_due = serializers.BooleanField(read_only=True)

    # Project identification - derived fields
    meta_code = serializers.CharField(source="meta_project_code", read_only=True)
    project_code = serializers.CharField(source="project.code", read_only=True)
    legacy_code = serializers.CharField(source="project.legacy_code", read_only=True)
    agency_name = serializers.CharField(
        source="project.agency.name", read_only=True, allow_null=True
    )
    # TODO: is it ok to use cluster.name below? or should it be cluster.code?
    cluster_name = serializers.CharField(
        source="project.cluster.name", read_only=True, allow_null=True
    )
    region_name = serializers.CharField(
        source="project.country.parent.name", read_only=True, allow_null=True
    )
    country_name = serializers.CharField(source="project.country.name", read_only=True)
    type_code = serializers.CharField(source="project_type", read_only=True)
    sector_code = serializers.CharField(source="project_sector", read_only=True)
    project_title = serializers.CharField(source="project.title", read_only=True)

    # Project date data fields - derived
    date_approved = serializers.DateField(read_only=True, allow_null=True)
    date_completion_proposal = serializers.DateField(read_only=True, allow_null=True)

    # Project date data fields - input
    status = serializers.CharField(allow_blank=True)
    date_first_disbursement = serializers.DateField(allow_null=True)
    date_planned_completion = serializers.DateField(allow_null=True)
    date_actual_completion = serializers.DateField(allow_null=True)
    date_financial_completion = serializers.DateField(allow_null=True)

    # Phaseout data fields - derived
    consumption_phased_out_odp_proposal = serializers.FloatField(
        read_only=True, allow_null=True
    )
    consumption_phased_out_co2_proposal = serializers.FloatField(
        read_only=True, allow_null=True
    )
    production_phased_out_odp_proposal = serializers.FloatField(
        read_only=True, allow_null=True
    )
    production_phased_out_co2_proposal = serializers.FloatField(
        read_only=True, allow_null=True
    )

    # Phaseout data fields - input
    consumption_phased_out_odp = serializers.FloatField(allow_null=True)
    consumption_phased_out_co2 = serializers.FloatField(allow_null=True)
    production_phased_out_odp = serializers.FloatField(allow_null=True)
    production_phased_out_co2 = serializers.FloatField(allow_null=True)

    # Financial data fields - derived
    approved_funding = serializers.FloatField(read_only=True, allow_null=True)
    adjustment = serializers.FloatField(read_only=True, allow_null=True)

    # Financial data fields - calculated
    approved_funding_plus_adjustment = serializers.FloatField(
        read_only=True, allow_null=True
    )
    per_cent_funds_disbursed = serializers.FloatField(read_only=True, allow_null=True)
    balance = serializers.FloatField(read_only=True, allow_null=True)

    # Financial data fields - derived (2)
    support_cost_approved = serializers.FloatField(
        read_only=True,
        allow_null=True,
    )
    support_cost_adjustment = serializers.FloatField(read_only=True, allow_null=True)

    # Financial data fields - calculated (2)
    support_cost_approved_plus_adjustment = serializers.FloatField(
        read_only=True, allow_null=True
    )
    support_cost_balance = serializers.FloatField(read_only=True, allow_null=True)

    # Financial data fields - input
    funds_disbursed = serializers.FloatField(allow_null=True)
    funds_committed = serializers.FloatField(allow_null=True)
    estimated_disbursement_current_year = serializers.FloatField(
        allow_null=True, required=False
    )
    support_cost_disbursed = serializers.FloatField(allow_null=True)
    support_cost_committed = serializers.FloatField(allow_null=True)
    disbursements_made_to_final_beneficiaries = serializers.FloatField(allow_null=True)
    funds_advanced = serializers.FloatField(allow_null=True)

    # Project financial data fields - derived (3)
    implementation_delays_status_report_decisions = serializers.CharField(
        allow_null=True, allow_blank=True, read_only=True
    )
    date_of_completion_per_agreement_or_decisions = serializers.DateField(
        read_only=True, allow_null=True
    )

    # Narrative and indicator data fields - input
    last_year_remarks = serializers.CharField(allow_null=True, allow_blank=True)
    current_year_remarks = serializers.CharField(allow_null=True, allow_blank=True)
    gender_policy = serializers.BooleanField(allow_null=True)

    # Audit fields - extra (not in document)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = AnnualProjectReport
        excel_fields = [
            # PCR due - later-added derived field
            "pcr_due",
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
            return reverse(
                "apr-file-download",
                kwargs={
                    "year": obj.report.progress_report.year,
                    "agency_id": obj.report.agency_id,
                    "pk": obj.pk,
                },
            )
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


class AnnualProjectReportUpdateSerializer(serializers.ModelSerializer):
    """
    Write serializer for updating AnnualProjectReport.
    Only allows updating editable fields, not derived fields.
    Requires project_code for matching the correct project report.
    """

    # ID is optional for agency, but needed for MLFS (checked in view)
    id = serializers.IntegerField(required=False, write_only=True)

    # Required field for matching the project report
    project_code = serializers.CharField(write_only=True, required=True)

    # All editable fields are optional, as this endpoint supports partial updates
    # Project date data fields - input
    status = serializers.CharField(required=False, allow_blank=True)
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
            "id",
            # project_code is needed for matching rows
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
        project_codes = [pr.get("project_code") for pr in value]
        duplicates = [
            code
            for code in project_codes
            if code is not None and project_codes.count(code) > 1
        ]

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


class AnnualProjectReportFileUploadSerializer(serializers.Serializer):
    """
    Serializer for uploading files to an agency report; validates file type
    """

    financial_file = serializers.FileField(required=False, allow_null=True)
    supporting_files = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        allow_empty=True,
    )

    def validate_financial_file(self, value):
        """
        Validate file type matches the file extension.
        For ANNUAL_PROGRESS_FINANCIAL_REPORT, only allow PDF/Word.
        """
        if value is None:
            return value

        allowed_extensions = ["pdf", "doc", "docx"]
        file_extension = value.name.lower().split(".")[-1]

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

        return value

    def validate(self, attrs):
        """Ensure at least one file is provided."""
        financial_file = attrs.get("financial_file")
        supporting_files = attrs.get("supporting_files", [])

        if not financial_file and not supporting_files:
            raise serializers.ValidationError(
                "At least one file of any type must be provided."
            )

        return attrs

    def create(self, validated_data):
        """
        Create the file records for all received files.
        If file_type is ANNUAL_PROGRESS_FINANCIAL_REPORT and one already exists,
        delete the old one first (due to unique constraint).
        For supporting files, creation is additive (no replacement)
        """
        report = validated_data.get("report")
        financial_file = validated_data.get("financial_file")
        supporting_files = validated_data.get("supporting_files", [])

        created_files = []

        # Check if we need to replace an existing financial file
        if financial_file:
            # Delete existing file of this type for this report
            AnnualProjectReportFile.objects.filter(
                report=report,
                file_type=AnnualProjectReportFile.FileType.ANNUAL_PROGRESS_FINANCIAL_REPORT,
            ).delete()

            # And then create new financial report file
            financial_record = AnnualProjectReportFile.objects.create(
                report=report,
                file=financial_file,
                file_name=financial_file.name,
                file_type=AnnualProjectReportFile.FileType.ANNUAL_PROGRESS_FINANCIAL_REPORT,
            )
            created_files.append(financial_record)

        for supporting_file in supporting_files:
            # TODO: what do we do in case of *name* clash?
            supporting_record = AnnualProjectReportFile.objects.create(
                report=report,
                file=supporting_file,
                file_name=supporting_file.name,
                file_type=AnnualProjectReportFile.FileType.OTHER_SUPPORTING_DOCUMENT,
            )
            created_files.append(supporting_record)

        return {"created_files": created_files}


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

        # From DRAFT, the submission can transition to any state
        if current_status == AnnualAgencyProjectReport.SubmissionStatus.DRAFT:
            return value

        # From SUBMITTED, we can only re-SUBMIT *if* the submission's unlocked
        if current_status == AnnualAgencyProjectReport.SubmissionStatus.SUBMITTED:
            if instance.is_unlocked:
                return value

        # No other transition allowed.
        raise serializers.ValidationError(
            f"Cannot transition from '{current_status}' to '{value}'."
        )

    def update(self, instance, validated_data):
        new_status = validated_data["status"]
        instance.status = new_status
        update_fields = ["status"]

        # If submitting, set submission metadata and mark is_unlocked as False
        if new_status == AnnualAgencyProjectReport.SubmissionStatus.SUBMITTED:
            instance.is_unlocked = False
            instance.submitted_at = timezone.now()
            instance.submitted_by = self.context.get("request").user
            update_fields.extend(["is_unlocked", "submitted_at", "submitted_by"])

        instance.save(update_fields=update_fields)
        return instance


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


class AnnualProgressReportEndorseSerializer(AnnualProgressReportSerializer):
    """Write serializer for endorsing `AnnualProgressReport`s."""

    # Overriding fields to make them required and add constraints
    date_endorsed = serializers.DateField(required=True)
    meeting_endorsed = serializers.PrimaryKeyRelatedField(
        queryset=Meeting.objects.all(),
        required=True,
        error_messages={
            "does_not_exist": "Meeting with ID {pk_value} does not exist.",
            "required": "Meeting is required for endorsement.",
        },
    )
    remarks_endorsed = serializers.CharField(
        max_length=400,
        allow_blank=True,
        required=False,
        default="",
        error_messages={
            "max_length": "Remarks cannot exceed 400 characters.",
        },
    )

    class Meta(AnnualProgressReportSerializer.Meta):
        model = AnnualProgressReport
        fields = [
            "date_endorsed",
            "meeting_endorsed",
            "remarks_endorsed",
        ]

    def validate(self, attrs):
        instance = self.instance
        if not instance:
            raise serializers.ValidationError("No progress report instance provided.")

        if instance.endorsed:
            raise serializers.ValidationError(
                f"APR for year {instance.year} is already endorsed."
            )

        return attrs

    def validate_date_endorsed(self, value):
        today = timezone.now().date()
        if value > today:
            raise serializers.ValidationError(
                "Endorsement date cannot be in the future."
            )
        return value

    def update(self, instance, validated_data):
        instance.date_endorsed = validated_data["date_endorsed"]
        instance.meeting_endorsed = validated_data["meeting_endorsed"]
        instance.remarks_endorsed = validated_data.get("remarks_endorsed", "")
        instance.endorsed = True

        instance.save(
            update_fields=[
                "date_endorsed",
                "meeting_endorsed",
                "remarks_endorsed",
                "endorsed",
            ]
        )

        return instance


class AnnualProjectReportMLFSBulkUpdateSerializer(serializers.Serializer):
    """
    MLFS-based serializer for bulk updating project reports across all agencies.
    Matches by project report ID, which seems the only certainly unique option.
    """

    project_reports = AnnualProjectReportUpdateSerializer(many=True)

    def validate_project_reports(self, value):
        if not value:
            raise serializers.ValidationError(
                "At least one project report must be provided."
            )

        ids = [pr.get("id") for pr in value if pr.get("id")]
        if len(ids) != len(set(ids)):
            raise serializers.ValidationError(
                "Duplicate project report IDs found in request."
            )

        return value

    @transaction.atomic
    def save(self, *args, **kwargs):
        project_reports_data = self.validated_data.get("project_reports", [])
        year = self.context.get("year")
        updated_reports = []
        errors = []

        ids = [pr.get("id") for pr in project_reports_data if pr.get("id")]
        existing_reports = AnnualProjectReport.objects.filter(
            id__in=ids,
            report__progress_report__year=year,
        ).select_related(
            "project",
            "report",
            "report__agency",
            "report__progress_report",
        )
        report_map = {report.id: report for report in existing_reports}

        for pr_data in project_reports_data:
            report_id = pr_data.get("id")
            if not report_id:
                errors.append(
                    {
                        "error": "Missing 'id' field",
                        "data": pr_data,
                    }
                )
                continue

            report = report_map.get(report_id)
            if not report:
                errors.append(
                    {
                        "id": report_id,
                        "error": f"Project report with ID {report_id} not found for year {year}",
                    }
                )
                continue

            # MLFS (or agency) cannot edit endorsed reports
            if report.report.is_endorsed():
                errors.append(
                    {
                        "id": report_id,
                        "project_code": report.project.code,
                        "agency": report.report.agency.name,
                        "error": "Cannot edit endorsed reports",
                    }
                )
                continue

            # Update the report
            serializer = AnnualProjectReportUpdateSerializer(
                instance=report,
                data=pr_data,
                partial=True,
                context=self.context,
            )

            if serializer.is_valid():
                serializer.save()
                updated_reports.append(report)
            else:
                errors.append(
                    {
                        "id": report_id,
                        "project_code": report.project.code,
                        "agency": report.report.agency.name,
                        "errors": serializer.errors,
                    }
                )

        return updated_reports, errors


class AnnualProjectReportKickStartResponseSerializer(serializers.Serializer):
    year = serializers.IntegerField()
    message = serializers.CharField()
    previous_year = serializers.IntegerField()


class AnnualProjectReportKickStartStatusSerializer(serializers.Serializer):
    can_kick_start = serializers.BooleanField()
    latest_endorsed_year = serializers.IntegerField(allow_null=True)
    next_year = serializers.IntegerField(allow_null=True)
    unendorsed_years = serializers.ListField(child=serializers.IntegerField())
    message = serializers.CharField(required=False)
