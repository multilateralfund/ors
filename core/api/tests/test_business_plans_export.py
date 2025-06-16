import io

import openpyxl
import pytest
from django.urls import reverse

from core.api.tests.base import BaseTest

pytestmark = pytest.mark.django_db
# pylint: disable=W0613, R0913


class TestBPExport(BaseTest):
    url = reverse("bpactivity-export")

    def test_export_permissions(
        self,
        secretariat_user,
        agency_user,
        agency_inputter_user,
        bp_viewer_user,
        bp_editor_user,
        admin_user,
        business_plan,
    ):

        def _test_export_permissions(user, expected_status):
            # check user with permissions
            self.client.force_authenticate(user=user)
            response = self.client.get(
                self.url,
                {
                    "year_start": business_plan.year_start,
                    "year_end": business_plan.year_end,
                    "bp_status": business_plan.status,
                },
            )
            assert response.status_code == expected_status

        # check anon user
        _test_export_permissions(None, 403)

        _test_export_permissions(secretariat_user, 200)
        _test_export_permissions(agency_user, 200)
        _test_export_permissions(agency_inputter_user, 200)
        _test_export_permissions(bp_viewer_user, 200)
        _test_export_permissions(bp_editor_user, 200)
        _test_export_permissions(admin_user, 200)
        # check user with BP editor permissions

    def test_export(
        self, bp_viewer_user, business_plan, bp_activity, bp_activity_values
    ):
        self.client.force_authenticate(user=bp_viewer_user)

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
            "Countries",
            "Agencies",
            "Clusters",
            "ChemicalTypes",
            "ProjectTypes",
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
        assert sheet["Q2"].value == bp_activity_values[0].value_co2

        assert sheet["R2"].value == bp_activity_values[1].value_usd
        assert sheet["S2"].value == bp_activity_values[1].value_odp
        assert sheet["T2"].value == bp_activity_values[1].value_mt
        assert sheet["U2"].value == bp_activity_values[1].value_co2

        assert sheet["V2"].value == bp_activity_values[2].value_usd
        assert sheet["W2"].value == bp_activity_values[2].value_odp
        assert sheet["X2"].value == bp_activity_values[2].value_mt
        assert sheet["Y2"].value == bp_activity_values[2].value_co2

        assert sheet["Z2"].value == bp_activity_values[3].value_usd
        assert sheet["AA2"].value == bp_activity_values[3].value_odp
        assert sheet["AB2"].value == bp_activity_values[3].value_mt
        assert sheet["AC2"].value == bp_activity_values[3].value_co2
