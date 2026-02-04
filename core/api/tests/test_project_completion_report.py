"""
Unit tests for Project Completion Report (PCR) API endpoints.
"""

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.urls import reverse
from rest_framework import status

from core.api.tests.factories import PCRSupportingEvidenceFactory
from core.api.tests.base import BaseTest
from core.models.project_complition_report import (
    PCRCauseOfDelay,
    PCRComment,
    PCRGenderMainstreaming,
    PCRLessonLearned,
    PCROverallAssessment,
    PCRProjectActivity,
    PCRRecommendation,
    PCRSDGContribution,
    ProjectCompletionReport,
    PCRSupportingEvidence,
)

# pylint: disable=W0221,W0613,C0302,R0913,R0914


@pytest.mark.django_db
class TestPCRReferenceDataView(BaseTest):

    def test_without_login(self):
        self.client.force_authenticate(user=None)
        url = reverse("pcr-reference-data")
        response = self.client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_returns_all_reference_data(self, user):
        call_command("loaddata", "core/fixtures/pcr_reference_data.json", verbosity=0)

        self.client.force_authenticate(user=user)
        url = reverse("pcr-reference-data")
        response = self.client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "delay_categories" in response.data
        assert "lesson_categories" in response.data
        assert "project_elements" in response.data
        assert "sdgs" in response.data
        assert "gender_phases" in response.data

        # Check SDGs loaded from fixtures
        assert len(response.data["sdgs"]) == 17
        # Check Project Elements loaded from fixtures
        assert len(response.data["project_elements"]) == 7
        # Check Gender Phases loaded from fixtures
        assert len(response.data["gender_phases"]) == 4


