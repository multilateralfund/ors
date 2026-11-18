"""
Read-only check of the legacy (MYA) PCR import against the client's checklist
"MYAPCRs - Excelsheetlist - KMSMigration" xlsx.

The checklist has two sheets:
  - "HPMP MYAs" => legacy database hpmppcr2023
  - "CFC MYAs"  => legacy database pcr2023
Each row is a tranche (Project Numbers = Project.code / legacy_code) and the
legacy PCR it belongs to (Project ID = PCRProject.Id = MetaProject.pcr_project_id).

For every legacy PCR (Project ID) the command checks:
  - the PCR exists in our legacy json files (if not, the client has to send it
    from their DB using the Project ID);
  - a meta project with that pcr_project_id exists (exactly one);
  - an OLD_PCR exists and the imported activities / delay explanations /
    learned lessons / supporting evidences / submission date match the source.
For every tranche (Project Number) it checks:
  - the project exists (latest version, matched by code or legacy_code);
  - the project belongs to the meta project matched by pcr_project_id;
  - the tranche is listed under the same Project ID in Import_ListofMYAProjects.

Nothing is written to the database. The result is saved as an xlsx report
(sheets: Summary, PCRs, Projects) and a summary is printed.

Note: project / meta project checks depend on the projects data of the
environment the command runs on, so they are only meaningful on production
(or a recent copy of it).
"""

import json
from collections import Counter, defaultdict
from pathlib import Path

import openpyxl
from django.conf import settings
from django.core.management import BaseCommand
from django.db.models import Count, Q

from core.import_data.import_pcr_activities import (
    IMPORTANT_ARGS as ACTIVITY_IMPORTANT_ARGS,
)
from core.import_data.utils import check_pcr_json_data
from core.models.project import MetaProject, Project
from core.models.project_completion_report import OLD_PCR

# pylint: disable=R0914,C0208

SHEET_DATABASE_MAPPING = {
    "HPMP MYAs": "hpmppcr2023",
    "CFC MYAs": "pcr2023",
}

# issue codes; ERROR = data is missing / wrong, WARNING = worth a look
PCR_ISSUES = {
    "NOT_IN_SOURCE": "ERROR",
    "META_PROJECT_MISSING": "ERROR",
    "MULTIPLE_META_PROJECTS": "ERROR",
    "OLD_PCR_MISSING": "ERROR",
    "ACTIVITIES_MISMATCH": "WARNING",
    "ACTIVITIES_WITHOUT_SECTOR": "INFO",
    "DELAY_EXPLANATIONS_MISMATCH": "WARNING",
    "LEARNED_LESSONS_MISMATCH": "WARNING",
    "SUPPORTING_EVIDENCE_MISSING": "WARNING",
    "SUBMISSION_DATE_MISSING": "WARNING",
    "NO_DATA_IN_SOURCE": "INFO",
}
PROJECT_ISSUES = {
    "PROJECT_NOT_FOUND": "ERROR",
    "MULTIPLE_PROJECTS": "ERROR",
    "MULTIPLE_PROJECTS_SAME_META_PROJECT": "WARNING",
    "PROJECT_IN_OTHER_META_PROJECT": "ERROR",
    "PROJECT_WITHOUT_META_PROJECT": "ERROR",
    "NOT_IN_SOURCE_PROJECT_LIST": "WARNING",
    "LISTED_UNDER_OTHER_PCR_IN_SOURCE": "WARNING",
}


def load_json(file_path):
    if not file_path.exists():
        return []
    with open(file_path, encoding="utf8") as f:
        return json.load(f)


def clean(value):
    if value is None:
        return None
    if isinstance(value, str):
        value = value.strip()
        return value or None
    return value


