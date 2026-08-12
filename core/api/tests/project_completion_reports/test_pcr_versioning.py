# pylint: disable=redefined-outer-name,too-many-statements,too-many-arguments,too-many-locals
from datetime import date
from decimal import Decimal
from unittest.mock import patch

import pytest
from django.utils import timezone

from core.api.tests.factories import MetaProjectFactory

from core.models import PCR
from core.models import PCRActivity
from core.models import PCRAdditionalComment
from core.models import PCRProject
from core.models import PCRProjectAlternativeTechnology
from core.models import PCRProjectComponent
from core.models import PCRProjectComponentOption
from core.models import PCRProjectEnterprise
from core.models import PCRProjectEquipment
from core.models import PCRSupportingEvidence
from core.models import PCRSupportingEvidenceSection
from core.models import PCRSustainableDevelopmentGoal
from core.models import PCRSustainableDevelopmentGoalDescription
from core.models import PCRDelayCategory
from core.models import PCRDelayCause
from core.models import PCRGoal

pytestmark = pytest.mark.django_db


@pytest.fixture
def original_pcr(decision, secretariat_user):

    meta_project = MetaProjectFactory(umbrella_code="PCR-CALC")
    pcr = PCR.objects.create(
        meta_project=meta_project,
        version_created_by=secretariat_user,
        version=1,
        project_date_approved=timezone.now().date(),
        project_date_completion=timezone.now().date(),
        phase_out_ods_approved=Decimal("100.00"),
        phase_out_ods_actual=Decimal("90.00"),
        phase_out_co2_eq_t_approved=Decimal("200.00"),
        phase_out_co2_eq_t_actual=Decimal("180.00"),
        financial_figures_status="Final",
        financial_figures_status_explanation="Explanation for final status",
        addresses="Some addresses",
        project_goal_achieved="Yes",
        project_goal_achieved_explanation="Explanation for project goal achieved",
        rating="Highly satisfactory",
        rating_explanation="Explanation for rating",
        rating_explanation_other="Other explanation",
        completed_by="Lead Agency",
        submission_date=timezone.now().date(),
    )
    pcr.decisions.set([decision])
    pcr.save()
    return pcr


@pytest.fixture
def pcr_project(original_pcr, project):
    return PCRProject.objects.create(
        pcr=original_pcr,
        project=project,
        funds_disbursed=Decimal("100.00"),
        planned_date_of_completion=timezone.now().date(),
    )


@pytest.fixture
def pcr_project_alternative_technology(pcr_project, substance):
    return PCRProjectAlternativeTechnology.objects.create(
        pcr_project=pcr_project,
        substance_from=substance,
        substance_to=substance,
    )


@pytest.fixture
def pcr_project_enterprise(pcr_project):
    return PCRProjectEnterprise.objects.create(
        pcr_project=pcr_project,
        name="Enterprise Name",
        address="Enterprise Address",
    )


@pytest.fixture
def pcr_project_equipment(pcr_project):
    return PCRProjectEquipment.objects.create(
        pcr_project=pcr_project,
        name="Equipment Name",
        description="Equipment Description",
        disposal_type=1,
        disposal_date=timezone.now().date(),
    )


@pytest.fixture
def pcr_additional_comment(original_pcr):
    return PCRAdditionalComment.objects.create(
        pcr=original_pcr,
        entity="Cooperating agency",
        comment="Some comment",
    )


@pytest.fixture
def pcr_activity(original_pcr, agency):
    return PCRActivity.objects.create(
        pcr=original_pcr,
        agency=agency,
        type_of_activity="Activity Type",
        activity_title="Activity Title",
        type_of_sector="Sector Type",
        planned_output="Planned Output",
        actual_activity_output="Actual Output",
        additional_remarks="Additional Remarks",
    )


@pytest.fixture
def pcr_project_component_option():
    return PCRProjectComponentOption.objects.create(name="Component option")


@pytest.fixture
def pcr_project_component(original_pcr, agency, pcr_project_component_option):
    return PCRProjectComponent.objects.create(
        pcr=original_pcr,
        agency=agency,
        project_component_option=pcr_project_component_option,
    )


@pytest.fixture
def pcr_delay_category():
    return PCRDelayCategory.objects.create(name="Delay Category")


