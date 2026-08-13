from django.core.management import BaseCommand
from django.db import transaction

from core.models import Project


class Command(BaseCommand):
    help = (
        "Correct lead agencies on receiving transfer projects based on whether "
        "the transferred portion belonged to the original lead agency. Use "
        "--dry-run to preview changes without writing."
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
        projects = list(
            Project.objects.filter(transferred_from_id__isnull=False)
            .select_related(
                "agency",
                "lead_agency",
                "transferred_from__agency",
                "transferred_from__lead_agency",
            )
            .order_by("id")
        )
        changes = []
        for project in projects:
            source = project.transferred_from
            if (
                source.lead_agency_id is None
                or source.agency_id == source.lead_agency_id
            ):
                target_lead_agency = project.agency
            else:
                target_lead_agency = source.lead_agency
            target_submitting_on_behalf = target_lead_agency.id != project.agency_id

            if (
                project.lead_agency_id != target_lead_agency.id
                or project.lead_agency_submitting_on_behalf
                != target_submitting_on_behalf
            ):
                changes.append(
                    (
                        project,
                        target_lead_agency,
                        target_submitting_on_behalf,
                    )
                )

        mode = "DRY RUN" if dry_run else "LIVE"
        self.stdout.write(f"{mode}: {len(changes)} receiving project(s) to fix.")

        for project, target_lead_agency, target_submitting_on_behalf in changes:
            old_lead_agency = (
                project.lead_agency.name if project.lead_agency else "None"
            )
            self.stdout.write(
                f"Project {project.id}: lead agency {old_lead_agency} -> "
                f"{target_lead_agency.name}; submitting on behalf "
                f"{project.lead_agency_submitting_on_behalf} -> "
                f"{target_submitting_on_behalf}"
            )

        if dry_run or not changes:
            self.stdout.write("No database changes were made.")
            return

        for project, target_lead_agency, target_submitting_on_behalf in changes:
            project.lead_agency = target_lead_agency
            project.lead_agency_submitting_on_behalf = target_submitting_on_behalf
        Project.objects.bulk_update(
            [project for project, _, _ in changes],
            ["lead_agency", "lead_agency_submitting_on_behalf"],
        )
        self.stdout.write(
            self.style.SUCCESS(f"Updated {len(changes)} receiving project(s).")
        )
