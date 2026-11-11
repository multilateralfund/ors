import json
from datetime import date

import pytest
from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework.test import APIClient

from core.api.tests.base import BaseTest
from core.import_data import (
    import_pcr_activities as activities_module,
    import_pcr_delay_explanations as delay_explanations_module,
    import_pcr_learned_lessons as learned_lessons_module,
)
from core.import_data.import_pcr_activities import import_pcr_activities
from core.import_data.import_pcr_delay_explanations import (
    import_pcr_delay_explanations,
)
from core.import_data.import_pcr_learned_lessons import import_pcr_learned_lessons
from core.import_data.import_pcr_supporting_evidences import (
    import_pcr_supporting_evidences,
)
from core.api.tests.factories import (
    AgencyFactory,
    MetaProjectFactory,
    OldPCRActivityFactory,
    OldPCRDelayExplanationFactory,
    OldPCRFactory,
    OldPCRLearnedLessonsFactory,
    OldPCRSupportingEvidenceFactory,
    PCRFactory,
    PCRProjectFactory,
    ProjectFactory,
    UserFactory,
)
from core.models.project_completion_report import (
    OLD_PCR,
    OLD_PCRActivity,
    OLD_PCRDelayExplanation,
    OLD_PCRLearnedLessons,
    OLD_PCRSupportingEvidence,
    PCR,
)

# pylint: disable=unused-argument,redefined-outer-name

pytestmark = pytest.mark.django_db


def _create_meta_project(agency, submission_status):
    meta_project = MetaProjectFactory()
    ProjectFactory(
        meta_project=meta_project,
        metacode=meta_project.umbrella_code,
        agency=agency,
        lead_agency=agency,
        submission_status=submission_status,
    )
    return meta_project


def _create_old_pcr(agency, submission_status):
    old_pcr = OldPCRFactory(
        meta_project=_create_meta_project(agency, submission_status),
        submission_date=date(2015, 3, 4),
    )
    OldPCRActivityFactory.create_batch(2, old_pcr=old_pcr)
    OldPCRDelayExplanationFactory(old_pcr=old_pcr, agency=agency)
    OldPCRLearnedLessonsFactory(old_pcr=old_pcr, agency=agency)
    OldPCRSupportingEvidenceFactory(old_pcr=old_pcr)
    return old_pcr


@pytest.fixture
def own_old_pcr(agency, project_approved_status):
    return _create_old_pcr(agency, project_approved_status)


@pytest.fixture
def other_agency_old_pcr(other_agency, project_approved_status):
    return _create_old_pcr(other_agency, project_approved_status)


def _detail_url(old_pcr):
    return reverse("legacy-project-completion-report-detail", args=[old_pcr.id])


def _download_url(old_pcr, evidence):
    return reverse(
        "legacy-project-completion-report-download-supporting-evidence",
        args=[old_pcr.id, evidence.id],
    )


