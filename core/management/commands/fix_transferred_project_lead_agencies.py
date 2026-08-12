from django.core.management import BaseCommand
from django.db import transaction
from django.db.models import F
from django.db.models import Q

from core.models import Project


class Command(BaseCommand):
    help = (
        "Set the lead agency of existing receiving transfer projects to their "
        "implementing agency. Use --dry-run to preview changes without writing."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report the changes without updating the database.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        projects = (
            Project.objects.filter(transferred_from_id__isnull=False)
            .filter(
                Q(lead_agency_id__isnull=True)
                | ~Q(lead_agency_id=F("agency_id"))
                | Q(lead_agency_submitting_on_behalf=True)
            )
            .select_related("agency", "lead_agency")
            .order_by("id")
        )
        project_ids = list(projects.values_list("id", flat=True))

        mode = "DRY RUN" if dry_run else "LIVE"
        self.stdout.write(f"{mode}: {len(project_ids)} receiving project(s) to fix.")

        for project in projects:
            old_lead_agency = (
                project.lead_agency.name if project.lead_agency else "None"
            )
            self.stdout.write(
                f"Project {project.id}: lead agency {old_lead_agency} -> "
                f"{project.agency.name}; submitting on behalf "
                f"{project.lead_agency_submitting_on_behalf} -> False"
            )

        if dry_run or not project_ids:
            self.stdout.write("No database changes were made.")
            return

        updated = Project.objects.filter(id__in=project_ids).update(
            lead_agency_id=F("agency_id"),
            lead_agency_submitting_on_behalf=False,
        )
        self.stdout.write(
            self.style.SUCCESS(f"Updated {updated} receiving project(s).")
        )
