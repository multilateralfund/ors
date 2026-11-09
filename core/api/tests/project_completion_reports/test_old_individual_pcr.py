import zipfile

import openpyxl
import pytest
from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework.test import APIClient

from core.api.tests.base import BaseTest
from core.api.tests.factories import (
    MetaProjectFactory,
    OldIndividualPCRFactory,
    OldPCRFactory,
    OldIndividualPCRLearnedLessonFactory,
    OldIndividualPCRSupportingEvidenceFactory,
    PCRFactory,
    ProjectFactory,
    UserFactory,
)
from core.import_data import import_pcr_individual as import_module
from core.import_data.import_pcr_individual import (
    import_pcr_individual,
    import_pcr_individual_supporting_evidences,
)
from core.models.project_completion_report import (
    OLD_IndividualPCR,
    OLD_IndividualPCRLearnedLesson,
    OLD_IndividualPCRSupportingEvidence,
    PCR,
)

# pylint: disable=unused-argument,redefined-outer-name

pytestmark = pytest.mark.django_db


def _create_project(agency, submission_status, **kwargs):
    meta_project = MetaProjectFactory()
    return ProjectFactory(
        meta_project=meta_project,
        metacode=meta_project.umbrella_code,
        agency=agency,
        lead_agency=agency,
        submission_status=submission_status,
        **kwargs,
    )


def _create_old_individual_pcr(agency, submission_status):
    old_pcr = OldIndividualPCRFactory(
        project=_create_project(agency, submission_status)
    )
    OldIndividualPCRLearnedLessonFactory(old_individual_pcr=old_pcr)
    OldIndividualPCRSupportingEvidenceFactory(old_individual_pcr=old_pcr)
    return old_pcr


@pytest.fixture
def own_old_pcr(agency, project_approved_status):
    return _create_old_individual_pcr(agency, project_approved_status)


@pytest.fixture
def other_agency_old_pcr(other_agency, project_approved_status):
    return _create_old_individual_pcr(other_agency, project_approved_status)


def _detail_url(old_pcr):
    return reverse(
        "legacy-individual-project-completion-report-detail", args=[old_pcr.id]
    )


def _download_url(old_pcr, evidence):
    return reverse(
        "legacy-individual-project-completion-report-download-supporting-evidence",
        args=[old_pcr.id, evidence.id],
    )


def _pcr_user(group_name, agency=None):
    user = UserFactory(agency=agency)
    user.groups.add(Group.objects.get(name=group_name))
    return user


class TestMetaProjectLegacyIndividualPCR:
    client = APIClient()

    def _get_ids(self, params):
        response = self.client.get(reverse("pcr-metaprojects-list"), params)
        assert response.status_code == 200
        return {row["id"] for row in response.data}

    def test_has_pcr_flags(self, admin_user, own_old_pcr):
        meta_project = own_old_pcr.project.meta_project
        assert meta_project.has_pcr and meta_project.has_legacy_pcr

        self.client.force_authenticate(user=admin_user)
        response = self.client.get(
            reverse("pcr-metaprojects-detail", args=[meta_project.id])
        )
        assert response.status_code == 200
        data = response.data
        assert data["has_pcr"] is True
        assert data["has_legacy_pcr"] is True
        assert data["legacy_pcr_id"] is None
        assert data["legacy_individual_pcr_id"] == own_old_pcr.id
        assert data["pcr_id"] is None
        assert data["pcr_status"] == PCR.Status.FINAL
        assert data["pcr_submission_date"] is None

    def test_legacy_ids_in_listing(
        self, admin_user, agency, project_approved_status, own_old_pcr
    ):
        no_pcr = _create_project(agency, project_approved_status).meta_project
        old_pcr = OldPCRFactory(
            meta_project=_create_project(agency, project_approved_status).meta_project
        )

        self.client.force_authenticate(user=admin_user)
        response = self.client.get(reverse("pcr-metaprojects-list"))
        assert response.status_code == 200
        rows = {
            row["id"]: (
                row["has_legacy_pcr"],
                row["legacy_pcr_id"],
                row["legacy_individual_pcr_id"],
            )
            for row in response.data
        }
        assert rows == {
            no_pcr.id: (False, None, None),
            old_pcr.meta_project_id: (True, old_pcr.id, None),
            own_old_pcr.project.meta_project_id: (True, None, own_old_pcr.id),
        }

    def test_pcr_submitted_filter(
        self, admin_user, agency, project_approved_status, own_old_pcr
    ):
        no_pcr = _create_project(agency, project_approved_status).meta_project
        with_pcr = own_old_pcr.project.meta_project

        self.client.force_authenticate(user=admin_user)
        assert self._get_ids({"pcr_submitted": "Yes"}) == {with_pcr.id}
        assert self._get_ids({"pcr_submitted": "No"}) == {no_pcr.id}

    def test_pcr_status_filter(
        self, admin_user, agency, project_approved_status, own_old_pcr
    ):
        with_pcr = _create_project(agency, project_approved_status).meta_project
        PCRFactory(meta_project=with_pcr)

        self.client.force_authenticate(user=admin_user)
        assert self._get_ids({"pcr_status": PCR.Status.FINAL}) == {
            own_old_pcr.project.meta_project_id
        }
        assert self._get_ids({"pcr_status": PCR.Status.DRAFT}) == {with_pcr.id}

        response = self.client.get(reverse("pcr-metaprojects-list-filters"))
        assert response.status_code == 200
        assert {status["id"] for status in response.data["pcr_status"]} == {
            PCR.Status.DRAFT,
            PCR.Status.FINAL,
        }

    def test_pcr_submission_date_filter(self, admin_user, own_old_pcr):
        own_old_pcr.submission_date = "2015-03-04"
        own_old_pcr.save()

        self.client.force_authenticate(user=admin_user)
        assert self._get_ids(
            {
                "pcr_submission_date_after": "2015-01-01",
                "pcr_submission_date_before": "2015-12-31",
            }
        ) == {own_old_pcr.project.meta_project_id}
        assert not self._get_ids({"pcr_submission_date_after": "2016-01-01"})


