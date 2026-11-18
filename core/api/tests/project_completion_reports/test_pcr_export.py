import io
import zipfile
from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import patch

import docx
import openpyxl
import pytest
from django.contrib.auth.models import Group
from django.core.files.base import ContentFile
from django.core.files.storage import FileSystemStorage
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from core.api.export.pcr.constants import SECTION_KEYS
from core.api.export.pcr.generate import generate_pcr_export
from core.api.export.pcr.sections import months_between
from core.api.tests.conftest import pdf_text
from core.api.tests.factories import (
    AgencyFactory,
    MetaProjectFactory,
    ProjectFactory,
    UserFactory,
)
from core.api.tests.project_completion_reports.utils import fill_pcr_required_data
from core.models import MetaProject
from core.models.project_completion_report import (
    OLD_IndividualPCR,
    OLD_IndividualPCRSupportingEvidence,
    OLD_PCR,
    OLD_PCRSupportingEvidence,
    PCR,
    PCRExport,
    PCRProject,
)
from core.tasks import delete_old_pcr_exports, run_pcr_export

# pylint: disable=unused-argument,redefined-outer-name,too-many-arguments
# pylint: disable=too-many-locals,consider-using-with,protected-access

pytestmark = pytest.mark.django_db

EXPORT_URL = reverse("pcr-metaprojects-export-pcrs")
DELAY_PATH = (
    "core.api.views.project_completion_report.pcr_metaprojects.run_pcr_export.delay"
)
LEGACY_PDF = b"%PDF-1.4 legacy pcr"


def _pcr_user(group_name, agency=None):
    user = UserFactory(agency=agency)
    user.groups.add(Group.objects.get(name=group_name))
    return user


@pytest.fixture(autouse=True)
def protected_storage(monkeypatch, tmp_path):
    # The export and legacy files are written in a temporary directory. The
    # storage of a FileField is set when the model is loaded, so overriding the
    # STORAGES setting is not enough
    storage = FileSystemStorage(location=tmp_path)
    for model in [
        PCRExport,
        OLD_PCRSupportingEvidence,
        OLD_IndividualPCRSupportingEvidence,
    ]:
        monkeypatch.setattr(model._meta.get_field("file"), "storage", storage)
    return storage


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def lead_agency():
    return AgencyFactory.create(name="Lead agency", code="LEAD")


@pytest.fixture
def cooperating_agency():
    return AgencyFactory.create(name="Cooperating agency", code="COOP")


@pytest.fixture
def full_access_user():
    return _pcr_user("PCR - Full access")


def _meta_project(code, country, agency, approved_status, agencies=None):
    meta_project = MetaProjectFactory.create(
        umbrella_code=code,
        country=country,
        lead_agency=agency,
        type=MetaProject.MetaProjectType.MYA,
    )
    projects = [
        ProjectFactory.create(
            code=f"{code}/{index}",
            meta_project=meta_project,
            country=country,
            agency=project_agency,
            lead_agency=agency,
            submission_status=approved_status,
            total_fund=1000 * index,
            date_approved=date(2020, 1, 15),
        )
        for index, project_agency in enumerate(agencies or [agency], start=1)
    ]
    return meta_project, projects


@pytest.fixture
def _setup_export(country_ro, lead_agency, cooperating_agency, project_approved_status):
    # meta project with a new PCR, submitted in 2025
    meta_project, projects = _meta_project(
        "ROM/NEW/1",
        country_ro,
        lead_agency,
        project_approved_status,
        agencies=[lead_agency, cooperating_agency],
    )
    pcr = PCR.objects.create(
        meta_project=meta_project, submission_date=date(2025, 5, 5)
    )
    for project in projects:
        PCRProject.objects.create(
            pcr=pcr,
            project=project,
            funds_disbursed=Decimal("250.00"),
            planned_date_of_completion=date(2021, 1, 15),
        )
    fill_pcr_required_data(pcr)

    # legacy PCR, with its original PDF, submitted in 2016
    old_meta_project, _ = _meta_project(
        "ROM/OLD/1", country_ro, lead_agency, project_approved_status
    )
    old_pcr = OLD_PCR.objects.create(
        meta_project=old_meta_project, submission_date=date(2016, 3, 3)
    )
    evidence = OLD_PCRSupportingEvidence(old_pcr=old_pcr, filename="PCR_1.pdf")
    evidence.file.save("PCR_1.pdf", ContentFile(LEGACY_PDF))

    # legacy PCR without a PDF
    _missing_meta_project, _ = _meta_project(
        "ROM/OLD/2", country_ro, lead_agency, project_approved_status
    )
    OLD_PCR.objects.create(
        meta_project=_missing_meta_project, submission_date=date(2016, 4, 4)
    )

    # legacy individual PCR: only the report is exported
    _individual_meta_project, individual_projects = _meta_project(
        "ROM/IND/1", country_ro, lead_agency, project_approved_status
    )
    individual_pcr = OLD_IndividualPCR.objects.create(
        project=individual_projects[0], submission_date=date(2017, 6, 6)
    )
    for document_type, content in [
        (OLD_IndividualPCRSupportingEvidence.DocumentType.REPORT, LEGACY_PDF),
        (
            OLD_IndividualPCRSupportingEvidence.DocumentType.ADDITIONAL_DOCUMENT,
            b"annex",
        ),
    ]:
        individual_evidence = OLD_IndividualPCRSupportingEvidence(
            old_individual_pcr=individual_pcr, document_type=document_type
        )
        individual_evidence.file.save(f"{document_type}.pdf", ContentFile(content))

    # meta project without a PCR, never exported
    _meta_project("ROM/NONE/1", country_ro, lead_agency, project_approved_status)

    return pcr


