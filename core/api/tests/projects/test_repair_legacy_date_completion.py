from datetime import date
from unittest.mock import patch

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError

from core.api.tests.factories import ProjectFactory
from core.management.commands import repair_legacy_date_completion
from core.models import Project, ProjectHistory


pytestmark = pytest.mark.django_db


def test_repair_legacy_date_completion_dry_run_and_apply():
    legacy_code = "TST/PHA/01/INV/01"
    corrupted_date = date(2024, 12, 1)
    correct_date = date(2026, 12, 1)
    latest_project = ProjectFactory.create(
        legacy_code=legacy_code,
        version=4,
        date_completion=corrupted_date,
        project_end_date=corrupted_date,
    )
    version_three = ProjectFactory.create(
        legacy_code=legacy_code,
        version=3,
        latest_project=latest_project,
        date_completion=corrupted_date,
        project_end_date=corrupted_date,
    )

    with patch.dict(
        repair_legacy_date_completion.PROJECT_DATE_COMPLETIONS,
        {legacy_code: correct_date},
        clear=True,
    ):
        call_command("repair_legacy_date_completion")

        latest_project.refresh_from_db()
        version_three.refresh_from_db()
        assert latest_project.date_completion == corrupted_date
        assert version_three.date_completion == corrupted_date
        assert (
            ProjectHistory.objects.filter(
                description=repair_legacy_date_completion.HISTORY_DESCRIPTION
            ).count()
            == 0
        )

        call_command("repair_legacy_date_completion", apply=True)

    latest_project.refresh_from_db()
    version_three.refresh_from_db()
    assert latest_project.date_completion == correct_date
    assert version_three.date_completion == correct_date
    assert latest_project.project_end_date == corrupted_date
    assert version_three.project_end_date == corrupted_date
    assert (
        ProjectHistory.objects.filter(
            project_id__in=[latest_project.id, version_three.id],
            description=repair_legacy_date_completion.HISTORY_DESCRIPTION,
        ).count()
        == 2
    )


def test_repair_legacy_date_completion_aborts_on_conflict():
    legacy_code = "TST/PHA/01/INV/02"
    stored_date = date(2023, 12, 1)
    ProjectFactory.create(
        legacy_code=legacy_code,
        version=3,
        date_completion=stored_date,
        project_end_date=date(2024, 12, 1),
    )

    with patch.dict(
        repair_legacy_date_completion.PROJECT_DATE_COMPLETIONS,
        {legacy_code: date(2026, 12, 1)},
        clear=True,
    ), pytest.raises(CommandError, match="Conflicting value"):
        call_command("repair_legacy_date_completion", apply=True)

    project = Project.objects.get(legacy_code=legacy_code)
    assert project.date_completion == stored_date


def test_repair_legacy_date_completion_aborts_when_versions_differ():
    legacy_code = "TST/PHA/01/INV/03"
    latest_project = ProjectFactory.create(
        legacy_code=legacy_code,
        version=4,
        date_completion=date(2025, 12, 1),
        project_end_date=date(2025, 12, 1),
    )
    version_three = ProjectFactory.create(
        legacy_code=legacy_code,
        version=3,
        latest_project=latest_project,
        date_completion=date(2024, 12, 1),
        project_end_date=date(2024, 12, 1),
    )

    with patch.dict(
        repair_legacy_date_completion.PROJECT_DATE_COMPLETIONS,
        {legacy_code: date(2026, 12, 1)},
        clear=True,
    ), pytest.raises(CommandError, match="Different date_completion values"):
        call_command("repair_legacy_date_completion", apply=True)

    latest_project.refresh_from_db()
    version_three.refresh_from_db()
    assert latest_project.date_completion == date(2025, 12, 1)
    assert version_three.date_completion == date(2024, 12, 1)