class TestMetaProjectLegacyPCR:
    client = APIClient()

    def _get_meta_project(self, meta_project):
        response = self.client.get(
            reverse("pcr-metaprojects-detail", args=[meta_project.id])
        )
        assert response.status_code == 200
        return response.data

    def test_has_pcr_flags(self, admin_user, agency, project_approved_status):
        no_pcr = _create_meta_project(agency, project_approved_status)
        with_pcr = _create_meta_project(agency, project_approved_status)
        PCRFactory(meta_project=with_pcr, submission_date="2026-08-08")
        old_pcr = _create_old_pcr(agency, project_approved_status)

        assert not no_pcr.has_pcr and not no_pcr.has_legacy_pcr
        assert with_pcr.has_pcr and not with_pcr.has_legacy_pcr
        assert old_pcr.meta_project.has_pcr and old_pcr.meta_project.has_legacy_pcr

        self.client.force_authenticate(user=admin_user)

        data = self._get_meta_project(no_pcr)
        assert data["has_pcr"] is False
        assert data["has_legacy_pcr"] is False
        assert data["legacy_pcr_id"] is None
        assert data["pcr_status"] is None
        assert data["pcr_submission_date"] is None

        data = self._get_meta_project(with_pcr)
        assert data["has_pcr"] is True
        assert data["has_legacy_pcr"] is False
        assert data["legacy_pcr_id"] is None
        assert data["pcr_status"] == PCR.Status.DRAFT
        assert data["pcr_submission_date"] == "2026-08-08"

        data = self._get_meta_project(old_pcr.meta_project)
        assert data["has_pcr"] is True
        assert data["has_legacy_pcr"] is True
        assert data["legacy_pcr_id"] == old_pcr.id
        assert data["pcr_id"] is None
        assert data["pcr_editable"] is None
        assert data["pcr_status"] == OLD_PCR._meta.get_field("status").default
        assert data["pcr_status"] == PCR.Status.APPROVED
        assert data["pcr_submission_date"] == "2015-03-04"

    def test_pcr_status_filter(self, admin_user, agency, project_approved_status):
        with_pcr = _create_meta_project(agency, project_approved_status)
        PCRFactory(meta_project=with_pcr)
        old_pcr = _create_old_pcr(agency, project_approved_status)

        self.client.force_authenticate(user=admin_user)

        def get_ids(pcr_status):
            response = self.client.get(
                reverse("pcr-metaprojects-list"), {"pcr_status": pcr_status}
            )
            assert response.status_code == 200
            return {row["id"] for row in response.data}

        assert get_ids(PCR.Status.APPROVED) == {old_pcr.meta_project_id}
        assert get_ids(PCR.Status.DRAFT) == {with_pcr.id}

    def test_pcr_submitted_filter(self, admin_user, agency, project_approved_status):
        no_pcr = _create_meta_project(agency, project_approved_status)
        old_pcr = _create_old_pcr(agency, project_approved_status)

        self.client.force_authenticate(user=admin_user)

        def get_ids(pcr_submitted):
            response = self.client.get(
                reverse("pcr-metaprojects-list"), {"pcr_submitted": pcr_submitted}
            )
            assert response.status_code == 200
            return {row["id"] for row in response.data}

        assert get_ids("Yes") == {old_pcr.meta_project_id}
        assert get_ids("No") == {no_pcr.id}
        assert get_ids("Yes,No") == {old_pcr.meta_project_id, no_pcr.id}

    def test_pcr_submission_date_filter(
        self, admin_user, agency, project_approved_status
    ):
        with_pcr = _create_meta_project(agency, project_approved_status)
        pcr = PCRFactory(meta_project=with_pcr, submission_date="2026-07-08")
        PCRProjectFactory(pcr=pcr, project=with_pcr.projects.first())
        old_pcr = _create_old_pcr(agency, project_approved_status)
        no_date = OldPCRFactory(
            meta_project=_create_meta_project(agency, project_approved_status)
        )

        self.client.force_authenticate(user=admin_user)

        def get_ids(params):
            response = self.client.get(reverse("pcr-metaprojects-list"), params)
            assert response.status_code == 200
            return {row["id"] for row in response.data}

        assert get_ids(
            {
                "pcr_submission_date_after": "2015-01-01",
                "pcr_submission_date_before": "2015-12-31",
            }
        ) == {old_pcr.meta_project_id}
        assert get_ids({"pcr_submission_date_after": "2015-01-01"}) == {
            with_pcr.id,
            old_pcr.meta_project_id,
        }
        assert get_ids({"pcr_submission_date_before": "2016-01-01"}) == {
            old_pcr.meta_project_id
        }
        assert no_date.meta_project_id not in get_ids(
            {"pcr_submission_date_after": "2000-01-01"}
        )

    def test_pcr_status_list_filters(self, admin_user, agency, project_approved_status):
        PCRFactory(meta_project=_create_meta_project(agency, project_approved_status))
        _create_old_pcr(agency, project_approved_status)

        self.client.force_authenticate(user=admin_user)
        response = self.client.get(reverse("pcr-metaprojects-list-filters"))
        assert response.status_code == 200
        assert {status["id"] for status in response.data["pcr_status"]} == {
            PCR.Status.DRAFT,
            PCR.Status.APPROVED,
        }


