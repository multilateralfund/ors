import json
from decimal import Decimal

import pytest
from django.core.serializers.json import DjangoJSONEncoder
from django.urls import reverse
from rest_framework.test import APIClient

from core.api.pcr_phase_out import get_pcr_phase_out
from core.api.tests.factories import (
    AnnualAgencyProjectReportFactory,
    AnnualProgressReportFactory,
    AnnualProjectReportFactory,
    MetaProjectFactory,
    ProjectFactory,
    ProjectOdsOdpFactory,
)
from core.models.project_completion_report import PCR

# pylint: disable=redefined-outer-name

pytestmark = pytest.mark.django_db

DEFAULTS_URL = reverse("project-completion-report-create-defaults")

EMPTY = {
    "phase_out_ods_approved": None,
    "phase_out_ods_actual": None,
    "phase_out_co2_eq_t_approved": None,
    "phase_out_co2_eq_t_actual": None,
}


@pytest.fixture
def client(admin_user):
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client


@pytest.fixture
def progress_reports():
    return {
        year: AnnualProgressReportFactory.create(year=year, endorsed=endorsed)
        for year, endorsed in [(2024, True), (2025, True), (2026, False)]
    }


def _apr(project, progress_report, consumption=None, production=None):
    """An APR with the same consumption / production values for ODP and CO2"""
    consumption = consumption or (None, None)
    production = production or (None, None)
    return AnnualProjectReportFactory.create(
        project=project,
        report=AnnualAgencyProjectReportFactory.create(progress_report=progress_report),
        consumption_phased_out_odp=consumption[0],
        consumption_phased_out_co2=consumption[1],
        production_phased_out_odp=production[0],
        production_phased_out_co2=production[1],
    )


@pytest.fixture
def meta_project(project_approved_status, project_submitted_status, progress_reports):
    meta_project = MetaProjectFactory.create()

    # approved in version 3, still at version 3
    first = ProjectFactory.create(
        meta_project=meta_project, submission_status=project_approved_status, version=3
    )
    ProjectOdsOdpFactory.create(project=first, odp=1.5, co2_mt=100)
    ProjectOdsOdpFactory.create(project=first, odp=0.25, co2_mt=None)
    # consumption project, only the latest endorsed APR is used
    _apr(first, progress_reports[2024], consumption=(9, 900))
    _apr(first, progress_reports[2025], consumption=(2, 200))
    _apr(first, progress_reports[2026], consumption=(99, 9900))

    # changed after the approval, the ODS/ODP entries of version 3 are used
    second = ProjectFactory.create(
        meta_project=meta_project, submission_status=project_approved_status, version=4
    )
    ProjectOdsOdpFactory.create(project=second, odp=50, co2_mt=5000)
    second_version_3 = ProjectFactory.create(
        meta_project=meta_project,
        submission_status=project_approved_status,
        version=3,
        latest_project=second,
    )
    ProjectOdsOdpFactory.create(project=second_version_3, odp=3, co2_mt=300)
    # production project
    _apr(second, progress_reports[2024], production=(4, 400))

    # not approved yet, not included
    pending = ProjectFactory.create(
        meta_project=meta_project, submission_status=project_submitted_status
    )
    ProjectOdsOdpFactory.create(project=pending, odp=1000, co2_mt=1000)
    _apr(pending, progress_reports[2025], consumption=(1000, 1000))
    return meta_project


def test_phase_out(meta_project):
    assert get_pcr_phase_out(meta_project) == {
        "phase_out_ods_approved": Decimal("4.75"),
        "phase_out_ods_actual": Decimal("6"),
        "phase_out_co2_eq_t_approved": Decimal("400"),
        "phase_out_co2_eq_t_actual": Decimal("600"),
    }


def test_consumption_and_production(project_approved_status, progress_reports):
    meta_project = MetaProjectFactory.create()
    project = ProjectFactory.create(
        meta_project=meta_project, submission_status=project_approved_status, version=3
    )
    _apr(project, progress_reports[2025], consumption=(1, 10), production=(2, 20))

    phase_out = get_pcr_phase_out(meta_project)

    assert phase_out["phase_out_ods_actual"] == Decimal("3")
    assert phase_out["phase_out_co2_eq_t_actual"] == Decimal("30")


def test_no_data(project_approved_status, progress_reports):
    meta_project = MetaProjectFactory.create()
    project = ProjectFactory.create(
        meta_project=meta_project, submission_status=project_approved_status, version=3
    )
    # an APR with no phase-out, and one that is not endorsed
    _apr(project, progress_reports[2025])
    _apr(project, progress_reports[2026], consumption=(1, 1))

    assert get_pcr_phase_out(meta_project) == EMPTY
    assert get_pcr_phase_out(MetaProjectFactory.create()) == EMPTY


def test_create_defaults(client, meta_project):
    response = client.get(DEFAULTS_URL, {"meta_project_id": meta_project.id})

    assert response.status_code == 200
    assert response.data["phase_out_ods_approved"] == Decimal("4.75")
    assert response.data["phase_out_ods_actual"] == Decimal("6")
    assert response.data["phase_out_co2_eq_t_approved"] == Decimal("400")
    assert response.data["phase_out_co2_eq_t_actual"] == Decimal("600")


def test_create_computes_the_phase_out(client, meta_project):
    response = client.post(
        reverse("project-completion-report-list"),
        {
            "metadata": json.dumps(
                {
                    "meta_project_id": meta_project.id,
                    # read only, ignored
                    "phase_out_ods_approved": 1,
                    "phase_out_ods_actual": 1,
                    "phase_out_co2_eq_t_approved": 1,
                    "phase_out_co2_eq_t_actual": 1,
                },
                cls=DjangoJSONEncoder,
            ),
            "files": [],
        },
        format="multipart",
    )

    assert response.status_code == 201
    pcr = PCR.objects.get(id=response.data["id"])
    assert pcr.phase_out_ods_approved == Decimal("4.75")
    assert pcr.phase_out_ods_actual == Decimal("6")
    assert pcr.phase_out_co2_eq_t_approved == Decimal("400")
    assert pcr.phase_out_co2_eq_t_actual == Decimal("600")


def test_update_ignores_the_phase_out(client, meta_project):
    pcr = PCR.objects.create(
        meta_project=meta_project, phase_out_ods_approved=Decimal("4.75")
    )

    response = client.patch(
        reverse("project-completion-report-detail", args=[pcr.id]),
        {
            "metadata": json.dumps(
                {"phase_out_ods_approved": 1, "phase_out_ods_actual": 1}
            ),
            "files": [],
        },
        format="multipart",
    )

    assert response.status_code == 200
    pcr.refresh_from_db()
    assert pcr.phase_out_ods_approved == Decimal("4.75")
    assert pcr.phase_out_ods_actual is None
