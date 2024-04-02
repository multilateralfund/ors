import pytest
from django.urls import reverse

from core.api.tests.base import BaseTest
from core.api.tests.factories import CPRaportFormatRowFactory
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

    def test_versions_list_without_year(self, user, cp_report_2019, _setup_version_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"country_id": cp_report_2019.country_id})
        assert response.status_code == 400


@pytest.fixture(name="_setup_old_version_2019")
def setup_old_version_2019(cp_report_2019, substance, blend, time_frames):
    cp_report_2019.status = CPReport.CPReportStatus.FINAL
    cp_report_2019.version = 2
    cp_report_2019.save()

    CPRaportFormatRowFactory.create(
        blend=blend,
        substance=None,
        section="B",
        time_frame=time_frames[(2000, None)],
        sort_order=2,
    )

    CPRaportFormatRowFactory.create(
        blend=None,
        substance=substance,
        section="A",
        time_frame=time_frames[(2000, None)],
        sort_order=1,
    )

    cp_ar = CPReportArchive.objects.create(
        name=cp_report_2019.name,
        year=cp_report_2019.year,
        country=cp_report_2019.country,
        status=cp_report_2019.status,
        version=1,
    )

    return cp_ar


@pytest.fixture(name="_setup_old_version_2005")
def setup_old_version_2005(
    cp_report_2005, substance, blend, adm_rows, adm_columns, time_frames
):
    cp_report_2005.status = CPReport.CPReportStatus.FINAL
    cp_report_2005.version = 2
    cp_report_2005.save()

    CPRaportFormatRowFactory.create(
        blend=blend,
        substance=None,
        section="B",
        time_frame=time_frames[(2000, None)],
        sort_order=2,
    )

    CPRaportFormatRowFactory.create(
        blend=None,
        substance=substance,
        section="A",
        time_frame=time_frames[(2000, None)],
        sort_order=1,
    )

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

    def test_get_old_version_2005(self, user, _setup_old_version_2005, cp_report_2005):
        self.client.force_authenticate(user=user)

        cp_ar = _setup_old_version_2005

        response = self.client.get(self.url, {"cp_report_id": cp_ar.id})
        assert response.status_code == 200
        assert response.data["cp_report"]["final_version_id"] == cp_report_2005.id
        assert len(response.data["section_a"]) == 1
        assert len(response.data["section_a"][0]["excluded_usages"]) == 1
        assert len(response.data["adm_b"]) == 1