class Command(BaseCommand):
    help = (
        "Read-only: check the imported legacy MYA PCRs against the client's "
        "MYAPCRs Excel checklist. Writes an xlsx report, nothing in the DB."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "file_path",
            type=str,
            help="Path to the MYAPCRs Excel checklist",
        )
        parser.add_argument(
            "--output",
            type=str,
            default=None,
            help=(
                "Path of the xlsx report "
                "(default: <IMPORT_DATA_DIR>/pcr/pcr_import_check.xlsx)"
            ),
        )

    def handle(self, *args, **options):
        pcr_dir = settings.IMPORT_DATA_DIR / "pcr"
        output = Path(options["output"] or pcr_dir / "pcr_import_check.xlsx")

        checklist = self.read_checklist(options["file_path"])
        source = self.read_source(pcr_dir)

        pcr_rows, meta_by_pcr_id = self.check_pcrs(checklist, source, pcr_dir)
        project_rows = self.check_projects(checklist, source, meta_by_pcr_id)
        extra_rows = self.get_extra_pcrs(checklist, source)

        self.write_report(output, pcr_rows, project_rows, extra_rows)
        self.print_summary(pcr_rows, project_rows, extra_rows, output)

    # --- input ---
    def read_checklist(self, file_path):
        """
        @return dict
            - struct: {pcr_project_id: {
                "sheet", "database", "country", "agreement", "codes": [str]
            }}
        """
        wb = openpyxl.load_workbook(file_path, read_only=True, data_only=True)
        checklist = {}
        for sheet_name, database in SHEET_DATABASE_MAPPING.items():
            ws = wb[sheet_name]
            country = agreement = None
            header_found = False
            for row in ws.iter_rows(values_only=True):
                row = [clean(v) for v in row[:5]]
                if not header_found:
                    header_found = row[3] == "Project Numbers"
                    continue
                if not any(row):
                    continue
                # country and agreement title are only set on the first tranche
                country = row[1] or country
                agreement = row[2] or agreement
                code, pcr_project_id = row[3], row[4]
                if pcr_project_id is None:
                    self.stdout.write(
                        self.style.WARNING(f"{sheet_name}: {code} has no Project ID")
                    )
                    continue
                pcr_project_id = str(int(pcr_project_id))
                entry = checklist.setdefault(
                    pcr_project_id,
                    {
                        "sheet": sheet_name,
                        "database": database,
                        "country": country,
                        "agreement": agreement,
                        "codes": [],
                    },
                )
                if code:
                    entry["codes"].append(code)
        return checklist

    def read_source(self, pcr_dir):
        """
        Read the legacy json files used by the PCR import

        @return dict
            - struct: {database: {
                "pcr_projects": set(pcr_project_id),
                "codes": {pcr_project_id: set(code)},
                "activities" / "activities_without_sector" /
                    "delay_explanations" / "learned_lessons" /
                    "submissions": Counter(pcr_project_id)
            }}
        """
        source = {}
        for database in SHEET_DATABASE_MAPPING.values():
            db_dir = pcr_dir / database
            codes = defaultdict(set)
            for entry in load_json(db_dir / "Import_ListofMYAProjects.json"):
                if entry["Code"]:
                    codes[str(entry["ProjectId"])].add(entry["Code"].strip())

            # the activities import skips sectors without a name, so their
            # activities are never imported
            sector_ids = {
                entry["Id"]
                for entry in load_json(db_dir / "PCRSector.json")
                if entry["Typeofactivity"]
            }
            activities = Counter()
            activities_without_sector = Counter()
            for entry in load_json(db_dir / "PCRActivity.json"):
                # same filter as the activities import (empty entries are skipped)
                if not check_pcr_json_data(entry, ACTIVITY_IMPORTANT_ARGS):
                    continue
                if entry["SectorId"] in sector_ids:
                    activities[str(entry["ProjectId"])] += 1
                else:
                    activities_without_sector[str(entry["ProjectId"])] += 1

            source[database] = {
                "pcr_projects": {
                    str(entry["Id"]) for entry in load_json(db_dir / "PCRProject.json")
                }
                | set(codes),
                "codes": codes,
                "activities": activities,
                "activities_without_sector": activities_without_sector,
                "delay_explanations": Counter(
                    str(entry["ProjectId"])
                    for entry in load_json(db_dir / "PCR53.json")
                ),
                "learned_lessons": Counter(
                    str(entry["ProjectId"]) for entry in load_json(db_dir / "PCR6.json")
                ),
                "submissions": Counter(
                    str(entry["ProjectId"])
                    for entry in load_json(db_dir / "PCRSubmission.json")
                ),
            }
            if not source[database]["pcr_projects"]:
                self.stdout.write(
                    self.style.WARNING(f"No legacy PCR json files found in {db_dir}")
                )
        return source

    # --- checks ---
    def check_pcrs(self, checklist, source, pcr_dir):
        """
        @return tuple(list of report rows, {pcr_project_id: [MetaProject]})
        """
        meta_by_pcr_id = defaultdict(list)
        for meta_project in MetaProject.objects.filter(
            pcr_project_id__in=checklist.keys()
        ):
            meta_by_pcr_id[meta_project.pcr_project_id].append(meta_project)

        old_pcrs = {
            old_pcr.meta_project_id: old_pcr
            for old_pcr in OLD_PCR.objects.filter(
                meta_project__pcr_project_id__in=checklist.keys()
            ).annotate(
                activities_count=Count("activities", distinct=True),
                delay_explanations_count=Count("delay_explanations", distinct=True),
                learned_lessons_count=Count("learned_lessons", distinct=True),
                supporting_evidences_count=Count("supporting_evidences", distinct=True),
            )
        }
        report_files = {
            file.stem.removeprefix("PCR_")
            for file in (pcr_dir / "pcr reports").glob("PCR_*.pdf")
        }

        rows = []
        for pcr_project_id, entry in checklist.items():
            src = source[entry["database"]]
            expected = {
                key: src[key][pcr_project_id]
                for key in ("activities", "delay_explanations", "learned_lessons")
            }
            without_sector = src["activities_without_sector"][pcr_project_id]
            has_data = any(expected.values())
            meta_projects = meta_by_pcr_id.get(pcr_project_id, [])
            meta_project = meta_projects[0] if len(meta_projects) == 1 else None
            old_pcr = old_pcrs.get(meta_project.id) if meta_project else None

            issues = []
            if pcr_project_id not in src["pcr_projects"]:
                issues.append("NOT_IN_SOURCE")
            elif not has_data:
                issues.append("NO_DATA_IN_SOURCE")
            if without_sector:
                issues.append("ACTIVITIES_WITHOUT_SECTOR")

            if not meta_projects:
                issues.append("META_PROJECT_MISSING")
            elif len(meta_projects) > 1:
                issues.append("MULTIPLE_META_PROJECTS")
            elif has_data and not old_pcr:
                issues.append("OLD_PCR_MISSING")

            imported = {}
            if old_pcr:
                imported = {
                    "activities": old_pcr.activities_count,
                    "delay_explanations": old_pcr.delay_explanations_count,
                    "learned_lessons": old_pcr.learned_lessons_count,
                }
                for key, count in expected.items():
                    if imported[key] != count:
                        issues.append(f"{key.upper()}_MISMATCH")
                if (
                    pcr_project_id in report_files
                    and not old_pcr.supporting_evidences_count
                ):
                    issues.append("SUPPORTING_EVIDENCE_MISSING")
                if src["submissions"][pcr_project_id] and not old_pcr.submission_date:
                    issues.append("SUBMISSION_DATE_MISSING")

            rows.append(
                {
                    "Sheet": entry["sheet"],
                    "Country": entry["country"],
                    "Agreement": entry["agreement"],
                    "Project ID": int(pcr_project_id),
                    "Tranches in checklist": len(entry["codes"]),
                    "In legacy json": pcr_project_id in src["pcr_projects"],
                    "Meta project(s)": ", ".join(
                        str(mp.code or mp.id) for mp in meta_projects
                    ),
                    "OLD_PCR id": old_pcr.id if old_pcr else None,
                    "Activities (source/imported)": self.fmt_counts(
                        expected["activities"], imported.get("activities")
                    ),
                    "Activities without sector (not imported)": without_sector,
                    "Delay explanations (source/imported)": self.fmt_counts(
                        expected["delay_explanations"],
                        imported.get("delay_explanations"),
                    ),
                    "Learned lessons (source/imported)": self.fmt_counts(
                        expected["learned_lessons"], imported.get("learned_lessons")
                    ),
                    "PDF report in source": pcr_project_id in report_files,
                    "Supporting evidences": (
                        old_pcr.supporting_evidences_count if old_pcr else None
                    ),
                    "Submission date": old_pcr.submission_date if old_pcr else None,
                    "Severity": self.get_severity(issues, PCR_ISSUES),
                    "Issues": ", ".join(issues),
                }
            )
        return rows, meta_by_pcr_id

    def check_projects(self, checklist, source, meta_by_pcr_id):
        all_codes = [code for entry in checklist.values() for code in entry["codes"]]
        projects_by_code = defaultdict(list)
        for project in Project.objects.filter(
            Q(code__in=all_codes) | Q(legacy_code__in=all_codes)
        ).select_related("meta_project"):
            for code in {project.code, project.legacy_code}:
                if code:
                    projects_by_code[code].append(project)

        source_pcr_by_code = {}
        for database, src in source.items():
            for pcr_project_id, codes in src["codes"].items():
                for code in codes:
                    source_pcr_by_code[(database, code)] = pcr_project_id

        rows = []
        for pcr_project_id, entry in checklist.items():
            meta_projects = meta_by_pcr_id.get(pcr_project_id, [])
            expected_meta = meta_projects[0] if len(meta_projects) == 1 else None
            for code in entry["codes"]:
                projects = projects_by_code.get(code, [])
                project = projects[0] if len(projects) == 1 else None
                issues = []
                if not projects:
                    issues.append("PROJECT_NOT_FOUND")
                elif len(projects) > 1:
                    if expected_meta and all(
                        p.meta_project_id == expected_meta.id for p in projects
                    ):
                        issues.append("MULTIPLE_PROJECTS_SAME_META_PROJECT")
                    else:
                        issues.append("MULTIPLE_PROJECTS")
                elif not project.meta_project:
                    issues.append("PROJECT_WITHOUT_META_PROJECT")
                elif expected_meta and project.meta_project_id != expected_meta.id:
                    issues.append("PROJECT_IN_OTHER_META_PROJECT")

                source_pcr_id = source_pcr_by_code.get((entry["database"], code))
                if source_pcr_id is None:
                    issues.append("NOT_IN_SOURCE_PROJECT_LIST")
                elif source_pcr_id != pcr_project_id:
                    issues.append("LISTED_UNDER_OTHER_PCR_IN_SOURCE")

                rows.append(
                    {
                        "Sheet": entry["sheet"],
                        "Country": entry["country"],
                        "Project ID": int(pcr_project_id),
                        "Project number": code,
                        "Project id(s) in DB": ", ".join(str(p.id) for p in projects),
                        "Project meta project(s)": ", ".join(
                            sorted(
                                {
                                    str(p.meta_project.code if p.meta_project else None)
                                    for p in projects
                                }
                            )
                        ),
                        "Expected meta project (by Project ID)": (
                            expected_meta.code if expected_meta else None
                        ),
                        "Project ID in Import_ListofMYAProjects": source_pcr_id,
                        "Severity": self.get_severity(issues, PROJECT_ISSUES),
                        "Issues": ", ".join(issues),
                    }
                )
        return rows

    def get_extra_pcrs(self, checklist, source):
        """
        Legacy PCRs that are in our json files or in the DB, but not in the checklist
        """
        rows = []
        for database, src in source.items():
            for pcr_project_id in sorted(
                src["pcr_projects"] - checklist.keys(), key=int
            ):
                rows.append(
                    {
                        "Found in": f"legacy json ({database})",
                        "Project ID": int(pcr_project_id),
                        "Meta project": None,
                    }
                )
        for old_pcr in (
            OLD_PCR.objects.exclude(meta_project__pcr_project_id__in=checklist.keys())
            .select_related("meta_project")
            .order_by("meta_project__code")
        ):
            rows.append(
                {
                    "Found in": "DB (OLD_PCR)",
                    "Project ID": old_pcr.meta_project.pcr_project_id,
                    "Meta project": old_pcr.meta_project.code,
                }
            )
        return rows

    # --- helpers ---
    @staticmethod
    def fmt_counts(expected, imported):
        return f"{expected} / {'-' if imported is None else imported}"

    @staticmethod
    def get_severity(issues, issue_levels):
        levels = {issue_levels[issue] for issue in issues}
        for level in ("ERROR", "WARNING", "INFO"):
            if level in levels:
                return level
        return "OK"

    # --- output ---
    def write_report(self, output, pcr_rows, project_rows, extra_rows):
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Summary"
        ws.append(["Sheet", "Issue", "Severity", "Count"])
        for rows, issue_levels in (
            (pcr_rows, PCR_ISSUES),
            (project_rows, PROJECT_ISSUES),
        ):
            for (sheet, issue), count in sorted(self.count_issues(rows).items()):
                ws.append([sheet, issue, issue_levels[issue], count])
        ws.append([])
        ws.append(["Legacy PCRs not in checklist", None, None, len(extra_rows)])

        for title, rows in (
            ("PCRs", pcr_rows),
            ("Projects", project_rows),
            ("Not in checklist", extra_rows),
        ):
            ws = wb.create_sheet(title)
            if not rows:
                continue
            ws.append(list(rows[0].keys()))
            for row in rows:
                ws.append(list(row.values()))
            ws.auto_filter.ref = ws.dimensions
            ws.freeze_panes = "A2"

        output.parent.mkdir(parents=True, exist_ok=True)
        wb.save(output)

    @staticmethod
    def count_issues(rows):
        counter = Counter()
        for row in rows:
            for issue in filter(None, row["Issues"].split(", ")):
                counter[(row["Sheet"], issue)] += 1
        return counter

    def print_summary(self, pcr_rows, project_rows, extra_rows, output):
        for title, rows in (("PCRs", pcr_rows), ("Projects", project_rows)):
            severities = Counter(row["Severity"] for row in rows)
            self.stdout.write(
                f"{title}: {len(rows)} checked - "
                + ", ".join(f"{k}: {v}" for k, v in sorted(severities.items()))
            )
            for (sheet, issue), count in sorted(self.count_issues(rows).items()):
                self.stdout.write(f"    {sheet} | {issue}: {count}")

        not_in_source = [
            str(row["Project ID"])
            for row in pcr_rows
            if "NOT_IN_SOURCE" in row["Issues"]
        ]
        if not_in_source:
            self.stdout.write(
                self.style.WARNING(
                    "Project IDs missing from the legacy json files "
                    f"(to be requested from the client): {', '.join(not_in_source)}"
                )
            )
        self.stdout.write(f"Legacy PCRs not in the checklist: {len(extra_rows)}")
        self.stdout.write(self.style.SUCCESS(f"Report saved to {output}"))