class TestOldPCRViewSet(BaseTest):

    @pytest.fixture(autouse=True)
    def setup(self, own_old_pcr):
        self.url = _detail_url(own_old_pcr)

    @staticmethod
    def _pcr_user(group_name, agency=None):
        user = UserFactory(agency=agency)
        user.groups.add(Group.objects.get(name=group_name))
        return user

    def test_retrieve(self, admin_user, own_old_pcr):
        self.client.force_authenticate(user=admin_user)
        response = self.client.get(self.url)
        assert response.status_code == 200
        data = response.data
        assert data["id"] == own_old_pcr.id
        assert data["meta_project_id"] == own_old_pcr.meta_project_id
        assert data["status"] == PCR.Status.APPROVED
        assert data["submission_date"] == "2015-03-04"
        assert len(data["activities"]) == 2
        assert data["activities"][0]["sector_type"] == "Investment"
        assert len(data["delay_explanations"]) == 1
        assert len(data["learned_lessons"]) == 1
        assert len(data["supporting_evidences"]) == 1
        assert data["supporting_evidences"][0]["filename"] == "PCR_1.pdf"
        evidence = own_old_pcr.supporting_evidences.get()
        assert data["supporting_evidences"][0]["download_url"] == _download_url(
            own_old_pcr, evidence
        )

    def test_viewer_own_agency(self, agency, own_old_pcr, other_agency_old_pcr):
        self.client.force_authenticate(user=self._pcr_user("PCR - Viewer", agency))
        assert self.client.get(self.url).status_code == 200
        response = self.client.get(_detail_url(other_agency_old_pcr))
        assert response.status_code == 404

    def test_secretariat_all_agencies(self, other_agency_old_pcr):
        self.client.force_authenticate(user=self._pcr_user("PCR - Secretariat"))
        assert self.client.get(self.url).status_code == 200
        response = self.client.get(_detail_url(other_agency_old_pcr))
        assert response.status_code == 200

    def test_without_pcr_access(self, agency):
        self.client.force_authenticate(user=UserFactory(agency=agency))
        assert self.client.get(self.url).status_code == 403

    def test_read_only(self, admin_user):
        self.client.force_authenticate(user=admin_user)
        for method in ["put", "patch", "delete"]:
            response = getattr(self.client, method)(self.url, {}, format="json")
            assert response.status_code in (403, 405)


class TestOldPCRSupportingEvidenceDownload(BaseTest):

    @pytest.fixture(autouse=True)
    def setup(self, own_old_pcr):
        self.url = _download_url(own_old_pcr, own_old_pcr.supporting_evidences.get())

    def test_download(self, admin_user, own_old_pcr):
        with own_old_pcr.supporting_evidences.get().file.open("rb") as f:
            content = f.read()
        self.client.force_authenticate(user=admin_user)
        response = self.client.get(self.url)
        assert response.status_code == 200
        assert b"".join(response.streaming_content) == content
        assert response["Content-Disposition"] == 'attachment; filename="PCR_1.pdf"'
        assert response["Content-Type"] == "application/pdf"

    def test_viewer_other_agency(self, agency, other_agency_old_pcr):
        user = UserFactory(agency=agency)
        user.groups.add(Group.objects.get(name="PCR - Viewer"))
        self.client.force_authenticate(user=user)
        evidence = other_agency_old_pcr.supporting_evidences.get()
        response = self.client.get(_download_url(other_agency_old_pcr, evidence))
        assert response.status_code == 404

    def test_without_pcr_access(self, agency):
        self.client.force_authenticate(user=UserFactory(agency=agency))
        assert self.client.get(self.url).status_code == 403

    def test_evidence_of_another_old_pcr(
        self, admin_user, own_old_pcr, other_agency_old_pcr
    ):
        self.client.force_authenticate(user=admin_user)
        evidence = other_agency_old_pcr.supporting_evidences.get()
        response = self.client.get(_download_url(own_old_pcr, evidence))
        assert response.status_code == 404

    def test_missing_file(self, admin_user, own_old_pcr):
        evidence = own_old_pcr.supporting_evidences.get()
        evidence.file.delete(save=False)
        self.client.force_authenticate(user=admin_user)
        assert self.client.get(self.url).status_code == 404


class TestImportOldPCRSupportingEvidences:

    @pytest.fixture
    def reports_dir(self, settings, tmp_path):
        settings.IMPORT_DATA_DIR = tmp_path
        reports_dir = tmp_path / "pcr" / "pcr reports"
        reports_dir.mkdir(parents=True)
        return reports_dir

    def test_import(self, reports_dir):
        with_old_pcr = OldPCRFactory(
            meta_project=MetaProjectFactory(pcr_project_id="881")
        )
        without_old_pcr = MetaProjectFactory(pcr_project_id="882")
        (reports_dir / "PCR_881.pdf").write_bytes(b"%PDF-881")
        (reports_dir / "PCR_881.html").write_bytes(b"<html></html>")
        (reports_dir / "PCR_882.pdf").write_bytes(b"%PDF-882")
        (reports_dir / "PCR_999.pdf").write_bytes(b"%PDF-999")

        import_pcr_supporting_evidences()

        evidence = OLD_PCRSupportingEvidence.objects.get(old_pcr=with_old_pcr)
        assert evidence.filename == "PCR_881.pdf"
        with evidence.file.open("rb") as f:
            assert f.read() == b"%PDF-881"

        created_old_pcr = OLD_PCR.objects.get(meta_project=without_old_pcr)
        assert created_old_pcr.status == PCR.Status.APPROVED
        assert created_old_pcr.supporting_evidences.get().filename == "PCR_882.pdf"

        # html files and unknown pcr project ids are skipped
        assert OLD_PCRSupportingEvidence.objects.count() == 2

    def test_reimport_replaces_files(self, reports_dir):
        old_pcr = OldPCRFactory(meta_project=MetaProjectFactory(pcr_project_id="881"))
        (reports_dir / "PCR_881.pdf").write_bytes(b"%PDF-881")

        import_pcr_supporting_evidences()
        first_file = old_pcr.supporting_evidences.get().file
        first_file_name = first_file.name
        storage = first_file.storage

        import_pcr_supporting_evidences()

        evidence = old_pcr.supporting_evidences.get()
        assert storage.exists(evidence.file.name)
        # the previously stored file is removed (or its name reused)
        assert evidence.file.name == first_file_name or not storage.exists(
            first_file_name
        )


