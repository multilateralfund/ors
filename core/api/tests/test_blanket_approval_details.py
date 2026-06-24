import pytest
from django.contrib.auth.models import AnonymousUser
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from core.api.serializers.project_v2 import ProjectV2CreateUpdateSerializer
from core.api.tests.factories import (
    AgencyFactory,
    CountryFactory,
    ProjectClusterFactory,
    ProjectFactory,
    ProjectOdsOdpFactory,
    ProjectSubmissionStatusFactory,
    ProjectTypeFactory,
)
from core.api.views.blanket_approval_details import BlanketApprovalDetailsViewset
from core.models.project import ProjectOdsOdp


pytestmark = pytest.mark.django_db
# pylint: disable=protected-access


def get_blanket_approval_view():
    request = APIRequestFactory().get("/api/blanket-approval-details")
    request.user = AnonymousUser()

    view = BlanketApprovalDetailsViewset()
    view.request = Request(request)
    view.args = ()
    view.kwargs = {}

    return view


def test_blanket_approval_details_aggregates_phaseout_once_per_project():
    submission_status = ProjectSubmissionStatusFactory.create(name="Recommended")
    country = CountryFactory.create(name="Mexico")
    project = ProjectFactory.create(
        title="KIP - SI T2 - Foam",
        agency=AgencyFactory.create(name="UNDP"),
        country=country,
        cluster=ProjectClusterFactory.create(name="KIGALI IMPLEMENTATION PLAN STAGE 1"),
        project_type=ProjectTypeFactory.create(name="Investment"),
        submission_status=submission_status,
        total_fund=1_332_750,
        support_cost_psc=93_293,
    )

    for co2_mt in [85_648.37, 93_632.87, 272_793.16]:
        ProjectOdsOdpFactory.create(
            project=project,
            co2_mt=co2_mt,
            odp=None,
            phase_out_mt=None,
        )

    total_projects, grand_total, result = get_blanket_approval_view()._extract_data()

    assert total_projects == 1
    assert grand_total["hfc"] == 452
    assert grand_total["project_funding"] == 1_332_750
    assert grand_total["project_support_cost"] == 93_293
    assert grand_total["total"] == 1_426_043

    project_data = result[0]["country_data"][0]["projects"][0]
    assert project_data["project_id"] == project.id
    assert project_data["hfc"] == 452
    assert project_data["project_funding"] == 1_332_750


def test_blanket_approval_details_rounds_phaseout_values_and_totals():
    submission_status = ProjectSubmissionStatusFactory.create(name="Recommended")
    country = CountryFactory.create(name="Mexico")
    cluster = ProjectClusterFactory.create(name="KIGALI IMPLEMENTATION PLAN STAGE 1")
    project_type = ProjectTypeFactory.create(name="Investment")

    project = ProjectFactory.create(
        title="KIP - SI T2 - Foam",
        country=country,
        cluster=cluster,
        project_type=project_type,
        submission_status=submission_status,
    )
    for odp, co2_mt in [(1.111, 1200.2), (2.222, 1450.7)]:
        ProjectOdsOdpFactory.create(
            project=project,
            odp=odp,
            co2_mt=co2_mt,
            phase_out_mt=None,
        )

    second_project = ProjectFactory.create(
        title="KIP - SI T3 - Foam",
        country=country,
        cluster=cluster,
        project_type=project_type,
        submission_status=submission_status,
    )
    ProjectOdsOdpFactory.create(
        project=second_project,
        odp=1.26,
        co2_mt=1499.9,
        phase_out_mt=None,
    )

    _, grand_total, result = get_blanket_approval_view()._extract_data()

    projects = result[0]["country_data"][0]["projects"]
    assert projects[0]["hcfc"] == 3.3
    assert projects[0]["hfc"] == 3
    assert isinstance(projects[0]["hfc"], int)
    assert projects[1]["hcfc"] == 1.3
    assert projects[1]["hfc"] == 1
    assert result[0]["country_total"]["hcfc"] == 4.6
    assert result[0]["country_total"]["hfc"] == 4
    assert grand_total["hcfc"] == 4.6
    assert grand_total["hfc"] == 4


def test_blanket_approval_details_orders_alphabetically():
    submission_status = ProjectSubmissionStatusFactory.create(name="Recommended")
    cluster = ProjectClusterFactory.create(name="KIGALI IMPLEMENTATION PLAN STAGE 1")
    project_type = ProjectTypeFactory.create(name="Investment")

    mexico = CountryFactory.create(name="Mexico")
    canada = CountryFactory.create(name="Canada")

    ProjectFactory.create(
        title="Bravo",
        country=mexico,
        cluster=cluster,
        project_type=project_type,
        submission_status=submission_status,
    )
    ProjectFactory.create(
        title="Alpha",
        country=mexico,
        cluster=cluster,
        project_type=project_type,
        submission_status=submission_status,
    )
    ProjectFactory.create(
        title="Zulu",
        country=canada,
        cluster=cluster,
        project_type=project_type,
        submission_status=submission_status,
    )

    _, _, result = get_blanket_approval_view()._extract_data()

    assert [country["country_name"] for country in result] == ["CANADA", "MEXICO"]
    mexico_projects = result[1]["country_data"][0]["projects"]
    assert [project["project_title"] for project in mexico_projects] == [
        "Alpha",
        "Bravo",
    ]


def test_project_v2_update_removes_blank_ods_odp_rows():
    project = ProjectFactory.create()
    existing_phaseout = ProjectOdsOdpFactory.create(
        project=project,
        co2_mt=123,
        odp=None,
        phase_out_mt=None,
    )
    blank_phaseout = ProjectOdsOdpFactory.create(
        project=project,
        co2_mt=None,
        odp=None,
        phase_out_mt=None,
        ods_replacement=None,
        ods_replacement_text="",
    )

    serializer = ProjectV2CreateUpdateSerializer(context={})
    serializer._update_or_create_ods_odp(
        project,
        [
            {
                "id": existing_phaseout.id,
                "co2_mt": 456,
                "odp": None,
                "phase_out_mt": None,
            },
            {
                "id": blank_phaseout.id,
                "co2_mt": None,
                "odp": None,
                "phase_out_mt": None,
                "ods_replacement": None,
                "ods_replacement_text": "",
                "sort_order": 2,
            },
            {
                "co2_mt": None,
                "odp": None,
                "phase_out_mt": None,
                "ods_replacement": None,
                "ods_replacement_text": "",
                "sort_order": 3,
            },
        ],
    )

    ods_odp_entries = ProjectOdsOdp.objects.filter(project=project)
    assert list(ods_odp_entries.values_list("id", flat=True)) == [existing_phaseout.id]
    existing_phaseout.refresh_from_db()
    assert existing_phaseout.co2_mt == 456
