from core.api.tests.base import BaseTest
from core.api.tests.factories import (
    AdmChoiceFactory,
    AdmColumnFactory,
    AdmRowFactory,
    CPRecordFactory,
    CPReportFactory,
    CPUsageFactory,
)
import pytest
from django.urls import reverse


pytestmark = pytest.mark.django_db
# pylint: disable=C8008


@pytest.fixture(name="_setup_empty_form")
def setup_empty_form(country_ro, cp_report_2005, substance):
    cp_report_17 = CPReportFactory.create(
        country=country_ro, year=2017, comment="Daca ploua nu ma ploua"
    )
    # section A
    cp_rec = CPRecordFactory.create(
        country_programme_report=cp_report_2005, section="A", substance=substance
    )
    # add 3 usages for one record
    for _ in range(3):
        CPUsageFactory.create(country_programme_record=cp_rec)

    for section in ["B", "C"]:
        # create adm column
        for i in range(2):
            order = 2 - i
            last_col = AdmColumnFactory.create(
                display_name=f"adm_column_{order}",
                sort_order=order,
                section=section,
                min_year=2000,
                max_year=2010,
                parent=None,
            )
        AdmColumnFactory.create(
            display_name="adm_column_child_1",
            sort_order=5,
            section=section,
            min_year=2000,
            max_year=2010,
            parent=last_col,
        )

        # create adm rows
        row_data = {
            "section": section,
            "min_year": 2000,
            "max_year": 2010,
        }
        title = AdmRowFactory.create(
            text=f"title_{section}",
            sort_order=2,
            type="title",
            parent=None,
            **row_data,
        )
        subtitle = AdmRowFactory.create(
            text=f"subtitle_{section}",
            sort_order=4,
            type="subtitle",
            parent=title,
            **row_data,
        )

        row_data["type"] = "question"
        row_data["parent"] = subtitle
        for i in range(2):
            order = 4 + i
            AdmRowFactory.create(
                text=f"{subtitle.text}_row_{i}",
                sort_order=order,
                **row_data,
            )
        if section == "B":
            # add 1.6.1 rows
            AdmRowFactory.create(
                text=f"{subtitle.text}_row_161",
                sort_order=10,
                index="1.6.1",
                country_programme_report=cp_report_2005,
                **row_data,
            )
            AdmRowFactory.create(
                text="N/A",
                sort_order=12,
                index="1.6.1",
                **row_data,
            )

    for i in range(2):
        d_row = AdmRowFactory.create(
            text=f"d_row_{i}",
            sort_order=1,
            section="D",
            type="question",
            min_year=2000,
            max_year=2010,
        )
        # add 3 choices for each row
        for j in range(3):
            AdmChoiceFactory.create(
                adm_row=d_row,
                value=f"d_row_choice_{i}{j}",
                sort_order=i,
            )

    return cp_report_17


class TestAdmEmptyFormView(BaseTest):
    url = reverse("empty-form")

    def test_get_empty_form_annon(self, cp_report_2005):
        # test without authentication
        response = self.client.get(self.url, {"cp_report_id": cp_report_2005.id})
        assert response.status_code == 403

    def test_get_empty_form_2005(self, user, cp_report_2005, _setup_empty_form):
        self.client.force_authenticate(user=user)

        # get adm form for 2005 cp report
        response = self.client.get(self.url, {"cp_report_id": cp_report_2005.id})
        assert response.status_code == 200

        # check usage Columns
        assert len(response.data["usage_columns"]) == 4

        # check admB section
        assert len(response.data["admB"]["columns"]) == 2
        assert len(response.data["admB"]["columns"][0]["children"]) == 1
        assert len(response.data["admB"]["rows"]) == 5
        assert "N/A" not in response.data["admB"]["rows"]
        # check rows sort order
        admb_rows = response.data["admB"]["rows"]
        assert admb_rows[0]["text"] == "title_B"
        assert admb_rows[1]["text"] == "subtitle_B"
        assert admb_rows[2]["text"] == "subtitle_B_row_0"
        assert admb_rows[3]["text"] == "subtitle_B_row_1"
        assert admb_rows[4]["text"] == "subtitle_B_row_161"

        # check admC section
        assert len(response.data["admC"]["columns"]) == 2
        assert len(response.data["admC"]["rows"]) == 4

        # check admD section
        assert len(response.data["admD"]["rows"]) == 2
        assert len(response.data["admD"]["rows"][0]["choices"]) == 3
        assert len(response.data["admD"]["rows"][1]["choices"]) == 3

    def test_get_empty_form_2017(self, user, _setup_empty_form):
        self.client.force_authenticate(user=user)
        cp_report_17 = _setup_empty_form

        response = self.client.get(self.url, {"cp_report_id": cp_report_17.id})
        assert response.status_code == 200

        # check usage Columns
        assert len(response.data["usage_columns"]) == 4

        assert len(response.data["admB"]["columns"]) == 0
        assert len(response.data["admB"]["rows"]) == 0
        assert len(response.data["admC"]["columns"]) == 0
        assert len(response.data["admC"]["rows"]) == 0
        assert len(response.data["admD"]["rows"]) == 0
