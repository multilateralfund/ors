import io

import openpyxl
import pytest
from django.urls import reverse

from core.api.export.section_export import parse_section_sheet
from core.api.tests.base import BaseTest

pytestmark = pytest.mark.django_db
# pylint: disable=C8008, W0221


class TestCPImportNewXLSX(BaseTest):
    url = reverse("country-programme-import")
    export_url = reverse("country-programme-export")

    def test_import_cp_new(self, user, cp_report_2019, _setup_new_cp_report):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.export_url, {"cp_report_id": cp_report_2019.id})
        assert response.status_code == 200

        xlsx = io.BytesIO(response.getvalue())
        response = self.client.post(self.url, {"file": xlsx}, format="multipart")
        assert response.status_code == 200
