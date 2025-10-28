from django.conf import settings
from django.db import models

from core.models.utils import get_protected_storage
from core.models.agency import Agency
from core.models.meeting import Meeting
from core.models.project import Project


class AnnualProgressReport(models.Model):
    year = models.IntegerField(verbose_name="Year of the report")
    meeting_endorsed = models.ForeignKey(
        Meeting,
        on_delete=models.CASCADE,
        related_name="progress_reports",
        verbose_name="Endorsement meeting",
        null=True,
        blank=True,
    )
    date_endorsed = models.DateField(
        null=True, blank=True, verbose_name="Endorsement date"
    )
    remarks_endorsed = models.TextField(verbose_name="Endorsement remarks")
    endorsed = models.BooleanField(
        default=False, verbose_name="The annual progress report is endorsed"
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["year"],
                name="unique_year_annual_progress_report",
            )
        ]
        ordering = ["-year"]

    def __str__(self):
        endorsed = "Endorsed" if self.endorsed else "Not Endorsed"
        return f"Annual Progress Report for {self.year} ({endorsed})"


class AnnualAgencyProjectReport(models.Model):
    class SubmissionStatus(models.TextChoices):
        DRAFT = "draft", "Draft"
        SUBMITTED = "submitted", "Submitted"

    progress_report = models.ForeignKey(
        AnnualProgressReport,
        on_delete=models.CASCADE,
        related_name="agency_project_reports",
        verbose_name="Annual Progress Report",
    )
    agency = models.ForeignKey(
        Agency,
        on_delete=models.CASCADE,
        related_name="annual_project_reports",
        verbose_name="Agency responsible for the progress report",
    )
    status = models.CharField(
        max_length=16,
        choices=SubmissionStatus.choices,
        verbose_name="Submission status",
    )
    is_unlocked = models.BooleanField(
        default=False,
        help_text="When True, agency can edit even when status is SUBMITTED",
    )

    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_agency_reports",
    )
    submitted_at = models.DateTimeField(null=True, blank=True)
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="submitted_agency_reports",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["progress_report", "agency"],
                name="unique_together_progress_report_agency",
            )
        ]

    def __str__(self):
        return (
            f"{self.agency.name} Project Report {self.progress_report.year} "
            f"({self.get_status_display()})"
        )

    def is_editable_by_agency(self):
        return self.status == self.SubmissionStatus.DRAFT or self.is_unlocked

    def is_endorsed(self):
        return self.progress_report.endorsed


class AnnualProjectReportFile(models.Model):
    class FileType(models.TextChoices):
        ANNUAL_PROGRESS_FINANCIAL_REPORT = (
            "annual_progress_financial_report",
            "Annual Progress & Financial Report",
        )
        OTHER_SUPPORTING_DOCUMENT = (
            "other_supporting_document",
            "Other supporting document",
        )

    file = models.FileField(
        storage=get_protected_storage, upload_to="project_report_files/"
    )
    report = models.ForeignKey(
        AnnualAgencyProjectReport,
        on_delete=models.CASCADE,
        related_name="files",
        verbose_name="The report the files are uploaded in",
    )
    file_name = models.CharField(max_length=128, verbose_name="File name")
    file_type = models.CharField(
        max_length=64, choices=FileType.choices, verbose_name="File type"
    )
    date_created = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["report"],
                condition=models.Q(file_type="annual_progress_financial_report"),
                name="unique_annual_progress_file_per_report",
            )
        ]

    def __str__(self):
        return f"File {self.file_name} for {str(self.report)}"


class AnnualProjectReport(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="annual_reports",
        verbose_name="Project",
    )
    report = models.ForeignKey(
        AnnualAgencyProjectReport,
        on_delete=models.CASCADE,
        related_name="project_reports",
        verbose_name="Agency report",
    )

    # Date data fields
    date_first_disbursement = models.DateField(
        null=True, blank=True, verbose_name="First Disbursement Date"
    )
    date_planned_completion = models.DateField(
        null=True, blank=True, verbose_name="Planned Date of Completion"
    )
    date_actual_completion = models.DateField(
        null=True, blank=True, verbose_name="Date completed (Actual)"
    )
    date_financial_completion = models.DateField(
        null=True, blank=True, verbose_name="Date of Financial Completion"
    )

    # Phaseout data fields
    consumption_phased_out_odp = models.FloatField(
        null=True, blank=True, verbose_name="Consumption ODP/MT Phased Out"
    )
    consumption_phased_out_co2 = models.FloatField(
        null=True, blank=True, verbose_name="Consumption Phased Out in CO2-eq Tonnes"
    )
    production_phased_out_odp = models.FloatField(
        null=True, blank=True, verbose_name="Production ODP/MT Phased Out"
    )
    production_phased_out_co2 = models.FloatField(
        null=True, blank=True, verbose_name="Production Phased Out in CO2-eq Tonnes"
    )

    # Financial data fields
    funds_disbursed = models.FloatField(
        null=True, blank=True, verbose_name="Funds Disbursed (US$)"
    )
    funds_committed = models.FloatField(
        null=True, blank=True, verbose_name="Funds Committed (US$)"
    )
    estimated_disbursement_current_year = models.FloatField(
        null=True,
        blank=True,
        verbose_name="Estimated Disbursement in Current Year (US$)",
    )
    support_cost_disbursed = models.FloatField(
        null=True, blank=True, verbose_name="Support Cost Disbursed (US$)"
    )
    support_cost_committed = models.FloatField(
        null=True, blank=True, verbose_name="Support Cost Committed (US$)"
    )
    disbursements_made_to_final_beneficiaries = models.FloatField(
        null=True,
        blank=True,
        verbose_name="Disbursements made to final beneficiaries from FECO/MEP",
    )
    funds_advanced = models.FloatField(
        null=True, blank=True, verbose_name="Funds advanced (US$)"
    )

    # Narrative & Indicators Data Fields
    last_year_remarks = models.TextField(blank=True)
    current_year_remarks = models.TextField(blank=True)
    gender_policy = models.BooleanField(
        default=False,
        blank=True,
        verbose_name="Gender Policy for All Projects Approved from 85th Mtg",
    )

    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["project", "report"],
                name="unique_together_project_report",
            )
        ]

    def __str__(self):
        return (
            f"Annual Project report for {str(self.project)} "
            f"({self.report.agency} - {self.report.progress_report.year})"
        )