@pytest.mark.django_db
class TestPCRWorkspaceView(BaseTest):

    def test_without_login(self, project):
        self.client.force_authenticate(user=None)
        url = reverse("pcr-workspace")
        response = self.client.get(url, {"project_id": project.id})
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_missing_project_and_meta_project(self, user):
        self.client.force_authenticate(user=user)
        url = reverse("pcr-workspace")
        response = self.client.get(url)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Either project_id or meta_project_id" in str(response.data)

    def test_both_project_and_meta_project(self, user, project, meta_project):
        self.client.force_authenticate(user=user)
        url = reverse("pcr-workspace")
        response = self.client.get(
            url, {"project_id": project.id, "meta_project_id": meta_project.id}
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_creates_pcr_for_project(self, pcr_agency_inputter_user, project):
        self.client.force_authenticate(user=pcr_agency_inputter_user)
        url = reverse("pcr-workspace")

        # Verify PCR doesn't exist yet
        assert ProjectCompletionReport.objects.count() == 0

        response = self.client.get(url, {"project_id": project.id})

        assert response.status_code == status.HTTP_200_OK
        assert ProjectCompletionReport.objects.count() == 1

        pcr = ProjectCompletionReport.objects.first()
        assert pcr.project == project
        assert pcr.status == ProjectCompletionReport.Status.DRAFT

        # Should have created tranche data
        assert pcr.tranches.count() >= 1

    def test_returns_existing_pcr(self, pcr_agency_viewer_user, project):
        self.client.force_authenticate(user=pcr_agency_viewer_user)
        url = reverse("pcr-workspace")

        # First call creates PCR
        response1 = self.client.get(url, {"project_id": project.id})
        pcr_id_1 = response1.data["id"]

        # Second call returns same PCR
        response2 = self.client.get(url, {"project_id": project.id})
        pcr_id_2 = response2.data["id"]

        assert pcr_id_1 == pcr_id_2
        assert ProjectCompletionReport.objects.count() == 1

    def test_agency_user_cannot_access_other_agency_project(
        self, pcr_agency_viewer_user, pcr_project_other_agency
    ):
        self.client.force_authenticate(user=pcr_agency_viewer_user)
        url = reverse("pcr-workspace")

        response = self.client.get(url, {"project_id": pcr_project_other_agency.id})
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestPCRListView(BaseTest):

    def test_without_login(self):
        self.client.force_authenticate(user=None)
        url = reverse("pcr-list")
        response = self.client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_agency_user_sees_only_own_pcrs(
        self, pcr_agency_viewer_user, project, pcr_project_other_agency, pcr_factory
    ):
        # Create PCR for user's agency
        pcr1 = pcr_factory(project=project)

        # Create PCR for other agency
        pcr_factory(project=pcr_project_other_agency)

        self.client.force_authenticate(user=pcr_agency_viewer_user)
        url = reverse("pcr-list")
        response = self.client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["id"] == pcr1.id

    def test_mlfs_user_sees_all_pcrs(
        self, mlfs_admin_user, project, pcr_project_other_agency, pcr_factory
    ):
        pcr_factory(project=project)
        pcr_factory(project=pcr_project_other_agency)

        self.client.force_authenticate(user=mlfs_admin_user)
        url = reverse("pcr-list")
        response = self.client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2


@pytest.mark.django_db
class TestPCRDetailView(BaseTest):

    def test_without_login(self, pcr_with_data):
        self.client.force_authenticate(user=None)
        url = reverse("pcr-detail", kwargs={"pk": pcr_with_data.id})
        response = self.client.get(url)
        assert response.status_code == 403

    def test_get_pcr_detail(self, pcr_agency_viewer_user, pcr_with_data):
        self.client.force_authenticate(user=pcr_agency_viewer_user)
        url = reverse("pcr-detail", kwargs={"pk": pcr_with_data.id})
        response = self.client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == pcr_with_data.id
        assert "activities" in response.data
        assert "overall_assessments" in response.data
        assert "tranches" in response.data
        assert "comments" in response.data


@pytest.mark.django_db
class TestPCRUpdateView(BaseTest):

    def test_without_login(self, pcr_with_data):
        self.client.force_authenticate(user=None)
        url = reverse("pcr-update", kwargs={"pk": pcr_with_data.id})
        response = self.client.get(url)
        assert response.status_code == 403

    def test_update_pcr_overview(self, pcr_agency_inputter_user, pcr_with_data):
        self.client.force_authenticate(user=pcr_agency_inputter_user)
        url = reverse("pcr-update", kwargs={"pk": pcr_with_data.id})

        data = {
            "project": pcr_with_data.project.id,
            "financial_figures_status": "final",
            "all_goals_achieved": True,
            "overall_rating": "highly_satisfactory",
        }

        response = self.client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["financial_figures_status"] == "final"
        assert response.data["all_goals_achieved"] is True

    def test_cannot_update_submitted_pcr_as_agency(
        self, pcr_agency_inputter_user, pcr_submitted
    ):
        # Lock the PCR (submitted PCRs are locked after submission)
        pcr_submitted.is_unlocked = False
        pcr_submitted.save()

        self.client.force_authenticate(user=pcr_agency_inputter_user)
        url = reverse("pcr-update", kwargs={"pk": pcr_submitted.id})

        data = {"all_goals_achieved": False}
        response = self.client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestPCRProjectActivityView(BaseTest):

    def test_without_login(self, pcr_with_data):
        self.client.force_authenticate(user=None)
        url = reverse("pcr-activity-create", kwargs={"pcr_id": pcr_with_data.id})
        response = self.client.post(url, {}, format="json")
        assert response.status_code == 403

    def test_create_activity(self, pcr_agency_inputter_user, pcr_with_data):
        self.client.force_authenticate(user=pcr_agency_inputter_user)
        url = reverse("pcr-activity-create", kwargs={"pcr_id": pcr_with_data.id})

        data = {
            "project_type": "INV",
            "sector": "FOA",
            "activity_type": "EQUIPMENT",
            "planned_outputs": "100 units",
            "actual_outputs": "95 units",
        }

        response = self.client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert PCRProjectActivity.objects.count() == 1
        assert response.data["planned_outputs"] == "100 units"

    def test_update_activity(self, pcr_agency_inputter_user, pcr_project_activity):
        self.client.force_authenticate(user=pcr_agency_inputter_user)
        url = reverse("pcr-activity-update", kwargs={"pk": pcr_project_activity.id})

        data = {"actual_outputs": "Updated outputs"}
        response = self.client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["actual_outputs"] == "Updated outputs"

    def test_delete_activity(self, pcr_agency_inputter_user, pcr_project_activity):
        self.client.force_authenticate(user=pcr_agency_inputter_user)
        url = reverse("pcr-activity-update", kwargs={"pk": pcr_project_activity.id})

        response = self.client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert PCRProjectActivity.objects.count() == 0

    def test_cannot_edit_submitted_report(
        self, pcr_agency_inputter_user, pcr_submitted
    ):
        self.client.force_authenticate(user=pcr_agency_inputter_user)
        url = reverse(
            "pcr-activity-create",
            kwargs={"pcr_id": pcr_submitted.id},
        )

        data = {"project_type": "INV"}
        response = self.client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestPCROverallAssessmentUpdate(BaseTest):

    def test_without_login(self, pcr_with_data):
        self.client.force_authenticate(user=None)
        url = reverse(
            "pcr-overall-assessment-update",
            kwargs={"pcr_id": pcr_with_data.id},
        )
        response = self.client.post(url, {}, format="json")
        assert response.status_code == 403

    def test_create_overall_assessment(self, pcr_agency_inputter_user, pcr_with_data):
        self.client.force_authenticate(user=pcr_agency_inputter_user)
        url = reverse(
            "pcr-overall-assessment-update",
            kwargs={"pcr_id": pcr_with_data.id},
        )

        data = {
            "rating": "satisfactory_planned",
            "rating_explanation": "Good project implementation",
        }

        response = self.client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert PCROverallAssessment.objects.count() == 1

    def test_update_existing_assessment(
        self, pcr_agency_inputter_user, pcr_with_data, pcr_overall_assessment
    ):
        self.client.force_authenticate(user=pcr_agency_inputter_user)
        url = reverse(
            "pcr-overall-assessment-update",
            kwargs={"pcr_id": pcr_with_data.id},
        )

        data = {"rating": "highly_satisfactory"}
        response = self.client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["rating"] == "highly_satisfactory"
        # Should still be only one assessment
        assert PCROverallAssessment.objects.count() == 1


@pytest.mark.django_db
class TestPCRCommentView(BaseTest):

    def test_without_login(self, pcr_with_data):
        self.client.force_authenticate(user=None)
        url = reverse("pcr-comment-create")
        response = self.client.post(url, {}, format="json")
        assert response.status_code == 403

    def test_create_comment_on_pcr(self, pcr_agency_inputter_user, pcr_with_data):
        self.client.force_authenticate(user=pcr_agency_inputter_user)
        url = reverse("pcr-comment-create")

        data = {
            "pcr_id": pcr_with_data.id,
            "section": "project_results",
            "entity_type": "secretariat",
            "comment_text": "Test pcr_comment",
        }

        response = self.client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert PCRComment.objects.count() == 1

    def test_update_comment(self, pcr_agency_inputter_user, pcr_comment):
        self.client.force_authenticate(user=pcr_agency_inputter_user)
        url = reverse("pcr-comment-update", kwargs={"pk": pcr_comment.id})

        data = {"comment_text": "Updated pcr_comment"}
        response = self.client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["comment_text"] == "Updated pcr_comment"

    def test_delete_comment(self, pcr_agency_inputter_user, pcr_comment):
        self.client.force_authenticate(user=pcr_agency_inputter_user)
        url = reverse("pcr-comment-update", kwargs={"pk": pcr_comment.id})

        response = self.client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert PCRComment.objects.count() == 0


@pytest.mark.django_db
class TestPCRCauseOfDelayView(BaseTest):

    def test_without_login(self, pcr_with_data):
        self.client.force_authenticate(user=None)
        url = reverse(
            "pcr-cause-of-delay-create",
            kwargs={"pcr_id": pcr_with_data.id},
        )
        response = self.client.post(url, {}, format="json")
        assert response.status_code == 403

    def test_create_cause_of_delay(
        self, pcr_agency_inputter_user, pcr_with_data, pcr_project_element
    ):
        self.client.force_authenticate(user=pcr_agency_inputter_user)
        url = reverse(
            "pcr-cause-of-delay-create",
            kwargs={"pcr_id": pcr_with_data.id},
        )

        data = {
            "project_element": pcr_project_element.id,
            "description": "Delayed due to COVID-19",
            "categories": [],
        }

        response = self.client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert PCRCauseOfDelay.objects.count() == 1

    def test_update_cause_of_delay(self, pcr_agency_inputter_user, pcr_cause_of_delay):
        self.client.force_authenticate(user=pcr_agency_inputter_user)
        url = reverse("pcr-cause-of-delay-update", kwargs={"pk": pcr_cause_of_delay.id})

        data = {"description": "Updated delay description"}
        response = self.client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["description"] == "Updated delay description"

    def test_delete_cause_of_delay(self, pcr_agency_inputter_user, pcr_cause_of_delay):
        self.client.force_authenticate(user=pcr_agency_inputter_user)
        url = reverse("pcr-cause-of-delay-update", kwargs={"pk": pcr_cause_of_delay.id})

        response = self.client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert PCRCauseOfDelay.objects.count() == 0


@pytest.mark.django_db
class TestPCRLessonLearnedView(BaseTest):

    def test_without_login(self, pcr_with_data):
        self.client.force_authenticate(user=None)
        url = reverse(
            "pcr-lesson-learned-create",
            kwargs={"pcr_id": pcr_with_data.id},
        )
        response = self.client.post(url, {}, format="json")
        assert response.status_code == 403

    def test_create_lesson_learned(
        self, pcr_agency_inputter_user, pcr_with_data, pcr_project_element
    ):
        self.client.force_authenticate(user=pcr_agency_inputter_user)
        url = reverse(
            "pcr-lesson-learned-create",
            kwargs={"pcr_id": pcr_with_data.id},
        )

        data = {
            "project_element": pcr_project_element.id,
            "description": "Important lesson learned",
            "categories": [],
        }

        response = self.client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert PCRLessonLearned.objects.count() == 1

    def test_update_lesson_learned(self, pcr_agency_inputter_user, pcr_lesson_learned):
        self.client.force_authenticate(user=pcr_agency_inputter_user)
        url = reverse("pcr-lesson-learned-update", kwargs={"pk": pcr_lesson_learned.id})

        data = {"description": "Updated lesson"}
        response = self.client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK

    def test_delete_lesson_learned(self, pcr_agency_inputter_user, pcr_lesson_learned):
        self.client.force_authenticate(user=pcr_agency_inputter_user)
        url = reverse("pcr-lesson-learned-update", kwargs={"pk": pcr_lesson_learned.id})

        response = self.client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert PCRLessonLearned.objects.count() == 0


@pytest.mark.django_db
class TestPCRRecommendationView(BaseTest):

    def test_without_login(self, pcr_with_data):
        self.client.force_authenticate(user=None)
        url = reverse("pcr-recommendation-create")
        response = self.client.post(url, {}, format="json")
        assert response.status_code == 403

    def test_create_recommendation_on_pcr(
        self, pcr_agency_inputter_user, pcr_with_data
    ):
        self.client.force_authenticate(user=pcr_agency_inputter_user)
        url = reverse("pcr-recommendation-create")

        data = {
            "pcr_id": pcr_with_data.id,
            "recommendation_text": "Recommendation text",
        }

        response = self.client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert PCRRecommendation.objects.count() == 1

    def test_update_recommendation(self, pcr_agency_inputter_user, pcr_recommendation):
        self.client.force_authenticate(user=pcr_agency_inputter_user)
        url = reverse("pcr-recommendation-update", kwargs={"pk": pcr_recommendation.id})

        data = {"recommendation_text": "Updated pcr_recommendation"}
        response = self.client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK

    def test_delete_recommendation(self, pcr_agency_inputter_user, pcr_recommendation):
        self.client.force_authenticate(user=pcr_agency_inputter_user)
        url = reverse("pcr-recommendation-update", kwargs={"pk": pcr_recommendation.id})

        response = self.client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert PCRRecommendation.objects.count() == 0


@pytest.mark.django_db
class TestPCRGenderMainstreamingView(BaseTest):

    def test_without_login(self, pcr_with_data):
        self.client.force_authenticate(user=None)
        url = reverse(
            "pcr-gender-mainstreaming-create",
            kwargs={"pcr_id": pcr_with_data.id},
        )
        response = self.client.post(url, {}, format="json")
        assert response.status_code == 403

    def test_create_gender_mainstreaming(
        self, pcr_agency_inputter_user, pcr_with_data, pcr_gender_phase
    ):
        self.client.force_authenticate(user=pcr_agency_inputter_user)
        url = reverse(
            "pcr-gender-mainstreaming-create",
            kwargs={"pcr_id": pcr_with_data.id},
        )

        data = {
            "phase": pcr_gender_phase.id,
            "indicator_met": True,
            "qualitative_description": "Gender indicators met",
        }

        response = self.client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert PCRGenderMainstreaming.objects.count() == 1

    def test_update_gender_mainstreaming(
        self, pcr_agency_inputter_user, pcr_gender_mainstreaming
    ):
        self.client.force_authenticate(user=pcr_agency_inputter_user)
        url = reverse(
            "pcr-gender-mainstreaming-update",
            kwargs={"pk": pcr_gender_mainstreaming.id},
        )

        data = {"indicator_met": False}
        response = self.client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK

    def test_delete_gender_mainstreaming(
        self, pcr_agency_inputter_user, pcr_gender_mainstreaming
    ):
        self.client.force_authenticate(user=pcr_agency_inputter_user)
        url = reverse(
            "pcr-gender-mainstreaming-update",
            kwargs={"pk": pcr_gender_mainstreaming.id},
        )

        response = self.client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert PCRGenderMainstreaming.objects.count() == 0


@pytest.mark.django_db
class TestPCRSDGContributionView(BaseTest):

    def test_without_login(self, pcr_with_data):
        self.client.force_authenticate(user=None)
        url = reverse(
            "pcr-sdg-contribution-create",
            kwargs={"pcr_id": pcr_with_data.id},
        )
        response = self.client.post(url, {}, format="json")
        assert response.status_code == 403

    def test_create_sdg_contribution(
        self, pcr_agency_inputter_user, pcr_with_data, pcr_sdg
    ):
        self.client.force_authenticate(user=pcr_agency_inputter_user)
        url = reverse(
            "pcr-sdg-contribution-create",
            kwargs={"pcr_id": pcr_with_data.id},
        )

        data = {
            "sdg": pcr_sdg.id,
            "description": "Contributed to SDG goals",
        }

        response = self.client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert PCRSDGContribution.objects.count() == 1

    def test_update_sdg_contribution(self, pcr_agency_inputter_user, pcr_sdg_contrib):
        self.client.force_authenticate(user=pcr_agency_inputter_user)
        url = reverse("pcr-sdg-contribution-update", kwargs={"pk": pcr_sdg_contrib.id})

        data = {"description": "Updated description"}
        response = self.client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK

    def test_delete_sdg_contribution(self, pcr_agency_inputter_user, pcr_sdg_contrib):
        self.client.force_authenticate(user=pcr_agency_inputter_user)
        url = reverse("pcr-sdg-contribution-update", kwargs={"pk": pcr_sdg_contrib.id})

        response = self.client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert PCRSDGContribution.objects.count() == 0


@pytest.mark.django_db
class TestPCRSubmit(BaseTest):
    def test_without_login(self, pcr_with_data):
        self.client.force_authenticate(user=None)
        url = reverse("pcr-submit", kwargs={"pk": pcr_with_data.id})
        response = self.client.post(url, {}, format="json")
        assert response.status_code == 403

    def test_lead_agency_can_submit_pcr(self, pcr_agency_submitter_user, pcr_with_data):
        self.client.force_authenticate(user=pcr_agency_submitter_user)
        url = reverse("pcr-submit", kwargs={"pk": pcr_with_data.id})

        data = {}
        response = self.client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK

        pcr_with_data.refresh_from_db()
        assert pcr_with_data.status == ProjectCompletionReport.Status.SUBMITTED


@pytest.mark.django_db
class TestPCRSupportingEvidence(BaseTest):
    def test_without_login(self):
        self.client.force_authenticate(user=None)
        url = reverse("pcr-supporting-evidence-upload")
        response = self.client.post(url, {}, format="json")
        assert response.status_code == 403

    def test_upload_supporting_evidence(
        self, pcr_agency_inputter_user, pcr_with_data, tmp_path
    ):
        self.client.force_authenticate(user=pcr_agency_inputter_user)
        url = reverse("pcr-supporting-evidence-upload")

        # Create a simple test file
        test_file = SimpleUploadedFile(
            "test_evidence.pdf", b"file_content", content_type="application/pdf"
        )

        data = {
            "pcr_id": pcr_with_data.id,
            "description": "Test supporting evidence",
            "related_section": "overview",
            "file": test_file,
        }

        response = self.client.post(url, data, format="multipart")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["description"] == "Test supporting evidence"
        assert "file" in response.data

        # Check that it was saved
        assert PCRSupportingEvidence.objects.filter(pcr=pcr_with_data).count() == 1

    def test_upload_without_pcr_id(self, pcr_agency_inputter_user):
        self.client.force_authenticate(user=pcr_agency_inputter_user)
        url = reverse("pcr-supporting-evidence-upload")

        data = {"description": "Test evidence"}

        response = self.client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_delete_supporting_evidence(self, pcr_agency_inputter_user, pcr_with_data):
        self.client.force_authenticate(user=pcr_agency_inputter_user)

        # Create evidence
        evidence = PCRSupportingEvidenceFactory(pcr=pcr_with_data)

        url = reverse("pcr-supporting-evidence-delete", kwargs={"pk": evidence.id})
        response = self.client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not PCRSupportingEvidence.objects.filter(id=evidence.id).exists()

    def test_agency_user_cannot_delete_other_agency_evidence(
        self, pcr_agency_inputter_user, pcr_project_other_agency, pcr_factory
    ):
        # Create PCR for another agency
        other_pcr = pcr_factory(project=pcr_project_other_agency)
        evidence = PCRSupportingEvidenceFactory(pcr=other_pcr)

        self.client.force_authenticate(user=pcr_agency_inputter_user)
        url = reverse("pcr-supporting-evidence-delete", kwargs={"pk": evidence.id})
        response = self.client.delete(url)

        # Permission checks happen before queryset filtering
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestPCRLockUnlock(BaseTest):
    def test_without_login(self, pcr_with_data):
        self.client.force_authenticate(user=None)
        url = reverse("pcr-toggle-lock", kwargs={"pk": pcr_with_data.id})
        response = self.client.post(url, {"is_unlocked": True}, format="json")
        assert response.status_code == 403

    def test_submit_locks_pcr(self, pcr_agency_submitter_user, pcr_with_data):
        self.client.force_authenticate(user=pcr_agency_submitter_user)

        pcr_with_data.is_unlocked = True
        pcr_with_data.save(update_fields=["is_unlocked"])
        assert pcr_with_data.status == ProjectCompletionReport.Status.DRAFT

        url = reverse("pcr-submit", kwargs={"pk": pcr_with_data.id})
        response = self.client.post(url, {}, format="json")

        assert response.status_code == status.HTTP_200_OK

        # Verify PCR is now locked
        pcr_with_data.refresh_from_db()
        assert pcr_with_data.is_unlocked is False
        assert pcr_with_data.status == ProjectCompletionReport.Status.SUBMITTED

    def test_mlfs_can_unlock_pcr(self, mlfs_admin_user, pcr_with_data):
        pcr_with_data.status = ProjectCompletionReport.Status.SUBMITTED
        pcr_with_data.is_unlocked = False
        pcr_with_data.save()

        self.client.force_authenticate(user=mlfs_admin_user)
        url = reverse("pcr-toggle-lock", kwargs={"pk": pcr_with_data.id})

        data = {"is_unlocked": True}
        response = self.client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_unlocked"] is True
        assert response.data["message"] == "PCR unlocked successfully."

        pcr_with_data.refresh_from_db()
        assert pcr_with_data.is_unlocked is True

    def test_agency_cannot_unlock_pcr(self, pcr_agency_inputter_user, pcr_with_data):
        pcr_with_data.status = ProjectCompletionReport.Status.SUBMITTED
        pcr_with_data.is_unlocked = False
        pcr_with_data.save()

        self.client.force_authenticate(user=pcr_agency_inputter_user)
        url = reverse("pcr-toggle-lock", kwargs={"pk": pcr_with_data.id})

        data = {"is_unlocked": True}
        response = self.client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Only MLFS users can lock/unlock" in str(response.data)

    def test_cannot_edit_locked_pcr(self, pcr_agency_inputter_user, pcr_with_data):
        pcr_with_data.status = ProjectCompletionReport.Status.SUBMITTED
        pcr_with_data.is_unlocked = False
        pcr_with_data.save()

        self.client.force_authenticate(user=pcr_agency_inputter_user)

        # Try to update the PCR overview
        url = reverse("pcr-update", kwargs={"pk": pcr_with_data.id})
        data = {"financial_figures_status": "final"}
        response = self.client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Cannot edit submitted PCR" in str(response.data)

    def test_can_edit_unlocked_pcr(
        self, pcr_agency_inputter_user, pcr_agency_submitter_user, pcr_with_data
    ):
        pcr_with_data.status = ProjectCompletionReport.Status.SUBMITTED
        pcr_with_data.is_unlocked = True
        pcr_with_data.save()

        self.client.force_authenticate(user=pcr_agency_inputter_user)

        # Try to update the PCR overview
        url = reverse("pcr-update", kwargs={"pk": pcr_with_data.id})
        data = {"financial_figures_status": "final"}
        response = self.client.patch(url, data, format="json")

        if response.status_code != status.HTTP_200_OK:
            print(f"Response data: {response.data}")
        assert response.status_code == status.HTTP_200_OK

        # Re-submit with submitter user (inputter doesn't have permission)
        self.client.force_authenticate(user=pcr_agency_submitter_user)
        url = reverse("pcr-submit", kwargs={"pk": pcr_with_data.id})
        response = self.client.post(url, {}, format="json")

        assert response.status_code == status.HTTP_200_OK

        pcr_with_data.refresh_from_db()
        assert pcr_with_data.is_unlocked is False
        assert pcr_with_data.status == ProjectCompletionReport.Status.SUBMITTED
        assert pcr_with_data.last_submission_date is not None

    def test_cannot_create_activity_on_locked_pcr(
        self, pcr_agency_inputter_user, pcr_with_data
    ):
        """Test that activities cannot be created on locked PCRs"""
        pcr_with_data.status = ProjectCompletionReport.Status.SUBMITTED
        pcr_with_data.is_unlocked = False
        pcr_with_data.save()

        self.client.force_authenticate(user=pcr_agency_inputter_user)
        url = reverse("pcr-activity-create", kwargs={"pcr_id": pcr_with_data.id})

        data = {
            "project_type": "INV",
            "sector": "FOA",
            "activity_type": "EQUIPMENT",
        }
        response = self.client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Cannot edit submitted PCR" in str(response.data)
