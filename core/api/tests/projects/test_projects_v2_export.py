import io
from http import HTTPStatus
from itertools import chain
from decimal import Decimal

import openpyxl
import pytest
import docx

from django.http.response import FileResponse
from django.urls import reverse
from openpyxl.utils import get_column_letter
from rest_framework.response import Response

from core.api.serializers.business_plan import BPActivityDetailSerializer
from core.api.tests.base import BaseTest
from core.api.tests.factories import AgencyFactory
from core.api.tests.factories import FundingWindowFactory
from core.api.tests.factories import MetaProjectFactory
from core.api.tests.factories import ProjectClusterFactory
from core.api.tests.factories import ProjectFactory
from core.api.tests.factories import ProjectSubSectorFactory
from core.api.export.single_project_v2.helpers import get_activity_data_from_instance
from core.api.export.single_project_v2.helpers import get_activity_data_from_json
from core.api.views import mya_export
from core.models import MetaProject
from core.models import Project
from core.models.business_plan import BPActivity
from core.models.project import Project
from core.models.project import ProjectOdsOdp
from core.models.substance import Substance
from core.models.user import User

pytestmark = pytest.mark.django_db


def validate_docx_export(project: Project, user: User, response: FileResponse):
    assert response.status_code == HTTPStatus.OK
    try:
        file_name = project.code.replace("/", "_")
    except AttributeError:
        file_name = f"project_{project.id}"
    assert response.filename == f"{file_name}.docx"
    assert (
        response.headers["Content-Type"]
        == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

    f = io.BytesIO(response.getvalue())
    doc = docx.Document(f)
    assert f.tell() > 0

    to_find = [
        x
        for x in [
            user.get_full_name() or user.username,
            project.title,
            project.country.name,
            project.agency.name,
            project.cluster.name,
            project.total_fund,
        ]
        if x
    ]
    result = [False for v in to_find]

    paragraphs_to_check = chain(
        doc.sections[0].first_page_footer.paragraphs,
        doc.sections[0].even_page_footer.paragraphs,
        doc.sections[0].footer.paragraphs,
        doc.paragraphs,
    )

    found_description = False
    for t in doc.tables:
        if len(t.rows) and len(t.columns) == 1:
            if t.cell(0, 0).text == project.description:
                found_description = True

    assert (
        found_description
    ), f"Could not locate description ({project.description}) in output."

    for p in paragraphs_to_check:
        for i, v in enumerate(to_find):
            if result[i] is False:
                if v in p.text:
                    result[i] = True

    for t, r in zip(to_find, result):
        assert r is True, f"Could not locate {t} in output."


def validate_single_project_export(project: Project, response: FileResponse):
    assert response.filename == f"Project {project.id}.xlsx", response.filename

    wb = openpyxl.load_workbook(io.BytesIO(response.getvalue()))
    assert {
        "Identifiers",
        "Identifiers - BP Activity",
        "Cross-cutting",
        "Specific information - Overview",
        "Specific information - Substance details",
        "Impact",
    }.intersection(wb.sheetnames)
    sheet = wb["Identifiers"]
    assert sheet["A1"].value == "Country", sheet["A1"].value
    assert sheet["A2"].value == project.country.name, sheet["A2"].value

    sheet = wb["Identifiers - BP Activity"]
    assert sheet["A1"].value == "Activity ID", sheet["A1"].value
    assert sheet["A2"].value, sheet["A2"].value

    return wb


def validate_projects_export(project: Project, response: FileResponse):
    assert response.filename == "Projects.xlsx", response.filename

    wb = openpyxl.load_workbook(io.BytesIO(response.getvalue()))
    assert {
        "Projects",
        "Codes",
        "Legacy codes",
        "Metaproject codes",
        "Clusters",
        "Metaproject categories",
        "Project types",
        "Legacy project types",
        "Sectors",
        "Legacy sectors",
        "Subsectors",
        "Legacy subsectors",
        "Substance types",
        "Substances",
        "Status",
        "Serial numbers",
        "Legacy serial numbers",
        "Countries",
        "Titles",
    }.intersection(wb.sheetnames)
    sheet = wb["Projects"]
    assert sheet["A1"].value == "Code", sheet["A1"].value
    assert sheet["A2"].value == project.code, sheet["A2"].value


@pytest.fixture(name="project_with_linked_bp")
def _project_with_linked_bp(
    project: Project, bp_activity: BPActivity, substance: Substance
):
    project.bp_activity = bp_activity
    serialized = BPActivityDetailSerializer(bp_activity)
    ods_odp = {
        "ods_substance_id": substance.id,
        "odp": 11.11,
        "ods_replacement_text": "ods replacement test",
        "ods_replacement": None,
        "co2_mt": 323.23,
        "phase_out_mt": 123.23,
        "ods_type": "production",
        "sort_order": 1,
    }
    ProjectOdsOdp.objects.create(project=project, **ods_odp)
    project.bp_activity_json = serialized.data
    project.save()
    return project


@pytest.fixture(name="project_with_deleted_linked_bp")
def _project_with_deleted_linked_bp(project_with_linked_bp: Project):
    project_with_linked_bp.bp_activity.delete()
    project_with_linked_bp.bp_activity = None
    return project_with_linked_bp


class TestProjectV2ExportXLSX(BaseTest):
    url = reverse("project-v2-export")

    def test_bp_json_structure(self, project_with_linked_bp):
        # pylint: disable-next=import-outside-toplevel
        from core.api.serializers.project_v2 import ProjectDetailsV2Serializer

        serializer = ProjectDetailsV2Serializer(project_with_linked_bp)
        data = serializer.data
        activity_data_from_instance = get_activity_data_from_instance(data)
        activity_data_from_json = get_activity_data_from_json(data["bp_activity_json"])

        del activity_data_from_json["business_plan_id"]
        del activity_data_from_instance["business_plan_id"]

        assert activity_data_from_instance == activity_data_from_json

    def test_export_project_anon(self, project):
        self.client.force_authenticate(user=None)
        response: Response = self.client.get(self.url, {"project_id": project.id})
        assert response.status_code == HTTPStatus.FORBIDDEN, response.data

    def test_export_project_agency_submitter(
        self, project_with_linked_bp, agency_inputter_user
    ):
        self.client.force_authenticate(user=agency_inputter_user)
        response: FileResponse = self.client.get(
            self.url, {"project_id": project_with_linked_bp.id}
        )
        assert response.status_code == HTTPStatus.OK
        validate_single_project_export(project_with_linked_bp, response)

    def test_export_project_secretariat(
        self, project_with_linked_bp, secretariat_viewer_user, project_submitted_status
    ):
        self.client.force_authenticate(user=secretariat_viewer_user)
        project_with_linked_bp.submission_status = project_submitted_status
        project_with_linked_bp.save()
        response: FileResponse = self.client.get(
            self.url, {"project_id": project_with_linked_bp.id}
        )
        assert response.status_code == HTTPStatus.OK
        validate_single_project_export(project_with_linked_bp, response)

    def test_export_project_deleted_activity_secretariat(
        self,
        project_with_deleted_linked_bp,
        secretariat_viewer_user,
        project_submitted_status,
    ):
        self.client.force_authenticate(user=secretariat_viewer_user)
        project_with_deleted_linked_bp.submission_status = project_submitted_status
        project_with_deleted_linked_bp.save()
        response: FileResponse = self.client.get(
            self.url, {"project_id": project_with_deleted_linked_bp.id}
        )

        assert response.status_code == HTTPStatus.OK
        assert (
            project_with_deleted_linked_bp.bp_activity is None
        ), project_with_deleted_linked_bp.bp_activity
        assert (
            project_with_deleted_linked_bp.bp_activity_json
        ), project_with_deleted_linked_bp.bp_activity_json
        validate_single_project_export(project_with_deleted_linked_bp, response)

    def test_export_projects_anon(self, project):
        self.client.force_authenticate(user=None)
        response: Response = self.client.get(self.url, {"project_id": project.id})
        assert response.status_code == HTTPStatus.FORBIDDEN, response.data

    def test_export_projects_agency_submitter(
        self, project, agency_inputter_user, project_approved_status
    ):
        # Set submission status to approved to have the project code shown in the export
        project.submission_status = project_approved_status
        project.save()
        self.client.force_authenticate(user=agency_inputter_user)
        response: FileResponse = self.client.get(self.url)
        assert response.status_code == HTTPStatus.OK
        validate_projects_export(project, response)

    def test_export_projects_secretariat(
        self, project, secretariat_viewer_user, project_approved_status
    ):
        # Set submission status to approved to have the project code shown in the export
        project.submission_status = project_approved_status
        project.save()
        self.client.force_authenticate(user=secretariat_viewer_user)
        response: FileResponse = self.client.get(self.url)
        assert response.status_code == HTTPStatus.OK
        validate_projects_export(project, response)

    def test_export_inventory_report_reads_project_objects_directly(self, admin_user):
        lead_agency = AgencyFactory.create(name="Lead agency")
        cluster = ProjectClusterFactory.create(name="Cluster A")
        funding_window = FundingWindowFactory.create(description="Window A")
        meta_project = MetaProjectFactory.create(type=MetaProject.MetaProjectType.MYA)
        subsector_one = ProjectSubSectorFactory.create(name="Subsector A")
        subsector_two = ProjectSubSectorFactory.create(name="Subsector B")
        project = ProjectFactory.create(
            version=3,
            metacode="META-123",
            code="PRJ-123",
            legacy_code="LEG-123",
            title="Inventory project",
            description="Inventory description",
            excom_provision="Provision text",
            products_manufactured="Manufactured product",
            tranche=4,
            production=True,
            lead_agency=lead_agency,
            funding_window=funding_window,
            meta_project=meta_project,
            cluster=cluster,
            subsectors=[subsector_one, subsector_two],
        )
        project.sector_legacy = "Sector legacy"
        project.subsector_legacy = "Subsector legacy"
        project.save()

        self.client.force_authenticate(user=admin_user)
        response: FileResponse = self.client.get(self.url, {"inventory_report": "true"})

        assert response.status_code == HTTPStatus.OK

        wb = openpyxl.load_workbook(io.BytesIO(response.getvalue()))
        sheet = wb["Projects"]

        assert sheet["A2"].value == project.id
        assert sheet["B2"].value == project.country.name
        assert sheet["C2"].value == project.metacode
        assert sheet["D2"].value == project.code
        assert sheet["E2"].value == project.legacy_code
        assert sheet["F2"].value == project.agency.name
        assert sheet["G2"].value == lead_agency.name
        assert sheet["H2"].value == project.cluster.name
        assert sheet["I2"].value == project.project_type.code
        assert sheet["J2"].value == project.sector.name
        assert sheet["K2"].value == project.sector_legacy
        assert sheet["L2"].value == ", ".join([subsector_one.name, subsector_two.name])
        assert sheet["M2"].value == project.subsector_legacy
        assert sheet["N2"].value == project.title
        assert sheet["O2"].value == project.description
        assert sheet["P2"].value == project.excom_provision
        assert sheet["Q2"].value == project.products_manufactured
        assert sheet["R2"].value == project.tranche
        assert sheet["S2"].value == meta_project.type
        assert sheet["T2"].value == funding_window.id
        assert sheet["U2"].value == "Yes"

    def test_export_mya_adds_filters_and_totals(
        self,
        secretariat_viewer_user,
        project_approved_status,
    ):
        first_meta_project = MetaProjectFactory.create(
            type=MetaProject.MetaProjectType.MYA
        )
        first_project = ProjectFactory.create(
            meta_project=first_meta_project,
            category=Project.Category.MYA,
            submission_status=project_approved_status,
        )
        first_meta_project.umbrella_code = "META-001"
        first_meta_project.country = first_project.country
        first_meta_project.cluster = first_project.cluster
        first_meta_project.project_duration = 12
        first_meta_project.project_funding = Decimal("100.50")
        first_meta_project.support_cost = Decimal("10.25")
        first_meta_project.project_cost = Decimal("110.75")
        first_meta_project.target_odp = Decimal("2.50")
        first_meta_project.baseline_odp = Decimal("3.75")
        first_meta_project.number_of_smes_directly_funded = 4
        first_meta_project.cost_effectiveness_kg = Decimal("5.50")
        first_meta_project.save()

        second_meta_project = MetaProjectFactory.create(
            type=MetaProject.MetaProjectType.MYA,
            umbrella_code="META-002",
            project_duration=24,
            project_funding=Decimal("200.25"),
            support_cost=Decimal("20.50"),
            project_cost=Decimal("220.75"),
            target_odp=Decimal("3.50"),
            baseline_odp=Decimal("4.25"),
            number_of_smes_directly_funded=6,
            cost_effectiveness_kg=Decimal("6.50"),
        )
        second_project = ProjectFactory.create(
            meta_project=second_meta_project,
            category=Project.Category.MYA,
            submission_status=project_approved_status,
        )
        second_meta_project.country = second_project.country
        second_meta_project.cluster = second_project.cluster
        second_meta_project.save()

        self.client.force_authenticate(user=secretariat_viewer_user)
        response: FileResponse = self.client.get(
            self.url, {"category": [Project.Category.MYA]}
        )

        assert response.status_code == HTTPStatus.OK

        wb = openpyxl.load_workbook(io.BytesIO(response.getvalue()))
        sheet = wb["MYAs"]

        assert sheet.auto_filter.ref == "A1:Z3"
        assert sheet["A4"].value is None, "Spacer row not empty."
        assert sheet["A5"].value == "Subtotal (filtered results)"
        assert sheet["A6"].value == "Grand total"

        assert sheet["D5"].value is None
        assert sheet["D6"].value is None

        for idx, header in enumerate(mya_export.HEADERS, start=1):
            if header.get("in_grand_total"):
                ltr = get_column_letter(idx)
                assert sheet[f"{ltr}5"].value == f"=SUBTOTAL(9,{ltr}2:{ltr}3)"
                assert sheet[f"{ltr}6"].value == f"=SUM({ltr}2:{ltr}3)"

                if cell_format := header.get("cell_format"):
                    assert sheet[f"{ltr}5"].number_format == cell_format
                    assert sheet[f"{ltr}6"].number_format == cell_format


class TestProjectV2ExportDOCX(BaseTest):
    url = reverse("project-v2-export")

    def test_export_project_anon(self, project):
        self.client.force_authenticate(user=None)
        response: Response = self.client.get(self.url, {"project_id": project.id})
        assert response.status_code == HTTPStatus.FORBIDDEN, response.data

    def test_export_project_agency_submitter(
        self, project_with_linked_bp, agency_inputter_user
    ):
        self.client.force_authenticate(user=agency_inputter_user)
        response: FileResponse = self.client.get(
            self.url, {"project_id": project_with_linked_bp.id, "output_format": "docx"}
        )
        validate_docx_export(project_with_linked_bp, agency_inputter_user, response)
