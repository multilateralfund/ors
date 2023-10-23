import pytest
from django.urls import reverse

from core.api.tests.base import BaseTest
from core.api.tests.factories import (
    AdmChoiceFactory,
    AdmColumnFactory,
    AdmRecordFactory,
    AdmRowFactory,
    BlendFactory,
    CPGenerationFactory,
    CPPricesFactory,
    CPRaportFormatFactory,
    CountryFactory,
    CPRecordFactory,
    CPReportFactory,
    CPUsageFactory,
    GroupFactory,
    SubstanceFactory,
    TimeFrameFactory,
    UsageFactory,
)
from core.models import Country
from core.models.adm import AdmRecord
from core.models.country_programme import CPEmission, CPGeneration, CPPrices, CPRecord

pytestmark = pytest.mark.django_db
# pylint: disable=C8008, W0221


@pytest.fixture(name="_setup_cp_report_list")
def setup_cp_report_list():
    for country in ["Romania", "Bulgaria", "Hungary"]:
        country = CountryFactory.create(name=country)
        for i in range(3):
            year = 2010 + i
            CPReportFactory.create(
                country=country, name=country.name + str(year), year=year
            )

    return country


class TestCPReportList(BaseTest):
    url = reverse("country-programme-reports")

    def test_get_cp_report_list(self, user, _setup_cp_report_list):
        self.client.force_authenticate(user=user)

        # get cp reports list
        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 9
        assert response.data[0]["name"] == "Bulgaria2010"
        assert response.data[8]["name"] == "Romania2012"

    def test_get_cp_report_list_country_filter(self, user, _setup_cp_report_list):
        self.client.force_authenticate(user=user)
        country = _setup_cp_report_list
        # filter by country id (country = Hungary)
        response = self.client.get(self.url, {"country_id": country.id})
        assert response.status_code == 200
        assert len(response.data) == 3
        assert country.name in response.data[0]["name"]

    def test_get_cp_report_list_country_filter_multiple(
        self, user, _setup_cp_report_list
    ):
        self.client.force_authenticate(user=user)
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

    def test_get_cp_report_list_name_filter(self, user, _setup_cp_report_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"name": "man"})
        assert response.status_code == 200
        assert len(response.data) == 3
        assert response.data[0]["name"] == "Romania2010"

    def test_get_cp_report_list_year_filter(self, user, _setup_cp_report_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"year_max": 2011, "year_min": 2011})
        assert response.status_code == 200
        assert len(response.data) == 3
        assert response.data[0]["name"] == "Bulgaria2011"
        assert response.data[0]["year"] == 2011

    def test_get_cp_report_list_year_filter_range(self, user, _setup_cp_report_list):
        self.client.force_authenticate(user=user)

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


