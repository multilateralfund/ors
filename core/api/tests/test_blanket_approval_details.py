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
