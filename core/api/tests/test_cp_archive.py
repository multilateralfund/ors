import pytest
from django.urls import reverse

from core.api.tests.base import BaseTest
from core.models import AdmRecordArchive
from core.models.country_programme import CPReport
from core.models.country_programme_archive import CPReportArchive


pytestmark = pytest.mark.django_db
# pylint: disable=C8008


@pytest.fixture(name="_setup_version_list")
def setup_version_list(cp_report_2019, cp_report_2005):
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
            )


class TestVersionsList(BaseTest):
    url = reverse("country-programme-versions")

    def test_versions_list(
        self, user, cp_report_2019, _setup_version_list, cp_report_2005
    ):
        self.client.force_authenticate(user=user)

        response = self.client.get(
            self.url, {"country_programme_report_id": cp_report_2019.id}
        )
        assert response.status_code == 200
        assert len(response.data) == 5

        response = self.client.get(
            self.url, {"country_programme_report_id": cp_report_2005.id}
        )
        assert response.status_code == 200
        assert len(response.data) == 5

    def test_versions_list_invalid_cp_report_id(self, user, _setup_version_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"country_programme_report_id": 999})
        assert response.status_code == 200
        assert len(response.data) == 0

    def test_version_list_filter_by_archive_id(self, user, _setup_version_list):
        self.client.force_authenticate(user=user)

        last_archive = CPReportArchive.objects.last()
        response = self.client.get(self.url, {"cp_report_archive_id": last_archive.id})
        assert response.status_code == 200
        assert len(response.data) == 5


@pytest.fixture(name="_setup_old_version_2019")
def setup_old_version_2019(cp_report_2019, substance, blend):
    cp_report_2019.status = CPReport.CPReportStatus.FINAL
    cp_report_2019.version = 2
    cp_report_2019.save()

    substance.displayed_in_all = True
    substance.save()

    blend.displayed_in_all = True
    blend.save()

    cp_ar = CPReportArchive.objects.create(
        name=cp_report_2019.name,
        year=cp_report_2019.year,
        country=cp_report_2019.country,
        status=cp_report_2019.status,
        version=1,
    )

    return cp_ar


@pytest.fixture(name="_setup_old_version_2005")
def setup_old_version_2005(cp_report_2005, substance, blend, adm_rows, adm_columns):
    cp_report_2005.status = CPReport.CPReportStatus.FINAL
    cp_report_2005.version = 2
    cp_report_2005.save()

    substance.displayed_in_all = True
    substance.save()

    blend.displayed_in_all = True
    blend.save()

    cp_ar = CPReportArchive.objects.create(
        name=cp_report_2005.name,
        year=cp_report_2005.year,
        country=cp_report_2005.country,
        status=cp_report_2005.status,
        version=1,
    )

    adm_b_row = adm_rows[0]
    adm_b_col = adm_columns[0]

    AdmRecordArchive.objects.create(
        row=adm_b_row,
        column=adm_b_col,
        section="B",
        value_text="Treviso",
        country_programme_report=cp_ar,
    )

    return cp_ar


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

    def test_get_old_version_2005(self, user, _setup_old_version_2005):
        self.client.force_authenticate(user=user)

        cp_ar = _setup_old_version_2005

        response = self.client.get(self.url, {"cp_report_id": cp_ar.id})
        assert response.status_code == 200
        assert len(response.data["section_a"]) == 1
        assert len(response.data["section_a"][0]["excluded_usages"]) == 1
        assert len(response.data["adm_b"]) == 1