def _create_export(client, user, params="", output_format="pdf", sections=None):
    client.force_authenticate(user=user)
    with patch(DELAY_PATH) as mock_delay:
        response = client.post(
            f"{EXPORT_URL}{params}",
            {"output_format": output_format, "sections": sections or SECTION_KEYS},
            format="json",
        )
    return response, mock_delay


def _run_and_download(client, response):
    export_id = response.data["id"]
    run_pcr_export(export_id)
    detail = client.get(reverse("pcr-export-detail", args=(export_id,)))
    assert detail.status_code == 200
    assert detail.data["status"] == PCRExport.Status.COMPLETED
    download = client.get(detail.data["download_url"])
    assert download.status_code == 200
    return detail.data, b"".join(download.streaming_content)


class TestCreatePCRExport:
    def test_anonymous(self, client):
        response = client.post(EXPORT_URL, {}, format="json")
        assert response.status_code == 403

    def test_without_pcr_access(self, client, user, _setup_export):
        response, mock_delay = _create_export(client, user)
        assert response.status_code == 403
        mock_delay.assert_not_called()

    def test_create(self, client, full_access_user, _setup_export):
        response, mock_delay = _create_export(
            client,
            full_access_user,
            sections=["sdgs", "overview"],
        )
        assert response.status_code == 201
        # the meta project without a PCR is not exported
        assert response.data["pcr_count"] == 4
        assert response.data["status"] == PCRExport.Status.PENDING
        # in the order of the PCR
        assert response.data["sections"] == ["overview", "sdgs"]
        assert response.data["download_url"] is None
        mock_delay.assert_called_once_with(response.data["id"])

        export = PCRExport.objects.get(id=response.data["id"])
        assert export.created_by == full_access_user
        # in the order of the listing
        assert [
            MetaProject.objects.get(id=meta_project_id).umbrella_code
            for meta_project_id in export.meta_project_ids
        ] == ["ROM/IND/1", "ROM/NEW/1", "ROM/OLD/1", "ROM/OLD/2"]

    def test_listing_filters(self, client, full_access_user, _setup_export):
        response, _ = _create_export(
            client, full_access_user, params="?pcr_submission_year=2016"
        )
        assert response.status_code == 201
        export = PCRExport.objects.get(id=response.data["id"])
        assert [
            MetaProject.objects.get(id=meta_project_id).umbrella_code
            for meta_project_id in export.meta_project_ids
        ] == ["ROM/OLD/1", "ROM/OLD/2"]

    def test_no_pcrs(self, client, full_access_user, _setup_export):
        response, mock_delay = _create_export(
            client, full_access_user, params="?search=nothing"
        )
        assert response.status_code == 400
        mock_delay.assert_not_called()

    def test_invalid(self, client, full_access_user, _setup_export):
        response, mock_delay = _create_export(
            client, full_access_user, output_format="csv", sections=["unknown"]
        )
        assert response.status_code == 400
        assert set(response.data) == {"output_format", "sections"}
        mock_delay.assert_not_called()

    def test_agency_user(
        self,
        client,
        lead_agency,
        country_ro,
        project_approved_status,
        _setup_export,
    ):
        other_agency = AgencyFactory.create(name="Other agency", code="OTH")
        other_meta_project, _ = _meta_project(
            "ROM/OTHER/1", country_ro, other_agency, project_approved_status
        )
        PCR.objects.create(meta_project=other_meta_project)

        response, _ = _create_export(client, _pcr_user("PCR - Viewer", lead_agency))
        assert response.status_code == 201
        # the PCR of the other agency is not exported
        assert response.data["pcr_count"] == 4

        response, _ = _create_export(client, _pcr_user("PCR - Viewer", other_agency))
        assert response.data["pcr_count"] == 1


