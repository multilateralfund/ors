import pytest
from django.urls import reverse

from core.api.tests.base import BaseTest
from core.api.tests.factories import CountryFactory
from core.api.views.utils import get_archive_reports_final_for_years
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
        self, secretariat_user, cp_report_2019, _setup_version_list, cp_report_2005
    ):
        self.client.force_authenticate(user=secretariat_user)

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

    def test_versions_list_invalid_country_id(
        self, secretariat_user, _setup_version_list
    ):
        self.client.force_authenticate(user=secretariat_user)

        response = self.client.get(self.url, {"country_id": 999, "year": 2005})
        assert response.status_code == 400

    def test_versions_list_without_year(
        self, secretariat_user, cp_report_2019, _setup_version_list
    ):
        self.client.force_authenticate(user=secretariat_user)

        response = self.client.get(self.url, {"country_id": cp_report_2019.country_id})
        assert response.status_code == 400


class TestGetOldVersion(BaseTest):
    url = reverse("country-programme-archive-record-list")

    def test_get_old_version_2019(
        self, secretariat_user, _setup_old_version_2019, cp_report_2019
    ):
        self.client.force_authenticate(user=secretariat_user)

        cp_ar = _setup_old_version_2019

        response = self.client.get(self.url, {"cp_report_id": cp_ar.id})
        assert response.status_code == 200
        assert response.data["cp_report"]["final_version_id"] == cp_report_2019.id
        assert len(response.data["section_a"]) == 1
        assert len(response.data["section_a"][0]["excluded_usages"]) == 1
        assert len(response.data["section_b"]) == 1

    def test_get_old_version_2005(
        self, secretariat_user, _setup_old_version_2005, cp_report_2005
    ):
        self.client.force_authenticate(user=secretariat_user)

        cp_ar = _setup_old_version_2005

        response = self.client.get(self.url, {"cp_report_id": cp_ar.id})
        assert response.status_code == 200
        assert response.data["cp_report"]["final_version_id"] == cp_report_2005.id
        assert len(response.data["section_a"]) == 1
        assert len(response.data["section_a"][0]["excluded_usages"]) == 1
        assert len(response.data["adm_b"]) == 1


class TestArchiveDedup:
    """Which archived reports stand in for a missing final one.

    The rule these pin: an archived report is used only where no FINAL report
    exists for the same country and year, and then only its highest version.
    """

    @staticmethod
    def archive(cp_report, version, status=CPReport.CPReportStatus.FINAL, year=None):
        return CPReportArchive.objects.create(
            name=cp_report.name,
            year=year if year is not None else cp_report.year,
            country=cp_report.country,
            status=status,
            version=version,
            created_by=cp_report.created_by,
        )

    def test_the_highest_archived_version_wins(self, cp_report_2019):
        """No final report for that country-year, so the archive answers."""
        cp_report_2019.status = CPReport.CPReportStatus.DRAFT
        cp_report_2019.save()
        for version in (1, 3, 2):
            self.archive(cp_report_2019, version)

        result = list(get_archive_reports_final_for_years(2019, 2019))

        assert result == [(cp_report_2019.country_id, 2019, 3)]

    def test_a_final_report_supersedes_every_archived_version(self, cp_report_2019):
        """The live report is served instead, so the archive contributes nothing."""
        cp_report_2019.status = CPReport.CPReportStatus.FINAL
        cp_report_2019.save()
        for version in (1, 2, 3):
            self.archive(cp_report_2019, version)

        assert not list(get_archive_reports_final_for_years(2019, 2019))

    def test_superseding_one_year_does_not_hide_another(self, cp_report_2019):
        """Both country and year must match for a final report to supersede."""
        cp_report_2019.status = CPReport.CPReportStatus.FINAL
        cp_report_2019.save()
        self.archive(cp_report_2019, 1)
        # Same country, a year with no final report of its own.
        self.archive(cp_report_2019, 2, year=2018)

        result = list(get_archive_reports_final_for_years(2018, 2019))

        assert result == [(cp_report_2019.country_id, 2018, 2)]

    def test_superseding_one_country_does_not_hide_another(self, cp_report_2019, user):
        """A final report for one country says nothing about another's archive."""
        cp_report_2019.status = CPReport.CPReportStatus.FINAL
        cp_report_2019.save()
        self.archive(cp_report_2019, 1)

        other = CountryFactory.create(name="Kenya", iso3="KEN")
        CPReportArchive.objects.create(
            name="Kenya 2019",
            year=2019,
            country=other,
            status=CPReport.CPReportStatus.FINAL,
            version=4,
            created_by=user,
        )

        result = list(get_archive_reports_final_for_years(2019, 2019))

        assert result == [(other.id, 2019, 4)]

    def test_the_year_range_bounds_the_answer(self, cp_report_2019):
        cp_report_2019.status = CPReport.CPReportStatus.DRAFT
        cp_report_2019.save()
        self.archive(cp_report_2019, 1)
        self.archive(cp_report_2019, 1, year=2010)

        assert list(get_archive_reports_final_for_years(2019, 2019)) == [
            (cp_report_2019.country_id, 2019, 1)
        ]
        assert list(get_archive_reports_final_for_years(2000, 2025)) == [
            (cp_report_2019.country_id, 2010, 1),
            (cp_report_2019.country_id, 2019, 1),
        ]

    def test_a_draft_archived_report_is_not_a_candidate(self, cp_report_2019):
        """Only final archived versions can stand in for a missing report."""
        cp_report_2019.status = CPReport.CPReportStatus.DRAFT
        cp_report_2019.save()
        self.archive(cp_report_2019, 5, status=CPReport.CPReportStatus.DRAFT)
        self.archive(cp_report_2019, 2)

        result = list(get_archive_reports_final_for_years(2019, 2019))

        assert result == [(cp_report_2019.country_id, 2019, 2)]

    def test_a_draft_report_does_not_supersede_the_archive(self, cp_report_2019):
        """Only a FINAL live report displaces the archived versions."""
        cp_report_2019.status = CPReport.CPReportStatus.DRAFT
        cp_report_2019.save()
        self.archive(cp_report_2019, 7)

        result = list(get_archive_reports_final_for_years(2019, 2019))

        assert result == [(cp_report_2019.country_id, 2019, 7)]
