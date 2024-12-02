import io

import openpyxl
import pytest
from django.urls import reverse

from core.api.tests.base import BaseTest
from core.api.tests.conftest import pdf_text

pytestmark = pytest.mark.django_db
# pylint: disable=W0613, R0913


class TestBPExport(BaseTest):
    url = reverse("bpactivity-export")

    def test_export_anon(self, business_plan):
        response = self.client.get(
            self.url,
            {
                "year_start": business_plan.year_start,
                "year_end": business_plan.year_end,
                "bp_status": business_plan.status,
            },
        )
        assert response.status_code == 403

    def test_export(self, user, business_plan, bp_activity, bp_activity_values):
        self.client.force_authenticate(user=user)

        response = self.client.get(
            self.url,
            {
                "year_start": business_plan.year_start,
                "year_end": business_plan.year_end,
                "bp_status": business_plan.status,
            },
        )
        assert response.status_code == 200
        assert (
            response.filename
            == f"{business_plan.status}_BusinessPlan{business_plan.year_start}-{business_plan.year_end}.xlsx"
        )

        wb = openpyxl.load_workbook(io.BytesIO(response.getvalue()))
        assert wb.sheetnames == [
            "Activities",
            "Agencies",
            "Countries",
            "Clusters",
            "ChemicalTypes",
            "Project Types",
            "Sectors",
            "SubSectors",
            "LVCStatuses",
        ]

        sheet = wb["Activities"]
        internal_id = str(bp_activity.initial_id).zfill(9)
        sort_order = (
            f"{bp_activity.agency.name}-{bp_activity.country.abbr}-{internal_id}"
        )
        assert sheet["A2"].value == sort_order
        assert sheet["B2"].value == bp_activity.country.name
        assert sheet["C2"].value == bp_activity.agency.name
        assert sheet["L2"].value == bp_activity.title

        assert sheet["N2"].value == bp_activity_values[0].value_usd
        assert sheet["O2"].value == bp_activity_values[0].value_odp
        assert sheet["P2"].value == bp_activity_values[0].value_mt

        assert sheet["Q2"].value == bp_activity_values[1].value_usd
        assert sheet["R2"].value == bp_activity_values[1].value_odp
        assert sheet["S2"].value == bp_activity_values[1].value_mt

        assert sheet["T2"].value == bp_activity_values[2].value_usd
        assert sheet["U2"].value == bp_activity_values[2].value_odp
        assert sheet["V2"].value == bp_activity_values[2].value_mt

        assert sheet["W2"].value == bp_activity_values[3].value_usd
        assert sheet["X2"].value == bp_activity_values[3].value_odp
        assert sheet["Y2"].value == bp_activity_values[3].value_mt
