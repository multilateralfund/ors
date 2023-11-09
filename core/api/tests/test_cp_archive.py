import pytest
from django.urls import reverse

from core.api.tests.base import BaseTest
from core.models.country_programme import CPReport
from core.models.country_programme_archive import CPReportArchive


pytestmark = pytest.mark.django_db
# pylint: disable=C8008


@pytest.fixture(name="_setup_version_list")
def setup_version_list(cp_report_2019):
    cp_report_2019.status = CPReport.CPReportStatus.FINAL
    cp_report_2019.save()

    for i in range(5):
        CPReportArchive.objects.create(
            name=cp_report_2019.name,
            year=cp_report_2019.year,
            country=cp_report_2019.country,
            status=cp_report_2019.status,
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
        assert len(response.data) == 0

    def test_versions_list_invalid_cp_report_id(self, user, _setup_version_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"country_programme_report_id": 999})
        assert response.status_code == 200
        assert len(response.data) == 0


@pytest.fixture(name="_setup_old_version")
def setup_old_version(cp_report_2019, substance, blend):
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


class TestGetOldVersion(BaseTest):
    url = reverse("country-programme-archive-record-list")

    def test_get_old_version(self, user, _setup_old_version):
        self.client.force_authenticate(user=user)

        cp_ar = _setup_old_version

        response = self.client.get(self.url, {"cp_report_id": cp_ar.id})
        assert response.status_code == 200
        assert len(response.data["section_a"]) == 1
        assert len(response.data["section_a"][0]["excluded_usages"]) == 1
        assert len(response.data["section_b"]) == 1
