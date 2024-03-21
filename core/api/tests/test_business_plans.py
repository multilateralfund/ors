import io

import openpyxl
import pytest
from django.urls import reverse

from core.api.tests.base import BaseTest
from core.api.tests.conftest import pdf_text

pytestmark = pytest.mark.django_db
# pylint: disable=C8008, W0221


class TestBPExport(BaseTest):
    url = reverse("bprecord-export")

    def test_export_anon(self, business_plan):
        response = self.client.get(
            self.url, {"business_plan__year_start": business_plan.year_start}
        )
        assert response.status_code == 403

    def test_export(self, user, business_plan, bp_record, bp_record_values):
        self.client.force_authenticate(user=user)

        response = self.client.get(
            self.url, {"business_plan__year_start": business_plan.year_start}
        )
        assert response.status_code == 200
        assert (
            response.filename
            == f"Business Plans {business_plan.year_start}-{business_plan.year_end}.xlsx"
        )

        wb = openpyxl.load_workbook(io.BytesIO(response.getvalue()))
        sheet = wb.active
        assert sheet["A2"].value == bp_record.country.name
        assert sheet["B2"].value == business_plan.agency.name
        assert sheet["M2"].value == bp_record.title

        assert sheet["O2"].value == bp_record_values[0].value_usd
        assert sheet["P2"].value == bp_record_values[0].value_odp
        assert sheet["Q2"].value == bp_record_values[0].value_mt

        assert sheet["R2"].value == bp_record_values[1].value_usd
        assert sheet["S2"].value == bp_record_values[1].value_odp
        assert sheet["T2"].value == bp_record_values[1].value_mt

        assert sheet["U2"].value == bp_record_values[2].value_usd
        assert sheet["V2"].value == bp_record_values[2].value_odp
        assert sheet["W2"].value == bp_record_values[2].value_mt

        assert sheet["X2"].value == bp_record_values[3].value_usd
        assert sheet["Y2"].value == bp_record_values[3].value_odp
        assert sheet["Z2"].value == bp_record_values[3].value_mt


class TestBPPrint(BaseTest):
    url = reverse("bprecord-print")

    def test_export_anon(self, business_plan):
        response = self.client.get(
            self.url, {"business_plan__year_start": business_plan.year_start}
        )
        assert response.status_code == 403

    def test_export(self, user, business_plan, bp_record):
        self.client.force_authenticate(user=user)

        response = self.client.get(
            self.url, {"business_plan__year_start": business_plan.year_start}
        )
        assert response.status_code == 200
        assert (
            response.filename
            == f"Business Plans {business_plan.year_start}-{business_plan.year_end}.pdf"
        )

        text = pdf_text(io.BytesIO(response.getvalue())).replace("\n", "")

        assert bp_record.country.name in text
        assert business_plan.agency.name in text
        assert bp_record.title in text
