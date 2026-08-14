import pytest

from core.api.serializers.project_v2 import ProjectV2TransferSerializer
from core.api.tests.factories import AgencyFactory
from core.api.tests.factories import MeetingFactory
from core.api.tests.factories import ProjectFactory
from core.api.tests.factories import ProjectStatusFactory
from core.api.tests.factories import ProjectSubmissionStatusFactory
from core.api.tests.factories import UserFactory
from core.models import Project


pytestmark = pytest.mark.django_db


def test_transfer_preserves_mya_lead_agency():
    ProjectStatusFactory.create(name="Ongoing", code="ONG")
    ProjectStatusFactory.create(name="Transferred", code="TRF")
    approved_status = ProjectSubmissionStatusFactory.create(
        name="Approved", code="approved"
    )
    original_agency = AgencyFactory.create(name="UNEP", code="UNEP")
    receiving_agency = AgencyFactory.create(name="UNDP", code="UNDP")
    transfer_meeting = MeetingFactory.create(number=100)
    original_project = ProjectFactory.create(
        version=3,
        agency=original_agency,
        lead_agency=original_agency,
        total_fund=1_000,
        support_cost_psc=100,
        submission_status=approved_status,
        category=Project.Category.MYA,
    )
    serializer = ProjectV2TransferSerializer(
        original_project,
        data={
            "agency": receiving_agency.id,
            "transfer_meeting": transfer_meeting.id,
            "fund_transferred": "400.00",
            "psc_transferred": "40.00",
            "psc_received": "40.00",
        },
    )

    assert serializer.is_valid(), serializer.errors
    receiving_project = serializer.save(user=UserFactory.create())

    receiving_project.refresh_from_db()
    original_project.refresh_from_db()

    assert receiving_project.transferred_from == original_project
    assert receiving_project.agency == receiving_agency
    assert receiving_project.lead_agency == original_agency
    assert receiving_project.lead_agency_submitting_on_behalf is True
    assert original_project.agency == original_agency
    assert original_project.lead_agency == original_agency


def test_transfer_preserves_independent_lead_agency():
    ProjectStatusFactory.create(name="Ongoing", code="ONG")
    ProjectStatusFactory.create(name="Transferred", code="TRF")
    approved_status = ProjectSubmissionStatusFactory.create(
        name="Approved", code="approved"
    )
    lead_agency = AgencyFactory.create(name="UNEP", code="UNEP")
    original_agency = AgencyFactory.create(name="UNIDO", code="UNIDO")
    receiving_agency = AgencyFactory.create(name="UNDP", code="UNDP")
    original_project = ProjectFactory.create(
        version=3,
        agency=original_agency,
        lead_agency=lead_agency,
        lead_agency_submitting_on_behalf=True,
        total_fund=1_000,
        support_cost_psc=100,
        submission_status=approved_status,
        category=Project.Category.MYA,
    )
    serializer = ProjectV2TransferSerializer(
        original_project,
        data={
            "agency": receiving_agency.id,
            "transfer_meeting": MeetingFactory.create(number=100).id,
            "fund_transferred": "400.00",
            "psc_transferred": "40.00",
            "psc_received": "40.00",
        },
    )

    assert serializer.is_valid(), serializer.errors
    receiving_project = serializer.save(user=UserFactory.create())

    receiving_project.refresh_from_db()
    original_project.refresh_from_db()

    assert receiving_project.agency == receiving_agency
    assert receiving_project.lead_agency == lead_agency
    assert receiving_project.lead_agency_submitting_on_behalf is True
    assert original_project.agency == original_agency
    assert original_project.lead_agency == lead_agency
