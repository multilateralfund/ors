from django.db import models

from core.models.project import Project


class AnnualProjectReport(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="annual_reports",
        verbose_name="Project",
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