@pytest.fixture
def pcr_delay_cause(pcr_project_component, pcr_delay_category):
    return PCRDelayCause.objects.create(
        pcr_project_component=pcr_project_component,
        delay=pcr_delay_category,
        description="Delay Cause Description",
    )


@pytest.fixture
def pcr_goal():
    return PCRGoal.objects.create(name="PCR Goal")


@pytest.fixture
def pcr_sustainable_development_goal(original_pcr, agency, pcr_goal):
    sdg = PCRSustainableDevelopmentGoal.objects.create(
        pcr=original_pcr,
        agency=agency,
    )
    sdg.goals.add(pcr_goal)
    return sdg


@pytest.fixture
def pcr_supporting_evidence_section():
    return PCRSupportingEvidenceSection.objects.create(name="Section Name")


@pytest.fixture
def pcr_supporting_evidence(
    original_pcr, agency, pcr_supporting_evidence_section, test_file
):
    supporting_evidence = PCRSupportingEvidence.objects.create(
        pcr=original_pcr,
        agency=agency,
        section=pcr_supporting_evidence_section,
        link="http://example.com",
    )

    with test_file.open() as the_file:
        supporting_evidence.file.save("scott.txt", the_file)
        supporting_evidence.filename = test_file.name

    supporting_evidence.save()
    return supporting_evidence


