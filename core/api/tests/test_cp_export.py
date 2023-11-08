import io

import openpyxl
import pytest
from django.urls import reverse

from core.api.tests.base import BaseTest

pytestmark = pytest.mark.django_db
# pylint: disable=C8008, W0221


class TestCPExport(BaseTest):
    url = reverse("country-programme-export")

    def test_get_cp_export_anon(self, cp_report_2019):
        response = self.client.get(self.url, {"cp_report_id": cp_report_2019.id})
        assert response.status_code == 403

    def test_get_cp_export_new(self, user, cp_report_2019):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"cp_report_id": cp_report_2019.id})
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
        assert wb["Section A"]["A1"].value == "Country: Romania Year: 2019"

    def test_get_cp_export_old(self, user, cp_report_2005):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"cp_report_id": cp_report_2005.id})
        assert response.status_code == 200

        wb = openpyxl.load_workbook(io.BytesIO(response.getvalue()))
        assert wb.sheetnames == [
            "Section A",
            "Adm B",
            "Adm C",
            "Section C",
            "Adm D",
        ]
        assert wb["Section A"]["A1"].value == "Country: Romania Year: 2005"
