from datetime import date
from decimal import Decimal

from core.api.tests.factories import (
    PCRDelayClusterFactory,
    PCRGoalFactory,
    PCRLearnedLessonCategoryFactory,
    PCRRootCausesOfDelayFactory,
    PCRSupportingEvidenceSectionFactory,
    SubstanceFactory,
)
from core.models.project_completion_report import (
    PCR,
    PCRAdditionalComment,
    PCRDelayCause,
    PCRDelayCauseRootCause,
    PCRFutureProjectRecommendation,
    PCRGenderMainstreaming,
    PCRLearnedLesson,
    PCRLearnedLessonDescription,
    PCROverallAssessmentHighlight,
    PCRProjectAlternativeTechnology,
    PCRProjectEnterprise,
    PCRProjectEquipment,
    PCRSupportingEvidence,
    PCRSustainableDevelopmentGoal,
    PCRSustainableDevelopmentGoalDescription,
)


def fill_pcr_required_data(pcr):
    """
    Fill all the data required to submit and approve the PCR, for the lead agency
    of the meta project and the agencies of the PCR projects.
    """
    PCR.objects.filter(pk=pcr.pk).update(
        financial_figures_status=PCR.FinancialFiguresStatus.FINAL,
        financial_figures_status_explanation="Final figures",
        addresses=pcr.addresses or "Address",
        project_goal_achieved=PCR.ProjectGoalAchieved.YES,
        project_goal_achieved_explanation="All goals achieved",
        rating=PCR.Rating.HIGHLY_SATISFACTORY,
        rating_explanation="Explanation",
        completed_by=PCR.CompletedBy.LEAD_AGENCY,
    )
    pcr.refresh_from_db()
    if not pcr.additional_comments.exists():
        PCRAdditionalComment.objects.create(
            pcr=pcr, entity=PCRAdditionalComment.Entity.ENTERPRISES, comment="Comment"
        )

    substance = SubstanceFactory.create()
    agency_ids = {pcr.meta_project.lead_agency_id}
    for pcr_project in pcr.pcr_projects.select_related("project"):
        agency_ids.add(pcr_project.project.agency_id)
        pcr_project.funds_disbursed = pcr_project.funds_disbursed or Decimal("100.00")
        pcr_project.planned_date_of_completion = date(2026, 1, 1)
        pcr_project.save()
        PCRProjectAlternativeTechnology.objects.create(
            pcr_project=pcr_project, substance_from=substance, substance_to=substance
        )
        PCRProjectEnterprise.objects.create(
            pcr_project=pcr_project, name="Enterprise", address="Address"
        )
        PCRProjectEquipment.objects.create(
            pcr_project=pcr_project,
            name="Equipment",
            description="Description",
            disposal_type=1,
            disposal_date=date(2026, 1, 1),
        )

    for agency_id in agency_ids - {None}:
        PCROverallAssessmentHighlight.objects.create(
            pcr=pcr,
            agency_id=agency_id,
            activity_title="Activity",
            planned_output="Planned",
            actual_activity_output="Actual",
            additional_remarks="Remarks",
        )
        delay_cause = PCRDelayCause.objects.create(
            pcr=pcr, agency_id=agency_id, delay_cluster=PCRDelayClusterFactory.create()
        )
        PCRDelayCauseRootCause.objects.create(
            delay_cause=delay_cause,
            root_cause=PCRRootCausesOfDelayFactory.create(),
            description_roots_causes_of_delay="Description",
            action_taken="Action",
        )
        learned_lesson = PCRLearnedLesson.objects.create(pcr=pcr, agency_id=agency_id)
        PCRLearnedLessonDescription.objects.create(
            learned_lesson=learned_lesson,
            lesson=PCRLearnedLessonCategoryFactory.create(),
            description="Lesson",
        )
        PCRFutureProjectRecommendation.objects.create(
            pcr=pcr, agency_id=agency_id, title="Title", description="Description"
        )
        PCRGenderMainstreaming.objects.create(
            pcr=pcr,
            agency_id=agency_id,
            project_preparation=PCRGenderMainstreaming.ProjectPreparation.IMPLEMENTATION,
            prefilled=PCRGenderMainstreaming.Prefilled.YES,
            qualitative_description="Description",
        )
        sdg = PCRSustainableDevelopmentGoal.objects.create(
            pcr=pcr, agency_id=agency_id, sdg_applying=True
        )
        PCRSustainableDevelopmentGoalDescription.objects.create(
            sgr=sdg, goal=PCRGoalFactory.create(), description="Contribution"
        )
        PCRSupportingEvidence.objects.create(
            pcr=pcr,
            agency_id=agency_id,
            section=PCRSupportingEvidenceSectionFactory.create(),
            link="https://example.com/evidence",
        )
    return pcr
