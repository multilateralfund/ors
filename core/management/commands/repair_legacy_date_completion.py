from datetime import date

from django.core.management import BaseCommand, CommandError
from django.db import transaction

from core.api.utils import log_project_history
from core.import_data.utils import get_import_user
from core.models import Project


HISTORY_DESCRIPTION = "Restore legacy date_completion from migration source"

PROJECT_DATE_COMPLETIONS = {
    "ALB/KIP/93/INV/55": date(2026, 12, 1),
    "ALB/KIP/93/TAS/53": date(2026, 12, 1),
    "BEN/PHA/90/INV/44": date(2025, 6, 1),
    "BEN/PHA/90/TAS/45": date(2025, 6, 1),
    "BHA/PHA/90/INV/32": date(2025, 6, 1),
    "BHA/PHA/90/TAS/33": date(2025, 6, 1),
    "BHE/PHA/87/INV/39": date(2024, 8, 1),
    "BKF/PHA/92/INV/48": date(2026, 6, 1),
    "BKF/PHA/92/TAS/47": date(2025, 12, 1),
    "BOL/KIP/93/INV/63": date(2026, 12, 1),
    "BOL/KIP/93/TAS/60": date(2026, 12, 1),
    "BRA/PHA/75/INV/309": date(2017, 12, 1),
    "BRA/PHA/75/INV/310": date(2017, 12, 1),
    "BRA/PHA/75/INV/312": date(2017, 12, 1),
    "BRA/PHA/75/TAS/313": date(2017, 12, 1),
    "BRA/PHA/80/INV/317": date(2018, 12, 1),
    "BRA/PHA/80/INV/319": date(2020, 12, 1),
    "BRA/PHA/80/TAS/318": date(2020, 12, 1),
    "BRA/PHA/82/TAS/321": date(2020, 12, 1),
    "BRA/PHA/86/INV/325": date(2023, 12, 1),
    "CBI/PHA/88/TAS/28": date(2024, 12, 1),
    "COL/PHA/75/INV/95": date(2018, 11, 1),
    "COL/PHA/75/INV/96": date(2018, 11, 1),
    "COL/PHA/75/INV/98": date(2018, 11, 1),
    "COL/PHA/75/TAS/93": date(2018, 11, 1),
    "COL/PHA/81/TAS/103": date(2021, 7, 1),
    "COL/PHA/81/TAS/104": date(2019, 7, 1),
    "CPR/PHA/64/INV/508": date(2012, 7, 1),
    "CPR/PHA/64/INV/512": date(2012, 7, 1),
    "CPR/PHA/64/INV/515": date(2013, 7, 1),
    "CPR/PHA/64/INV/516": date(2013, 7, 1),
    "CPR/PHA/64/INV/518": date(2012, 7, 1),
    "CPR/PHA/64/TAS/517": date(2013, 7, 1),
    "CPR/PHA/65/INV/519": date(2016, 10, 1),
    "CPR/PHA/68/INV/524": date(2013, 12, 1),
    "CPR/PHA/68/INV/526": date(2013, 12, 1),
    "CPR/PHA/68/INV/527": date(2013, 12, 1),
    "CPR/PHA/68/TAS/528": date(2013, 12, 1),
    "CPR/PHA/69/INV/529": date(2014, 4, 1),
    "CPR/PHA/69/INV/532": date(2014, 4, 1),
    "CPR/PHA/71/INV/535": date(2014, 12, 1),
    "CPR/PHA/72/INV/539": date(2015, 5, 1),
    "CPR/PHA/72/TAS/541": date(2015, 5, 1),
    "CPR/PHA/74/INV/560": date(2016, 5, 1),
    "DRC/PHA/88/INV/49": date(2024, 12, 1),
    "DRC/PHA/88/TAS/48": date(2024, 12, 1),
    "FIJ/PHA/88/INV/39": date(2024, 12, 1),
    "FIJ/PHA/88/TAS/40": date(2024, 12, 1),
    "GUY/PHA/75/TAS/27": date(2018, 12, 1),
    "IDS/PHA/92/INV/221": date(2025, 5, 1),
    "IDS/PHA/92/INV/222": date(2025, 5, 1),
    "IND/PHA/77/INV/468": date(2019, 12, 1),
    "IND/PHA/77/INV/469": date(2019, 12, 1),
    "IND/PHA/77/INV/471": date(2018, 12, 1),
    "IND/PHA/82/INV/473": date(2022, 12, 1),
    "IND/PHA/82/INV/475": date(2022, 12, 1),
    "IRQ/PHA/65/INV/16": date(2013, 11, 1),
    "MEX/KIP/93/INV/207": date(2026, 12, 1),
    "MEX/KIP/93/INV/209": date(2026, 12, 1),
    "MEX/KIP/93/INV/210": date(2026, 12, 1),
    "MEX/KIP/93/INV/214": date(2026, 12, 1),
    "MEX/KIP/93/INV/215": date(2026, 12, 1),
    "MEX/KIP/93/TAS/211": date(2026, 12, 1),
    "MEX/KIP/93/TAS/212": date(2026, 12, 1),
    "NER/PHA/90/INV/43": date(2025, 6, 1),
    "NER/PHA/90/TAS/44": date(2025, 6, 1),
    "NIR/PHA/81/INV/147": date(2020, 12, 1),
    "NIR/PHA/81/INV/151": date(2020, 12, 1),
    "NIR/PHA/81/TAS/148": date(2020, 12, 1),
    "NIR/PHA/81/TAS/149": date(2020, 12, 1),
    "NIR/PHA/81/TAS/150": date(2020, 12, 1),
    "PAK/PHA/76/INV/94": date(2019, 12, 1),
    "PAK/PHA/83/INV/102": date(2021, 12, 1),
    "SOA/PHA/76/TAS/11": date(2019, 12, 1),
    "YUG/KIP/97/TAS/65": date(2028, 12, 1),
}