class TestOldIndividualPCRViewSet(BaseTest):

    @pytest.fixture(autouse=True)
    def setup(self, own_old_pcr):
        self.url = _detail_url(own_old_pcr)

    def test_retrieve(self, admin_user, own_old_pcr):
        self.client.force_authenticate(user=admin_user)
        response = self.client.get(self.url)
        assert response.status_code == 200
        data = response.data
        assert data["id"] == own_old_pcr.id
        assert data["project_id"] == own_old_pcr.project_id
        assert data["meta_project_id"] == own_old_pcr.project.meta_project_id
        assert data["status"] == PCR.Status.FINAL
        assert data["submission_date"] is None
        assert len(data["learned_lessons"]) == 1
        assert data["learned_lessons"][0]["report_filename"] == "AFG1.pdf"
        assert len(data["supporting_evidences"]) == 1
        evidence = own_old_pcr.supporting_evidences.get()
        assert data["supporting_evidences"][0] == {
            "id": evidence.id,
            "document_type": "report",
            "filename": "AFG1.pdf",
            "download_url": _download_url(own_old_pcr, evidence),
        }

    def test_viewer_own_agency(self, agency, other_agency_old_pcr):
        self.client.force_authenticate(user=_pcr_user("PCR - Viewer", agency))
        assert self.client.get(self.url).status_code == 200
        response = self.client.get(_detail_url(other_agency_old_pcr))
        assert response.status_code == 404

    def test_secretariat_all_agencies(self, other_agency_old_pcr):
        self.client.force_authenticate(user=_pcr_user("PCR - Secretariat"))
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


class TestOldIndividualPCRSupportingEvidenceDownload(BaseTest):

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
        assert response["Content-Disposition"] == 'attachment; filename="AFG1.pdf"'

    def test_viewer_other_agency(self, agency, other_agency_old_pcr):
        self.client.force_authenticate(user=_pcr_user("PCR - Viewer", agency))
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
        own_old_pcr.supporting_evidences.get().file.delete(save=False)
        self.client.force_authenticate(user=admin_user)
        assert self.client.get(self.url).status_code == 404