class TestCPReportListGroupByYear(BaseTest):
    url = reverse("country-programme-reports-by-year")

    def test_get_cp_report_list(self, user, _setup_cp_report_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 3
        assert response.data[0]["id"] == 2010
        assert [report["country"] for report in response.data[0]["reports"]] == [
            "Bulgaria",
            "Hungary",
            "Romania",
        ]

    def test_get_cp_report_list_order(self, user, _setup_cp_report_list):
        self.client.force_authenticate(user=user)

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

    def test_get_cp_report_list(self, user, _setup_cp_report_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data) == 3
        assert response.data[0]["group"] == "Bulgaria"
        assert [report["year"] for report in response.data[0]["reports"]] == [
            2012,
            2011,
            2010,
        ]

    def test_get_cp_report_list_order(self, user, _setup_cp_report_list):
        self.client.force_authenticate(user=user)

        response = self.client.get(self.url, {"ordering": "desc"})
        assert response.status_code == 200
        assert len(response.data) == 3
        assert response.data[0]["group"] == "Romania"
        assert [report["year"] for report in response.data[0]["reports"]] == [
            2012,
            2011,
            2010,
        ]


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
            "rowId": f"substance_{substance.id}",
            **cp_record_data,
        },
        {
            "substance_id": substance2.id,
            "rowId": f"substance_{substance2.id}",
            **cp_record_data,
        },
    ]
    section_c = [
        {
            "substance_id": substance.id,
            "rowId": f"substance_{substance.id}",
            "current_year_price": 25.5,
            "remarks": "Mama mea cand mi-a dat viata",
        },
        {
            "blend_id": blend.id,
            "rowId": f"blend_{blend.id}",
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
        "section_a": section_a,
        "section_b": [
            {
                "blend_id": blend.id,
                "rowId": f"blend_{blend.id}",
                **cp_record_data,
            }
        ],
        "section_c": section_c,
        "section_d": [
            {
                "all_uses": "80.570",
                "rowId": "generation_1",
                "destruction": "80.570",
            }
        ],
        "section_e": [
            {
                "facility": "Facility",
                "rowId": "emission_1",
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

    def test_without_login(self, _setup_new_cp_report_create):
        self.client.force_authenticate(user=None)
        response = self.client.post(
            self.url, _setup_new_cp_report_create, format="json"
        )
        assert response.status_code == 403

    def test_create_new_cp_report(self, user, _setup_new_cp_report_create):
        self.client.force_authenticate(user=user)
        response = self.client.post(
            self.url, _setup_new_cp_report_create, format="json"
        )
        assert response.status_code == 201
        assert response.data["name"] == "Romania2019"
        assert response.data["year"] == 2019
        assert response.data["country"] == "Romania"
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

    def test_create_old_cp_report(self, user, _setup_old_cp_report_create):
        self.client.force_authenticate(user=user)

        response = self.client.post(
            self.url, _setup_old_cp_report_create, format="json"
        )
        assert response.status_code == 201
        assert response.data["name"] == "Romania2000"
        assert response.data["year"] == 2000
        assert response.data["country"] == "Romania"
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

    def test_invalid_country_id(self, user, _setup_new_cp_report_create):
        self.client.force_authenticate(user=user)
        data = _setup_new_cp_report_create
        data["country_id"] = 999
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400
        assert "country_id" in response.data
        assert "general_error" in response.data["country_id"]

    def test_invalid_usage_id(self, user, _setup_new_cp_report_create, substance):
        self.client.force_authenticate(user=user)
        data = _setup_new_cp_report_create
        data["section_a"][0]["record_usages"][0]["usage_id"] = 999
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400
        subst_error = response.data["section_a"][f"substance_{substance.id}"]
        assert "record_usages" in subst_error
        assert "usage_999" in subst_error["record_usages"]
        assert "usage_id" in subst_error["record_usages"]["usage_999"]

    def test_invalid_usage_quantity(
        self, user, _setup_new_cp_report_create, substance, usage
    ):
        self.client.force_authenticate(user=user)
        data = _setup_new_cp_report_create
        data["section_a"][0]["record_usages"][0]["quantity"] = "abc"
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400
        subst_error = response.data["section_a"][f"substance_{substance.id}"]
        assert "record_usages" in subst_error
        assert f"usage_{usage.id}" in subst_error["record_usages"]
        assert "quantity" in subst_error["record_usages"][f"usage_{usage.id}"]

    def test_invalid_substance_id(self, user, _setup_new_cp_report_create):
        self.client.force_authenticate(user=user)
        data = _setup_new_cp_report_create
        data["section_a"][0]["substance_id"] = 999
        data["section_a"][0]["rowId"] = "substance_999"
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400
        assert "substance_999" in response.data["section_a"]
        assert "substance_id" in response.data["section_a"]["substance_999"]

    def test_invalid_substance_and_blend(
        self, user, _setup_new_cp_report_create, blend
    ):
        self.client.force_authenticate(user=user)
        data = _setup_new_cp_report_create
        data["section_a"][0]["blend_id"] = blend.id
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400
        assert "general_error" in response.data["section_a"]
        assert "non_field_errors" in response.data["section_a"]["general_error"]

    def test_invalid_current_year_price(
        self, user, _setup_new_cp_report_create, substance
    ):
        self.client.force_authenticate(user=user)
        data = _setup_new_cp_report_create
        data["section_c"][0]["current_year_price"] = "abc"
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400
        row_id = f"substance_{substance.id}"
        assert row_id in response.data["section_c"]
        assert "current_year_price" in response.data["section_c"][row_id]

    def test_invalid_adm_row_id(self, user, _setup_old_cp_report_create):
        self.client.force_authenticate(user=user)
        data = _setup_old_cp_report_create
        data["adm_b"][0]["row_id"] = 999
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400
        assert "row_id" in response.data["adm_b"][0]

    def test_invalid_adm_column_id(self, user, _setup_old_cp_report_create):
        self.client.force_authenticate(user=user)
        data = _setup_old_cp_report_create
        data["adm_b"][0]["column_id"] = 999
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400
        assert "column_id" in response.data["adm_b"][0]

    def test_invalid_adm_choice_id(self, user, _setup_old_cp_report_create):
        self.client.force_authenticate(user=user)
        data = _setup_old_cp_report_create
        data["adm_d"][0]["value_choice_id"] = 999
        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400
        assert "value_choice_id" in response.data["adm_d"][0]

    def test_invalid_adm_record(self, user, _setup_old_cp_report_create):
        self.client.force_authenticate(user=user)
        data = _setup_old_cp_report_create
        data["adm_b"][0].pop("column_id")

        response = self.client.post(self.url, data, format="json")
        assert response.status_code == 400
        assert "non_field_errors" in response.data["adm_b"][0]


@pytest.fixture(name="_setup_new_cp_report")
def setup_new_cp_report(cp_report_2019, blend, substance):
    # section A
    CPRecordFactory.create(
        country_programme_report=cp_report_2019, section="A", substance=substance
    )

    # section B
    cp_rec = CPRecordFactory.create(
        country_programme_report=cp_report_2019, section="B", blend=blend
    )
    # substance
    BlendFactory.create(
        name="blend2B",
        displayed_in_all=True,
    )
    # add 3 usages for one record
    for _ in range(3):
        CPUsageFactory.create(country_programme_record=cp_rec)

    # section C (prices)
    CPPricesFactory.create(country_programme_report=cp_report_2019, blend=blend)
    CPPricesFactory.create(country_programme_report=cp_report_2019, substance=substance)

    # section D (generation)
    CPGenerationFactory.create(country_programme_report=cp_report_2019)

    # section E (emissions)
    for _ in range(2):
        CPEmission.objects.create(country_programme_report=cp_report_2019)


@pytest.fixture(name="_setup_old_cp_report")
def setup_old_cp_report(cp_report_2005, substance, blend, groupA, time_frames):
    # section A
    cp_rec = CPRecordFactory.create(
        country_programme_report=cp_report_2005, section="A", substance=substance
    )
    # add 3 usages for one record
    for _ in range(3):
        CPUsageFactory.create(country_programme_record=cp_rec)
    # substance
    SubstanceFactory.create(name="substance2", displayed_in_all=True, group=groupA)

    # section C (prices)
    CPPricesFactory.create(country_programme_report=cp_report_2005, blend=blend)
    CPPricesFactory.create(country_programme_report=cp_report_2005, substance=substance)

    # create rows and columns
    rows = {}
    columns = {}
    for section in ["B", "C", "D"]:
        data = {
            "section": section,
            "time_frame": time_frames[(2000, 2011)],
        }
        if section != "D":
            columns[section] = AdmColumnFactory.create(
                display_name=f"adm_column_{section}", sort_order=1, **data
            )

        rows[section] = AdmRowFactory.create(
            text=f"row{section}",
            index=None,
            type="question",
            parent=None,
            **data,
        )
        if section == "D":
            # creat choices
            for i in range(3):
                last_choice = AdmChoiceFactory.create(
                    adm_row=rows[section],
                    value="choice1",
                    sort_order=i,
                )

    # create records
    for section in ["B", "C", "D"]:
        record_data = {
            "country_programme_report": cp_report_2005,
            "row": rows[section],
            "column": columns.get(section, None),
            "value_text": f"record_{section}",
            "section": section,
        }
        if section == "D":
            record_data["value_choice"] = last_choice
        AdmRecordFactory.create(**record_data)

    return last_choice


class TestCPRecordList(BaseTest):
    url = reverse("country-programme-record-list")

    def test_without_login(self, cp_report_2019, _setup_new_cp_report):
        self.client.force_authenticate(user=None)
        response = self.client.get(self.url, {"cp_report_id": cp_report_2019.id})
        assert response.status_code == 403

    def test_get_cp_record_list__invalid_cp_rep_id(self, user, _setup_new_cp_report):
        self.client.force_authenticate(user=user)

        # try get cp records list without cp report id
        response = self.client.get(self.url)
        assert response.status_code == 400

        # try get cp records list with invalid cp report id
        response = self.client.get(self.url, {"cp_report_id": 999})
        assert response.status_code == 400

    def test_get_new_cp_record_list(
        self, user, substance, blend, cp_report_2019, _setup_new_cp_report
    ):
        self.client.force_authenticate(user=user)

        # get cp records list
        response = self.client.get(self.url, {"cp_report_id": cp_report_2019.id})
        assert response.status_code == 200
        assert len(response.data["section_a"]) == 1
        assert len(response.data["section_a"][0]["excluded_usages"]) == 1
        assert response.data["section_a"][0]["chemical_name"] == substance.name
        assert len(response.data["section_b"]) == 2
        assert response.data["section_b"][0]["chemical_name"] == blend.name
        assert len(response.data["section_b"][0]["record_usages"]) == 3
        assert len(response.data["section_c"]) == 2
        assert len(response.data["section_d"]) == 1
        assert response.data["section_d"][0]["chemical_name"] == "HFC-23"
        assert len(response.data["section_e"]) == 2
        assert response.data["section_f"]["remarks"] == cp_report_2019.comment

    def test_get_old_cp_record_list(self, user, cp_report_2005, _setup_old_cp_report):
        last_choice = _setup_old_cp_report
        self.client.force_authenticate(user=user)

        # check response
        response = self.client.get(self.url, {"cp_report_id": cp_report_2005.id})
        assert response.status_code == 200
        assert len(response.data["section_a"]) == 2
        assert len(response.data["adm_b"]) == 1
        assert response.data["adm_b"][0]["row_text"] == "rowB"
        assert response.data["adm_b"][0]["values"][0]["value_text"] == "record_B"
        assert len(response.data["section_c"]) == 2
        assert len(response.data["adm_c"]) == 1
        assert len(response.data["adm_d"]) == 1
        assert response.data["adm_d"][0]["value_choice_id"] == last_choice.id


@pytest.fixture(name="_setup_get_empty_form")
def setup_get_empty_form(usage):
    time_frame = TimeFrameFactory.create(
        min_year=2022,
        max_year=None,
    )
    cerate_data = {
        "usage": usage,
        "time_frame": time_frame,
        "section": "B",
    }
    CPRaportFormatFactory.create(**cerate_data)


class TestGetEmptyForm(BaseTest):
    url = reverse("empty-form")

    def test_without_cp_report_id(self, user, _setup_get_empty_form, _cp_report_format):
        self.client.force_authenticate(user=user)
        response = self.client.get(self.url)
        assert response.status_code == 200
        assert len(response.data["usage_columns"]["section_a"]) == 1
        assert len(response.data["usage_columns"]["section_b"]) == 2

    def test_with_cp_report_id(
        self, user, cp_report_2019, _setup_get_empty_form, _cp_report_format
    ):
        self.client.force_authenticate(user=user)
        response = self.client.get(self.url, {"cp_report_id": cp_report_2019.id})
        assert response.status_code == 200
        assert len(response.data["usage_columns"]["section_a"]) == 1
        assert len(response.data["usage_columns"]["section_b"]) == 1