@pytest.mark.django_db
def test_increase_version(
    original_pcr: "PCR",
    secretariat_user,
    pcr_project,
    pcr_project_alternative_technology,
    pcr_project_enterprise,
    pcr_project_equipment,
    pcr_additional_comment,
    pcr_activity,
    pcr_project_component,
    pcr_delay_cause,
    pcr_sustainable_development_goal,
    pcr_supporting_evidence,
):
    # Increase the version of the original PCR
    original_pcr.increase_version(secretariat_user)

    # Check that the original PCR still exists
    assert PCR.objects.filter(pk=original_pcr.pk).exists()

    # Check that the new PCR version was successfully created
    archived_pcr = PCR.objects.really_all().get(latest_pcr=original_pcr)
    assert original_pcr.version == 2
    assert archived_pcr.version == 1
    assert archived_pcr.version_created_by == secretariat_user
    assert archived_pcr.decisions.all().count() == original_pcr.decisions.all().count()

    # Check that related data was duplicated
    assert PCRProject.objects.filter(pcr=archived_pcr).exists()
    assert PCRProjectAlternativeTechnology.objects.filter(
        pcr_project__pcr=archived_pcr
    ).exists()
    assert PCRProjectEnterprise.objects.filter(pcr_project__pcr=archived_pcr).exists()
    assert PCRProjectEquipment.objects.filter(pcr_project__pcr=archived_pcr).exists()
    assert PCRAdditionalComment.objects.filter(pcr=archived_pcr).exists()
    assert PCRActivity.objects.filter(pcr=archived_pcr).exists()
    assert PCRProjectComponent.objects.filter(pcr=archived_pcr).exists()
    assert PCRDelayCause.objects.filter(
        pcr_project_component__pcr=archived_pcr
    ).exists()
    assert PCRSustainableDevelopmentGoal.objects.filter(pcr=archived_pcr).exists()
    assert PCRSupportingEvidence.objects.filter(pcr=archived_pcr).exists()

    # Check that the duplicated PCRProject has the correct fields
    new_pcr_project = PCRProject.objects.get(pcr=archived_pcr)
    assert new_pcr_project.project == pcr_project.project
    assert new_pcr_project.funds_disbursed == pcr_project.funds_disbursed
    assert (
        new_pcr_project.planned_date_of_completion
        == pcr_project.planned_date_of_completion
    )

    # Check that the duplicated PCRProjectAlternativeTechnology has the correct fields
    new_pcr_project_alternative_technology = (
        PCRProjectAlternativeTechnology.objects.get(pcr_project__pcr=archived_pcr)
    )
    assert (
        new_pcr_project_alternative_technology.substance_from
        == pcr_project_alternative_technology.substance_from
    )
    assert (
        new_pcr_project_alternative_technology.substance_to
        == pcr_project_alternative_technology.substance_to
    )

    # Check that the duplicated PCRProjectEnterprise has the correct fields
    new_pcr_project_enterprise = PCRProjectEnterprise.objects.get(
        pcr_project__pcr=archived_pcr
    )
    assert new_pcr_project_enterprise.name == pcr_project_enterprise.name
    assert new_pcr_project_enterprise.address == pcr_project_enterprise.address

    # Check that the duplicated PCRProjectEquipment has the correct fields
    new_pcr_project_equipment = PCRProjectEquipment.objects.get(
        pcr_project__pcr=archived_pcr
    )
    assert new_pcr_project_equipment.name == pcr_project_equipment.name
    assert new_pcr_project_equipment.description == pcr_project_equipment.description
    assert (
        new_pcr_project_equipment.disposal_type == pcr_project_equipment.disposal_type
    )
    assert (
        new_pcr_project_equipment.disposal_date == pcr_project_equipment.disposal_date
    )

    # Check that the duplicated PCRAdditionalComment has the correct fields
    new_pcr_additional_comment = PCRAdditionalComment.objects.get(pcr=archived_pcr)
    assert new_pcr_additional_comment.entity == pcr_additional_comment.entity
    assert new_pcr_additional_comment.comment == pcr_additional_comment.comment

    # Check that the duplicated PCRActivity has the correct fields
    new_pcr_activity = PCRActivity.objects.get(pcr=archived_pcr)
    assert new_pcr_activity.agency == pcr_activity.agency
    assert new_pcr_activity.type_of_activity == pcr_activity.type_of_activity
    assert new_pcr_activity.activity_title == pcr_activity.activity_title
    assert new_pcr_activity.type_of_sector == pcr_activity.type_of_sector
    assert new_pcr_activity.planned_output == pcr_activity.planned_output
    assert new_pcr_activity.additional_remarks == pcr_activity.additional_remarks

    # Check that the duplicated PCRProjectComponent has the correct fields
    new_pcr_project_component = PCRProjectComponent.objects.get(pcr=archived_pcr)
    assert new_pcr_project_component.agency == pcr_project_component.agency
    assert (
        new_pcr_project_component.project_component_option
        == pcr_project_component.project_component_option
    )

    # Check that the duplicated PCRDelayCause has the correct fields
    new_pcr_delay_cause = PCRDelayCause.objects.get(
        pcr_project_component__pcr=archived_pcr
    )
    assert new_pcr_delay_cause.delay == pcr_delay_cause.delay
    assert new_pcr_delay_cause.description == pcr_delay_cause.description

    # Check that the duplicated PCRSustainableDevelopmentGoal has the correct fields
    new_pcr_sustainable_development_goal = PCRSustainableDevelopmentGoal.objects.get(
        pcr=archived_pcr
    )
    assert (
        new_pcr_sustainable_development_goal.agency
        == pcr_sustainable_development_goal.agency
    )
    assert (
        new_pcr_sustainable_development_goal.goals.all().count()
        == pcr_sustainable_development_goal.goals.all().count()
    )

    # Check that the duplicated PCRSustainableDevelopmentGoalDescription has the correct fields
    original_pcr_sdg_descriptions = (
        PCRSustainableDevelopmentGoalDescription.objects.filter(
            sgr=pcr_sustainable_development_goal
        )
    )
    new_pcr_sdg_descriptions = PCRSustainableDevelopmentGoalDescription.objects.filter(
        sgr=new_pcr_sustainable_development_goal
    )
    for original_description, new_description in zip(
        original_pcr_sdg_descriptions, new_pcr_sdg_descriptions
    ):
        assert new_description.goal == original_description.goal
        assert new_description.description == original_description.description

    # Check that the duplicated PCRSupportingEvidence has the correct fields
    new_pcr_supporting_evidence = PCRSupportingEvidence.objects.get(pcr=archived_pcr)
    assert new_pcr_supporting_evidence.agency == pcr_supporting_evidence.agency
    assert new_pcr_supporting_evidence.section == pcr_supporting_evidence.section
    assert new_pcr_supporting_evidence.file.name != pcr_supporting_evidence.file.name
    assert f"_{new_pcr_supporting_evidence.id}" in new_pcr_supporting_evidence.file.name
    assert "_None" not in new_pcr_supporting_evidence.file.name
    assert new_pcr_supporting_evidence.filename == pcr_supporting_evidence.filename
    assert new_pcr_supporting_evidence.link == pcr_supporting_evidence.link


