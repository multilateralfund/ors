from datetime import datetime

from django.core.management import BaseCommand
from django.db import transaction

from core.models import Project
from core.api.export.projects_inventory_report import is_same_month


TARGETS = (
    ("IRQ/PHA/58/INV/09", "Dec-25", None),
    ("ALG/PHA/66/INV/76", "Dec-26", "Dec-18"),
    ("ALG/PHA/66/INV/77", "Dec-26", "Dec-18"),
    ("AFG/PHA/85/INV/28", "Dec-26", "Dec-21"),
    ("AFG/PHA/79/INV/22", "Dec-26", "Dec-21"),
    ("AFG/PHA/95/TAS/33", "Dec-26", "Dec-21"),
    ("DMI/PHA/95/TAS/28", "Dec-26", "Dec-21"),
    ("IRQ/PHA/74/INV/23", "Dec-25", "Dec-20"),
    ("SUD/PHA/75/INV/38", "Dec-26", "Dec-21"),
    ("ARG/PHA/79/INV/178", "Dec-27", "Dec-23"),
    ("ARG/PHA/80/INV/184", "Dec-27", "Dec-23"),
    ("ARG/PHA/84/INV/189", "Dec-27", "Dec-23"),
    ("ARG/PHA/84/INV/192", "Dec-27", "Dec-23"),
    ("ARG/PHA/84/TAS/190", "Dec-27", "Dec-23"),
    ("ARG/PHA/84/TAS/191", "Dec-27", "Dec-23"),
    ("ARG/PHA/84/TAS/193", "Dec-27", "Dec-23"),
    ("ARG/PHA/92/INV/198", "Dec-27", "Dec-23"),
    ("ARG/PHA/92/INV/199", "Dec-27", "Dec-23"),
    ("ARG/PHA/92/INV/200", "Dec-27", "Dec-23"),
    ("ARG/PHA/97/INV/205", "Dec-27", "Dec-23"),
    ("ARG/PHA/97/INV/206", "Dec-27", "Dec-23"),
    ("ARG/PHA/97/INV/207", "Dec-27", "Dec-23"),
    ("MLI/PHA/92/INV/46", "Jun-25", "Dec-21"),
    ("JOR/PHA/91/INV/114", "Dec-26", "Dec-23"),
    ("SUR/PHA/92/TAS/33", "Jun-24", "Dec-21"),
    ("DRK/PHA/73/INV/59", "Dec-21", "Dec-19"),
    ("DRK/PHA/75/INV/62", "Dec-21", "Dec-19"),
    ("NIR/PHA/81/TAS/149", "Dec-26", "Dec-24"),
    ("NIR/PHA/88/INV/159", "Dec-26", "Dec-24"),
    ("NIR/PHA/88/INV/161", "Dec-26", "Dec-24"),
    ("NIR/PHA/93/INV/166", "Dec-26", "Dec-24"),
    ("NIR/PHA/93/INV/167", "Dec-26", "Dec-24"),
    ("IRA/PHA/86/INV/245", "Jun-27", "Dec-25"),
    ("IRA/PHA/86/INV/246", "Jun-27", "Dec-25"),
    ("IRA/PHA/86/TAS/248", "Jun-27", "Dec-25"),
    ("IRA/PHA/77/INV/224", "Jun-27", "Dec-25"),
    ("IRA/PHA/77/INV/228", "Jun-27", "Dec-25"),
    ("IRA/PHA/84/INV/237", "Jun-27", "Dec-25"),
    ("IRA/PHA/84/INV/239", "Jun-27", "Dec-25"),
    ("IRA/PHA/84/TAS/234", "Jun-27", "Dec-25"),
    ("IRA/PHA/84/TAS/240", "Jun-27", "Dec-25"),
    ("IRA/PHA/92/INV/266", "Jun-27", "Dec-25"),
    ("IRA/PHA/92/INV/267", "Jun-27", "Dec-25"),
    ("IRA/PHA/94/INV/270", "Jun-27", "Dec-25"),
    ("IRA/PHA/94/INV/271", "Jun-27", "Dec-25"),
    ("IRA/PHA/94/INV/272", "Jun-27", "Dec-25"),
    ("IRA/PHA/94/TAS/273", "Jun-27", "Dec-25"),
    ("MEX/PHA/77/INV/179", "Dec-24", "Dec-23"),
    ("ALB/EEF/93/TAS/54", "Dec-27", "Dec-26"),
    ("ALB/PHA/91/INV/47", "Dec-27", "Dec-26"),
    ("ALB/PHA/91/TAS/48", "Dec-27", "Dec-26"),
    ("BRA/PHA/94/INV/340", "Dec-25", "Dec-24"),
    ("SEN/EEF/97/TAS/54", "Dec-27", "Dec-26"),
    ("SEN/PHA/88/INV/48", "Dec-27", "Dec-26"),
    ("SEN/PHA/88/TAS/47", "Dec-27", "Dec-26"),
    ("SEN/PHA/97/INV/55", "Dec-27", "Dec-26"),
    ("SEN/PHA/97/TAS/56", "Dec-27", "Dec-26"),
    ("SSD/PHA/91/INV/06", "Dec-26", "Dec-25"),
    ("SSD/PHA/97/INV/12", "Dec-26", "Dec-25"),
    ("SSD/PHA/97/TAS/11", "Dec-26", "Dec-25"),
    ("ZIM/REF/82/INV/55", "Jun-26", "Jun-25"),
    ("ZIM/REF/82/INV/56", "Jun-26", "Jun-25"),
    ("THA/PHA/82/INV/179", "Jun-25", "Dec-24"),
    ("THA/PHA/82/TAS/177", "Jun-25", "Dec-24"),
    ("THA/PHA/92/INV/181", "Jun-25", "Dec-24"),
    ("THA/PHA/92/INV/182", "Jun-25", "Dec-24"),
    ("THA/PHA/92/INV/183", "Jun-25", "Dec-24"),
)


def parse_date_str(date_str):
    return datetime.strptime(date_str, "%b-%y").date() if date_str else None


class Command(BaseCommand):
    help = "Overwrite date_per_agreement for specific projects."

    def add_arguments(self, parser):
        parser.add_argument(
            "--apply",
            action="store_true",
            help="Apply the repair. Without this flag, no database writes are made.",
        )

    def handle(self, *args, **options):
        apply_changes = options["apply"]
        mapping = {c: (w, r) for c, w, r in TARGETS}

        with transaction.atomic():
            queryset = Project.objects.really_all().filter(
                legacy_code__in=mapping.keys(),
                version__gte=3,
                latest_project__isnull=True,
                submission_status__name="Approved",
            )

            modified = []
            modified_codes = []

            for project in queryset:
                wrong, right = mapping[project.legacy_code]
                wrong = parse_date_str(wrong)
                right = parse_date_str(right)

                if is_same_month(project.date_per_agreement, wrong):
                    self.stdout.write(
                        f"{project.legacy_code} {project.date_per_agreement} == {wrong} => {right}"
                    )
                    project.date_per_agreement = right
                    modified.append(project)
                    modified_codes.append(project.legacy_code)
                else:
                    self.stdout.write(
                        f"{project.legacy_code} {project.date_per_agreement} != {wrong} [{right}]"
                    )

            self.stdout.write(f"Targets: {len(TARGETS)}, will modify: {len(modified)}!")

            for p in mapping:
                if p not in modified_codes:
                    self.stdout.write(f"Not modifying {p}!")

            if apply_changes and modified:
                Project.objects.really_all().bulk_update(
                    modified, ["date_per_agreement"]
                )
                self.stdout.write("Modified projects!")
