from decimal import Decimal

import pytest

from django.contrib.auth.models import Group
from django.urls import reverse
from unittest.mock import patch

from core.api.tests.base import BaseTest
from core.api.tests.factories import (
    CPReportFormatColumnFactory,
    CPReportFormatRowFactory,
    CountryFactory,
    CPReportFactory,
    CPReportCommentFactory,
    GroupFactory,
    SubstanceFactory,
    TimeFrameFactory,
    UsageFactory,
    UserFactory,
)
from core.models import AdmRecordArchive
from core.models import Country
from core.models import CPUsage
from core.models import CPUsageArchive
from core.models.adm import AdmRecord
from core.models.country_programme import (
    CPComment,
    CPEmission,
    CPGeneration,
    CPPrices,
    CPRecord,
    CPReport,
)
from core.models.country_programme_archive import (
    CPEmissionArchive,
    CPGenerationArchive,
    CPPricesArchive,
    CPRecordArchive,
    CPReportArchive,
)

pytestmark = pytest.mark.django_db
# pylint: disable=C8008, W0221, R0915, C0302


@pytest.fixture(name="mock_send_mail_report_create")
def _mock_send_mail_report_create():
    with patch("core.tasks.send_mail_report_create.delay") as send_mail:
        yield send_mail


@pytest.fixture(name="mock_send_mail_report_update")
def _mock_send_mail_report_update():
    with patch("core.tasks.send_mail_report_update.delay") as send_mail:
        yield send_mail


@pytest.fixture(name="_setup_cp_report_list")
def setup_cp_report_list(user):
    for country in ["Romania", "Bulgaria", "Hungary"]:
        country = CountryFactory.create(name=country)
        for i in range(3):
            year = 2010 + i
            data = {
                "country": country,
                "name": country.name + str(year),
                "year": year,
                "created_by": user,
                "version": 1,
            }
            # create final report archive
            if i == 2:
                CPReportArchive.objects.create(
                    **data,
                    status=CPReport.CPReportStatus.FINAL,
                )
                data["version"] = 2
            CPReportFactory.create(
                **data,
                status=CPReport.CPReportStatus.DRAFT,
            )

    return country


@pytest.fixture(name="status_update_url")
def _status_update_url(cp_report_2019):
    return reverse("country-programme-report-status", kwargs={"id": cp_report_2019.id})


@pytest.fixture(name="another_country_user")
def _another_country_user():
    new_country = CountryFactory.create(name="New Country")
    group = Group.objects.get(name="CP - Country user")
    user = UserFactory.create(country=new_country)
    user.groups.add(group)
    return user


class TestCPReportList(BaseTest):
    url = reverse("country-programme-reports")

    def test_get_cp_report_list(self, country_viewer_user, _setup_cp_report_list):
        self.client.force_authenticate(user=country_viewer_user)

        # get cp reports list
        response = self.client.get(self.url, {"ordering": "year,country__name"})
        assert response.status_code == 200
        assert len(response.data) == 9
        assert response.data[0]["name"] == "Bulgaria2010"
        assert response.data[8]["name"] == "Romania2012"

    def test_get_cp_report_list_country_user(self, country_user, _setup_cp_report_list):
        self.client.force_authenticate(user=country_user)

        # get cp reports list
        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 3
        assert response.data[0]["name"] == "Romania2010"
        assert response.data[2]["name"] == "Romania2012"

    def test_get_cp_report_list_country_filter(
        self, secretariat_user, _setup_cp_report_list
    ):
        self.client.force_authenticate(user=secretariat_user)
        country = _setup_cp_report_list
        # filter by country id (country = Hungary)
        response = self.client.get(self.url, {"country_id": country.id})
        assert response.status_code == 200
        assert len(response.data) == 3
        assert country.name in response.data[0]["name"]

    def test_get_cp_report_list_country_filter_multiple(
        self, secretariat_user, _setup_cp_report_list
    ):
        self.client.force_authenticate(user=secretariat_user)
        ids = map(
            str,
            Country.objects.filter(name__in=["Romania", "Bulgaria"]).values_list(
                "id", flat=True
            ),
        )
        # filter by country id (country = Hungary)
        response = self.client.get(
            self.url, {"country_id": ",".join(ids), "ordering": "country__name"}
        )
        assert response.status_code == 200
        assert len(response.data) == 6
        assert "Bulgaria" in response.data[0]["name"]
        assert "Romania" in response.data[-1]["name"]

    def test_get_cp_report_list_name_filter(
        self, secretariat_user, _setup_cp_report_list
    ):
        self.client.force_authenticate(user=secretariat_user)

        response = self.client.get(self.url, {"name": "man", "ordering": "year"})
        assert response.status_code == 200
        assert len(response.data) == 3
        assert response.data[0]["name"] == "Romania2010"

    def test_get_cp_report_list_year_filter(
        self, secretariat_user, _setup_cp_report_list
    ):
        self.client.force_authenticate(user=secretariat_user)

        response = self.client.get(
            self.url, {"year_max": 2011, "year_min": 2011, "ordering": "country__name"}
        )
        assert response.status_code == 200
        assert len(response.data) == 3
        assert response.data[0]["name"] == "Bulgaria2011"
        assert response.data[0]["year"] == 2011

    def test_get_cp_report_list_year_filter_range(
        self, secretariat_user, _setup_cp_report_list
    ):
        self.client.force_authenticate(user=secretariat_user)

        response = self.client.get(
            self.url,
            {"year_max": 2011, "year_min": 2010, "ordering": "year,country__name"},
        )

        assert response.status_code == 200
        assert len(response.data) == 6
        assert response.data[0]["name"] == "Bulgaria2010"
        assert response.data[0]["year"] == 2010
        assert response.data[-1]["name"] == "Romania2011"
        assert response.data[-1]["year"] == 2011

    def test_get_cp_report_list_status_filter(
        self, secretariat_user, _setup_cp_report_list
    ):
        self.client.force_authenticate(user=secretariat_user)

        response = self.client.get(self.url, {"status": "draft"})
        assert response.status_code == 200
        assert len(response.data) == 9
        for report in response.data:
            assert report["status"] == "draft"
            assert report["is_archive"] is False

        response = self.client.get(self.url, {"status": "final"})
        assert response.status_code == 200
        assert len(response.data) == 3
        for report in response.data:
            assert report["status"] == "final"
            assert report["is_archive"] is True


