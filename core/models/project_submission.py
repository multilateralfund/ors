from django.db import models
from core.models.project import Project


class ProjectSubmissionManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().select_related("project")


class ProjectSubmission(models.Model):
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

    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="submissions"
    )
    category = models.CharField(
        max_length=164, choices=ProjectSubmissionCategories.choices
    )
    submission_number = models.IntegerField(null=True, blank=True)
    programme_officer = models.CharField(max_length=255, null=True, blank=True)
    impact_tranche = models.TextField(null=True, blank=True)
    funds_allocated = models.FloatField(null=True, blank=True)
    support_cost_13 = models.FloatField(null=True, blank=True)
    date_approved = models.DateField(null=True, blank=True)
    contingency_cost = models.FloatField(null=True, blank=True)
    project_cost = models.FloatField(null=True, blank=True)
    date_received = models.DateField(null=True, blank=True)
    revision_number = models.TextField(null=True, blank=True)
    date_of_revision = models.DateField(null=True, blank=True)
    agency_remarks = models.TextField(null=True, blank=True)
    comments = models.TextField(null=True, blank=True)
    withdrawn = models.BooleanField(default=False)
    issue = models.BooleanField(default=False)
    issue_description = models.TextField(null=True, blank=True)
    incomplete = models.BooleanField(default=False)
    reviewed_mfs = models.BooleanField(default=False)
    correspondance_no = models.IntegerField(null=True, blank=True)
    plus = models.BooleanField(default=False)
    source_file = models.CharField(max_length=255, null=True, blank=True)

    objects = ProjectSubmissionManager()

    def __str__(self):
        return "Submission: " + self.project.title


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