class TestImportOldIndividualPCR:

    @pytest.fixture
    def import_dir(self, settings, tmp_path):
        settings.IMPORT_DATA_DIR = tmp_path
        import_dir = tmp_path / "pcr" / import_module.PCR_INDIVIDUAL_DIR
        (import_dir / import_module.REPORTS_DIR).mkdir(parents=True)
        (import_dir / import_module.ADDITIONAL_DOCUMENTS_DIR).mkdir()

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.append(
            [
                None,
                "Project code",
                "PDF file name",
                "Additional documents",
                "Agency_lessons learned",
            ]
        )
        ws.append([1, "AFG/PHA/47/TAS/05\xa0", "AFG1.pdf", "AFG1ANX.zip", "lesson 1"])
        # the same project, with another report
        ws.append([2, "AFG/PHA/47/TAS/05", "AFG2.PDF", " ", "lesson 2"])
        # repeated row
        ws.append([3, "AFG/PHA/47/TAS/05", "AFG2.PDF", None, "lesson 2"])
        # wrong extension in the xlsx
        ws.append([4, "ARG/REF/10/INV/01", "ARG1.pdf", "ARG1ANX.pad", "lesson 3"])
        # missing project
        ws.append([5, "ODS Surveys", "ODS1.pdf", None, "lesson 4"])
        # missing report file
        ws.append([6, "BRA/REF/10/INV/01", "BRA1.pdf", None, None])
        wb.save(import_dir / import_module.PCR_INDIVIDUAL_FILE)

        reports_dir = import_dir / import_module.REPORTS_DIR
        for name in ["AFG1.pdf", "AFG 2.pdf", "ARG1.pdf", "ODS1.pdf"]:
            (reports_dir / name).write_bytes(f"%PDF-{name}".encode())

        documents_dir = import_dir / import_module.ADDITIONAL_DOCUMENTS_DIR
        with zipfile.ZipFile(documents_dir / "AFG1ANX.zip", "w") as zf:
            zf.writestr("AFG1ANX/Annex1.pdf", b"%PDF-annex1")
            zf.writestr("Annex2.jpg", b"jpg")
            zf.writestr("__MACOSX/._Annex2.jpg", b"junk")
        (documents_dir / "ARG1ANX.pdf").write_bytes(b"%PDF-ARG1ANX")
        return import_dir

    @pytest.fixture
    def projects(self, project_approved_status):
        return {
            code: ProjectFactory(
                legacy_code=code, submission_status=project_approved_status
            )
            for code in [
                "AFG/PHA/47/TAS/05",
                "ARG/REF/10/INV/01",
                "BRA/REF/10/INV/01",
            ]
        }

    def _evidences(self, old_pcr):
        return {
            (evidence.document_type, evidence.filename)
            for evidence in old_pcr.supporting_evidences.all()
        }

    def test_import(self, import_dir, projects):
        import_pcr_individual()
        import_pcr_individual_supporting_evidences()

        assert OLD_IndividualPCR.objects.count() == 3
        afg = OLD_IndividualPCR.objects.get(project=projects["AFG/PHA/47/TAS/05"])
        assert afg.status == PCR.Status.FINAL
        assert {
            (lesson.description, lesson.report_filename)
            for lesson in afg.learned_lessons.all()
        } == {("lesson 1", "AFG1.pdf"), ("lesson 2", "AFG2.PDF")}
        assert self._evidences(afg) == {
            ("report", "AFG1.pdf"),
            ("report", "AFG 2.pdf"),
            ("additional_document", "Annex1.pdf"),
            ("additional_document", "Annex2.jpg"),
        }
        annex = afg.supporting_evidences.get(filename="Annex1.pdf")
        assert annex.source_file == "AFG1ANX.zip"
        with annex.file.open("rb") as f:
            assert f.read() == b"%PDF-annex1"

        arg = OLD_IndividualPCR.objects.get(project=projects["ARG/REF/10/INV/01"])
        assert self._evidences(arg) == {
            ("report", "ARG1.pdf"),
            ("additional_document", "ARG1ANX.pdf"),
        }

        # created even if it has no lessons and its report file is missing
        bra = OLD_IndividualPCR.objects.get(project=projects["BRA/REF/10/INV/01"])
        assert not bra.learned_lessons.exists()
        assert not bra.supporting_evidences.exists()

    def test_reimport(self, import_dir, projects):
        import_pcr_individual()
        import_pcr_individual_supporting_evidences()
        first_files = [
            evidence.file.name
            for evidence in OLD_IndividualPCRSupportingEvidence.objects.all()
        ]
        storage = OLD_IndividualPCRSupportingEvidence.objects.first().file.storage

        import_pcr_individual()
        import_pcr_individual_supporting_evidences()

        assert OLD_IndividualPCR.objects.count() == 3
        assert OLD_IndividualPCRLearnedLesson.objects.count() == 3
        evidences = OLD_IndividualPCRSupportingEvidence.objects.all()
        assert evidences.count() == 6
        current_files = {evidence.file.name for evidence in evidences}
        # the previously stored files are removed (or their names reused)
        for file_name in first_files:
            assert file_name in current_files or not storage.exists(file_name)

    def test_import_uses_latest_project_version(self, import_dir, projects, admin_user):
        project = projects["AFG/PHA/47/TAS/05"]
        project.increase_version(admin_user)

        import_pcr_individual()

        assert (
            OLD_IndividualPCR.objects.get(
                project__legacy_code="AFG/PHA/47/TAS/05"
            ).project
            == project
        )
