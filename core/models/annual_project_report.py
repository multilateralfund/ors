import logging

from django.conf import settings
from django.db import models
from django.utils.functional import cached_property

from core.models.utils import get_protected_storage
from core.models.agency import Agency
from core.models.meeting import Meeting
from core.models.project import Project

logger = logging.getLogger(__name__)

# pylint: disable=R0904


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
    remarks_endorsed = models.TextField(
        max_length=400, verbose_name="Endorsement remarks"
    )
    endorsed = models.BooleanField(
        default=False, verbose_name="The annual progress report is endorsed"
    )

    created_at = models.DateTimeField(auto_now_add=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_progress_reports",
        verbose_name="User who initiated this APR",
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
    # pylint: disable=R0902
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
    status = models.CharField(
        max_length=255, blank=True, help_text="Project status name for reporting year"
    )
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

    # Denormalized derived fields
    # These are populated from Project when the APR is created
    # or when the workspace is first accessed. They store snapshot values
    # that (hopefully) won't change since reporting is done for historical years.

    # PCR due
    pcr_due_denorm = models.BooleanField(
        null=True,
        blank=True,
        verbose_name="PCR Due (denormalized)",
        help_text="Whether PCR is due (ONG to COM/FIN transition)",
    )

    # Project identification - derived from Project relationships
    meta_code_denorm = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name="Meta Code (denormalized)",
        help_text="Snapshot of project.metacode at time of reporting",
    )
    project_code_denorm = models.CharField(
        max_length=128,
        null=True,
        blank=True,
        verbose_name="Project Code (denormalized)",
        help_text="Snapshot of project.code at time of reporting",
    )
    legacy_code_denorm = models.CharField(
        max_length=128,
        null=True,
        blank=True,
        verbose_name="Legacy Code (denormalized)",
        help_text="Snapshot of project.legacy_code at time of reporting",
    )
    agency_name_denorm = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name="Agency Name (denormalized)",
        help_text="Snapshot of project.agency.name at time of reporting",
    )
    cluster_name_denorm = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name="Cluster Name (denormalized)",
        help_text="Snapshot of project.cluster.name at time of reporting",
    )
    region_name_denorm = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name="Region Name (denormalized)",
        help_text="Snapshot of project.country.parent.name at time of reporting",
    )
    country_name_denorm = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name="Country Name (denormalized)",
        help_text="Snapshot of project.country.name at time of reporting",
    )
    type_code_denorm = models.CharField(
        max_length=10,
        null=True,
        blank=True,
        verbose_name="Type Code (denormalized)",
        help_text="Snapshot of project.project_type.code at time of reporting",
    )
    sector_code_denorm = models.CharField(
        max_length=10,
        null=True,
        blank=True,
        verbose_name="Sector Code (denormalized)",
        help_text="Snapshot of project.sector.code at time of reporting",
    )
    project_title_denorm = models.CharField(
        max_length=256,
        null=True,
        blank=True,
        verbose_name="Project Title (denormalized)",
        help_text="Snapshot of project.title at time of reporting",
    )

    # Project date data - derived from version 3
    date_approved_denorm = models.DateField(
        null=True,
        blank=True,
        verbose_name="Date Approved (denormalized)",
        help_text="Snapshot of project version 3 approval date",
    )
    date_completion_proposal_denorm = models.DateField(
        null=True,
        blank=True,
        verbose_name="Date Completion Proposal (denormalized)",
        help_text="Snapshot of project version 3 completion date",
    )

    # Phaseout proposals - derived from version 3
    consumption_phased_out_odp_proposal_denorm = models.FloatField(
        null=True,
        blank=True,
        verbose_name="Consumption ODP Proposal (denormalized)",
        help_text="Snapshot of version 3 consumption phase out ODP",
    )
    consumption_phased_out_co2_proposal_denorm = models.FloatField(
        null=True,
        blank=True,
        verbose_name="Consumption CO2 Proposal (denormalized)",
        help_text="Snapshot of version 3 consumption phase out CO2",
    )
    production_phased_out_odp_proposal_denorm = models.FloatField(
        null=True,
        blank=True,
        verbose_name="Production ODP Proposal (denormalized)",
        help_text="Snapshot of version 3 production phase out ODP",
    )
    production_phased_out_co2_proposal_denorm = models.FloatField(
        null=True,
        blank=True,
        verbose_name="Production CO2 Proposal (denormalized)",
        help_text="Snapshot of version 3 production phase out CO2",
    )

    # Financial data - derived from project versions
    approved_funding_denorm = models.FloatField(
        null=True,
        blank=True,
        verbose_name="Approved Funding (denormalized)",
        help_text="Snapshot of version 3 total_fund",
    )
    adjustment_denorm = models.FloatField(
        null=True,
        blank=True,
        verbose_name="Adjustment (denormalized)",
        help_text="Calculated adjustment from latest version vs version 3",
    )
    approved_funding_plus_adjustment_denorm = models.FloatField(
        null=True,
        blank=True,
        verbose_name="Approved Funding + Adjustment (denormalized)",
        help_text="Total approved funding including adjustments",
    )
    per_cent_funds_disbursed_denorm = models.FloatField(
        null=True,
        blank=True,
        verbose_name="Percent Funds Disbursed (denormalized)",
        help_text="Calculated percentage of funds disbursed",
    )
    balance_denorm = models.FloatField(
        null=True,
        blank=True,
        verbose_name="Balance (denormalized)",
        help_text="Calculated balance: approved_funding - funds_disbursed",
    )

    # Support costs - derived from project versions
    support_cost_approved_denorm = models.FloatField(
        null=True,
        blank=True,
        verbose_name="Support Cost Approved (denormalized)",
        help_text="Snapshot of version 3 support_cost_psc",
    )
    support_cost_adjustment_denorm = models.FloatField(
        null=True,
        blank=True,
        verbose_name="Support Cost Adjustment (denormalized)",
        help_text="Calculated support cost adjustment from latest version",
    )
    support_cost_approved_plus_adjustment_denorm = models.FloatField(
        null=True,
        blank=True,
        verbose_name="Support Cost + Adjustment (denormalized)",
        help_text="Total support cost including adjustments",
    )
    support_cost_balance_denorm = models.FloatField(
        null=True,
        blank=True,
        verbose_name="Support Cost Balance (denormalized)",
        help_text="Calculated support cost balance",
    )

    # Other derived fields
    implementation_delays_status_report_decisions_denorm = models.CharField(
        max_length=500,
        null=True,
        blank=True,
        verbose_name="Implementation Delays (denormalized)",
        help_text="Implementation delays from status reports",
    )
    date_of_completion_per_agreement_or_decisions_denorm = models.DateField(
        null=True,
        blank=True,
        verbose_name="Date Completion per Agreement (denormalized)",
        help_text="Latest version date_completion at time of reporting",
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

    @property
    def meta_project_code(self):
        if self.project.metacode:
            return self.project.metacode
        return ""

    @property
    def project_type(self):
        if self.project.project_type:
            return self.project.project_type.code
        return ""

    @property
    def project_sector(self):
        if self.project.sector:
            return self.project.sector.code
        return ""

    @cached_property
    def report_year(self):
        return self.report.progress_report.year

    @cached_property
    def project_version_3(self):
        return self.project.get_version(3)

    @property
    def pcr_due(self):
        """
        Returns True if project changed status from ONG to COM or FIN
        during self.report_year.
        """
        statuses_during_year = self.project.all_versions_for_year(
            self.report_year
        ).values_list("status__code", flat=True)
        previous_year_version = self.project.latest_version_for_year(
            self.report_year - 1
        )

        started_ong = (
            previous_year_version and previous_year_version.status.code == "ONG"
        ) or "ONG" in statuses_during_year

        is_completed_this_year = any(
            status in statuses_during_year for status in ("COM", "FIN")
        )

        return started_ong and is_completed_this_year

    @property
    def date_approved(self):
        return self.project_version_3.date_approved

    @property
    def date_of_completion_per_agreement_or_decisions(self):
        latest_version = self.project.latest_version_for_year(self.report_year)
        if not latest_version:
            latest_version = self.project_version_3
        if not latest_version:
            return None
        return latest_version.date_completion

    @property
    def date_completion_proposal(self):
        return self.project_version_3.date_completion

    @cached_property
    def consumption_phased_out_odp_proposal(self):
        if not self.project_version_3:
            return None

        return self.project_version_3.consumption_phase_out_odp

    @cached_property
    def consumption_phased_out_co2_proposal(self):
        if not self.project_version_3:
            return None

        return self.project_version_3.consumption_phase_out_co2

    @cached_property
    def production_phased_out_odp_proposal(self):
        if not self.project_version_3:
            return None

        return self.project_version_3.production_phase_out_odp

    @cached_property
    def production_phased_out_co2_proposal(self):
        if not self.project_version_3:
            return None

        return self.project_version_3.production_phase_out_co2

    @cached_property
    def approved_funding(self):
        # TODO: are we sure it's .total_fund and not .total_fund_approved?
        if not self.project_version_3:
            return None

        return self.project_version_3.total_fund

    @cached_property
    def adjustment(self):
        latest_version = self.project.latest_version_for_year(self.report_year)
        if not latest_version or latest_version.version <= 3:
            return None

        latest_funding = latest_version.total_fund
        if latest_funding is None:
            return None

        return latest_funding - (self.approved_funding or 0)

    @cached_property
    def approved_funding_plus_adjustment(self):
        latest_version = self.project.latest_version_for_year(self.report_year)
        if not latest_version:
            if not self.project_version_3:
                return None
            return self.project_version_3.total_fund

        return latest_version.total_fund

    @property
    def per_cent_funds_disbursed(self):
        if (
            self.funds_disbursed is None
            or self.approved_funding_plus_adjustment_denorm is None
        ):
            return None

        return self.funds_disbursed / self.approved_funding_plus_adjustment_denorm

    @property
    def balance(self):
        if self.approved_funding_denorm is None:
            return None

        return self.approved_funding_denorm - (self.funds_disbursed or 0)

    @cached_property
    def support_cost_approved(self):
        if not self.project_version_3 or not self.project_version_3.support_cost_psc:
            return None
        return self.project_version_3.support_cost_psc

    @cached_property
    def support_cost_adjustment(self):
        # Support cost in the latest version - Support cost in version 3
        latest_version = self.project.latest_version_for_year(self.report_year)
        if not latest_version or not latest_version.support_cost_psc:
            return None

        return latest_version.support_cost_psc - (self.support_cost_approved or 0)

    @cached_property
    def support_cost_approved_plus_adjustment(self):
        if self.support_cost_approved is None:
            if self.support_cost_adjustment is None:
                return None
            return self.support_cost_adjustment
        return self.support_cost_approved + (self.support_cost_adjustment or 0)

    @property
    def support_cost_balance(self):
        # Support Costs Approved Funding plus Adjustments - Support Cost Disbursed
        if self.support_cost_approved_plus_adjustment_denorm is None:
            return None

        return self.support_cost_approved_plus_adjustment_denorm - (
            self.support_cost_disbursed or 0
        )

    @property
    def implementation_delays_status_report_decisions(self):
        # TODO: need to ask MLFS about this field
        return ""

    def populate_derived_fields(self):
        """
        Populate all denormalized fields from their corresponding properties.

        Should be called:
        - When creating or updating new APR records in agency workspace
        - During data migration for existing records
        """
        # Only populate if we have a project
        if not self.project_id:
            return

        # Project identification fields
        self.meta_code_denorm = self.project.metacode or ""
        self.project_code_denorm = self.project.code or ""
        self.legacy_code_denorm = self.project.legacy_code or ""

        # Agency
        if self.project.agency:
            self.agency_name_denorm = self.project.agency.name

        # Cluster
        if self.project.cluster:
            self.cluster_name_denorm = self.project.cluster.name

        # Country and Region
        if self.project.country:
            self.country_name_denorm = self.project.country.name
            if self.project.country.parent:
                self.region_name_denorm = self.project.country.parent.name

        # Type and Sector
        if self.project.project_type:
            self.type_code_denorm = self.project.project_type.code

        if self.project.sector:
            self.sector_code_denorm = self.project.sector.code

        # Project title
        self.project_title_denorm = self.project.title or ""

        # Version 3 dependent fields
        version_3 = self.project_version_3
        if version_3:
            # Dates
            self.date_approved_denorm = version_3.date_approved
            self.date_completion_proposal_denorm = version_3.date_completion

            # Phaseout proposals
            self.consumption_phased_out_odp_proposal_denorm = (
                version_3.consumption_phase_out_odp
            )
            self.consumption_phased_out_co2_proposal_denorm = (
                version_3.consumption_phase_out_co2
            )
            self.production_phased_out_odp_proposal_denorm = (
                version_3.production_phase_out_odp
            )
            self.production_phased_out_co2_proposal_denorm = (
                version_3.production_phase_out_co2
            )

            # Approved funding
            self.approved_funding_denorm = version_3.total_fund

            # Support cost approved
            self.support_cost_approved_denorm = version_3.support_cost_psc

        # Computed financial fields (may depend on latest version for report year)
        self.adjustment_denorm = self.adjustment
        self.approved_funding_plus_adjustment_denorm = (
            self.approved_funding_plus_adjustment
        )
        self.per_cent_funds_disbursed_denorm = self.per_cent_funds_disbursed
        self.balance_denorm = self.balance

        # Support cost fields
        self.support_cost_adjustment_denorm = self.support_cost_adjustment
        self.support_cost_approved_plus_adjustment_denorm = (
            self.support_cost_approved_plus_adjustment
        )

        # Other computed fields
        self.implementation_delays_status_report_decisions_denorm = (
            self.implementation_delays_status_report_decisions
        )
        self.date_of_completion_per_agreement_or_decisions_denorm = (
            self.date_of_completion_per_agreement_or_decisions
        )
        self.pcr_due_denorm = self.pcr_due