def test_increase_version_copies_link_only_supporting_evidence(
    original_pcr,
    secretariat_user,
    agency,
    pcr_supporting_evidence_section,
):
    PCRSupportingEvidence.objects.create(
        pcr=original_pcr,
        agency=agency,
        section=pcr_supporting_evidence_section,
        filename="External evidence",
        link="https://example.com/evidence",
    )

    original_pcr.increase_version(secretariat_user)

    archived_pcr = PCR.objects.really_all().get(latest_pcr=original_pcr)
    archived_evidence = PCRSupportingEvidence.objects.get(pcr=archived_pcr)

    assert archived_evidence.file.name == ""
    assert archived_evidence.filename == "External evidence"
    assert archived_evidence.link == "https://example.com/evidence"


def test_repeated_revisions_preserve_submission_history_and_creators(
    original_pcr,
    admin_user,
    secretariat_user,
):
    """Each review/rework cycle keeps the submitted revision as an archive."""
    original_pcr.submission_date = date(2026, 1, 10)
    original_pcr.addresses = "Initially submitted address"
    original_pcr.save()

    original_pcr.increase_version(admin_user)
    original_pcr.submission_date = date(2026, 2, 15)
    original_pcr.addresses = "First revised address"
    original_pcr.save()

    original_pcr.increase_version(secretariat_user)
    original_pcr.submission_date = date(2026, 3, 20)
    original_pcr.addresses = "Latest revised address"
    original_pcr.save()

    archived_versions = list(
        PCR.objects.really_all().filter(latest_pcr=original_pcr).order_by("version")
    )

    assert [pcr.version for pcr in archived_versions] == [1, 2]
    assert [pcr.submission_date for pcr in archived_versions] == [
        date(2026, 1, 10),
        date(2026, 2, 15),
    ]
    assert [pcr.addresses for pcr in archived_versions] == [
        "Initially submitted address",
        "First revised address",
    ]
    assert [pcr.version_created_by for pcr in archived_versions] == [
        secretariat_user,
        admin_user,
    ]

    original_pcr.refresh_from_db()
    assert original_pcr.version == 3
    assert original_pcr.version_created_by == secretariat_user
    assert original_pcr.submission_date == date(2026, 3, 20)
    assert original_pcr.addresses == "Latest revised address"

    assert list(PCR.objects.all()) == [original_pcr]
    assert PCR.objects.really_all().count() == 3


def test_archived_revision_is_unchanged_when_current_pcr_is_edited(
    original_pcr,
    secretariat_user,
    pcr_project,
    pcr_activity,
    pcr_additional_comment,
):
    """Reopened PCR edits must not mutate the version submitted for review."""
    original_pcr.increase_version(secretariat_user)
    archived_pcr = PCR.objects.really_all().get(latest_pcr=original_pcr)

    pcr_project.funds_disbursed = Decimal("250.00")
    pcr_project.save()
    pcr_activity.actual_activity_output = "Revised output"
    pcr_activity.save()
    pcr_additional_comment.comment = "Revised comment"
    pcr_additional_comment.save()

    archived_project = PCRProject.objects.get(pcr=archived_pcr)
    archived_activity = PCRActivity.objects.get(pcr=archived_pcr)
    archived_comment = PCRAdditionalComment.objects.get(pcr=archived_pcr)

    assert archived_project.funds_disbursed == Decimal("100.00")
    assert archived_activity.actual_activity_output == "Actual Output"
    assert archived_comment.comment == "Some comment"


def test_increase_version_rolls_back_when_snapshot_creation_fails(
    original_pcr,
    secretariat_user,
    pcr_activity,
):
    """A failed snapshot must leave the submitted PCR and its version unchanged."""
    assert pcr_activity.pcr == original_pcr

    with patch.object(
        PCRActivity,
        "make_copy",
        side_effect=RuntimeError("Unable to copy PCR activity"),
    ):
        with pytest.raises(RuntimeError, match="Unable to copy PCR activity"):
            original_pcr.increase_version(secretariat_user)

    original_pcr.refresh_from_db()
    assert original_pcr.version == 1
    assert (
        PCR.objects.really_all().filter(meta_project=original_pcr.meta_project).count()
        == 1
    )
    assert PCRActivity.objects.filter(pcr=original_pcr).count() == 1