def get_project_changes(lock=False):
    projects = Project.objects.really_all().filter(
        legacy_code__in=PROJECT_DATE_COMPLETIONS
    )
    if lock:
        projects = projects.select_for_update()

    projects_by_code = {}
    for project in projects.order_by("legacy_code", "version", "id"):
        projects_by_code.setdefault(project.legacy_code, []).append(project)

    errors = []
    changes = []
    already_correct = 0
    for legacy_code, correct_date in PROJECT_DATE_COMPLETIONS.items():
        project_versions = projects_by_code.get(legacy_code, [])
        if not project_versions:
            errors.append(f"Project not found: {legacy_code}")
            continue

        version_three_count = sum(project.version == 3 for project in project_versions)
        if version_three_count != 1:
            errors.append(
                f"Expected one version 3 row for {legacy_code}; "
                f"found {version_three_count}"
            )
            continue

        completion_dates = {project.date_completion for project in project_versions}
        if len(completion_dates) != 1:
            errors.append(
                f"Different date_completion values across versions for {legacy_code}: "
                f"{sorted(str(value) for value in completion_dates)}"
            )
            continue

        for project in project_versions:
            if project.date_completion == correct_date:
                already_correct += 1
            elif project.date_completion == project.project_end_date:
                changes.append((project, correct_date))
            else:
                errors.append(
                    f"Conflicting value for {legacy_code} version {project.version}: "
                    f"date_completion={project.date_completion}, "
                    f"project_end_date={project.project_end_date}, expected={correct_date}"
                )

    if errors:
        raise CommandError("\n".join(errors))
    return changes, already_correct


class Command(BaseCommand):
    help = (
        "Restore date_completion for the hardcoded legacy projects. "
        "The command is a dry run unless --apply is supplied."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--apply",
            action="store_true",
            help="Apply the repair. Without this flag, no database writes are made.",
        )

    def handle(self, *args, **options):
        apply_changes = options["apply"]
        with transaction.atomic():
            changes, already_correct = get_project_changes(lock=apply_changes)
            for project, correct_date in changes:
                self.stdout.write(
                    f"{project.legacy_code} version {project.version}: "
                    f"{project.date_completion} -> {correct_date}"
                )

            if apply_changes:
                system_user = get_import_user()
                for project, correct_date in changes:
                    project.date_completion = correct_date
                    project.save(update_fields=["date_completion", "date_updated"])
                    log_project_history(project, system_user, HISTORY_DESCRIPTION)

        mode = "Applied" if apply_changes else "Dry run"
        self.stdout.write(
            self.style.SUCCESS(
                f"{mode}: {len(PROJECT_DATE_COMPLETIONS)} project codes, "
                f"{len(changes)} database rows to restore, "
                f"{already_correct} already correct."
            )
        )
