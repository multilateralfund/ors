import pytest
from django.urls import reverse

from core.api.tests.base import BaseTest
from core.models.country_programme import CPReport
from core.models.country_programme_archive import CPReportArchive


pytestmark = pytest.mark.django_db
# pylint: disable=C8008, R0913


@pytest.fixture(name="_setup_version_list")
def setup_version_list(cp_report_2019, cp_report_2005, user):
    cp_report_2019.status = CPReport.CPReportStatus.FINAL
    cp_report_2019.save()

    for cp_report in (cp_report_2005, cp_report_2019):
        for i in range(5):
            CPReportArchive.objects.create(
                name=cp_report.name,
                year=cp_report.year,
                country=cp_report.country,
                status=cp_report.status,
                version=i + 1,
                created_by=user,
            )


class TestVersionsList(BaseTest):
    url = reverse("country-programme-versions")

    def test_versions_list(
        self, user, cp_report_2019, _setup_version_list, cp_report_2005
    ):
        self.client.force_authenticate(user=user)

        response = self.client.get(
            self.url, {"country_id": cp_report_2019.country_id, "year": 2019}
        )
        assert response.status_code == 200
        assert len(response.data) == 6
        assert response.data[0]["id"] == cp_report_2019.id

        response = self.client.get(
            self.url, {"country_id": cp_report_2005.country_id, "year": 2005}
        )
        assert response.status_code == 200
        assert len(response.data) == 6

    def test_versions_list_invalid_country_id(self, user, _setup_version_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"country_id": 999, "year": 2005})
        assert response.status_code == 400

    def test_versions_list_without_year(
        self, user, cp_report_2019, _setup_version_list
    ):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"country_id": cp_report_2019.country_id})
        assert response.status_code == 400


class TestGetOldVersion(BaseTest):
    url = reverse("country-programme-archive-record-list")

    def test_get_old_version_2019(self, user, _setup_old_version_2019, cp_report_2019):
        self.client.force_authenticate(user=user)

        cp_ar = _setup_old_version_2019

        response = self.client.get(self.url, {"cp_report_id": cp_ar.id})
        assert response.status_code == 200
        assert response.data["cp_report"]["final_version_id"] == cp_report_2019.id
        assert len(response.data["section_a"]) == 1
        assert len(response.data["section_a"][0]["excluded_usages"]) == 1
        assert len(response.data["section_b"]) == 1

    def test_get_old_version_2005(self, user, _setup_old_version_2005, cp_report_2005):
        self.client.force_authenticate(user=user)

        cp_ar = _setup_old_version_2005

        response = self.client.get(self.url, {"cp_report_id": cp_ar.id})
        assert response.status_code == 200
        assert response.data["cp_report"]["final_version_id"] == cp_report_2005.id
        assert len(response.data["section_a"]) == 1
        assert len(response.data["section_a"][0]["excluded_usages"]) == 1
        assert len(response.data["adm_b"]) == 1
