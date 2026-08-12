from io import StringIO

import pytest

from django.core.management import call_command

from core.api.tests.factories import AgencyFactory
from core.api.tests.factories import ProjectFactory


pytestmark = pytest.mark.django_db


def make_projects_for_command():
    original_agency = AgencyFactory.create(name="UNEP")
    receiving_agency = AgencyFactory.create(name="UNDP")
    original = ProjectFactory.create(
        agency=original_agency,
        lead_agency=original_agency,
    )
    receiving = ProjectFactory.create(
        transferred_from=original,
        agency=receiving_agency,
        lead_agency=original_agency,
        lead_agency_submitting_on_behalf=True,
    )
    unrelated = ProjectFactory.create(
        agency=receiving_agency,
        lead_agency=original_agency,
        lead_agency_submitting_on_behalf=True,
    )
    return original, receiving, unrelated


def test_command_dry_run_reports_without_updating():
    original, receiving, unrelated = make_projects_for_command()
    stdout = StringIO()

    call_command("fix_transferred_project_lead_agencies", dry_run=True, stdout=stdout)

    original.refresh_from_db()
    receiving.refresh_from_db()
    unrelated.refresh_from_db()
    assert receiving.lead_agency == original.agency
    assert receiving.lead_agency_submitting_on_behalf is True
    assert unrelated.lead_agency == original.agency
    assert "DRY RUN: 1 receiving project(s) to fix." in stdout.getvalue()
    assert "No database changes were made." in stdout.getvalue()


def test_command_updates_only_receiving_projects():
    original, receiving, unrelated = make_projects_for_command()
    stdout = StringIO()

    call_command("fix_transferred_project_lead_agencies", stdout=stdout)

    original.refresh_from_db()
    receiving.refresh_from_db()
    unrelated.refresh_from_db()
    assert receiving.lead_agency == receiving.agency
    assert receiving.lead_agency_submitting_on_behalf is False
    assert original.lead_agency == original.agency
    assert unrelated.lead_agency == original.agency
    assert unrelated.lead_agency_submitting_on_behalf is True
    assert "LIVE: 1 receiving project(s) to fix." in stdout.getvalue()
    assert "Updated 1 receiving project(s)." in stdout.getvalue()
