import io

import openpyxl
import pytest
from django.urls import reverse

from core.api.tests.base import BaseTest
from core.api.tests.conftest import pdf_text

pytestmark = pytest.mark.django_db
# pylint: disable=C8008, W0221


class TestCPExportXLSX(BaseTest):
    url = reverse("country-programme-export")

    def test_get_cp_export_anon(self, cp_report_2019):
        response = self.client.get(self.url, {"cp_report_id": cp_report_2019.id})
        assert response.status_code == 403

    def test_get_cp_export_new(self, user, cp_report_2019, _setup_new_cp_report):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"cp_report_id": cp_report_2019.id})
        assert response.status_code == 200
        assert response.filename == cp_report_2019.name + ".xlsx"

        wb = openpyxl.load_workbook(io.BytesIO(response.getvalue()))
        assert wb.sheetnames == [
            "Section A",
            "Section B",
            "Section C",
            "Section D",
            "Section E",
            "Section F",
        ]
        assert wb["Section A"]["A1"].value == "Country: Romania Year: 2019"

    def test_get_cp_export_old(self, user, cp_report_2005, _setup_old_cp_report):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"cp_report_id": cp_report_2005.id})
        assert response.status_code == 200
        assert response.filename == cp_report_2005.name + ".xlsx"

        wb = openpyxl.load_workbook(io.BytesIO(response.getvalue()))
        assert wb.sheetnames == [
            "Section A",
            "Adm B",
            "Adm C",
            "Section C",
            "Adm D",
        ]
        assert wb["Section A"]["A1"].value == "Country: Romania Year: 2005"


class TestCPExportPDF(BaseTest):
    url = reverse("country-programme-print")

    def test_get_cp_export_anon(self, cp_report_2019):
        response = self.client.get(self.url, {"cp_report_id": cp_report_2019.id})
        assert response.status_code == 403

    def test_get_cp_export_new(self, user, cp_report_2019, _setup_new_cp_report):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"cp_report_id": cp_report_2019.id})
        assert response.status_code == 200
        assert response.filename == cp_report_2019.name + ".pdf"

        text = pdf_text(io.BytesIO(response.getvalue()))
        assert "Country: Romania Year: 2019" in text
        for name in [
            "Section A",
            "Section B",
            "Section C",
            "Section D",
            "Section E",
            "Section F",
        ]:
            assert name.upper() in text

    def test_get_cp_export_old(self, user, cp_report_2005, _setup_old_cp_report):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"cp_report_id": cp_report_2005.id})
        assert response.status_code == 200
        assert response.filename == cp_report_2005.name + ".pdf"

        text = pdf_text(io.BytesIO(response.getvalue()))
        assert "Country: Romania Year: 2005" in text

        for name in [
            "Section A",
            "Adm B",
            "Adm C",
            "Section C",
            "Adm D",
        ]:
            assert name.upper() in text


class TestCPExportEmpty(BaseTest):
    url = reverse("country-programme-export-empty")

    def test_get_cp_export_anon(self, cp_report_2019):
        response = self.client.get(self.url, {"cp_report_id": cp_report_2019.id})
        assert response.status_code == 403

    def test_get_cp_export_new(self, user):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"year": "2019"})
        assert response.status_code == 200

        wb = openpyxl.load_workbook(io.BytesIO(response.getvalue()))
        assert wb.sheetnames == [
            "Section A",
            "Section B",
            "Section C",
            "Section D",
            "Section E",
            "Section F",
        ]
        assert wb["Section A"]["A1"].value == "Country: XXXX Year: 2019"

    def test_get_cp_export_old(self, user):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"year": 2005})
        assert response.status_code == 200

        wb = openpyxl.load_workbook(io.BytesIO(response.getvalue()))
        assert wb.sheetnames == [
            "Section A",
            "Adm B",
            "Adm C",
            "Section C",
            "Adm D",
        ]
        assert wb["Section A"]["A1"].value == "Country: XXXX Year: 2005"


class TestCPArchiveExportXLSX(BaseTest):
    url = reverse("country-programme-archive-export")

    def test_get_cp_export_anon(self, cp_report_2019):
        response = self.client.get(self.url, {"cp_report_id": cp_report_2019.id})
        assert response.status_code == 403

    def test_get_cp_archive_export_new(self, user, _setup_old_version_2019):
        self.client.force_authenticate(user=user)

        cp_ar = _setup_old_version_2019

        response = self.client.get(self.url, {"cp_report_id": cp_ar.id})
        assert response.status_code == 200
        assert response.filename == cp_ar.name + ".xlsx"

        wb = openpyxl.load_workbook(io.BytesIO(response.getvalue()))
        assert wb.sheetnames == [
            "Section A",
            "Section B",
            "Section C",
            "Section D",
            "Section E",
            "Section F",
        ]
        assert wb["Section A"]["A1"].value == "Country: Romania Year: 2019"

    def test_get_cp_export_old(self, user, _setup_old_version_2005):
        self.client.force_authenticate(user=user)

        cp_ar = _setup_old_version_2005

        response = self.client.get(self.url, {"cp_report_id": cp_ar.id})
        assert response.status_code == 200
        assert response.filename == cp_ar.name + ".xlsx"

        wb = openpyxl.load_workbook(io.BytesIO(response.getvalue()))
        assert wb.sheetnames == [
            "Section A",
            "Adm B",
            "Adm C",
            "Section C",
            "Adm D",
        ]
        assert wb["Section A"]["A1"].value == "Country: Romania Year: 2005"