class TestPCRExportFile:
    def test_pdf(self, client, full_access_user, _setup_export):
        response, _ = _create_export(
            client,
            full_access_user,
            sections=["causes_of_delay", "summary_of_key_data"],
        )
        detail, content = _run_and_download(client, response)
        assert detail["filename"].endswith(".zip")

        zip_file = zipfile.ZipFile(io.BytesIO(content))
        assert zip_file.namelist() == [
            "ROM IND 1 - Romania - Lead agency - legacy PCR.pdf",
            "ROM NEW 1 - Romania - Lead agency.pdf",
            "ROM OLD 1 - Romania - Lead agency - legacy PCR.pdf",
            "missing_files.txt",
        ]
        # the original legacy PDFs, without the additional documents
        assert (
            zip_file.read("ROM IND 1 - Romania - Lead agency - legacy PCR.pdf")
            == LEGACY_PDF
        )
        assert (
            zip_file.read("ROM OLD 1 - Romania - Lead agency - legacy PCR.pdf")
            == LEGACY_PDF
        )
        assert "ROM OLD 2 - Romania - Lead agency" in zip_file.read(
            "missing_files.txt"
        ).decode("utf-8")

        text = pdf_text(
            io.BytesIO(zip_file.read("ROM NEW 1 - Romania - Lead agency.pdf"))
        )
        assert "PROJECT COMPLETION REPORT - ROM/NEW/1" in text
        assert "SECTION 3: CAUSES OF DELAYS AND ACTION TAKEN" in text
        assert "SECTION 7: SUMMARY OF KEY DATA ON PROJECT IMPLEMENTATION" in text
        assert "SECTION 1:" not in text
        assert "SECTION 4:" not in text
        assert "ROM/NEW/1/2" in text
        # the funds disbursed of the project
        assert "250.00" in text

    def test_docx(self, client, full_access_user, _setup_export):
        response, _ = _create_export(
            client,
            full_access_user,
            output_format="docx",
            sections=["overview", "lessons_learned"],
        )
        _, content = _run_and_download(client, response)

        zip_file = zipfile.ZipFile(io.BytesIO(content))
        assert "ROM NEW 1 - Romania - Lead agency.docx" in zip_file.namelist()
        # the legacy PCRs are exported as PDFs
        assert (
            "ROM OLD 1 - Romania - Lead agency - legacy PCR.pdf" in zip_file.namelist()
        )

        document = docx.Document(
            io.BytesIO(zip_file.read("ROM NEW 1 - Romania - Lead agency.docx"))
        )
        headings = [
            paragraph.text
            for paragraph in document.paragraphs
            if paragraph.style.name.startswith("Heading")
        ]
        assert "SECTION 1: PROJECT OVERVIEW" in headings
        assert "SECTION 4: LESSONS LEARNED" in headings
        assert not any(heading.startswith("SECTION 2") for heading in headings)
        cells = {
            cell.text
            for table in document.tables
            for row in table.rows
            for cell in row.cells
        }
        # the total MLF funding approved of the 2 projects
        assert "3,000.00" in cells
        assert "Lesson" in cells

    def test_xlsx(self, client, full_access_user, _setup_export):
        response, _ = _create_export(
            client,
            full_access_user,
            output_format="xlsx",
            sections=["overview", "sdgs"],
        )
        detail, content = _run_and_download(client, response)
        assert detail["filename"].endswith(".xlsx")

        wb = openpyxl.load_workbook(io.BytesIO(content))
        assert wb.sheetnames == ["PCRs", "Overview", "SDGs", "Not included"]

        pcrs = list(wb["PCRs"].values)
        assert pcrs[0][:4] == ("Metacode", "Country", "Lead agency", "Metacode")
        assert [row[0] for row in pcrs[1:]] == ["ROM/NEW/1"]

        sdgs = list(wb["SDGs"].values)
        assert sdgs[1][:4] == ("Metacode", "Country", "Lead agency", "Agency")
        assert {row[3] for row in sdgs[2:] if row[0]} == {
            "Lead agency",
            "Cooperating agency",
        }

        not_included = list(wb["Not included"].values)
        assert [row[0] for row in not_included[1:]] == [
            "ROM/IND/1",
            "ROM/OLD/1",
            "ROM/OLD/2",
        ]

    def test_queries_do_not_grow_with_pcrs(
        self,
        full_access_user,
        country_ro,
        lead_agency,
        project_approved_status,
        _setup_export,
    ):
        def count_queries(meta_project_ids):
            export = PCRExport.objects.create(
                created_by=full_access_user,
                output_format=PCRExport.OutputFormat.DOCX,
                sections=SECTION_KEYS,
                meta_project_ids=meta_project_ids,
            )
            with CaptureQueriesContext(connection) as queries:
                generate_pcr_export(export)
            return len(queries)

        meta_project_ids = [_setup_export.meta_project_id]
        one_pcr_queries = count_queries(meta_project_ids)
        for index in range(3):
            meta_project, projects = _meta_project(
                f"ROM/MORE/{index}", country_ro, lead_agency, project_approved_status
            )
            pcr = PCR.objects.create(meta_project=meta_project)
            PCRProject.objects.create(pcr=pcr, project=projects[0])
            fill_pcr_required_data(pcr)
            meta_project_ids.append(meta_project.id)

        # MetaProject.total_number_of_trainnes is computed per meta project
        assert count_queries(meta_project_ids) <= one_pcr_queries + 3 * 2