class TestImportOldPCRData:
    """
    The activities, delay explanations and learned lessons are linked to the
    old PCR of their meta project (created if missing).
    """

    @pytest.fixture
    def db_dir(self, settings, tmp_path, monkeypatch):
        settings.IMPORT_DATA_DIR = tmp_path
        for module in [
            activities_module,
            delay_explanations_module,
            learned_lessons_module,
        ]:
            monkeypatch.setattr(module, "PCR_DIR_LIST", ["pcr2023"])
        db_dir = tmp_path / "pcr" / "pcr2023"
        db_dir.mkdir(parents=True)
        files = {
            "Agencies.json": [
                {"ID": 984, "Name": "IBRD", "IsAgency": 1},
                {"ID": 997, "Name": "UNDP", "IsAgency": 1},
                {"ID": 999, "Name": "Unknown agency", "IsAgency": 1},
            ],
            "PCRSector.json": [
                {"Id": 1, "Typeofactivity": "Investment sector", "Type": 1},
            ],
            "PCRActivity.json": [
                {
                    "Id": 1,
                    "ProjectId": 881,
                    "SectorId": 1,
                    "Typeofactivity": "activity",
                    "Plannedoutput": "planned",
                    "Actualactivityoutput": "actual",
                    "Evaluation": 1,
                    "Explanation": "",
                },
            ],
            "PCRTitle53.json": [{"Id": 1, "Title": "Delay category", "SortId": 1}],
            "PCR53.json": [
                {
                    "Id": 1,
                    "ProjectId": 881,
                    "AgencyId": 984,
                    "TitleId": 1,
                    "CauseOfDelays": "cause",
                    "MeasuresToOvercome": "",
                },
                {
                    "Id": 2,
                    "ProjectId": 881,
                    "AgencyId": 999,
                    "TitleId": 1,
                    "CauseOfDelays": "cause",
                    "MeasuresToOvercome": "",
                },
            ],
            "PCRTitle6.json": [{"Id": 1, "Title": "Lesson category", "SortId": 1}],
            "PCR6.json": [
                {
                    "Id": 1,
                    "ProjectId": 881,
                    "AgencyId": 997,
                    "TitleId": 1,
                    "Description": "lesson",
                },
            ],
        }
        for file_name, data in files.items():
            (db_dir / file_name).write_text(json.dumps(data), encoding="utf8")
        return db_dir

    def test_import_links_old_pcr(self, db_dir):
        world_bank = AgencyFactory(name="World Bank", code="WB")
        undp = AgencyFactory(name="UNDP")
        meta_project = MetaProjectFactory(pcr_project_id="881")

        import_pcr_activities()
        import_pcr_delay_explanations()
        import_pcr_learned_lessons()

        old_pcr = OLD_PCR.objects.get(meta_project=meta_project)
        assert OLD_PCR.objects.count() == 1

        activity = OLD_PCRActivity.objects.get()
        assert activity.old_pcr == old_pcr

        # IBRD is mapped to World Bank, unknown agencies are skipped
        explanation = OLD_PCRDelayExplanation.objects.get()
        assert explanation.old_pcr == old_pcr
        assert explanation.agency == world_bank

        lesson = OLD_PCRLearnedLessons.objects.get()
        assert lesson.old_pcr == old_pcr
        assert lesson.agency == undp

    def test_import_uses_existing_old_pcr(self, db_dir):
        AgencyFactory(name="World Bank", code="WB")
        old_pcr = OldPCRFactory(meta_project=MetaProjectFactory(pcr_project_id="881"))

        import_pcr_activities()
        import_pcr_delay_explanations()

        assert OLD_PCR.objects.count() == 1
        assert old_pcr.activities.count() == 1
        assert old_pcr.delay_explanations.count() == 1