class TestCPReportListGroupByYear(BaseTest):
    url = reverse("country-programme-reports-by-year")

    def test_get_cp_report_list(self, country_viewer_user, _setup_cp_report_list):
        self.client.force_authenticate(user=country_viewer_user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 3
        assert response.data[0]["id"] == 2010
        assert [report["country"] for report in response.data[0]["reports"]] == [
            "Bulgaria",
            "Hungary",
            "Romania",
        ]

    def test_get_cp_report_list_country_user(self, country_user, _setup_cp_report_list):
        self.client.force_authenticate(user=country_user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 3
        assert response.data[0]["id"] == 2010
        assert [report["country"] for report in response.data[0]["reports"]] == [
            "Romania",
        ]

    def test_get_cp_report_list_order(self, secretariat_user, _setup_cp_report_list):
        self.client.force_authenticate(user=secretariat_user)

        response = self.client.get(self.url, {"ordering": "desc"})
        assert response.status_code == 200
        assert len(response.data) == 3
        assert response.data[0]["id"] == 2012
        assert [report["country"] for report in response.data[0]["reports"]] == [
            "Bulgaria",
            "Hungary",
            "Romania",
        ]


class TestCPReportListGroupByCountry(BaseTest):
    url = reverse("country-programme-reports-by-country")

    def test_get_cp_report_list(self, country_viewer_user, _setup_cp_report_list):
        self.client.force_authenticate(user=country_viewer_user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 3
        assert response.data[0]["group"] == "Bulgaria"
        assert [report["year"] for report in response.data[0]["reports"]] == [
            2012,
            2011,
            2010,
        ]

    def test_get_cp_report_list_country_user(self, country_user, _setup_cp_report_list):
        self.client.force_authenticate(user=country_user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["group"] == "Romania"
        assert [report["year"] for report in response.data[0]["reports"]] == [
            2012,
            2011,
            2010,
        ]

    def test_get_cp_report_list_order(self, secretariat_user, _setup_cp_report_list):
        self.client.force_authenticate(user=secretariat_user)

        response = self.client.get(self.url, {"ordering": "desc"})
        assert response.status_code == 200
        assert len(response.data) == 3
        assert response.data[0]["group"] == "Romania"
        assert [report["year"] for report in response.data[0]["reports"]] == [
            2012,
            2011,
            2010,
        ]


class TestCPReportStatusUpdate(BaseTest):
    def test_without_login(self, status_update_url):
        self.client.force_authenticate(user=None)
        response = self.client.put(status_update_url, {"status": "draft"})
        assert response.status_code == 403

    def test_as_viewer(self, viewer_user, status_update_url):
        self.client.force_authenticate(user=viewer_user)
        response = self.client.put(status_update_url, {"status": "draft"})
        assert response.status_code == 403

    def test_without_permission_agency(self, agency_user, status_update_url):
        self.client.force_authenticate(user=agency_user)
        response = self.client.put(status_update_url, {"status": "draft"})
        assert response.status_code == 403

    def test_without_permission_stakeholder(self, stakeholder_user, status_update_url):
        self.client.force_authenticate(user=stakeholder_user)
        response = self.client.put(status_update_url, {"status": "draft"})
        assert response.status_code == 403

    def test_invalid_status(self, secretariat_user, status_update_url):
        self.client.force_authenticate(user=secretariat_user)
        response = self.client.put(status_update_url, {"status": "invalid"})
        assert response.status_code == 400
        assert "status" in response.data
        assert "Invalid value" in response.data["status"]

    def test_update_status(self, second_user, cp_report_2019, status_update_url):
        self.client.force_authenticate(user=second_user)
        response = self.client.put(status_update_url, {"status": "final"})
        assert response.status_code == 200
        assert response.data["status"] == "final"
        assert response.data["id"] == cp_report_2019.id


@pytest.fixture(name="_setup_section_a_c")
def setup_section_a_c(substance, blend, usage):
    usage2 = UsageFactory.create(name="usage2")
    groupB = GroupFactory.create(name="group B", annex="B")
    substance2 = SubstanceFactory.create(name="substance2", group=groupB)

    cp_record_data = {
        "imports": 12.3,
        "exports": 13.3,
        "export_quotas": 14.3,
        "production": 20.3,
        "manufacturing_blends": 15.3,
        "banned_date": "2019-11-21",
        "remarks": "Se vede din departare",
        "record_usages": [
            {"usage_id": usage.id, "quantity": 12.1},
            {"usage_id": usage2.id, "quantity": 12.1},
        ],
    }
    section_a = [
        {
            "substance_id": substance.id,
            "blend_id": None,
            "row_id": f"substance_{substance.id}",
            **cp_record_data,
        },
        {
            "substance_id": substance2.id,
            "blend_id": None,
            "row_id": f"substance_{substance2.id}",
            **cp_record_data,
        },
    ]
    section_c = [
        {
            "substance_id": substance.id,
            "blend_id": None,
            "row_id": f"substance_{substance.id}",
            "current_year_price": 25.5,
            "remarks": "Mama mea cand mi-a dat viata",
        },
        {
            "blend_id": blend.id,
            "substance_id": None,
            "row_id": f"blend_{blend.id}",
            "previous_year_price": 12.4,
            "current_year_price": 25.5,
            "remarks": "Smecheri au luat vacanta",
        },
    ]
    return cp_record_data, section_a, section_c


@pytest.fixture(name="_setup_new_cp_report_create")
def setup_new_cp_report_create(blend, country_ro, _setup_section_a_c):
    cp_record_data, section_a, section_c = _setup_section_a_c

    report_data = {
        "country_id": country_ro.id,
        "name": "Romania2019",
        "year": 2019,
        "status": CPReport.CPReportStatus.DRAFT,
        "section_a": section_a,
        "section_b": [
            {
                "blend_id": blend.id,
                "row_id": f"blend_{blend.id}",
                **cp_record_data,
            }
        ],
        "section_c": section_c,
        "section_d": [
            {
                "all_uses": "80.570",
                "row_id": "generation_1",
                "destruction": "80.570",
            }
        ],
        "section_e": [
            {
                "facility": "Facility",
                "row_id": "emission_1",
                "total": 12.4,
                "all_uses": 15.4,
                "generated_emissions": 31.887,
                "remarks": "Dumnezeul le-a dat un semn",
            },
        ],
        "section_f": {
            "remarks": "S-a nascut un fenomen",
        },
    }

    return report_data


@pytest.fixture(name="_setup_old_cp_report_create")
def setup_old_cp_report_create(country_ro, _setup_section_a_c, adm_rows, adm_columns):
    _, section_a, section_c = _setup_section_a_c
    b_row, c_row, d_row = adm_rows
    b_column, c_column = adm_columns

    report_data = {
        "country_id": country_ro.id,
        "name": "Romania2000",
        "status": CPReport.CPReportStatus.FINAL,
        "year": 2000,
        "section_a": section_a,
        "adm_b": [
            {
                "row_id": b_row.id,
                "column_id": b_column.id,
                "value_text": "Am fost locu-ntai la scoala",
            }
        ],
        "section_c": section_c,
        "adm_c": [
            {
                "row_id": c_row.id,
                "column_id": c_column.id,
                "value_text": "Scoala vietii, scoala vietii",
            }
        ],
        "adm_d": [
            {
                "row_id": d_row.id,
                "value_choice_id": d_row.choices.first().id,
                "value_text": "La orele de vrajeala",
            }
        ],
    }

    return report_data


class TestCPReportCreate(BaseTest):
    url = reverse("country-programme-reports")
    records_url = reverse("country-programme-record-list")

    SECTION_A = "section_a"
    SECTION_B = "section_b"
    COMMENT_COUNTRY = "comment_country"
    COMMENT_SECRETARIAT = "comment_secretariat"

    def test_without_login(self, _setup_new_cp_report_create):
        self.client.force_authenticate(user=None)
        response = self.client.post(
            self.url, _setup_new_cp_report_create, format="json"
        )
        assert response.status_code == 403

    def test_as_viewer(self, viewer_user, _setup_new_cp_report_create):
        self.client.force_authenticate(user=viewer_user)
        response = self.client.post(
            self.url, _setup_new_cp_report_create, format="json"
        )
        assert response.status_code == 403

    def test_without_permission_agency(self, agency_user, _setup_new_cp_report_create):
        self.client.force_authenticate(user=agency_user)
        response = self.client.post(
            self.url, _setup_new_cp_report_create, format="json"
        )
        assert response.status_code == 403

    def test_without_permission_stakeholder(
        self, stakeholder_user, _setup_new_cp_report_create
    ):
        self.client.force_authenticate(user=stakeholder_user)
        response = self.client.post(
            self.url, _setup_new_cp_report_create, format="json"
        )
        assert response.status_code == 403

    def test_without_permission_country_user(
        self, another_country_user, _setup_new_cp_report_create
    ):
        self.client.force_authenticate(user=another_country_user)
        response = self.client.post(
            self.url, _setup_new_cp_report_create, format="json"
        )
        assert response.status_code == 403

    def test_create_new_cp_report(
        self,
        secretariat_user,
        _setup_new_cp_report_create,
        mock_send_mail_report_create,
    ):
        self.client.force_authenticate(user=secretariat_user)
        response = self.client.post(
            self.url, _setup_new_cp_report_create, format="json"
        )
        assert response.status_code == 201
        assert response.data["name"] == "Romania2019"
        assert response.data["year"] == 2019
        assert response.data["country"] == "Romania"
        assert response.data["status"] == CPReport.CPReportStatus.DRAFT
        assert response.data["version"] == 1
        assert response.data["created_by"] == secretariat_user.username
        assert response.data["version_created_by"] == secretariat_user.username
        assert response.data["comment"] == "S-a nascut un fenomen"
        cp_report_id = response.data["id"]

        # check cp records
        records = CPRecord.objects.filter(country_programme_report_id=cp_report_id)
        assert records.count() == 3
        assert records.filter(section="A", substance_id__isnull=False).count() == 2
        assert records.filter(section="B", blend_id__isnull=False).count() == 1
        for record in records:
            assert float(record.imports) == 12.3
            assert record.banned_date.strftime("%Y-%m-%d") == "2019-11-21"
            assert record.record_usages.count() == 2
            for usage in record.record_usages.all():
                assert float(usage.quantity) == 12.1

        # check cp prices
        prices = CPPrices.objects.filter(country_programme_report_id=cp_report_id)
        assert prices.count() == 2
        assert prices.filter(substance_id__isnull=False).count() == 1
        assert prices.filter(blend_id__isnull=False).count() == 1
        for price in prices:
            assert float(price.current_year_price) == 25.5

        # check cp generation
        generation = CPGeneration.objects.filter(
            country_programme_report_id=cp_report_id
        )
        assert generation.count() == 1
        assert float(generation[0].all_uses) == 80.570

        # check cp emissions
        emissions = CPEmission.objects.filter(country_programme_report_id=cp_report_id)
        assert emissions.count() == 1
        assert float(emissions[0].total) == 12.4

        # check email not sent (DRAFT)
        mock_send_mail_report_create.assert_not_called()

    def test_create_new_cp_report_with_comments(
        self, secretariat_user, _setup_new_cp_report_create
    ):
        data = _setup_new_cp_report_create
        added_comment = "Test create country comment"
        data["comments_section_a"] = {
            "mlfs": None,
            "country": added_comment,
        }
        self.client.force_authenticate(user=secretariat_user)
        response = self.client.post(
            self.url, _setup_new_cp_report_create, format="json"
        )
        assert response.status_code == 201
        report_id = response.data["id"]

        response = self.client.get(self.records_url, {"cp_report_id": report_id})
        assert response.status_code == 200
        assert len(response.data["cp_report"]["comments"]) == 1
        assert response.data["cp_report"]["comments"][0]["comment"] == added_comment
        assert (
            response.data["cp_report"]["comments"][0]["comment_type"]
            == "comment_country"
        )

    def test_create_old_cp_report(
        self,
        secretariat_user,
        _setup_old_cp_report_create,
        mock_send_mail_report_create,
    ):
        self.client.force_authenticate(user=secretariat_user)

        response = self.client.post(
            self.url, _setup_old_cp_report_create, format="json"
        )
        assert response.status_code == 201
        assert response.data["name"] == "Romania2000"
        assert response.data["year"] == 2000
        assert response.data["country"] == "Romania"
        assert response.data["status"] == CPReport.CPReportStatus.FINAL
        assert response.data["created_by"] == secretariat_user.username
        cp_report_id = response.data["id"]

        # check cp records
        records = CPRecord.objects.filter(country_programme_report_id=cp_report_id)
        assert records.count() == 2

        # check cp prices
        prices = CPPrices.objects.filter(country_programme_report_id=cp_report_id)
        assert prices.count() == 2

        # check adm records
        adm_records = AdmRecord.objects.filter(country_programme_report_id=cp_report_id)
        assert adm_records.count() == 3
        for section in ["B", "C", "D"]:
            assert adm_records.filter(section=section).count() == 1

        # check question with column
        b_record = adm_records.get(section="B")
        assert b_record.column.display_name == "adm_column_b"
        assert b_record.row.text == "adm_row_b"
        assert b_record.value_text == "Am fost locu-ntai la scoala"

        # check question without choice
        d_record = adm_records.get(section="D")
        assert d_record.column is None
        assert d_record.value_choice_id == d_record.row.choices.first().id
        assert d_record.value_text == "La orele de vrajeala"

        # check email sent (FINAL)
        mock_send_mail_report_create.assert_called_once()

    def test_existing_cp_report(
        self, secretariat_user, _setup_new_cp_report_create, cp_report_2019
    ):
        self.client.force_authenticate(user=secretariat_user)
        data = _setup_new_cp_report_create
        data["country_id"] = cp_report_2019.country_id
        data["year"] = cp_report_2019.year
        response = self.client.post(
            self.url, _setup_new_cp_report_create, format="json"
        )
        assert response.status_code == 400
        assert "already exists" in response.data["general_error"]

    def test_invalid_country_id(self, secretariat_user, _setup_new_cp_report_create):
        self.client.force_authenticate(user=secretariat_user)
        data = _setup_new_cp_report_create
        data["country_id"] = 999
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400
        assert "country_id" in response.data

    def test_invalid_usage_id(
        self, secretariat_user, _setup_new_cp_report_create, substance
    ):
        self.client.force_authenticate(user=secretariat_user)
        data = _setup_new_cp_report_create
        data["section_a"][0]["record_usages"][0]["usage_id"] = 999
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400
        subst_error = response.data["section_a"][f"substance_{substance.id}"]
        assert "record_usages" in subst_error
        assert "usage_999" in subst_error["record_usages"]
        assert "usage_id" in subst_error["record_usages"]["usage_999"]

    def test_invalid_usage_quantity(
        self, secretariat_user, _setup_new_cp_report_create, substance, usage
    ):
        self.client.force_authenticate(user=secretariat_user)
        data = _setup_new_cp_report_create
        data["section_a"][0]["record_usages"][0]["quantity"] = "abc"
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400
        subst_error = response.data["section_a"][f"substance_{substance.id}"]
        assert "record_usages" in subst_error
        assert f"usage_{usage.id}" in subst_error["record_usages"]
        assert "quantity" in subst_error["record_usages"][f"usage_{usage.id}"]

    def test_invalid_substance_id(self, secretariat_user, _setup_new_cp_report_create):
        self.client.force_authenticate(user=secretariat_user)
        data = _setup_new_cp_report_create
        data["section_a"][0]["substance_id"] = 999
        data["section_a"][0]["row_id"] = "substance_999"
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400
        assert "substance_999" in response.data["section_a"]
        assert "substance_id" in response.data["section_a"]["substance_999"]

    def test_invalid_substance_and_blend(
        self, secretariat_user, _setup_new_cp_report_create, blend
    ):
        self.client.force_authenticate(user=secretariat_user)
        data = _setup_new_cp_report_create
        data["section_a"][0]["blend_id"] = blend.id
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400
        assert "general_error" in response.data["section_a"]
        assert "non_field_errors" in response.data["section_a"]["general_error"]

    def test_invalid_current_year_price(
        self, secretariat_user, _setup_new_cp_report_create, substance
    ):
        self.client.force_authenticate(user=secretariat_user)
        data = _setup_new_cp_report_create
        data["section_c"][0]["current_year_price"] = "abc"
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400
        row_id = f"substance_{substance.id}"
        assert row_id in response.data["section_c"]
        assert "current_year_price" in response.data["section_c"][row_id]

    def test_invalid_adm_row_id(self, secretariat_user, _setup_old_cp_report_create):
        self.client.force_authenticate(user=secretariat_user)
        data = _setup_old_cp_report_create
        data["adm_b"][0]["row_id"] = 999
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400
        assert "Invalid pk " in response.data["adm_b"]["999"]

    def test_invalid_adm_column_id(self, secretariat_user, _setup_old_cp_report_create):
        self.client.force_authenticate(user=secretariat_user)
        data = _setup_old_cp_report_create
        data["adm_b"][0]["column_id"] = 999
        row_id = str(data["adm_b"][0]["row_id"])
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400
        assert "column_id" in response.data["adm_b"][row_id]["values"]["999"]

    def test_invalid_adm_choice_id(self, secretariat_user, _setup_old_cp_report_create):
        self.client.force_authenticate(user=secretariat_user)
        data = _setup_old_cp_report_create
        data["adm_d"][0]["value_choice_id"] = 999
        row_id = str(data["adm_d"][0]["row_id"])
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400
        assert "value_choice_id" in response.data["adm_d"][row_id]

    def test_invalid_adm_record_value(
        self, secretariat_user, _setup_old_cp_report_create
    ):
        self.client.force_authenticate(user=secretariat_user)
        data = _setup_old_cp_report_create
        data["adm_b"][0]["column_id"] = None
        data["adm_b"][0]["value_choice_id"] = None
        data["adm_b"][0]["value_text"] = None
        row_id = str(data["adm_b"][0]["row_id"])

        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400
        assert "must be specified" in response.data["adm_b"][row_id]

    def test_invalid_adm_record(self, secretariat_user, _setup_old_cp_report_create):
        self.client.force_authenticate(user=secretariat_user)
        data = _setup_old_cp_report_create
        data["adm_b"][0].pop("row_id")

        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400
        assert "row_id" in response.data["adm_b"]["general_error"]


class TestCPReportUpdate(BaseTest):
    SECTION_A = "section_a"
    SECTION_B = "section_b"
    COMMENT_COUNTRY = "comment_country"
    COMMENT_SECRETARIAT = "comment_secretariat"

    def test_without_login(self, cp_report_2019):
        self.url = reverse("country-programme-reports") + f"{cp_report_2019.id}/"
        self.client.force_authenticate(user=None)
        response = self.client.put(
            self.url, {"id": cp_report_2019.id, "name": "Romania2019"}, format="json"
        )
        assert response.status_code == 403

    def test_as_viewer(self, viewer_user, cp_report_2019):
        self.url = reverse("country-programme-reports") + f"{cp_report_2019.id}/"
        self.client.force_authenticate(user=viewer_user)
        response = self.client.put(
            self.url, {"id": cp_report_2019.id, "name": "Romania2019"}, format="json"
        )
        assert response.status_code == 403

    def test_without_permission_agency(self, agency_user, cp_report_2019):
        self.url = reverse("country-programme-reports") + f"{cp_report_2019.id}/"
        self.client.force_authenticate(user=agency_user)
        response = self.client.put(
            self.url, {"id": cp_report_2019.id, "name": "Romania2019"}, format="json"
        )
        assert response.status_code == 403

    def test_without_permission_stakeholder(self, stakeholder_user, cp_report_2019):
        self.url = reverse("country-programme-reports") + f"{cp_report_2019.id}/"
        self.client.force_authenticate(user=stakeholder_user)
        response = self.client.put(
            self.url, {"id": cp_report_2019.id, "name": "Romania2019"}, format="json"
        )
        assert response.status_code == 403

    def test_update_cp_report_draft(
        self,
        second_user,
        _setup_new_cp_report_create,
        cp_report_2019,
        secretariat_user,
        mock_send_mail_report_update,
    ):
        self.url = reverse("country-programme-reports") + f"{cp_report_2019.id}/"

        # set status draft
        cp_report_2019.status = CPReport.CPReportStatus.DRAFT
        cp_report_2019.save()

        self.client.force_authenticate(user=second_user)
        data = _setup_new_cp_report_create
        data["name"] = "Alo baza baza"
        data["section_f"]["remarks"] = "Alo Delta Force"
        response = self.client.put(self.url, data, format="json")
        assert response.status_code == 200
        assert response.data["name"] == "Alo baza baza"
        assert response.data["year"] == 2019
        assert response.data["country"] == "Romania"
        assert response.data["status"] == CPReport.CPReportStatus.DRAFT
        assert response.data["version"] == 1
        assert response.data["comment"] == "Alo Delta Force"
        assert response.data["created_by"] == secretariat_user.username
        cp_report_id = response.data["id"]

        # check cp records
        records = CPRecord.objects.filter(country_programme_report_id=cp_report_id)
        assert records.count() == 3
        assert records.filter(section="A", substance_id__isnull=False).count() == 2
        assert records.filter(section="B", blend_id__isnull=False).count() == 1

        # check cp prices
        prices = CPPrices.objects.filter(country_programme_report_id=cp_report_id)
        assert prices.count() == 2
        assert prices.filter(substance_id__isnull=False).count() == 1
        assert prices.filter(blend_id__isnull=False).count() == 1

        # check cp generation
        generation = CPGeneration.objects.filter(
            country_programme_report_id=cp_report_id
        )
        assert generation.count() == 1

        # check cp emissions
        emissions = CPEmission.objects.filter(country_programme_report_id=cp_report_id)
        assert emissions.count() == 1

        # check no archive is created
        assert CPReportArchive.objects.count() == 0

        # check email not sent (DRAFT)
        mock_send_mail_report_update.assert_not_called()

    def test_update_cp_report_draft_country_user(
        self,
        country_user,
        _setup_new_cp_report_create,
        cp_report_2019,
    ):
        self.url = reverse("country-programme-reports") + f"{cp_report_2019.id}/"

        # set status draft
        cp_report_2019.status = CPReport.CPReportStatus.DRAFT
        cp_report_2019.save()

        self.client.force_authenticate(user=country_user)
        data = _setup_new_cp_report_create
        data["name"] = "Alo baza baza"
        data["section_f"]["remarks"] = "Alo Delta Force"
        response = self.client.put(self.url, data, format="json")
        assert response.status_code == 200

    def test_update_cp_report_comments_draft_country_user(
        self,
        country_user,
        _setup_new_cp_report_create,
        cp_report_2019,
    ):
        self.url = reverse("country-programme-reports") + f"{cp_report_2019.id}/"

        # set status draft
        cp_report_2019.status = CPReport.CPReportStatus.DRAFT
        CPReportCommentFactory.create(
            country_programme_report=cp_report_2019,
            section=self.SECTION_A,
            comment_type=self.COMMENT_COUNTRY,
            comment="Test initial comment",
        )
        cp_report_2019.save()

        self.client.force_authenticate(user=country_user)
        data = _setup_new_cp_report_create
        updated_comment = "Test update country comment"
        data["comments_section_a"] = {
            "mlfs": None,
            "country": updated_comment,
        }
        response = self.client.put(self.url, data, format="json")
        assert response.status_code == 200

        comment = CPComment.objects.first()
        assert comment.comment == updated_comment

    def test_update_cp_report_final(
        self,
        second_user,
        _setup_new_cp_report_create,
        cp_report_2019,
        secretariat_user,
        mock_send_mail_report_update,
    ):
        self.url = reverse("country-programme-reports") + f"{cp_report_2019.id}/"
        self.client.force_authenticate(user=second_user)

        # change status to final
        cp_report_2019.status = CPReport.CPReportStatus.FINAL
        cp_report_2019.save()
        # update cp report (keep final status => new version)
        data = _setup_new_cp_report_create
        data["status"] = CPReport.CPReportStatus.FINAL
        data["name"] = "O valoare mare, o mare valoare"
        data["section_f"]["remarks"] = "Sunt din cap până în picioare"

        response = self.client.put(self.url, data, format="json")
        assert response.status_code == 200
        assert response.data["name"] == "O valoare mare, o mare valoare"
        assert response.data["status"] == CPReport.CPReportStatus.FINAL
        assert response.data["version"] == 2
        assert response.data["created_by"] == secretariat_user.username
        assert response.data["version_created_by"] == second_user.username

        new_id = response.data["id"]
        self.url = reverse("country-programme-reports") + f"{new_id}/"
        self.client.force_authenticate(user=secretariat_user)

        # update again (update status too => new version)
        data["status"] = CPReport.CPReportStatus.DRAFT
        data["name"] = "Sunt destept si calculat"
        data["section_f"]["remarks"] = "La dusmani le-am pus capac."
        response = self.client.put(self.url, data, format="json")
        assert response.status_code == 200
        assert response.data["name"] == "Sunt destept si calculat"
        assert response.data["status"] == CPReport.CPReportStatus.DRAFT
        assert response.data["version"] == 3
        assert response.data["created_by"] == secretariat_user.username
        assert response.data["version_created_by"] == secretariat_user.username

        new_id = response.data["id"]
        self.url = reverse("country-programme-reports") + f"{new_id}/"

        # update as draft (no new version)
        data["name"] = "Am relatii peste tot"
        data["section_f"]["remarks"] = "Sunt sef de clan mafiot"
        response = self.client.put(self.url, data, format="json")
        assert response.status_code == 200
        assert response.data["name"] == "Am relatii peste tot"
        assert response.data["status"] == CPReport.CPReportStatus.DRAFT
        assert response.data["version"] == 3
        assert response.data["created_by"] == secretariat_user.username
        assert response.data["version_created_by"] == secretariat_user.username

        new_id = response.data["id"]
        self.url = reverse("country-programme-reports") + f"{new_id}/"

        # update to final (no new version)
        data["name"] = "De la Frankfurt la Paris"
        data["section_f"]["remarks"] = "Eu multi fraieri am invins"
        data["status"] = CPReport.CPReportStatus.FINAL
        response = self.client.put(self.url, data, format="json")
        assert response.status_code == 200
        assert response.data["name"] == "De la Frankfurt la Paris"
        assert response.data["status"] == CPReport.CPReportStatus.FINAL
        assert response.data["version"] == 3
        assert response.data["created_by"] == secretariat_user.username

        new_id = response.data["id"]
        self.url = reverse("country-programme-reports") + f"{new_id}/"

        # update again as final (no new version)
        data["name"] = "Nimeni nu ma poate egala"
        data["section_f"]["remarks"] = "Ca tot ce fac eu fac cu cap"
        response = self.client.put(self.url, data, format="json")
        assert response.status_code == 200
        assert response.data["name"] == "Nimeni nu ma poate egala"
        assert response.data["status"] == CPReport.CPReportStatus.FINAL
        assert response.data["version"] == 4
        assert response.data["created_by"] == secretariat_user.username
        assert response.data["version_created_by"] == secretariat_user.username

        # check report archive
        assert CPReportArchive.objects.count() == 3

        # check ther are not arhive for draft updates
        for name in ["Sunt destept si calculat", "Am relatii peste tot"]:
            assert not CPReportArchive.objects.filter(name=name).exists()

        # check first archive
        ar = (
            CPReportArchive.objects.filter(name=cp_report_2019.name)
            .select_related("created_by")
            .first()
        )
        assert ar is not None
        assert ar.comment == cp_report_2019.comment
        assert ar.version == 1
        assert ar.created_by.username == secretariat_user.username

        # check second archive
        ar = (
            CPReportArchive.objects.filter(name="O valoare mare, o mare valoare")
            .select_related("created_by", "version_created_by")
            .first()
        )
        assert ar is not None
        assert ar.comment == "Sunt din cap până în picioare"
        assert ar.version == 2
        assert ar.created_by.username == secretariat_user.username
        assert ar.version_created_by.username == second_user.username
        assert ar.created_at is not None

        # check record usage archive
        records = CPRecordArchive.objects.filter(country_programme_report_id=ar.id)
        assert records.count() == 3
        assert records.filter(section="A", substance_id__isnull=False).count() == 2
        assert records.filter(section="B", blend_id__isnull=False).count() == 1
        for record in records:
            assert float(record.imports) == 12.3
            assert record.record_usages.count() == 2

        # check cp prices
        prices = CPPricesArchive.objects.filter(country_programme_report_id=ar.id)
        assert prices.count() == 2
        for price in prices:
            assert float(price.current_year_price) == 25.5

        # check cp generation
        assert (
            CPGenerationArchive.objects.filter(
                country_programme_report_id=ar.id
            ).count()
            == 1
        )

        # check cp emissions
        assert (
            CPEmissionArchive.objects.filter(country_programme_report_id=ar.id).count()
            == 1
        )

        # check 3 emails sent (3 FINAL reports)
        mock_send_mail_report_update.assert_called()
        assert mock_send_mail_report_update.call_count == 3

    def test_finalize_cp_report_country_user(
        self,
        country_user,
        _setup_new_cp_report_create,
        cp_report_2019,
    ):
        self.url = reverse("country-programme-reports") + f"{cp_report_2019.id}/"
        self.client.force_authenticate(user=country_user)

        # change status to final
        cp_report_2019.status = CPReport.CPReportStatus.FINAL
        cp_report_2019.save()
        # update cp report (keep final status => new version)
        data = _setup_new_cp_report_create
        data["status"] = CPReport.CPReportStatus.FINAL

        response = self.client.put(self.url, data, format="json")
        assert response.status_code == 403

    def test_finalize_cp_report_country_submitter(
        self,
        country_submitter,
        _setup_new_cp_report_create,
        cp_report_2019,
    ):
        self.url = reverse("country-programme-reports") + f"{cp_report_2019.id}/"
        self.client.force_authenticate(user=country_submitter)

        # change status to final
        cp_report_2019.status = CPReport.CPReportStatus.FINAL
        cp_report_2019.save()
        # update cp report (keep final status => new version)
        data = _setup_new_cp_report_create
        data["status"] = CPReport.CPReportStatus.FINAL

        response = self.client.put(self.url, data, format="json")
        assert response.status_code == 200

    def test_update_cp_report_old(
        self,
        secretariat_user,
        _setup_old_cp_report_create,
        cp_report_2005,
        substance,
        mock_send_mail_report_update,
    ):
        self.url = reverse("country-programme-reports") + f"{cp_report_2005.id}/"
        self.client.force_authenticate(user=secretariat_user)

        data = _setup_old_cp_report_create
        data["year"] = cp_report_2005.year
        data["name"] = "Komorebi"

        response = self.client.put(self.url, data, format="json")
        assert response.status_code == 200
        assert response.data["name"] == "Komorebi"
        assert response.data["version"] == 2
        assert CPReportArchive.objects.count() == 1

        new_id = response.data["id"]
        self.url = reverse("country-programme-reports") + f"{new_id}/"

        # update again
        data = _setup_old_cp_report_create
        data["year"] = cp_report_2005.year
        data["section_a"][0]["record_usages"][0]["quantity"] = 42.0
        data["section_c"][0]["remarks"] = "Sunlight leaking through trees"
        data["adm_b"][0]["value_text"] = "Lumina care se filtrează printre copaci"

        response = self.client.put(self.url, data, format="json")
        assert response.status_code == 200
        assert response.data["version"] == 3
        assert CPReportArchive.objects.count() == 2

        new_cp = CPReport.objects.get(pk=response.data["id"])

        # Check if the usage record has updated
        cp_record = CPRecord.objects.get(
            substance=substance,
            country_programme_report=new_cp,
        )
        usage_record = CPUsage.objects.get(
            usage__id=data["section_a"][0]["record_usages"][0]["usage_id"],
            country_programme_record=cp_record,
        )
        assert usage_record.quantity == 42.0

        # Check if the cp prices have updated
        cp_price_record = CPPrices.objects.get(
            substance=substance, country_programme_report=new_cp
        )
        assert cp_price_record.remarks == "Sunlight leaking through trees"

        # Check if the adm record has updated
        adm_record = AdmRecord.objects.get(
            row=data["adm_b"][0]["row_id"],
            column=data["adm_b"][0]["column_id"],
            section="B",
            country_programme_report=new_cp,
        )
        assert adm_record.value_text == "Lumina care se filtrează printre copaci"

        old_cp = CPReportArchive.objects.get(version=2)

        # Check if the usage record is archived
        cp_record = CPRecordArchive.objects.get(
            substance=substance,
            country_programme_report=old_cp,
        )
        usage_record = CPUsageArchive.objects.get(
            usage__id=data["section_a"][0]["record_usages"][0]["usage_id"],
            country_programme_record=cp_record,
        )
        assert usage_record.quantity == Decimal("12.1")

        # Check if the cp prices are archived
        cp_price_record = CPPricesArchive.objects.get(
            substance=substance, country_programme_report=old_cp
        )
        assert cp_price_record.remarks == "Mama mea cand mi-a dat viata"

        # Check if the adm record is archived
        adm_record = AdmRecordArchive.objects.get(
            row=data["adm_b"][0]["row_id"],
            column=data["adm_b"][0]["column_id"],
            section="B",
            country_programme_report=old_cp,
        )
        assert adm_record.value_text == "Am fost locu-ntai la scoala"

        # check 2 emails sent (2 FINAL reports)
        mock_send_mail_report_update.assert_called()
        assert mock_send_mail_report_update.call_count == 2

    def test_update_cp_report_invalid_country(
        self, secretariat_user, _setup_new_cp_report_create, cp_report_2019
    ):
        self.url = reverse("country-programme-reports") + f"{cp_report_2019.id}/"
        self.client.force_authenticate(user=secretariat_user)
        data = _setup_new_cp_report_create
        data["country_id"] = 999
        response = self.client.put(self.url, data, format="json")
        assert response.status_code == 400
        assert "country_id" in response.data

        # check no archive is created
        assert CPReportArchive.objects.count() == 0

    def test_update_cp_report_invalid_year(
        self, secretariat_user, _setup_new_cp_report_create, cp_report_2019
    ):
        self.url = reverse("country-programme-reports") + f"{cp_report_2019.id}/"
        self.client.force_authenticate(user=secretariat_user)
        data = _setup_new_cp_report_create
        data["year"] = _setup_new_cp_report_create["year"] - 1
        response = self.client.put(self.url, data, format="json")
        assert response.status_code == 400

        # check no archive is created
        assert CPReportArchive.objects.count() == 0

    def test_update_cp_report_invalid_cp_id(
        self, secretariat_user, _setup_new_cp_report_create
    ):
        self.url = reverse("country-programme-reports") + "999/"
        self.client.force_authenticate(user=secretariat_user)
        data = _setup_new_cp_report_create
        response = self.client.put(self.url, data, format="json")
        assert response.status_code == 404

        # check no archive is created
        assert CPReportArchive.objects.count() == 0

    def test_update_cp_report_invalid_usage_id(
        self, secretariat_user, _setup_new_cp_report_create, cp_report_2019, substance
    ):
        self.url = reverse("country-programme-reports") + f"{cp_report_2019.id}/"
        self.client.force_authenticate(user=secretariat_user)
        data = _setup_new_cp_report_create
        data["section_a"][0]["record_usages"][0]["usage_id"] = 999
        response = self.client.put(self.url, data, format="json")
        assert response.status_code == 400
        subst_error = response.data["section_a"][f"substance_{substance.id}"]
        assert "record_usages" in subst_error
        assert "usage_999" in subst_error["record_usages"]
        assert "usage_id" in subst_error["record_usages"]["usage_999"]

        # check no archive is created
        assert CPReportArchive.objects.count() == 0


@pytest.fixture(name="_delete_url")
def delete_url(cp_report_2019):
    return reverse("country-programme-reports") + f"{cp_report_2019.id}/"


class TestCPReportDelete(BaseTest):
    def test_without_login(self, _delete_url):
        self.client.force_authenticate(user=None)
        response = self.client.delete(_delete_url)
        assert response.status_code == 403

    def test_as_viewer(self, viewer_user, _delete_url):
        self.client.force_authenticate(user=viewer_user)
        response = self.client.delete(_delete_url)
        assert response.status_code == 403

    def test_without_permission_agency(self, agency_user, _delete_url):
        self.client.force_authenticate(user=agency_user)
        response = self.client.delete(_delete_url)
        assert response.status_code == 403

    def test_delete_first_version(self, secretariat_user, cp_report_2019, _delete_url):
        self.client.force_authenticate(user=secretariat_user)

        cp_report_2019.status = CPReport.CPReportStatus.DRAFT
        cp_report_2019.save()

        response = self.client.delete(_delete_url)
        assert response.status_code == 400

    def test_delete_final_version(self, secretariat_user, cp_report_2019, _delete_url):
        self.client.force_authenticate(user=secretariat_user)

        cp_report_2019.status = CPReport.CPReportStatus.FINAL
        cp_report_2019.save()

        response = self.client.delete(_delete_url)
        assert response.status_code == 400

    def test_delete_cp_report_draft(
        self, cp_report_2019, secretariat_user, _delete_url, _setup_new_cp_report_create
    ):
        self.client.force_authenticate(user=secretariat_user)
        self.url = _delete_url

        # set status final
        cp_report_2019.status = CPReport.CPReportStatus.FINAL
        cp_report_2019.save()

        # create second version by updating the report
        data = _setup_new_cp_report_create
        data["status"] = CPReport.CPReportStatus.FINAL
        data["section_f"]["remarks"] = "N-am interes sa te mint"
        response = self.client.put(self.url, data, format="json")
        assert response.status_code == 200
        new_report_id = response.data["id"]

        # create version 3 (this will be deleted)
        data["status"] = CPReport.CPReportStatus.DRAFT
        data["section_a"][0]["imports"] = 1
        data["section_b"][0]["record_usages"] = data["section_b"][0]["record_usages"][
            :1
        ]
        data["section_c"][0]["current_year_price"] = 1
        data["section_d"][0]["all_uses"] = 1
        data["section_e"][0]["total"] = 1
        data["section_f"]["remarks"] = "Eu iti spun exact ce simt"
        self.url = reverse("country-programme-reports") + f"{new_report_id}/"
        response = self.client.put(self.url, data, format="json")
        assert response.status_code == 200
        new_report_id = response.data["id"]

        # delete draft
        self.url = reverse("country-programme-reports") + f"{new_report_id}/"
        response = self.client.delete(self.url)
        assert response.status_code == 200
        new_report_id = response.data["id"]

        # check the archive is deleted
        assert CPReportArchive.objects.count() == 1

        # check current report is the first version
        current_report = (
            CPReport.objects.filter(pk=new_report_id)
            .select_related("created_by", "version_created_by")
            .first()
        )
        assert current_report is not None
        assert current_report.comment == "N-am interes sa te mint"
        assert current_report.version == 2
        assert current_report.status == CPReport.CPReportStatus.FINAL
        assert current_report.created_by.username == secretariat_user.username
        assert current_report.version_created_by.username == secretariat_user.username
        assert current_report.created_at is not None

        # check record usage archive
        records = CPRecord.objects.all()
        assert records.count() == 3
        assert records.filter(section="A", substance_id__isnull=False).count() == 2
        assert records.filter(section="B", blend_id__isnull=False).count() == 1
        for record in records:
            assert record.country_programme_report_id == current_report.id
            assert float(record.imports) == 12.3
            assert record.record_usages.count() == 2

        # check cp prices
        prices = CPPrices.objects.all()
        assert prices.count() == 2
        for price in prices:
            assert price.country_programme_report_id == current_report.id
            assert float(price.current_year_price) == 25.5

        # check cp generation
        generations = CPGeneration.objects.all()
        assert generations.count() == 1
        for generation in generations:
            assert generation.country_programme_report_id == current_report.id
            assert str(generation.all_uses) == "80.5700000000"

        # check cp emissions
        emissions = CPEmission.objects.all()
        assert emissions.count() == 1
        for emission in emissions:
            assert emission.country_programme_report_id == current_report.id
            assert str(emission.total) == "12.4000000000"


@pytest.fixture(name="_setup_get_empty_form")
def setup_get_empty_form(usage, substance, blend):
    time_frame = TimeFrameFactory.create(
        min_year=2022,
        max_year=None,
    )
    create_data = {
        "usage": usage,
        "time_frame": time_frame,
        "section": "B",
    }
    time_frame = TimeFrameFactory.create(min_year=2000, max_year=None)
    CPReportFormatColumnFactory.create(**create_data)
    for sect in ["A", "C"]:
        create_data = {
            "substance": substance,
            "time_frame": time_frame,
            "section": sect,
            "sort_order": 1,
        }
        CPReportFormatRowFactory.create(**create_data)
    for sect in ["B", "C"]:
        create_data = {
            "blend": blend,
            "time_frame": time_frame,
            "section": sect,
            "sort_order": 2,
        }
        CPReportFormatRowFactory.create(**create_data)


class TestGetEmptyForm(BaseTest):
    url = reverse("empty-form")

    def test_without_cp_report_id(
        self, country_viewer_user, _setup_get_empty_form, _cp_report_format
    ):
        self.client.force_authenticate(user=country_viewer_user)
        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data["usage_columns"]["section_a"]) == 1
        assert len(response.data["usage_columns"]["section_b"]) == 2
        assert len(response.data["substance_rows"]["section_a"]) == 1
        assert len(response.data["substance_rows"]["section_b"]) == 1
        assert len(response.data["substance_rows"]["section_c"]) == 2

    def test_with_cp_report_id(
        self, secretariat_user, cp_report_2019, _setup_get_empty_form, _cp_report_format
    ):
        self.client.force_authenticate(user=secretariat_user)
        response = self.client.get(self.url, {"cp_report_id": cp_report_2019.id})
        assert response.status_code == 200
        assert len(response.data["usage_columns"]["section_a"]) == 1
        assert len(response.data["usage_columns"]["section_b"]) == 1
        assert len(response.data["substance_rows"]["section_a"]) == 1
        assert len(response.data["substance_rows"]["section_b"]) == 1
        assert len(response.data["substance_rows"]["section_c"]) == 2

    def test_with_country_and_year(
        self, secretariat_user, cp_report_2019, _setup_get_empty_form, _cp_report_format
    ):
        self.client.force_authenticate(user=secretariat_user)
        response = self.client.get(
            self.url, {"country_id": cp_report_2019.country_id, "year": 2019}
        )
        assert response.status_code == 200
        assert len(response.data["usage_columns"]["section_a"]) == 1
        assert len(response.data["usage_columns"]["section_b"]) == 1
        assert len(response.data["substance_rows"]["section_a"]) == 1
        assert len(response.data["substance_rows"]["section_b"]) == 1
        assert len(response.data["substance_rows"]["section_c"]) == 2

    def test_with_previous_records(
        self,
        secretariat_user,
        country_ro,
        _setup_get_empty_form,
        _cp_report_format,
        _setup_new_cp_report_create,
    ):
        self.client.force_authenticate(user=secretariat_user)
        response = self.client.post(
            reverse("country-programme-reports"),
            _setup_new_cp_report_create,
            format="json",
        )
        assert response.status_code == 201

        response = self.client.get(self.url, {"country_id": country_ro.id})
        assert response.status_code == 200
        assert len(response.data["usage_columns"]["section_a"]) == 1
        assert len(response.data["usage_columns"]["section_b"]) == 2
        assert len(response.data["substance_rows"]["section_a"]) == 1
        assert len(response.data["substance_rows"]["section_b"]) == 1
        assert len(response.data["substance_rows"]["section_c"]) == 2

        assert len(response.data["previous_substances"]["section_a"]) == 2
        assert len(response.data["previous_substances"]["section_b"]) == 1
        assert len(response.data["previous_substances"]["section_c"]) == 2