class TestPCRExportStatus:
    def test_other_user(self, client, full_access_user, _setup_export):
        response, _ = _create_export(client, full_access_user)
        client.force_authenticate(user=_pcr_user("PCR - Full access"))
        url = reverse("pcr-export-detail", args=(response.data["id"],))
        assert client.get(url).status_code == 404
        assert client.get(f"{url}download/").status_code == 404

    def test_download_not_completed(self, client, full_access_user, _setup_export):
        response, _ = _create_export(client, full_access_user)
        url = reverse("pcr-export-download", args=(response.data["id"],))
        assert client.get(url).status_code == 404

    def test_failed(self, client, full_access_user, _setup_export):
        response, _ = _create_export(client, full_access_user)
        with patch(
            "core.api.export.pcr.generate.generate_pcr_export",
            side_effect=ValueError("error"),
        ):
            run_pcr_export(response.data["id"])
        detail = client.get(reverse("pcr-export-detail", args=(response.data["id"],)))
        assert detail.data["status"] == PCRExport.Status.FAILED
        assert detail.data["error"]
        assert detail.data["download_url"] is None

    def test_x_accel_redirect(self, client, settings, full_access_user, _setup_export):
        settings.PROTECTED_MEDIA_X_ACCEL_REDIRECT = True
        response, _ = _create_export(client, full_access_user)
        run_pcr_export(response.data["id"])
        export = PCRExport.objects.get(id=response.data["id"])

        download = client.get(reverse("pcr-export-download", args=(export.id,)))
        assert download.status_code == 200
        assert download["X-Accel-Redirect"] == f"/protected-media/{export.file.name}"
        assert download["Content-Type"] == "application/zip"
        assert export.filename in download["Content-Disposition"]
        assert download.content == b""

    def test_delete_old_exports(self, full_access_user):
        exports = []
        for days in [2, 0]:
            export = PCRExport.objects.create(
                created_by=full_access_user,
                output_format=PCRExport.OutputFormat.PDF,
                status=PCRExport.Status.COMPLETED,
            )
            export.file.save(f"{export.id}.zip", ContentFile(b"zip"))
            PCRExport.objects.filter(id=export.id).update(
                date_created=timezone.now() - timedelta(days=days)
            )
            exports.append(export)
        old_export = exports[0]
        new_export = exports[1]
        storage = old_export.file.storage

        delete_old_pcr_exports()

        assert list(PCRExport.objects.all()) == [new_export]
        assert not storage.exists(old_export.file.name)
        assert storage.exists(new_export.file.name)


class TestPCRSubmissionYearFilter:
    def test_listing(self, client, full_access_user, _setup_export):
        client.force_authenticate(user=full_access_user)
        url = reverse("pcr-metaprojects-list")

        response = client.get(url, {"pcr_submission_year": "2025"})
        assert [row["umbrella_code"] for row in response.data] == ["ROM/NEW/1"]

        response = client.get(url, {"pcr_submission_year": "2016,2017"})
        assert {row["umbrella_code"] for row in response.data} == {
            "ROM/OLD/1",
            "ROM/OLD/2",
            "ROM/IND/1",
        }

    def test_list_filters(self, client, full_access_user, _setup_export):
        client.force_authenticate(user=full_access_user)
        response = client.get(reverse("pcr-metaprojects-list-filters"))
        assert response.data["pcr_submission_year"] == [
            {"id": 2025, "name": "2025"},
            {"id": 2017, "name": "2017"},
            {"id": 2016, "name": "2016"},
        ]


@pytest.mark.parametrize(
    "start,end,months",
    [
        (date(2024, 1, 15), date(2024, 3, 15), 2),
        (date(2024, 1, 15), date(2024, 3, 16), 3),
        # the end of the month is clamped, as in dayjs
        (date(2024, 1, 31), date(2024, 2, 29), 1),
        (date(2024, 3, 15), date(2024, 1, 15), 0),
        (None, date(2024, 1, 15), None),
    ],
)
def test_months_between(start, end, months):
    assert months_between(start, end) == months
