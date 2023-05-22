from django.db import models
from core.models.agency import Agency

from core.models.country import Country
from core.models.usage import Usage


class ProjectSubmission(models.Model):
    class ProjectSubmissionTypes(models.TextChoices):
        DOC = "doc", "DOC"
        INS = "ins", "INS"
        INV = "inv", "INV"
        PRP = "prp", "PRP"
        TAS = "tas", "TAS"

    class ProjectSubmissionCategories(models.TextChoices):
        BIL_COOP = (
            "bilateral cooperation",
            "Bilateral cooperation",
        )
        INVEST_PROJ = (
            "investment project",
            "Investment project",
        )
        WORK_PROG_AMMEND = (
            "work programme amendment",
            "Work programme amendment",
        )
        OTHER_DOC = (
            "other doc: cpg, policy paper, business plan",
            "Other doc: CPG, policy paper, business plan",
        )

    project_number = models.IntegerField()
    country = models.ForeignKey(Country, on_delete=models.CASCADE)
    usage = models.ForeignKey(Usage, on_delete=models.CASCADE)
    agency = models.ForeignKey(Agency, on_delete=models.CASCADE)
    type = models.CharField(max_length=164, choices=ProjectSubmissionTypes.choices)
    category = models.CharField(
        max_length=164, choices=ProjectSubmissionCategories.choices
    )
    programme_officer = models.CharField(max_length=255, null=True, blank=True)
    title = models.CharField(max_length=256)
    description = models.TextField(null=True, blank=True)
    products_manufactured = models.TextField(null=True, blank=True)
    impact = models.TextField(null=True, blank=True)
    impact_tranche = models.TextField(null=True, blank=True)
    is_HCFC = models.BooleanField(default=False)
    is_HFC = models.BooleanField(default=False)
    funds_allocated = models.FloatField(null=True, blank=True)
    support_cost_13 = models.FloatField(null=True, blank=True)
    meeting1 = models.TextField(null=True, blank=True)
    date_approved = models.DateField(null=True, blank=True)
    cost_effectivness = models.TextField(null=True, blank=True)
    project_duration = models.IntegerField(null=True, blank=True)
    date_completion = models.DateField(null=True, blank=True)
    local_ownership = models.BooleanField(default=False)
    capital_cost = models.FloatField(null=True, blank=True)
    operating_cost = models.FloatField(null=True, blank=True)
    contingency_cost = models.FloatField(null=True, blank=True)
    project_cost = models.FloatField(null=True, blank=True)
    status_code = models.TextField(null=True, blank=True)
    date_received = models.DateField(null=True, blank=True)
    revision_number = models.TextField(null=True, blank=True)
    date_of_revision = models.DateField(null=True, blank=True)
    agency_remarks = models.TextField(null=True, blank=True)
    comments = models.TextField(null=True, blank=True)
    withdrawn = models.BooleanField(default=False)
    issue = models.BooleanField(default=False)
    incomplete = models.BooleanField(default=False)
    reviewed_mfs = models.BooleanField(default=False)
    excom_provision = models.TextField(null=True, blank=True)
    export_to = models.TextField(null=True, blank=True)
    umbrella_project = models.BooleanField(default=False)
    retroactive_finance = models.BooleanField(default=False)
    loan = models.BooleanField(default=False)
    intersessional_approval = models.BooleanField(default=False)
    national_agency = models.TextField(null=True, blank=True)
    issue_description = models.TextField(null=True, blank=True)
    correspondance_no = models.IntegerField(null=True, blank=True)
    plus = models.BooleanField(default=False)
    source = models.CharField(max_length=255, null=True, blank=True)


class SubmissionOdsOdp(models.Model):
    ods_number = models.IntegerField()
    ods_name = models.CharField(max_length=256)
    odp = models.CharField(max_length=256)
    ods_replacement = models.CharField(max_length=256)
    submission = models.ForeignKey(ProjectSubmission, on_delete=models.CASCADE)

    def __str__(self):
        return self.ods_name


class SubmissionAmount(models.Model):
    class SubmissionStatus(models.TextChoices):
        REQUESTED = "requested", "Requested"
        REVIEWED = "reviewed", "Reviewed"
        RECOMMENDED = "recomm", "Recommended"
        GRAND_TOTAL = "grand_total", "Grand Total"
        RSVD = "rsvd", "Grand Total RSVD"

    submission = models.ForeignKey(ProjectSubmission, on_delete=models.CASCADE)
    amount = models.FloatField()
    amount_13 = models.FloatField(default=0, null=True)
    impact = models.FloatField(default=0, null=True)
    cost_effectiveness = models.CharField(max_length=255, null=True, blank=True)
    status = models.CharField(max_length=164, choices=SubmissionStatus.choices)

    def __str__(self):
        return self.status + "  " + self.amount
